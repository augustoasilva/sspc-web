// T048a (spec.md Clarifications 2026-11-02, FR-023, SC-006): computed from the generated
// tokens, not from a browser. Checks the text/background pairs of the seven Phase 3
// components in both themes (WCAG 2.x contrast), the non-text focus ring (3:1), and that
// every component target-size token is at least 48 px. Layout is confirmed on the iPhone (T085, T095).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(path.join(root, 'src/app/ui/tokens/tokens.json'), 'utf8'));

function colorOf(theme, name) {
  const group = theme === 'dark' ? tokens.dark : tokens.color;
  const token = group[name];
  if (!token) throw new Error(`missing ${theme} color token "${name}"`);
  return token.$value;
}

function luminance(hex) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Text pairs for each component's rendered states (SCSS of the seven components).
const textPairs = [
  { component: 'SspcButton primary', fg: 'on-primary', bg: 'primary' },
  { component: 'SspcButton secondary', fg: 'on-primary-container', bg: 'primary-container' },
  { component: 'SspcButton ghost', fg: 'primary', bg: 'surface' },
  { component: 'SspcButton destructive', fg: 'on-error', bg: 'error' },
  { component: 'SspcStatusChip neutral', fg: 'on-surface-variant', bg: 'surface-container-high' },
  { component: 'SspcStatusChip positive', fg: 'on-secondary-container', bg: 'secondary-container' },
  { component: 'SspcStatusChip attention', fg: 'on-tertiary-container', bg: 'tertiary-container' },
  { component: 'SspcBanner info', fg: 'on-secondary-container', bg: 'secondary-container' },
  { component: 'SspcBanner error', fg: 'on-error-container', bg: 'error-container' },
  { component: 'SspcDialog heading', fg: 'on-surface', bg: 'surface-container' },
  { component: 'SspcDialog description', fg: 'on-surface-variant', bg: 'surface-container' },
  { component: 'SspcAppBar heading', fg: 'primary', bg: 'surface' },
  { component: 'SspcAppBar overline', fg: 'on-surface-variant', bg: 'surface' },
  { component: 'SspcTabBar item', fg: 'on-surface-variant', bg: 'surface' },
  { component: 'SspcTabBar active item', fg: 'primary', bg: 'surface' },
  { component: 'SspcListRow label', fg: 'on-surface-variant', bg: 'surface' },
  { component: 'SspcListRow value', fg: 'on-surface', bg: 'surface' },
];

describe('component metrics (T048a)', () => {
  it.each(textPairs.flatMap((pair) => ['light', 'dark'].map((theme) => ({ ...pair, theme }))))(
    'given $component text on its background in $theme, then the contrast is at least 4.5:1',
    ({ fg, bg, theme }) => {
      // given / when
      const ratio = contrast(colorOf(theme, fg), colorOf(theme, bg));
      // then
      expect(ratio, `${fg} on ${bg} (${theme}) = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(['light', 'dark'])('given the focus ring in %s, then it is a non-text indicator of at least 3:1', (theme) => {
    // given / when
    const ratio = contrast(colorOf(theme, 'tertiary'), colorOf(theme, 'surface'));
    // then
    expect(ratio, `focus ring on surface (${theme}) = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });

  it('given every component target-size token, then each is at least 48 px', () => {
    // given
    const sizes = Object.entries(tokens.component).filter(([name]) => /-(height|size)$/.test(name));
    // when / then
    expect(sizes.length).toBeGreaterThan(0);
    for (const [name, token] of sizes) {
      const px = parseFloat(token.$value);
      expect(px, `${name} = ${token.$value}`).toBeGreaterThanOrEqual(48);
    }
  });
});
