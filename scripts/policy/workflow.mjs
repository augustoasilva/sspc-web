// Workflow policy (contracts/build-and-ci.md §Policy checks, SEC-007, FR-029). It reads a GitHub
// workflow and returns one finding per broken rule. The rules mirror the sibling's
// scripts/check-workflow.sh, parsed with the `yaml` package instead of awk, plus one rule of ours
// (a download must be checked with sha256sum in the same step).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const REQUIRED_JOBS = ['lint', 'test', 'build', 'security', 'image', 'branch-guard'];
export const PULL_REQUEST_TYPES = ['opened', 'synchronize', 'reopened', 'edited'];
export const CONCURRENCY_GROUP =
  '${{ github.workflow }}-${{ github.event_name }}-${{ github.event.pull_request.number || github.run_id }}';
export const CANCEL_IN_PROGRESS = "${{ github.event_name == 'pull_request' }}";
const BRANCH_GUARD_IF = "github.event_name == 'pull_request'";
const ALLOWED_EVENTS = ['pull_request', 'push', 'workflow_dispatch'];
const FILTER_KEYS = ['paths', 'paths-ignore', 'tags', 'tags-ignore'];
const PIN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+@[0-9a-f]{40}$/;
const EVENT_DATA = /github\.event\.|github\.head_ref|github\.base_ref/;

function sameList(actual, expected, ordered = true) {
  if (!Array.isArray(actual)) return false;
  if (ordered) return JSON.stringify(actual) === JSON.stringify(expected);
  return [...actual].sort().join(',') === [...expected].sort().join(',');
}

// Returns an array of findings (strings); an empty array means the workflow passes.
export function checkWorkflow(doc) {
  const findings = [];
  const fail = (message) => findings.push(message);
  const text = JSON.stringify(doc);

  // The GitHub secrets context only: ${{ secrets.NAME }}. A file name such as secrets.sh is not one.
  if (/\$\{\{[^}]*\bsecrets\./.test(text)) fail('the workflow references secrets.');

  const on = doc?.on;
  if (!on || typeof on !== 'object') {
    fail('the workflow has no event map');
  } else {
    for (const event of Object.keys(on)) {
      if (!ALLOWED_EVENTS.includes(event)) fail(`unexpected trigger ${event}`);
    }
    if (on.pull_request) {
      if (!sameList(on.pull_request.branches, ['develop', 'main'])) fail('pull_request branches must be exactly develop and main');
      if (!sameList(on.pull_request.types, PULL_REQUEST_TYPES)) fail('pull_request types must be exactly opened, synchronize, reopened, edited');
    }
    if (on.push && !sameList(on.push.branches, ['develop', 'main'], false)) fail('push branches must be exactly develop and main');
    for (const event of Object.values(on)) {
      if (event && typeof event === 'object') {
        for (const key of FILTER_KEYS) if (key in event) fail(`trigger filter ${key} is not allowed`);
      }
    }
  }

  if (!doc.permissions || JSON.stringify(doc.permissions) !== JSON.stringify({ contents: 'read' })) {
    fail('top-level permissions must be exactly contents: read');
  }
  if (doc.concurrency?.group !== CONCURRENCY_GROUP) fail('the concurrency group is not the one of R-18');
  if (doc.concurrency?.['cancel-in-progress'] !== CANCEL_IN_PROGRESS) fail('cancel-in-progress is not the one of R-18');

  const jobs = doc.jobs && typeof doc.jobs === 'object' ? doc.jobs : {};
  for (const name of REQUIRED_JOBS) {
    if (!(name in jobs)) fail(`required job ${name} is missing`);
  }

  for (const [name, job] of Object.entries(jobs)) {
    if (job.permissions !== undefined) fail(`job ${name} sets permissions`);
    if (job.if !== undefined && !(name === 'branch-guard' && job.if === BRANCH_GUARD_IF)) {
      fail(`job ${name} has an if, which is prohibited`);
    }
    if (job['continue-on-error'] !== undefined) fail(`job ${name} has continue-on-error, which is prohibited`);

    for (const step of job.steps ?? []) {
      const uses = step.uses;
      if (typeof uses === 'string') {
        if (!PIN.test(uses)) fail(`job ${name} uses ${uses}, which is not pinned to a 40-hex commit`);
        if (uses.startsWith('actions/checkout') && step.with?.['persist-credentials'] !== false) {
          fail(`job ${name} checks out without persist-credentials: false`);
        }
      }
      if (typeof step.run === 'string') {
        if (EVENT_DATA.test(step.run)) fail(`job ${name} interpolates event data in run; pass it through env`);
        if (/docker run/.test(step.run) && !/@sha256:/.test(step.run)) fail(`job ${name} runs a docker image without a digest`);
        if (/(curl|wget)\s/.test(step.run) && !/sha256sum\s+(--check|-c)/.test(step.run)) {
          fail(`job ${name} downloads without a sha256sum check in the same step`);
        }
      }
    }
    if (typeof job.container === 'string' && !/@sha256:/.test(job.container)) fail(`job ${name} container has no digest`);
    if (job.container?.image && !/@sha256:/.test(job.container.image)) fail(`job ${name} container has no digest`);
    for (const [key, value] of Object.entries(job.services ?? {})) {
      if (value?.image && !/@sha256:/.test(value.image)) fail(`service ${key} has no digest`);
    }
  }
  return findings;
}

// Parses the YAML text and checks it. A duplicate job name is a parse error in the `yaml` package.
export function checkWorkflowText(text) {
  let doc;
  try {
    doc = parse(text, { uniqueKeys: true });
  } catch (error) {
    return [`the workflow does not parse: ${error.message.split('\n')[0]}`];
  }
  return checkWorkflow(doc);
}

function main() {
  const file = process.argv[2] ?? '.github/workflows/ci.yml';
  const findings = checkWorkflowText(readFileSync(file, 'utf8'));
  if (findings.length > 0) {
    for (const finding of findings) console.error(`workflow: ${finding}`);
    process.exit(1);
  }
  console.log(`workflow: ${file} passes the policy`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
