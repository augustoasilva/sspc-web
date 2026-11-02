// Validation record policy (contracts/build-and-ci.md §Policy checks, SEC-010, research R-27). The
// record of the iPhone checks holds results only: no IP address, no local host name, no certificate
// fingerprint, no client address and no raw log line. It must keep its cleanup section.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const RECORD = 'specs/001-installable-pwa-shell/validation.md';

const RULES = [
  { name: 'an IPv4 address', pattern: /\b\d{1,3}(?:\.\d{1,3}){3}\b/ },
  { name: 'an IPv6 address', pattern: /\b(?:[0-9a-f]{1,4}:){4,7}[0-9a-f]{1,4}\b|::[0-9a-f]{1,4}\b/i },
  { name: 'a local host name (.local, .lan or .home)', pattern: /\b[a-z0-9-]+\.(?:local|lan|home)\b/i },
  { name: 'a colon-separated fingerprint', pattern: /\b(?:[0-9a-f]{2}:){7,}[0-9a-f]{2}\b/i },
  { name: 'a 64-hex fingerprint', pattern: /\b[0-9a-f]{64}\b/i },
  { name: 'a JSON log line', pattern: /\{\s*"[^"]+"\s*:/ },
];

// Returns the findings for the record's text; an empty array passes.
export function checkValidationRecord(text) {
  const findings = [];
  text.split('\n').forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) findings.push(`line ${index + 1} holds ${rule.name}`);
    }
  });
  if (!/^## Cleanup/m.test(text)) findings.push('the cleanup section (SEC-010) is missing');
  return findings;
}

function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const path = `${root}${RECORD}`;
  if (!existsSync(path)) {
    console.log(`validation-record: ${RECORD} is not present yet`);
    return;
  }
  const findings = checkValidationRecord(readFileSync(path, 'utf8'));
  if (findings.length > 0) {
    for (const finding of findings) console.error(`validation-record: ${finding}`);
    process.exit(1);
  }
  console.log('validation-record: the record passes the policy');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
