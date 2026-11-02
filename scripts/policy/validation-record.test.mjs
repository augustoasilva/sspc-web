// Table-driven tests for the validation record policy (T110, SEC-010). Each bad line is one rule.
import { describe, expect, it } from 'vitest';
import { checkValidationRecord } from './validation-record.mjs';

const CLEAN = ['## Results', '', '| Check | Result |', '|---|---|', '| Version | pass (0.0.4+dev) |', '', '## Cleanup (SEC-010)', '', '| Item | Done |', '|---|---|', '| Stack stopped | yes |'].join('\n');

describe('validation record policy', () => {
  it.each([
    { name: 'given a clean record, then no finding is reported', text: CLEAN, expected: null },
    { name: 'given an IPv4 address, then it is named', text: CLEAN.replace('0.0.4+dev', 'reached 192.168.100.11'), expected: 'an IPv4 address' },
    { name: 'given an IPv6 address, then it is named', text: CLEAN + '\nclient fe80:0:0:0:1ff:fe23:4567:890a', expected: 'an IPv6 address' },
    { name: 'given a .local host name, then it is named', text: CLEAN + '\nopened the phone-name.local host', expected: 'a local host name' },
    { name: 'given a colon-separated fingerprint, then it is named', text: CLEAN + '\nfingerprint 3A:7F:00:11:22:33:44:55:66:77', expected: 'a colon-separated fingerprint' },
    { name: 'given a 64-hex fingerprint, then it is named', text: CLEAN + '\n' + 'a'.repeat(64), expected: 'a 64-hex fingerprint' },
    { name: 'given a JSON log line, then it is named', text: CLEAN + '\n{"level":"error","msg":"x"}', expected: 'a JSON log line' },
    { name: 'given no cleanup section, then it is named', text: CLEAN.replace('## Cleanup (SEC-010)', '## Notes'), expected: 'the cleanup section (SEC-010) is missing' },
    { name: 'given a time and a version, then no address is reported', text: CLEAN + '\nmeasured at 12:30:05 on 0.0.4+dev', expected: null },
  ])('$name', ({ text, expected }) => {
    // given / when
    const findings = checkValidationRecord(text);
    // then
    if (expected === null) expect(findings).toEqual([]);
    else expect(findings.some((finding) => finding.includes(expected))).toBe(true);
  });
});
