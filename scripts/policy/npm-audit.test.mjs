// Table-driven tests for the npm audit gate (T112, SEC-006). The audit JSON is stubbed.
import { describe, expect, it } from 'vitest';
import { findUncovered } from './npm-audit.mjs';

const TODAY = new Date('2026-11-10T00:00:00Z');
const advisory = (severity, ghsa = 'GHSA-aaaa-bbbb-cccc') => ({
  name: 'zod',
  severity,
  via: [{ source: 1234, url: `https://github.com/advisories/${ghsa}`, title: 'x', severity }],
  fixAvailable: false,
});
const exception = (overrides = {}) => ({
  id: 'GHSA-aaaa-bbbb-cccc',
  scope: 'npm',
  target: 'zod',
  rationale: 'no fix in 3.x',
  compensating_controls: 'development-only',
  approver: 'owner',
  approved: '2026-11-02',
  expires: '2026-12-02',
  ...overrides,
});

describe('npm audit gate', () => {
  it.each([
    { name: 'given no advisories, then the gate passes', audit: { vulnerabilities: {} }, exceptions: [], expected: null },
    { name: 'given a low advisory, then the gate passes', audit: { vulnerabilities: { zod: advisory('low') } }, exceptions: [], expected: null },
    { name: 'given a high advisory with no exception, then it is named', audit: { vulnerabilities: { zod: advisory('high') } }, exceptions: [], expected: 'high advisory in zod (GHSA-aaaa-bbbb-cccc)' },
    { name: 'given a critical advisory with no exception, then it is named', audit: { vulnerabilities: { zod: advisory('critical') } }, exceptions: [], expected: 'critical advisory in zod' },
    { name: 'given a high advisory covered by an unexpired npm entry, then the gate passes', audit: { vulnerabilities: { zod: advisory('high') } }, exceptions: [exception()], expected: null },
    { name: 'given a high advisory covered by an expired entry, then it is named', audit: { vulnerabilities: { zod: advisory('high') } }, exceptions: [exception({ approved: '2026-09-01', expires: '2026-10-01' })], expected: 'high advisory in zod' },
    { name: 'given an image entry for the same id, then it does not cover the npm advisory', audit: { vulnerabilities: { zod: advisory('high') } }, exceptions: [exception({ scope: 'image', target: undefined })], expected: 'high advisory in zod' },
  ])('$name', ({ audit, exceptions, expected }) => {
    // given / when
    const findings = findUncovered(audit, exceptions, TODAY);
    // then
    if (expected === null) expect(findings).toEqual([]);
    else expect(findings.some((finding) => finding.includes(expected))).toBe(true);
  });
});
