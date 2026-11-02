// Static check for the offline start (FR-005, T062): the app sources make no HTTP request
// at startup, so no HttpClient may be provided or injected anywhere under src/app. Runs in
// CI with `npm run test:tools`.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Every non-spec TypeScript file under a directory.
function listSources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSources(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [full] : [];
  });
}

describe('offline start (src/app)', () => {
  it.each([
    {
      name: 'given the app sources, then none references HttpClient',
      token: 'HttpClient',
    },
    {
      name: 'given the app sources, then none provides HttpClient',
      token: 'provideHttpClient',
    },
  ])('$name', ({ token }) => {
    // given the non-spec sources under src/app
    const sources = listSources(path.join(root, 'src', 'app'));
    // when they are searched for the token
    const hits = sources.filter((file) => readFileSync(file, 'utf8').includes(token));
    // then no file uses it
    expect(hits.map((file) => path.relative(root, file))).toEqual([]);
  });
});
