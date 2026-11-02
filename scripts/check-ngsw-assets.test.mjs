// Table-driven test of scripts/check-ngsw-assets.mjs (contracts/pwa-and-update.md §ngsw-config,
// FR-005). A build directory is written into a temporary folder with a generated ngsw.json,
// then the script runs as a child process. Runs in CI with `npm run test:tools`.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'check-ngsw-assets.mjs');

const temporaryDirs = [];
afterEach(() => {
  for (const dir of temporaryDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

// Writes each file (empty content) and an ngsw.json whose app and assets groups list the given urls.
function buildDirectory({ files, appUrls, assetUrls }) {
  const dir = mkdtempSync(path.join(tmpdir(), 'ngsw-assets-'));
  temporaryDirs.push(dir);
  for (const file of files) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), '');
  }
  const ngsw = {
    configVersion: 1,
    assetGroups: [
      { name: 'app', urls: appUrls },
      { name: 'assets', urls: assetUrls },
    ],
  };
  writeFileSync(path.join(dir, 'ngsw.json'), JSON.stringify(ngsw));
  return dir;
}

function run(dir) {
  return spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
}

describe('check-ngsw-assets', () => {
  it.each([
    {
      name: 'given every image and font is in the app group, then it exits 0',
      input: {
        files: ['index.html', 'media/font-abc.woff2', 'icons/icon-192-any.png', 'images/about.webp', 'favicon.ico'],
        appUrls: ['/index.html', '/media/font-abc.woff2', '/icons/icon-192-any.png', '/images/about.webp', '/favicon.ico'],
        assetUrls: [],
      },
      output: { status: 0, names: [] },
    },
    {
      name: 'given a png only in the lazy assets group, then it exits non-zero and names the file',
      input: {
        files: ['index.html', 'images/about.webp'],
        appUrls: ['/index.html'],
        assetUrls: ['/images/about.webp'],
      },
      output: { status: 1, names: ['images/about.webp'] },
    },
    {
      name: 'given a font missing from every group, then it exits non-zero and names the file',
      input: { files: ['index.html', 'media/font-abc.woff2'], appUrls: ['/index.html'], assetUrls: [] },
      output: { status: 1, names: ['media/font-abc.woff2'] },
    },
    {
      name: 'given a missing favicon.ico, then it exits non-zero and names the file',
      input: { files: ['index.html', 'favicon.ico'], appUrls: ['/index.html'], assetUrls: [] },
      output: { status: 1, names: ['favicon.ico'] },
    },
    {
      name: 'given a jpeg and an svg not in the app group, then it names both',
      input: {
        files: ['index.html', 'images/a.jpg', 'images/b.svg'],
        appUrls: ['/index.html'],
        assetUrls: ['/images/a.jpg', '/images/b.svg'],
      },
      output: { status: 1, names: ['images/a.jpg', 'images/b.svg'] },
    },
    {
      name: 'given only the service worker files and scripts, then they are ignored and it exits 0',
      input: {
        files: ['index.html', 'ngsw-worker.js', 'ngsw.json', 'safety-worker.js', 'worker-basic.min.js', 'main.js'],
        appUrls: ['/index.html'],
        assetUrls: [],
      },
      output: { status: 0, names: [] },
    },
    {
      name: 'given no ngsw.json in the directory, then it exits non-zero',
      input: { files: ['index.html'], appUrls: [], assetUrls: [], skipNgsw: true },
      output: { status: 1, names: ['ngsw.json'] },
    },
  ])('$name', ({ input, output }) => {
    // given a build directory with its ngsw.json
    const dir = buildDirectory(input);
    if (input.skipNgsw) rmSync(path.join(dir, 'ngsw.json'));
    // when the script checks it
    const result = run(dir);
    // then the exit status and the named files match
    expect(result.status).toBe(output.status);
    for (const name of output.names) expect(result.stdout + result.stderr).toContain(name);
    if (output.status === 0) expect(result.stdout + result.stderr).not.toMatch(/missing/i);
  });
});
