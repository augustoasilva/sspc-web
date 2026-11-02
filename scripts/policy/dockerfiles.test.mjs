// Table-driven tests for the Dockerfile policy (T106, SEC-004, SEC-005, FR-030).
import { describe, expect, it } from 'vitest';
import { checkDockerfile } from './dockerfiles.mjs';

const NODE = 'node:24.22.2@sha256:e7add2a490bb17d97b485b8641bd88455fff7839ade0f5eba493c3508124d413';
const CADDY = 'caddy:2.11.7@sha256:36c24ad91a7ff7bc4c87fe22bfa8df3c4b18da0773d73fc12ee2c52b98c0bb7e';

function appDockerfile(overrides = {}) {
  return [
    `FROM ${NODE} AS build`,
    'ARG APP_VERSION=0.0.0+dev',
    'ARG APP_BUILD=local',
    'ARG SSPC_CATALOG=false',
    'RUN npm ci',
    `FROM ${CADDY}`,
    'RUN setcap -r /usr/bin/caddy',
    'USER 65532:65532',
    overrides.extra ?? '',
  ].join('\n');
}

describe('Dockerfile policy', () => {
  it.each([
    { name: 'given a digest-pinned app image, then it passes', text: appDockerfile(), file: 'Dockerfile', expected: null },
    {
      name: 'given a FROM without a digest, then it is named',
      text: appDockerfile().replace(`FROM ${NODE} AS build`, 'FROM node:24 AS build'),
      file: 'Dockerfile',
      expected: 'FROM node:24 has no @sha256: digest',
    },
    {
      name: 'given an unknown build argument, then it is named',
      text: appDockerfile().replace('ARG SSPC_CATALOG=false', 'ARG SECRET=x'),
      file: 'Dockerfile',
      expected: 'ARG SECRET is not one of',
    },
    {
      name: 'given a final stage that does not end as 65532, then it is named',
      text: appDockerfile().replace('USER 65532:65532', 'USER root'),
      file: 'Dockerfile',
      expected: 'the final stage does not end with USER 65532:65532',
    },
    {
      name: 'given a Caddy stage without setcap -r, then it is named',
      text: appDockerfile().replace('RUN setcap -r /usr/bin/caddy\n', ''),
      file: 'Dockerfile',
      expected: 'does not run setcap -r',
    },
    {
      name: 'given the site image copies the whole context, then it is named',
      text: `FROM ${CADDY}\nRUN setcap -r /usr/bin/caddy\nCOPY . /srv\nUSER 65532:65532\n`,
      file: 'site/Dockerfile',
      expected: 'copies the whole context',
    },
    {
      name: 'given the site image copies named folders, then it passes',
      text: `FROM ${CADDY}\nRUN setcap -r /usr/bin/caddy\nCOPY index.html /srv/\nCOPY links/ /srv/links/\nUSER 65532:65532\n`,
      file: 'site/Dockerfile',
      expected: null,
    },
  ])('$name', ({ text, file, expected }) => {
    // given / when
    const findings = checkDockerfile(text, file);
    // then
    if (expected === null) expect(findings).toEqual([]);
    else expect(findings.some((finding) => finding.includes(expected))).toBe(true);
  });
});
