// Exceptions record policy (data-model §ExceptionRecord, SEC-006, research R-30). An exception is an
// advisory the owner accepts for a limited time. Each entry must be complete, unique, approved for
// at most 30 days and not expired. `--trivy-out FILE` writes the Trivy ignore file from the active
// image entries; `activeExceptions` gives the npm entries to npm-audit.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const RECORD = 'security/exceptions.yaml';
const REQUIRED = ['id', 'scope', 'rationale', 'compensating_controls', 'approver', 'approved', 'expires'];
const DAY = 24 * 60 * 60 * 1000;

function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00Z`);
  return null;
}

// Returns the findings for the parsed record; `today` is injected so the tests can fix the date.
export function checkExceptions(record, today = new Date()) {
  const findings = [];
  const list = Array.isArray(record?.exceptions) ? record.exceptions : null;
  if (list === null) return ['the record has no exceptions list'];
  const seen = new Set();
  list.forEach((entry, index) => {
    const label = `exception ${index + 1} (${entry?.id ?? 'no id'})`;
    for (const field of REQUIRED) {
      const value = entry?.[field];
      if (value === undefined || value === null || String(value).trim() === '') findings.push(`${label}: ${field} is empty`);
    }
    if (entry?.scope !== undefined && !['image', 'npm'].includes(entry.scope)) findings.push(`${label}: scope must be image or npm`);
    const key = `${entry?.scope}|${entry?.target ?? ''}|${entry?.id}`;
    if (seen.has(key)) findings.push(`${label}: duplicate entry`);
    seen.add(key);
    const approved = toDate(entry?.approved);
    const expires = toDate(entry?.expires);
    if (!approved || !expires) {
      findings.push(`${label}: approved and expires must be dates (YYYY-MM-DD)`);
      return;
    }
    if (expires - approved > 30 * DAY) findings.push(`${label}: expires more than 30 days after approved`);
    if (expires < today) findings.push(`${label}: expired on ${String(entry.expires)}`);
  });
  return findings;
}

// The entries that still apply (not expired) for one scope.
export function activeExceptions(record, scope, today = new Date()) {
  return (record?.exceptions ?? []).filter((entry) => entry.scope === scope && toDate(entry.expires) >= today);
}

// The Trivy ignore file (vulnerabilities list) for the active image entries.
export function trivyIgnoreYaml(record, today = new Date()) {
  const lines = ['vulnerabilities:'];
  for (const entry of activeExceptions(record, 'image', today)) {
    lines.push(`  - id: ${JSON.stringify(entry.id)}`);
    lines.push(`    statement: ${JSON.stringify(String(entry.rationale))}`);
    lines.push(`    expired_at: ${String(entry.expires)}`);
  }
  if (lines.length === 1) lines[0] = 'vulnerabilities: []';
  return `${lines.join('\n')}\n`;
}

function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const record = parse(readFileSync(`${root}${RECORD}`, 'utf8'));
  const findings = checkExceptions(record);
  if (findings.length > 0) {
    for (const finding of findings) console.error(`exceptions: ${finding}`);
    process.exit(1);
  }
  const outIndex = process.argv.indexOf('--trivy-out');
  if (outIndex !== -1) {
    const target = process.argv[outIndex + 1];
    if (!target) {
      console.error('exceptions: --trivy-out needs a file');
      process.exit(2);
    }
    writeFileSync(target, trivyIgnoreYaml(record));
  }
  console.log(`exceptions: ${record.exceptions.length} entries pass the policy`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
