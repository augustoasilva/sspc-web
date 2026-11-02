// Test-only request counter (contracts/http-serving.md §Local-only request counter, SEC-008).
// It forwards every request to the catalogue-enabled app and counts each incoming request
// before forwarding it. It keeps only an integer: no request fields, no access log, no output.
// The count is read through a control socket (see count.mjs), never over HTTP. Node standard
// library only. This image is never served to users.
import { createServer as createHttpServer, request as httpRequest } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { existsSync, unlinkSync } from 'node:fs';

const UPSTREAM = new URL(process.env.UPSTREAM ?? 'http://web-app:8080');
const LISTEN_PORT = Number(process.env.LISTEN_PORT ?? 8080);
const COUNT_SOCKET = process.env.COUNT_SOCKET ?? '/tmp/counter.sock';

let count = 0;

function forward(req, res) {
  count += 1;
  const upstreamReq = httpRequest(
    {
      protocol: UPSTREAM.protocol,
      hostname: UPSTREAM.hostname,
      port: UPSTREAM.port,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstreamReq.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-length': '0' });
    res.end();
  });
  req.pipe(upstreamReq);
}

const server = createHttpServer(forward);
server.on('error', () => {});

// The control socket appears only once the proxy serves requests, so a reader never races the
// listener. It is created with a restrictive umask, so it is never readable by others.
const control = createNetServer((socket) => {
  socket.on('error', () => {});
  socket.end(`${count}\n`);
});
control.on('error', () => {});
server.listen(LISTEN_PORT, '0.0.0.0', () => {
  if (existsSync(COUNT_SOCKET)) unlinkSync(COUNT_SOCKET);
  const previousUmask = process.umask(0o177);
  control.listen(COUNT_SOCKET);
  process.umask(previousUmask);
});

function shutdown() {
  control.close();
  server.close();
  try {
    unlinkSync(COUNT_SOCKET);
  } catch {
    // already gone
  }
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
