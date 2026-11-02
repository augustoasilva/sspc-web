// Principle VI gate (research R-09, R-30): design.md lint must pass on a valid
// design and fail with a broken-ref error on an unresolvable reference.
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.join(here, '..', 'node_modules', '.bin', 'design.md');
const fixture = (name) => path.join(here, 'fixtures', name);

function lint(file) {
  return new Promise((resolve) => {
    execFile(bin, ['lint', file], { encoding: 'utf8' }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, output: `${stdout}${stderr}` });
    });
  });
}

describe('design.md lint gate', () => {
  it.each([
    {
      name: 'given a valid design, when linted, then it exits 0 with no errors',
      input: { file: 'valid-design.md' },
      output: { exitCode: 0, mustContain: '"errors": 0' },
    },
    {
      name: 'given a reference to a missing color, when linted, then it exits non-zero with a broken-ref error',
      input: { file: 'broken-design.md' },
      output: { exitCodeNot: 0, mustContain: 'broken-ref' },
    },
  ])('$name', async ({ input, output }) => {
    // given
    const file = fixture(input.file);
    // when
    const result = await lint(file);
    // then
    if (output.exitCode !== undefined) expect(result.code).toBe(output.exitCode);
    if (output.exitCodeNot !== undefined) expect(result.code).not.toBe(output.exitCodeNot);
    expect(result.output).toContain(output.mustContain);
  });
});
