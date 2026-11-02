// Dockerfile policy (contracts/build-and-ci.md §Policy checks, SEC-004, SEC-005, FR-030). Checks
// every Dockerfile of the repository: digest-pinned base images, the three allowed build arguments,
// no broad COPY in the site image, a final stage that runs as 65532:65532, and setcap -r on Caddy.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const FILES = ['Dockerfile', 'site/Dockerfile', 'tools/offline-proof/Dockerfile'];
const ALLOWED_ARGS = ['APP_VERSION', 'APP_BUILD', 'SSPC_CATALOG'];

// Returns the findings for one Dockerfile's text; an empty array passes.
export function checkDockerfile(text, name) {
  const findings = [];
  const fail = (message) => findings.push(`${name}: ${message}`);
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));

  const stages = [];
  for (const line of lines) {
    const [directive, ...rest] = line.split(/\s+/);
    const keyword = directive.toUpperCase();
    if (keyword === 'FROM') {
      const image = rest[0] ?? '';
      if (!image.includes('@sha256:')) fail(`FROM ${image} has no @sha256: digest`);
      stages.push({ base: image, users: [], setcap: false });
    }
    if (keyword === 'ARG') {
      const argName = rest[0]?.split('=')[0];
      if (!ALLOWED_ARGS.includes(argName)) fail(`ARG ${argName} is not one of ${ALLOWED_ARGS.join(', ')}`);
    }
    if (keyword === 'USER') stages.at(-1)?.users.push(rest.join(' '));
    if (keyword === 'RUN' && /setcap\s+-r/.test(line) && stages.length > 0) stages.at(-1).setcap = true;
    if (keyword === 'COPY' && /\s(\.|\*)(\s|$)/.test(line) && name.startsWith('site/')) {
      fail(`${line} copies the whole context`);
    }
  }
  if (stages.length === 0) fail('no FROM instruction');

  const last = stages.at(-1);
  if (last) {
    if (last.users.at(-1) !== '65532:65532') fail('the final stage does not end with USER 65532:65532');
  }
  for (const stage of stages) {
    if (/caddy/.test(stage.base) && !stage.setcap) fail(`the Caddy stage ${stage.base} does not run setcap -r`);
  }
  return findings;
}

function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const findings = [];
  for (const file of FILES) {
    const path = `${root}${file}`;
    if (!existsSync(path)) continue;
    findings.push(...checkDockerfile(readFileSync(path, 'utf8'), file));
  }
  if (findings.length > 0) {
    for (const finding of findings) console.error(`dockerfiles: ${finding}`);
    process.exit(1);
  }
  console.log('dockerfiles: all Dockerfiles pass the policy');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
