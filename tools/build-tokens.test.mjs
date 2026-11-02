// Table-driven tests for tools/build-tokens.mjs (research R-09, contract build-and-ci).
// Each case builds a fixture into a fresh temporary directory and checks the output.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { buildTokens } from './build-tokens.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(here, 'fixtures', name);
const dirs = [];

function run(designFile) {
  const dir = mkdtempSync(path.join(tmpdir(), 'sspc-tokens-'));
  dirs.push(dir);
  const out = {
    tokensJson: path.join(dir, 'tokens.json'),
    tokensCss: path.join(dir, 'tokens.css'),
    siteCss: path.join(dir, 'site-tokens.css'),
  };
  return buildTokens({ designPath: fixture(designFile), ...out }).then(() => ({
    json: JSON.parse(readFileSync(out.tokensJson, 'utf8')),
    css: readFileSync(out.tokensCss, 'utf8'),
    site: readFileSync(out.siteCss, 'utf8'),
    out,
  }));
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('build-tokens', () => {
  it.each([
    {
      name: 'given a valid design, when built, then tokens.json uses the W3C format with light and dark groups',
      input: 'valid-design.md',
      check: ({ json }) => {
        expect(json.color.primary).toEqual({ $type: 'color', $value: '#414B3B' });
        expect(json.dark.primary).toEqual({ $type: 'color', $value: '#8CA87C' });
      },
    },
    {
      name: 'given a valid design, when built, then tokens.css has light values on :root and dark values under the media query',
      input: 'valid-design.md',
      check: ({ css }) => {
        expect(css).toMatch(/:root\s*\{[^}]*--sspc-color-primary:\s*#414B3B/);
        expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{[^@]*--sspc-color-primary:\s*#8CA87C/);
        expect(css).toContain('color-scheme: light dark');
      },
    },
    {
      name: 'given a valid design, when built, then tokens.css has theme selectors for a scoped wrapper (light and dark, colors only)',
      input: 'valid-design.md',
      check: ({ css }) => {
        expect(css).toMatch(/\[data-theme="light"\]\s*\{[^}]*--sspc-color-primary:\s*#414B3B/);
        expect(css).toMatch(/\[data-theme="dark"\]\s*\{[^}]*--sspc-color-primary:\s*#8CA87C/);
        expect(css).not.toMatch(/\[data-theme="(light|dark)"\]\s*\{[^}]*--sspc-spacing/);
      },
    },
    {
      name: 'given a typography scale, when built, then a .type-<name> class carries family, weight and fontVariation',
      input: 'valid-design.md',
      check: ({ css }) => {
        expect(css).toContain('.type-body-md');
        expect(css).toContain("font-variation-settings: 'wdth' 100, 'opsz' 16");
        expect(css).toMatch(/font-family:\s*"Bricolage Grotesque",\s*system-ui,\s*sans-serif/);
      },
    },
    {
      name: 'given component dimensions, when built, then they become --sspc-component-<name>-<prop> variables',
      input: 'valid-design.md',
      check: ({ css }) => {
        expect(css).toContain('--sspc-component-fab-size: 60px');
        expect(css).toContain('--sspc-component-button-primary-height: 48px');
      },
    },
    {
      name: 'given no stroke group, when built, then the stroke and focus tokens are written over spacing-base, never as literal px',
      input: 'valid-design.md',
      check: ({ css }) => {
        expect(css).toContain('--sspc-stroke-hairline: calc(var(--sspc-spacing-base) * 0.25)');
        expect(css).toContain('--sspc-stroke-focus: calc(var(--sspc-spacing-base) * 0.5)');
        expect(css).toContain('--sspc-focus-offset: calc(var(--sspc-spacing-base) * 0.5)');
        expect(css).toContain('--sspc-elevation-floating: 0 calc(var(--sspc-spacing-base) * 2) calc(var(--sspc-spacing-base) * 6)');
      },
    },
    {
      name: 'given a stroke group in the design, when built, then that group is used for stroke-hairline',
      input: 'stroke-design.md',
      check: ({ css }) => {
        expect(css).toContain('--sspc-stroke-hairline: 2px');
      },
    },
    {
      name: 'given a valid design, when built, then the site stylesheet has the light values and the dark media block',
      input: 'valid-design.md',
      check: ({ site }) => {
        expect(site).toContain('--sspc-color-primary: #414B3B');
        expect(site).toContain('prefers-color-scheme: dark');
      },
    },
    {
      name: 'given the same design twice, when built twice, then the output is byte-identical',
      input: 'valid-design.md',
      check: async ({ out }) => {
        const first = readFileSync(out.tokensCss, 'utf8');
        await buildTokens({ designPath: fixture('valid-design.md'), ...out });
        expect(readFileSync(out.tokensCss, 'utf8')).toBe(first);
      },
    },
  ])('$name', async ({ input, check }) => {
    // given / when
    const result = await run(input);
    // then
    await check(result);
  });
});
