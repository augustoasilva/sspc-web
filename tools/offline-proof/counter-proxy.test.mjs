// Table-driven test of the local-only request counter (contracts/http-serving.md §Local-only
// request counter, SEC-008). A stub upstream records what arrives; the proxy runs as a child
// process with a temporary control socket. Runs in CI with `npm run test:tools`.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { connect, createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const proxyScript = path.join(here, 'counter-proxy.mjs');
const countScript = path.join(here, 'count.mjs');

const cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

async function freePort() {
  const server = createNetServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1');
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

// A stub upstream: answers 304 to conditional requests, echoes POST bodies, and records the
// method and URL of each request it receives.
async function startUpstream() {
  const received = [];
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      received.push({ method: req.method, url: req.url, cookie: req.headers.cookie ?? '' });
      if (req.headers['if-none-match']) {
        res.writeHead(304, { ETag: '"abc"' });
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end(req.method === 'HEAD' ? undefined : `ok:${Buffer.concat(chunks).length}`);
    });
  });
  const port = await freePort();
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  cleanups.push(() => new Promise((resolve) => server.close(resolve)));
  return { url: `http://127.0.0.1:${port}`, received };
}

// Starts the proxy child process and waits until its control socket exists.
async function startProxy({ upstream }) {
  const dir = mkdtempSync(path.join(tmpdir(), 'counter-'));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  const socket = path.join(dir, 'counter.sock');
  const port = await freePort();
  const output = [];
  const child = spawn(process.execPath, [proxyScript], {
    env: { PATH: process.env.PATH, UPSTREAM: upstream, LISTEN_PORT: String(port), COUNT_SOCKET: socket },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => output.push(chunk));
  child.stderr.on('data', (chunk) => output.push(chunk));
  const exited = new Promise((resolve) => child.on('exit', resolve));
  cleanups.push(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await exited;
  });
  // Ready means both the control socket exists and the HTTP port accepts connections.
  for (let i = 0; i < 100; i++) {
    if (existsSync(socket) && (await canConnect(port))) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  return { port, socket, child, exited, output: () => Buffer.concat(output).toString('utf8') };
}

function readCount(socket) {
  const result = spawnSync(process.execPath, [countScript], {
    env: { PATH: process.env.PATH, COUNT_SOCKET: socket },
    encoding: 'utf8',
  });
  return { status: result.status, stdout: result.stdout };
}

describe('counter proxy: forwarded requests are counted', () => {
  it.each([
    {
      name: 'given GET, HEAD, POST with a body and GET with a cookie and a query string, then the count reads 4 and each reached the upstream',
      input: [
        { method: 'GET', path: '/manifest.webmanifest?v=1' },
        { method: 'HEAD', path: '/' },
        { method: 'POST', path: '/sobre', body: 'hello' },
        { method: 'GET', path: '/', headers: { cookie: 'a=1' } },
      ],
      output: { count: '4', upstreamCount: 4 },
    },
    {
      name: 'given one conditional request answered 304, then the count reads 1 and the 304 passes through',
      input: [{ method: 'GET', path: '/ngsw.json', headers: { 'if-none-match': '"abc"' } }],
      output: { count: '1', upstreamCount: 1, status: 304 },
    },
  ])('$name', async ({ input, output }) => {
    // given a running proxy in front of the stub upstream
    const upstream = await startUpstream();
    const proxy = await startProxy({ upstream: upstream.url });
    // when each request is sent through the proxy
    const statuses = [];
    for (const request of input) {
      const response = await fetch(`http://127.0.0.1:${proxy.port}${request.path}`, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
      });
      statuses.push(response.status);
      await response.arrayBuffer();
    }
    // then the count reads back as the number of requests and the upstream received them all
    expect(readCount(proxy.socket)).toEqual({ status: 0, stdout: `${output.count}\n` });
    expect(upstream.received).toHaveLength(output.upstreamCount);
    if (output.status) expect(statuses).toContain(output.status);
  });
});

describe('counter proxy: silence, socket and failure', () => {
  it('given requests were forwarded, then the proxy printed nothing', async () => {
    // given / when
    const upstream = await startUpstream();
    const proxy = await startProxy({ upstream: upstream.url });
    await (await fetch(`http://127.0.0.1:${proxy.port}/`)).arrayBuffer();
    // then
    expect(proxy.output()).toBe('');
  });

  it('given the proxy is running, then the control socket has mode 0600', async () => {
    // given / when
    const upstream = await startUpstream();
    const proxy = await startProxy({ upstream: upstream.url });
    // then
    expect(statSync(proxy.socket).mode & 0o777).toBe(0o600);
  });

  it('given the proxy receives SIGTERM, then it exits and removes the control socket', async () => {
    // given
    const upstream = await startUpstream();
    const proxy = await startProxy({ upstream: upstream.url });
    // when
    proxy.child.kill('SIGTERM');
    await proxy.exited;
    // then
    expect(existsSync(proxy.socket)).toBe(false);
  });

  it('given the upstream is unreachable, then the answer is 502 with an empty body and the request is still counted', async () => {
    // given an upstream port that nothing listens on
    const deadPort = await freePort();
    const proxy = await startProxy({ upstream: `http://127.0.0.1:${deadPort}` });
    // when
    const response = await fetch(`http://127.0.0.1:${proxy.port}/`);
    const body = await response.text();
    // then
    expect(response.status).toBe(502);
    expect(body).toBe('');
    expect(readCount(proxy.socket).stdout).toBe('1\n');
  });

  it('given the proxy is not running, then count.mjs exits 1 with no output', () => {
    // given a socket path that does not exist
    const dir = mkdtempSync(path.join(tmpdir(), 'counter-missing-'));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    // when
    const result = readCount(path.join(dir, 'absent.sock'));
    // then
    expect(result).toEqual({ status: 1, stdout: '' });
  });
});
