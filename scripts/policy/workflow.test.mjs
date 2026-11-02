// Table-driven tests for the workflow policy (T105, SEC-007, FR-029). Each case takes a valid
// workflow, breaks one rule and expects the finding that names it.
import { describe, expect, it } from 'vitest';
import { checkWorkflow, checkWorkflowText, CANCEL_IN_PROGRESS, CONCURRENCY_GROUP } from './workflow.mjs';

const CHECKOUT = 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1';
const SETUP_NODE = 'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1';
const BRANCH_GUARD_IF = "github.event_name == 'pull_request'";

function goodWorkflow() {
  const npmJob = () => ({
    'runs-on': 'ubuntu-latest',
    steps: [
      { uses: CHECKOUT, with: { 'persist-credentials': false } },
      { uses: SETUP_NODE, with: { 'node-version': 24 } },
      { run: 'npm ci' },
    ],
  });
  return {
    name: 'CI',
    on: {
      pull_request: { branches: ['develop', 'main'], types: ['opened', 'synchronize', 'reopened', 'edited'] },
      push: { branches: ['develop', 'main'] },
      workflow_dispatch: {},
    },
    permissions: { contents: 'read' },
    concurrency: { group: CONCURRENCY_GROUP, 'cancel-in-progress': CANCEL_IN_PROGRESS },
    jobs: {
      lint: npmJob(),
      test: npmJob(),
      build: npmJob(),
      security: npmJob(),
      image: npmJob(),
      'branch-guard': {
        if: BRANCH_GUARD_IF,
        'runs-on': 'ubuntu-latest',
        steps: [{ uses: CHECKOUT, with: { 'persist-credentials': false } }, { run: 'scripts/check-branch-guard.sh "$BASE_REF" "$HEAD_REF"' }],
      },
    },
  };
}

describe('workflow policy', () => {
  it.each([
    {
      name: 'given the valid workflow, then no finding is reported',
      mutate: () => {},
      expected: null,
    },
    {
      name: 'given a pull_request_target trigger, then it is named as an unexpected trigger',
      mutate: (w) => (w.on.pull_request_target = { branches: ['develop', 'main'] }),
      expected: 'unexpected trigger pull_request_target',
    },
    {
      name: 'given pull_request into develop only, then the branches rule fails',
      mutate: (w) => (w.on.pull_request.branches = ['develop']),
      expected: 'pull_request branches must be exactly develop and main',
    },
    {
      name: 'given a push trigger on a feature branch, then the push branches rule fails',
      mutate: (w) => (w.on.push.branches = ['develop', 'main', 'feature/x']),
      expected: 'push branches must be exactly develop and main',
    },
    {
      name: 'given a pull_request type is missing, then the types rule fails',
      mutate: (w) => (w.on.pull_request.types = ['opened', 'synchronize', 'reopened']),
      expected: 'pull_request types must be exactly',
    },
    {
      name: 'given a paths filter on push, then the filter is named',
      mutate: (w) => (w.on.push.paths = ['src/**']),
      expected: 'trigger filter paths is not allowed',
    },
    {
      name: 'given write permission at the top level, then the permissions rule fails',
      mutate: (w) => (w.permissions = { contents: 'write' }),
      expected: 'top-level permissions must be exactly contents: read',
    },
    {
      name: 'given permissions on a job, then the job is named',
      mutate: (w) => (w.jobs.test.permissions = { contents: 'write' }),
      expected: 'job test sets permissions',
    },
    {
      name: 'given a required job is missing, then it is named',
      mutate: (w) => delete w.jobs.image,
      expected: 'required job image is missing',
    },
    {
      name: 'given an if on a job other than branch-guard, then it is named',
      mutate: (w) => (w.jobs.lint.if = 'always()'),
      expected: 'job lint has an if',
    },
    {
      name: 'given continue-on-error on a job, then it is named',
      mutate: (w) => (w.jobs.test['continue-on-error'] = true),
      expected: 'job test has continue-on-error',
    },
    {
      name: 'given an action pinned to a tag, then it is not pinned to a commit',
      mutate: (w) => (w.jobs.build.steps[1].uses = 'actions/setup-node@v7'),
      expected: 'not pinned to a 40-hex commit',
    },
    {
      name: 'given a checkout that keeps credentials, then persist-credentials is named',
      mutate: (w) => (w.jobs.security.steps[0].with = {}),
      expected: 'checks out without persist-credentials: false',
    },
    {
      name: 'given event data interpolated in run, then it is named',
      mutate: (w) => (w.jobs.lint.steps[2].run = 'echo "${{ github.event.pull_request.title }}"'),
      expected: 'interpolates event data in run',
    },
    {
      name: 'given a secret reference, then it is named',
      mutate: (w) => (w.jobs.image.steps[2].run = 'echo ${{ secrets.TOKEN }}'),
      expected: 'references secrets.',
    },
    {
      name: 'given docker run without a digest, then it is named',
      mutate: (w) => (w.jobs.image.steps[2].run = 'docker run --rm aquasec/trivy:0.75.0 image x'),
      expected: 'runs a docker image without a digest',
    },
    {
      name: 'given a download without a checksum step, then it is named',
      mutate: (w) => (w.jobs.security.steps[2].run = 'curl -sSL https://example.com/gitleaks.tar.gz -o g.tgz'),
      expected: 'downloads without a sha256sum check',
    },
    {
      name: 'given a download with sha256sum in the same step, then it passes',
      mutate: (w) => (w.jobs.security.steps[2].run = 'curl -sSL https://example.com/g.tgz -o g.tgz && echo "x  g.tgz" | sha256sum --check'),
      expected: null,
    },
    {
      name: 'given a script whose file name contains secrets, then it is not a secrets reference',
      mutate: (w) => (w.jobs.security.steps[2].run = 'bash scripts/check-tracked-secrets.sh'),
      expected: null,
    },
    {
      name: 'given a changed concurrency group, then it is named',
      mutate: (w) => (w.concurrency.group = 'ci'),
      expected: 'the concurrency group is not the one of R-18',
    },
  ])('$name', ({ mutate, expected }) => {
    // given
    const workflow = goodWorkflow();
    mutate(workflow);
    // when
    const findings = checkWorkflow(workflow);
    // then
    if (expected === null) {
      expect(findings).toEqual([]);
    } else {
      expect(findings.some((finding) => finding.includes(expected))).toBe(true);
    }
  });

  it('given a duplicate job name in the text, then the file does not parse and the parse error is reported', () => {
    // given
    const text = 'name: CI\non: {push: {branches: [develop, main]}}\njobs:\n  lint: {}\n  lint: {}\n';
    // when
    const findings = checkWorkflowText(text);
    // then
    expect(findings.length).toBe(1);
    expect(findings[0]).toContain('does not parse');
  });
});
