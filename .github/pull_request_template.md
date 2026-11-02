<!--
Title: Conventional Commits in English, lowercase subject, e.g. "feat: add the update notice".
It becomes the squash commit on develop or main. Write "N/A" where something does not apply.
These comments do not show in the PR; leave or delete them.
-->

## What and why

<!-- One or two sentences: the outcome for the owner, and the reason. -->

## Spec Kit

- Feature: `specs/NNN-name/` — spec.md · plan.md · tasks.md
- `/speckit-converge`: <!-- "Converged", or what is left and why -->

## Acceptance scenarios

<!-- Copy the scenarios from spec.md and tick the ones you checked by hand. -->

- [ ]

## How to test

<!-- Commands a reviewer can run: `npm test`, `npm run test:tools`, a build, the smoke scripts, the iPhone steps from quickstart.md. -->

## Checklist

**Architecture**

- [ ] `ui` components import no app code (`@sspc/core`, `@sspc/features`, `@angular/router`, `@angular/common/http`) and no path climbing two or more levels (ESLint boundary rules clean).
- [ ] No feature imports another feature; shared code lives in `core` or `ui`.
- [ ] Each `ui` component has its README, harness, axe test and a catalogue entry.

**Tests**

- [ ] Table-driven, with `{ name, input, output }` cases, `given …, when …, then …` names and `// given`, `// when`, `// then` sections.
- [ ] Harnesses for components; fakes through TestBed; time through `vi.useFakeTimers`.
- [ ] Tokens: any new text pair or component size is covered by `tools/contrast.test.mjs` or `tools/component-metrics.test.mjs`.

**Design**

- [ ] Stitch screens for the change are listed (light and dark), and `DESIGN.md` and the generated tokens are in sync (`npm run tokens:check`).
- [ ] Copy is Brazilian Portuguese; no copy lives in a component template without a reason.

**Offline and iPhone**

- [ ] Verified on the installed app: the record in `specs/001-installable-pwa-shell/validation.md` is updated (results only).
- [ ] Airplane-mode and stack-stopped launches checked when the change touches the shell, the worker or the update flow.

**Security**

- [ ] No secrets in code, tests, fixtures or logs; the Stitch key is never in a file (only `${STITCH_API_KEY}`).
- [ ] CSP unchanged, or the change is justified in Deploy notes; no remote font, image or script.
- [ ] Owner confirmations: SEC-009 (any photo or name published) and SEC-011 (no third-party request added).
- [ ] Every Stitch write in this work was approved by the owner and is listed here: <!-- "none", or the screen names -->.

**Delivery**

- [ ] CI green: lint, test, build, security, image and branch-guard (`release/X.Y.Z` or `hotfix/X.Y.Z` into `main`).
- [ ] Commits signed and shown as Verified.

**Before merging** (branch protection is unavailable on this plan, so these checks are advisory; decision D-003)

- [ ] Every job above finished green on the latest push of this pull request.
- [ ] The owner has read the Security section and the Stitch list.

## Deploy notes

<!--
What the deploy needs beyond the image: a new build argument, a manual step, a runbook change.
With an sspc-api change: the API deploys first.
How to roll back. "None" when there is nothing.
-->

## Related

<!-- The matching sspc-api PR, issues. -->
