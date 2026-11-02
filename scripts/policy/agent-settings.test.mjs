// Table-driven tests for the agent settings policy (T107, Principle VI v2.1.0).
import { describe, expect, it } from 'vitest';
import { ASK_TOOLS, DENY_TOOLS, READ_TOOLS, checkAgentSettings } from './agent-settings.mjs';

const P = 'mcp__stitch__';
const goodMcp = () => ({ mcpServers: { stitch: { type: 'http', url: 'https://stitch.googleapis.com/mcp', headers: { 'X-Goog-Api-Key': '${STITCH_API_KEY}' } } } });
const goodSettings = () => ({
  permissions: {
    allow: READ_TOOLS.map((t) => P + t),
    ask: ASK_TOOLS.map((t) => P + t),
    deny: DENY_TOOLS.map((t) => P + t),
  },
});

describe('agent settings policy', () => {
  it.each([
    { name: 'given the contract state, then no finding is reported', mutate: () => {}, expected: null },
    {
      name: 'given a literal key in the header, then the placeholder rule fails',
      mutate: (mcp) => (mcp.mcpServers.stitch.headers['X-Goog-Api-Key'] = 'AIzaSyExampleLiteralKey'),
      expected: 'the Stitch key header is not exactly',
    },
    {
      name: 'given a write tool in allow, then the allow rule fails',
      mutate: (_, s) => s.permissions.allow.push(P + 'create_project'),
      expected: 'allow is not exactly the six read tools',
    },
    {
      name: 'given edit_screens moved from ask to allow, then the ask rule fails',
      mutate: (_, s) => {
        s.permissions.ask = s.permissions.ask.filter((r) => r !== P + 'edit_screens');
        s.permissions.allow.push(P + 'edit_screens');
      },
      expected: 'ask is not exactly the three write tools',
    },
    {
      name: 'given a write tool missing from deny, then the deny rule fails',
      mutate: (_, s) => (s.permissions.deny = s.permissions.deny.filter((r) => r !== P + 'upload_design_md')),
      expected: 'deny is not exactly the seven write tools',
    },
    {
      name: 'given an unclassified Stitch rule, then it is named',
      mutate: (_, s) => s.permissions.allow.push(P + 'new_tool'),
      expected: 'the unclassified rule mcp__stitch__new_tool',
    },
  ])('$name', ({ mutate, expected }) => {
    // given
    const mcp = goodMcp();
    const settings = goodSettings();
    mutate(mcp, settings);
    // when
    const findings = checkAgentSettings(mcp, settings);
    // then
    if (expected === null) expect(findings).toEqual([]);
    else expect(findings.some((finding) => finding.includes(expected))).toBe(true);
  });
});
