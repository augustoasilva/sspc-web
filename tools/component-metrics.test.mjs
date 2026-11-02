// T048a (spec.md Clarifications 2026-11-02, FR-023, SC-006): target sizes computed from the
// generated tokens. The text/background contrast and the focus ring moved to contrast.test.mjs
// (T076). Layout is confirmed on the iPhone (T085, T095). Runs in `npm run test:tools`.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(path.join(root, 'src/app/ui/tokens/tokens.json'), 'utf8'));

describe('component metrics (T048a)', () => {
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
