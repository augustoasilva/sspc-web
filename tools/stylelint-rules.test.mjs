// Proof that the stylelint rules of stylelint.config.mjs fire on the forbidden
// values and stay silent on token-only styles (research R-13, T030). Inline SCSS at a
// virtual ui path, so the config's scope applies and no fixture file is created.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function lint(code) {
  const result = await stylelint.lint({
    code,
    codeFilename: path.join(root, 'src/app/ui/button/x.scss'),
    configFile: path.join(root, 'stylelint.config.mjs'),
    customSyntax: 'postcss-scss',
  });
  return result.results[0].warnings.map((warning) => warning.rule);
}

describe('stylelint ui rules', () => {
  it.each([
    {
      name: 'given a hex color, when linted, then color-no-hex fires',
      input: { code: '.a { color: #414B3B; }' },
      output: { ruleId: 'color-no-hex' },
    },
    {
      name: 'given an rgb() color, when linted, then function-disallowed-list fires',
      input: { code: '.a { color: rgb(0, 0, 0); }' },
      output: { ruleId: 'function-disallowed-list' },
    },
    {
      name: 'given a literal px size, when linted, then unit-disallowed-list fires',
      input: { code: '.a { margin: 16px; }' },
      output: { ruleId: 'unit-disallowed-list' },
    },
    {
      name: 'given a literal font-family, when linted, then declaration-property-value-disallowed-list fires',
      input: { code: '.a { font-family: Arial; }' },
      output: { ruleId: 'declaration-property-value-disallowed-list' },
    },
    {
      name: 'given token-only styles, when linted, then no rule fires',
      input: {
        code: '.a { color: var(--sspc-color-primary); margin: 0 calc(var(--sspc-spacing-base) * 4); width: 100%; font-family: var(--sspc-font-body); }',
      },
      output: { clean: true },
    },
  ])('$name', async ({ input, output }) => {
    // given / when
    const rules = await lint(input.code);
    // then
    if (output.clean) expect(rules).toEqual([]);
    else expect(rules).toContain(output.ruleId);
  });
});
