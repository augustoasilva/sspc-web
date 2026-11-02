// Accessibility assertion for component specs (research R-24). Runs axe-core 4.13.0
// on the element and fails with the violation ids. Under jsdom axe reports
// `color-contrast` as incomplete (it needs canvas), so contrast is asserted by the
// token tests (T076) and on the device (T085, T095), never by axe here.
import axe from 'axe-core';
import { expect } from 'vitest';

export async function expectNoA11yViolations(target: HTMLElement | { nativeElement: HTMLElement }): Promise<void> {
  const element = target instanceof HTMLElement ? target : target.nativeElement;
  const results = await axe.run(element, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  });
  const incomplete = results.incomplete
    .map((rule) => rule.id)
    .filter((id) => id !== 'color-contrast');
  if (incomplete.length > 0) {
    console.info(`axe incomplete (review): ${incomplete.join(', ')}`);
  }
  const violations = results.violations.map((rule) => rule.id);
  expect(violations, `axe violations: ${violations.join(', ')}`).toEqual([]);
}
