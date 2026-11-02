// Table-driven tests for the exceptions record (T111, data-model §ExceptionRecord, SEC-006).
import { describe, expect, it } from 'vitest';
import { activeExceptions, checkExceptions, trivyIgnoreYaml } from './exceptions.mjs';

const TODAY = new Date('2026-11-10T00:00:00Z');
const entry = (overrides = {}) => ({
  id: 'GHSA-xxxx-yyyy-zzzz',
  scope: 'npm',
  target: 'zod',
  rationale: 'no fixed version in 3.x; the 4.x line is used',
  compensating_controls: 'the package is development-only',
  approver: 'owner',
  approved: '2026-11-02',
  expires: '2026-12-02',
  ...overrides,
});

describe('exceptions record policy', () => {
  it.each([
    { name: 'given an empty list, then no finding is reported', record: { exceptions: [] }, expected: null },
    { name: 'given a complete entry approved and expiring within 30 days, then no finding is reported', record: { exceptions: [entry()] }, expected: null },
    { name: 'given an empty required field, then it is named', record: { exceptions: [entry({ approver: '' })] }, expected: 'approver is empty' },
    { name: 'given a scope other than image or npm, then it is named', record: { exceptions: [entry({ scope: 'os' })] }, expected: 'scope must be image or npm' },
    { name: 'given expiry more than 30 days after approval, then it is named', record: { exceptions: [entry({ expires: '2027-02-01' })] }, expected: 'expires more than 30 days after approved' },
    { name: 'given an expired entry, then it is named', record: { exceptions: [entry({ approved: '2026-09-01', expires: '2026-10-01' })] }, expected: 'expired on 2026-10-01' },
    { name: 'given the same entry twice, then the duplicate is named', record: { exceptions: [entry(), entry()] }, expected: 'duplicate entry' },
    { name: 'given a missing list, then the record is named as invalid', record: {}, expected: 'the record has no exceptions list' },
  ])('$name', ({ record, expected }) => {
    // given / when
    const findings = checkExceptions(record, TODAY);
    // then
    if (expected === null) expect(findings).toEqual([]);
    else expect(findings.some((finding) => finding.includes(expected))).toBe(true);
  });

  it('given an active image entry and an npm entry, then the Trivy file lists only the image entry', () => {
    // given
    const record = { exceptions: [entry({ id: 'CVE-2026-0001', scope: 'image', target: 'sspc-web', rationale: 'base image fix pending' }), entry()] };
    // when
    const yaml = trivyIgnoreYaml(record, TODAY);
    // then
    expect(yaml).toContain('- id: "CVE-2026-0001"');
    expect(yaml).toContain('statement: "base image fix pending"');
    expect(yaml).toContain('expired_at: 2026-12-02');
    expect(yaml).not.toContain('GHSA-xxxx');
  });

  it('given no active image entry, then the Trivy file is an empty list', () => {
    // given / when
    const yaml = trivyIgnoreYaml({ exceptions: [] }, TODAY);
    // then
    expect(yaml).toBe('vulnerabilities: []\n');
  });

  it('given an expired npm entry, then activeExceptions leaves it out', () => {
    // given
    const record = { exceptions: [entry({ approved: '2026-09-01', expires: '2026-10-01' })] };
    // when / then
    expect(activeExceptions(record, 'npm', TODAY)).toEqual([]);
  });
});
