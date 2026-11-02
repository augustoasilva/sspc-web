// Caddyfile policy (contracts/build-and-ci.md §Policy checks, SEC-001, SEC-008, research R-27).
// Adapts each Caddyfile with the pinned Caddy image and checks the JSON: no access log, the
// default log filter deletes the request object, and every response header of the contract is set.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CADDY_IMAGE = 'caddy:2.11.7@sha256:36c24ad91a7ff7bc4c87fe22bfa8df3c4b18da0773d73fc12ee2c52b98c0bb7e';
export const APP_HEADERS = [
  ['Content-Security-Policy', "default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'no-referrer'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
];

// `adapted` is the JSON that `caddy adapt` prints. `headers` lists the [name, value] pairs the file must set.
export function checkAdapted(adapted, headers = APP_HEADERS) {
  const findings = [];
  const encoder = adapted?.logging?.logs?.default?.encoder;
  if (encoder?.format !== 'filter') findings.push('the default log encoder is not the filter');
  if (encoder?.wrap?.format !== 'json') findings.push('the default log filter does not wrap JSON');
  if (encoder?.fields?.request?.filter !== 'delete') findings.push('the default log filter does not delete the request object');

  const servers = adapted?.apps?.http?.servers ?? {};
  for (const [name, server] of Object.entries(servers)) {
    if (server.logs !== undefined) findings.push(`server ${name} has an access log (logs)`);
  }

  const text = JSON.stringify(adapted);
  for (const [name, value] of headers) {
    if (!text.includes(JSON.stringify(value))) findings.push(`the header ${name} with its contract value is missing`);
  }
  return findings;
}

// Runs `caddy adapt` through the pinned image and returns the parsed JSON.
export function adaptWithDocker(file) {
  const out = execFileSync(
    'docker',
    ['run', '--rm', '-v', `${file}:/tmp/Caddyfile:ro`, CADDY_IMAGE, 'caddy', 'adapt', '--config', '/tmp/Caddyfile', '--adapter', 'caddyfile'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return JSON.parse(out);
}

function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const targets = [{ file: `${root}Caddyfile`, headers: APP_HEADERS }];
  // The site Caddyfile has its own CSP (contract §Site); it joins the list with its Phase 11 task.
  const findings = [];
  for (const { file, headers } of targets) {
    if (!existsSync(file)) {
      findings.push(`${file} is missing`);
      continue;
    }
    findings.push(...checkAdapted(adaptWithDocker(file), headers).map((finding) => `${file}: ${finding}`));
  }
  if (findings.length > 0) {
    for (const finding of findings) console.error(`caddyfile: ${finding}`);
    process.exit(1);
  }
  console.log('caddyfile: the Caddyfiles pass the policy');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
