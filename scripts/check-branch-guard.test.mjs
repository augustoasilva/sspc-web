// Table-driven tests for the branch guard (T114, R-18). The script runs as a child process with the
// base and the head given as arguments, exactly as the workflow passes them.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), 'check-branch-guard.sh');
const run = (args) => spawnSync('bash', [SCRIPT, ...args], { encoding: 'utf8' });

describe('branch guard', () => {
  it.each([
    { name: 'given one argument, then the usage error is exit 2', args: ['main'], status: 2 },
    { name: 'given three arguments, then the usage error is exit 2', args: ['main', 'release/1.2.3', 'extra'], status: 2 },
    { name: 'given a base other than main, then it is not applicable and passes', args: ['develop', 'feature/anything'], status: 0, out: 'not applicable' },
    { name: 'given main and a release name, then it passes', args: ['main', 'release/1.2.3'], status: 0, out: 'release or hotfix name' },
    { name: 'given main and a hotfix name, then it passes', args: ['main', 'hotfix/10.0.1'], status: 0, out: 'release or hotfix name' },
    { name: 'given main and a feature name, then it fails', args: ['main', 'feature/login'], status: 1, err: 'feature/login may not merge into main' },
    { name: 'given main and an incomplete version, then it fails', args: ['main', 'release/1.2'], status: 1, err: 'release/1.2 may not merge' },
    { name: 'given main and a leading zero in the version, then it fails', args: ['main', 'release/01.2.3'], status: 1, err: 'release/01.2.3 may not merge' },
    { name: 'given main and an upper-case prefix, then it fails (case-sensitive)', args: ['main', 'Release/1.2.3'], status: 1, err: 'Release/1.2.3 may not merge' },
    { name: 'given main and a name with a shell substitution, then it fails and the name is shown as text', args: ['main', 'release/$(id).1.2'], status: 1, err: 'release/??id?.1.2 may not merge' },
    { name: 'given main and a name with a format specifier, then it fails and is not expanded', args: ['main', 'hotfix/%s.1.2'], status: 1, err: 'hotfix/?s.1.2 may not merge' },
  ])('$name', ({ args, status, out, err }) => {
    // given / when
    const result = run(args);
    // then
    expect(result.status).toBe(status);
    if (out) expect(result.stdout).toContain(out);
    if (err) expect(result.stderr).toContain(err);
  });
});
