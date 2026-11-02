// npm audit wrapper (contracts/build-and-ci.md §Policy checks, SEC-006, research R-30). It audits the
// whole tree (development dependencies included) and fails on each high or critical advisory that no
// unexpired npm entry of security/exceptions.yaml covers. It prints every advisory it fails on.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { activeExceptions } from './exceptions.mjs';

const BLOCKING = ['high', 'critical'];

function advisoryIds(vulnerability) {
  const ids = new Set();
  for (const via of vulnerability.via ?? []) {
    if (typeof via !== 'object' || via === null) continue; // a transitive entry names another package
    const text = `${via.url ?? ''} ${via.source ?? ''}`;
    for (const match of text.matchAll(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}|CVE-\d{4}-\d+/gi)) ids.add(match[0]);
  }
  return [...ids];
}

// Returns one line per advisory that fails the gate; an empty array passes.
export function findUncovered(audit, exceptions, today = new Date()) {
  const covered = activeExceptions({ exceptions }, 'npm', today);
  const findings = [];
  for (const [name, vulnerability] of Object.entries(audit?.vulnerabilities ?? {})) {
    if (!BLOCKING.includes(vulnerability.severity)) continue;
    const ids = advisoryIds(vulnerability);
    const isCovered = covered.some((entry) => entry.target === name && ids.includes(entry.id));
    if (!isCovered) {
      const label = ids.length > 0 ? ids.join(', ') : 'no advisory id';
      findings.push(`${vulnerability.severity} advisory in ${name} (${label}) has no unexpired exception`);
    }
  }
  return findings;
}

function runAudit() {
  try {
    return execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // npm exits non-zero when it finds advisories; the JSON is still on stdout.
    if (typeof error.stdout === 'string' && error.stdout.trim().startsWith('{')) return error.stdout;
    throw error;
  }
}

function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const exceptions = parse(readFileSync(`${root}security/exceptions.yaml`, 'utf8')).exceptions ?? [];
  const findings = findUncovered(JSON.parse(runAudit()), exceptions);
  if (findings.length > 0) {
    for (const finding of findings) console.error(`npm-audit: ${finding}`);
    process.exit(1);
  }
  console.log('npm-audit: no high or critical advisory without an exception');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
