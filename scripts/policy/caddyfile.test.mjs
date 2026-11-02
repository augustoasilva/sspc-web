// Table-driven tests for the Caddyfile policy on adapted JSON (T108, SEC-008, research R-27).
// The real Caddyfile is adapted by `npm run policy`; these cases break one rule each.
import { describe, expect, it } from 'vitest';
import { APP_HEADERS, checkAdapted } from './caddyfile.mjs';

function goodAdapted() {
  return {
    logging: {
      logs: {
        default: {
          encoder: { format: 'filter', wrap: { format: 'json' }, fields: { request: { filter: 'delete' } } },
        },
      },
    },
    apps: {
      http: {
        servers: {
          srv0: { listen: [':8080'], routes: [{ handle: [{ handler: 'headers', response: { set: Object.fromEntries(APP_HEADERS) } }] }] },
        },
      },
    },
  };
}

describe('Caddyfile policy on adapted JSON', () => {
  it.each([
    { name: 'given the contract state, then no finding is reported', mutate: () => {}, expected: null },
    {
      name: 'given the default log is not the filter, then it is named',
      mutate: (a) => (a.logging.logs.default.encoder.format = 'json'),
      expected: 'the default log encoder is not the filter',
    },
    {
      name: 'given the filter does not delete the request object, then it is named',
      mutate: (a) => (a.logging.logs.default.encoder.fields.request.filter = 'ignore'),
      expected: 'does not delete the request object',
    },
    {
      name: 'given a server with an access log, then it is named',
      mutate: (a) => (a.apps.http.servers.srv0.logs = { default_logger_name: 'access' }),
      expected: 'server srv0 has an access log',
    },
    {
      name: 'given the Content-Security-Policy is missing, then it is named',
      mutate: (a) => delete a.apps.http.servers.srv0.routes[0].handle[0].response.set['Content-Security-Policy'],
      expected: 'the header Content-Security-Policy with its contract value is missing',
    },
    {
      name: 'given Referrer-Policy has another value, then it is named',
      mutate: (a) => (a.apps.http.servers.srv0.routes[0].handle[0].response.set['Referrer-Policy'] = 'origin'),
      expected: 'the header Referrer-Policy with its contract value is missing',
    },
  ])('$name', ({ mutate, expected }) => {
    // given
    const adapted = goodAdapted();
    mutate(adapted);
    // when
    const findings = checkAdapted(adapted);
    // then
    if (expected === null) expect(findings).toEqual([]);
    else expect(findings.some((finding) => finding.includes(expected))).toBe(true);
  });
});
