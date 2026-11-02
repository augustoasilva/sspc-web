// Agent settings policy (contracts/build-and-ci.md §Stitch MCP configuration, Principle VI v2.1.0,
// SEC-007). The Stitch key is never in a file: .mcp.json holds only the placeholder. The Stitch
// permissions are exactly the three lists of the contract; any other Stitch rule fails.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PREFIX = 'mcp__stitch__';
export const READ_TOOLS = ['get_project', 'get_screen', 'list_projects', 'list_screens', 'list_design_systems', 'download_file'];
export const ASK_TOOLS = ['generate_screen_from_text', 'edit_screens', 'apply_design_system'];
export const DENY_TOOLS = [
  'create_project',
  'delete_project',
  'generate_variants',
  'create_design_system',
  'create_design_system_from_design_md',
  'update_design_system',
  'upload_design_md',
];

function sameSet(actual, expected) {
  if (!Array.isArray(actual)) return false;
  const want = expected.map((tool) => PREFIX + tool).sort();
  return JSON.stringify([...actual].sort()) === JSON.stringify(want);
}

// `mcp` is the parsed .mcp.json, `settings` the parsed .claude/settings.json.
export function checkAgentSettings(mcp, settings) {
  const findings = [];
  const header = mcp?.mcpServers?.stitch?.headers?.['X-Goog-Api-Key'];
  if (header !== '${STITCH_API_KEY}') findings.push('.mcp.json: the Stitch key header is not exactly ${STITCH_API_KEY}');

  const permissions = settings?.permissions ?? {};
  if (!sameSet(permissions.allow, READ_TOOLS)) findings.push('.claude/settings.json: allow is not exactly the six read tools');
  if (!sameSet(permissions.ask, ASK_TOOLS)) findings.push('.claude/settings.json: ask is not exactly the three write tools');
  if (!sameSet(permissions.deny, DENY_TOOLS)) findings.push('.claude/settings.json: deny is not exactly the seven write tools');

  const known = [...READ_TOOLS, ...ASK_TOOLS, ...DENY_TOOLS].map((tool) => PREFIX + tool);
  for (const list of ['allow', 'ask', 'deny']) {
    for (const rule of permissions[list] ?? []) {
      if (rule.startsWith(PREFIX) && !known.includes(rule)) findings.push(`.claude/settings.json: ${list} has the unclassified rule ${rule}`);
    }
  }
  return findings;
}

function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const mcp = JSON.parse(readFileSync(`${root}.mcp.json`, 'utf8'));
  const settings = JSON.parse(readFileSync(`${root}.claude/settings.json`, 'utf8'));
  const findings = checkAgentSettings(mcp, settings);
  if (findings.length > 0) {
    for (const finding of findings) console.error(`agent-settings: ${finding}`);
    process.exit(1);
  }
  console.log('agent-settings: the Stitch configuration passes the policy');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
