// Table-driven tests for the tracked secret path guard (T113, SEC-007). Each case builds a temporary
// git repository, tracks the files of the case and runs the script inside it.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), 'check-tracked-secrets.sh');
const roots = [];

function repo({ gitignore = '.env*\n*.key\n', files }) {
  const root = mkdtempSync(join(tmpdir(), 'tracked-secrets-'));
  roots.push(root);
  execFileSync('git', ['init', '-q'], { cwd: root });
  if (gitignore !== null) writeFileSync(join(root, '.gitignore'), gitignore);
  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), 'x\n');
  }
  // Force-add: a file the ignore rules cover must still be caught if somebody tracks it.
  execFileSync('git', ['add', '-f', '-A'], { cwd: root });
  return root;
}

function run(root) {
  return spawnSync('bash', [SCRIPT], { cwd: root, encoding: 'utf8' });
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe('tracked secret path guard', () => {
  it.each([
    { name: 'given only ordinary tracked files, then it passes', files: ['src/app.ts', 'README.md'], expected: 0, message: null },
    { name: 'given a tracked .enc.yaml file, then it fails and names it', files: ['deploy/values.enc.yaml'], expected: 1, message: 'tracked encrypted file: deploy/values.enc.yaml' },
    { name: 'given a tracked private key, then it fails and names it', files: ['certs/server.key'], expected: 1, message: 'tracked key or certificate: certs/server.key' },
    { name: 'given a tracked certificate, then it fails and names it', files: ['certs/ca.pem'], expected: 1, message: 'tracked key or certificate: certs/ca.pem' },
    { name: 'given a tracked profile, then it fails and names it', files: ['device/trust.mobileconfig'], expected: 1, message: 'tracked key or certificate: device/trust.mobileconfig' },
    { name: 'given a tracked .env file, then it fails and names it', files: ['.env.local'], expected: 1, message: 'tracked environment file: .env.local' },
    { name: 'given a tracked file under secrets/, then it fails and names it', files: ['secrets/token.txt'], expected: 1, message: 'tracked file under secrets/: secrets/token.txt' },
  ])('$name', ({ files, expected, message }) => {
    // given
    const root = repo({ files });
    // when
    const result = run(root);
    // then
    expect(result.status).toBe(expected);
    if (message) expect(result.stderr).toContain(message);
  });

  it('given .gitignore lacks the .env pattern, then it fails and names the missing rule', () => {
    // given
    const root = repo({ gitignore: '*.key\n', files: ['src/app.ts'] });
    // when
    const result = run(root);
    // then
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.gitignore does not ignore .env*');
  });
});
