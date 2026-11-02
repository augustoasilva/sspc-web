# Implementation Plan: Installable PWA Shell

**Branch**: `feature/001-installable-pwa-shell` | **Date**: 2026-11-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-installable-pwa-shell/spec.md`, plus the technical direction given with `/speckit-plan`.

## Summary

Deliver the installable shell of SSPC Studio: an Angular 22 PWA (standalone, zoneless, signals) that installs to the iPhone Home Screen, opens as a standalone app and works offline after one load; shows a placeholder home and an About screen (version, build, connection, storage protection); follows the Stitch designs in light and dark from tokens generated out of `DESIGN.md`; and tells the user, without interrupting them, when a new version is ready (Angular service worker, `SwUpdate`). Around it: seven first `ui` components with a catalogue at `/_ds` (development only), a hardened Caddy image for the app, a second image for the static profile site in `site/`, a CI workflow that lints, tests, builds, scans and builds both images for every pull request, Dependabot, a PR template, and a quickstart that proves everything on an iPhone over the home network through the `sspc-api` local stack, including the offline launch. The security review added twelve requirements (SEC-001 to SEC-012); the design carries them through policy checks in CI, a stricter scan gate with a 30-day exceptions record, digest-pinned images without access logs, an HTTPS-only service worker with a visible notice otherwise, and a test-only request counter that replaces access logs as the offline evidence ([research R-26](research.md) maps each requirement to its artefact). A design phase before the components lets the agent create the three missing Stitch screens (dialog, placeholder home, insecure-connection notice) through the Stitch MCP, the owner approving every write, and iterate on them until they match `DESIGN.md` ([research R-33](research.md)).

Research found four things that change the input or the spec; each is recorded in [research.md](research.md) and listed in section "Decisions needing the owner" below: the service worker serves any relaunch from the newest version (spec amended), `lucide-angular@1.0.0` cannot be installed with Angular 22 (use `@lucide/angular`), the sibling's CI forbids `paths-ignore` (not copied), and three Stitch pieces are missing (dialog, placeholder home, insecure-connection notice).

## Technical Context

**Language/Version**: TypeScript 6.0.3, Angular 22.2.4 (build and CLI 22.2.5), SCSS, Node 24 LTS (24.21.0 here); npm 11.19.0

**Primary Dependencies**: Runtime: `@angular/*` 22.2.4 (incl. `service-worker`; `@angular/build` and `@angular/cli` 22.2.5), `@angular/cdk` 22.2.5, `@lucide/angular` 1.66.0, `rxjs` ~7.8. Dev: `vitest` 5.0.5, `jsdom` 30, `axe-core` 4.13.0, `style-dictionary` 5.5.5, `yaml` 2.9.1, `@google/design.md` 0.4.0, `eslint` 10 + `angular-eslint` 22 + `typescript-eslint` 8.72, `stylelint` 17.16 + `postcss-scss`. Images, pinned by digest (research R-29): `node:24.22.2` (builder), `caddy:2.11.7` (both runtime stages), `node:24.22.2-alpine` (test-only counter proxy). No new runtime or development dependency comes from the security work: the policy scripts and the proxy use the Node standard library and the `yaml` package already planned. Justifications: research R-07.

**Storage**: No user text. Browser cache holds public app assets only (no `dataGroups`, SEC-002); one `localStorage` flag records the storage-persistence request, written before the request (SEC-012); no IndexedDB. Neither image writes an access log (SEC-008).

**Testing**: Vitest through `@angular/build:unit-test` (jsdom), `TestbedHarnessEnvironment` with CDK harnesses, axe-core on every `ui` component variant, `it.each` over `{ name, input, output }`; container, site and counter smoke scripts; policy-check and counter-proxy tests in Vitest's node environment (research R-31); the installed app on a real iPhone (quickstart).

**Target Platform**: iOS Safari with the app on the Home Screen (primary); desktop browsers (secondary); `linux/amd64` images, run by the `sspc-api` local stack and later by the cluster (non-root, all capabilities dropped, read-only root).

**Project Type**: Single web application (PWA) plus a static site, in one repository, two images.

**Performance Goals**: first usable screen < 1 s on warm launch, online or offline (SC-001); update notice < 5 s after open/foreground/online (SC-004); connection state change < 2 s; initial JS **warning 400 kB, error 600 kB** (baseline 222.37 kB raw for the bare scaffold).

**Constraints**: offline after the first load, service worker only in a secure context (SEC-001); no Background Sync; CSP per image (app: `default-src 'self'`, no inline scripts or handlers, no remote fonts or images; site: stricter); no third-party requests, no access logs, no source maps (SEC-002, SEC-004, SEC-008); every UI string in Brazilian Portuguese; tap targets ≥ 48 px; DESIGN.md wins over Stitch; Stitch writes only with the owner's approval of each call (Principle VI v2.1.0, R-33); no secrets in CI; images never pushed; high and critical findings fail the scans whether or not a fix exists (SEC-006).

**Scale/Scope**: 2 users; 2 routes (`/`, `/sobre`) plus a development-only catalogue (`/_ds`); 7 `ui` components; 2 production images plus 1 test-only image (the counter proxy); 1 workflow with 6 jobs; 8 policy checks; 6 new Stitch screens (3 × light and dark).

## Constitution Check

*GATE: passes before research, re-checked after design (second column).*

| Principle | Before | After | How the design meets it |
|-----------|:------:|:-----:|--------------------------|
| I. Offline-First | ✔ | ⚠ | "After the first successful sign-in" is read as "after the first load" because no sign-in exists yet (spec A-001; see Complexity Tracking). Every screen, with its images and fonts, is served from the service worker cache from 10 s after one load (R-02); the shell stores no user text, so the 500 ms rule has nothing to guard yet; `storage.persist()` is requested (R-04). No Dexie because there is no data. |
| II. iOS Safari primary | ✔ | ✔ | No Background Sync; update checks at start, foreground and `online` (R-01); done only after the quickstart is recorded on an iPhone with the installed app. |
| III. Modern Angular | ✔ | ✔ | Standalone, zoneless (verified, R-06), `OnPush` (the Angular 22 default: components omit `changeDetection`, and the lint rule reports any explicit opt-out; R-13), signals; `effect()` only for DOM/storage side effects; `input()`/`output()`/`inject()`; `@if`/`@for`; lazy routes (`/`, `/sobre`, `/_ds`, `**` → `/`); RxJS only at the edge (`SwUpdate.versionUpdates`, converted to a signal); files without `.service`/`.component`; prefix `sspc`; the three angular-eslint rules are errors. |
| IV. Structure and boundaries | ✔ | ✔ | `core`, `features/<name>/{pages,<name>.routes.ts}`, `ui`, `src/testing`; boundaries enforced by `no-restricted-imports` and proven by inline failing cases in the tools config (R-13). Intra-`ui` imports are an interpretation, recorded in Complexity Tracking. |
| V. Design system with the screens | ✔ | ⚠ | Seven components, each with README, harness, table-driven tests with axe, catalogue entry; tokens-only styles, stylelint rule set, CDK, Lucide, self-hosted fonts. The dialog has no Stitch design yet; the design phase (Phase 2, R-33) creates and aligns it before T038 and T039 start (see Complexity Tracking). |
| VI. Design source | ✔ | ⚠ | `DESIGN.md` + `design:lint` + `tokens:build` + sync check; Stitch read through the MCP and recorded in research.md R-14 (layout, states, spacing, copy, light and dark); nothing copied; the agent writes to Stitch only with the owner's approval of each call (Principle VI v2.1.0), enforced by `ask` permissions and verified in CI by the `agent-settings` check. Three pieces have no Stitch design yet (dialog, home, insecure-connection notice): the design phase creates them and aligns them with `DESIGN.md` (T017 to T022); see Complexity Tracking. |
| VII. Test discipline | ✔ | ✔ | Harness-only assertions, `it.each` tables, given/when/then, fakes through TestBed, `vi.useFakeTimers`; axe on every component variant; no Playwright flow needed. |
| VIII. Dependencies | ✔ | ✔ | All additions are on the allowed list or are tooling; justified in R-07. One substitution: `@lucide/angular` for the deprecated `lucide-angular`. The counter proxy and policy scripts add no dependency. |
| IX. Quality gates | ✔ | ✔ | ESLint + boundaries, stylelint, `design:lint`, `tokens:check`, Vitest (app and tools), budgets 400/600 kB, `npm audit` over the whole tree, gitleaks, Trivy without `ignore-unfixed`, policy checks: all in CI (R-18, R-30, R-31). A finding can only be excepted through the dated record of R-30. |
| X. API contract | n/a | n/a | No request is made. `APP_VERSION` exists for the later `X-App-Version` header; the 426 forced update is deferred (spec A-001). |
| XI. User experience | ✔ | ⚠ | Mobile-first, 48 px targets, light/dark from the device, labelled controls, contrast ≥ 4.5:1 checked by token tests, connection chip on every screen. The sync status indicator is deferred to the sync feature (see Complexity Tracking). |
| XII. Release discipline | ✔ | ✔ | CI never publishes, deploys or holds secrets (read-only token, no persisted credentials, SHA-pinned actions, checked by the `workflow` policy); both images built and scanned but not pushed; `APP_VERSION`/`APP_BUILD` injected, `0.0.0+dev` locally; `branch-guard`; tagging, promotion and the published-image catalogue check are the release feature's. |
| XIII. Language and naming | ✔ | ✔ | English code and docs; Portuguese UI text and routes (`/sobre`); `/_ds` is the constitution's own catalogue path. |

Workflow and Definition of Done: iPhone verification is the quickstart (section D); every new `ui` component ships its artefacts; all gates pass in CI.

## Project Structure

### Documentation (this feature)

```text
specs/001-installable-pwa-shell/
├── plan.md              # This file
├── research.md          # Decisions, verified findings, Stitch reading (R-14)
├── data-model.md        # Runtime state and content entities
├── quickstart.md        # Validation: local gates, container, site, iPhone
├── contracts/
│   ├── ui-components.md         # inputs, outputs, states of the 7 components
│   ├── pwa-and-update.md        # manifest, index.html, ngsw config, update contract
│   ├── http-serving.md          # Caddy behaviour, headers, image runtime contract
│   └── build-and-ci.md          # defines, scripts, CI jobs, Dependabot
├── checklists/requirements.md
└── tasks.md             # Ordered tasks (140), with the requirement coverage map
```

### Source Code (repository root)

```text
DESIGN.md                      # source of truth for tokens (copied from the owner's file)
Dockerfile                     # app: node:24.22.2 builder → caddy:2.11.7 (both pinned by digest, R-29), setcap -r, USER 65532, VOLUME /data /config
Caddyfile                      # app serving rules (contracts/http-serving.md)
.dockerignore  .mcp.json  eslint.config.mjs  stylelint.config.mjs  proxy.conf.json
angular.json  ngsw-config.json  package.json  tsconfig*.json   # edited, not new
.claude/settings.json          # committed: Stitch read allow-list, three write tools on ask, seven denied (R-33)
.github/
├── workflows/ci.yml           # lint, test, build, security, image, branch-guard
├── dependabot.yml
└── pull_request_template.md
tools/build-tokens.mjs         # DESIGN.md → tokens.json + tokens.css
tools/*.test.mjs               # Vitest node environment: build-tokens, design-lint, pwa-static, ngsw-config, contrast and the rule proofs lint-rules (ESLint) and stylelint-rules, which lint inline code at virtual paths (R-13)
tools/offline-proof/           # test-only: counter-proxy.mjs, count.mjs, Dockerfile (+ .dockerignore), compose.override.yaml, tests
security/exceptions.yaml       # scan exceptions record, ships as `exceptions: []`
vitest.tools.config.ts         # node-environment Vitest for scripts, proxy and site content check
scripts/                       # check-tracked-secrets.sh, check-branch-guard.sh, check-ngsw-assets.mjs (+ tests), smoke-app.sh, smoke-site.sh, smoke-counter.sh
scripts/policy/                # workflow, dockerfiles, agent-settings, caddyfile, image-metadata, validation-record, exceptions, npm-audit (+ tests)
site/
├── Dockerfile  Caddyfile  .dockerignore   # explicit COPY allowlist; nothing else reaches /srv
├── index.html  links/index.html  assets/{css,fonts,img}/
└── tests/content.test.mjs     # Vitest (node env) against the running image; not copied into the image
public/                        # copied as is: manifest.webmanifest, icons/, images/about-hero.webp (owner-supplied; prefetched, R-02)
src/
├── index.html  main.ts  styles.scss
├── assets/fonts/…woff2 + OFL.txt
├── testing/                   # expectNoA11yViolations, fakes
└── app/
    ├── app.ts app.html app.scss app.config.ts app.routes.ts   # shell: app bar, banner slot, outlet, tab bar
    ├── core/                  # app-version.ts, connectivity.ts, secure-context.ts, app-update.ts, storage-persistence.ts, unsaved-work.ts, build-constants.d.ts
    ├── features/
    │   ├── home/      {pages/, home.routes.ts}
    │   ├── about/     {pages/, about.routes.ts}
    │   └── catalog/   {pages/, catalog.routes.ts}   # /_ds, development only
    └── ui/
        ├── tokens/    # tokens.json, tokens.css (generated, committed)
        └── button/ banner/ dialog/ status-chip/ list-row/ app-bar/ tab-bar/
            #   each: <name>.ts, .html, .scss, .harness.ts, .spec.ts, README.md
```

**Structure Decision**: one repository, one Angular project at the root (as scaffolded) and a separate `site/` folder with its own Dockerfile and no build step. The input's `UpdateService` is named `AppUpdate` (file `app-update.ts`), following Principle III's naming rule and avoiding a clash with Angular's `SwUpdate`; the same rule names the other core classes (`Connectivity`, `SecureContext`, `StoragePersistence`, `UnsavedWork`).

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|-----------|-----------|---------------------------------------|
| **VI**: three screens (dialog, placeholder home, insecure-connection notice) are created in Stitch and read into `research.md` after the spec and the tasks were written, not before tasks are generated | They have no Stitch design (R-14 G1, G2, G10). Principle VI v2.1.0 lets the agent create a missing screen when the owner approves each write, and wants it to exist before the component or page that uses it is built; the bullet that has the plan record the Stitch reading before tasks are generated is the one not met | Waiting would block the shell; building them from tokens alone would break Principle VI. Bounds: Phase 2 runs before any component or page that uses them; the owner approves every write (`ask`); only the six new screens are created or edited; the loop stops after 5 rounds per screen; T021 reconciles the spec and ends with a clean `/speckit-analyze`. This row is removed when T021 completes |
| **V**: seven `ui` components, not the two named in the input | FR-008, FR-012, FR-016, FR-017, FR-019 need chip, dialog, row, app bar, tab bar; Principle V forbids page-level one-off markup | Building them as page markup breaks Principle V and would have to be redone as soon as the next feature needs them. The owner may cut `list-row`, `app-bar` and `tab-bar` by accepting that exception |
| **VIII**: `@lucide/angular` instead of `lucide-angular@1.0.0` | The latter is deprecated and its peer range stops at Angular 21 | Forcing it with `--legacy-peer-deps` hides a real incompatibility |
| **VIII/IX**: a `package.json` `overrides` entry forces `zod` `^4.6.6` under `@google/design.md` (research R-30) | `@google/design.md` 0.4.0 depends on zod 3.x, which carries a high advisory with no 3.x fix, and SEC-006 fails the scan on it. The design linter was checked to give the same result with zod 4 | An owner-approved entry in `security/exceptions.yaml` would last 30 days at a time for a problem the override removes. Drop the override when the tool depends on zod 4.6.6 or later |
| **CI**: no `paths-ignore` although the input asks for it | The sibling forbids it, and the spec (FR-026, SC-008) requires every pull request to show every result | A path filter leaves required checks pending or falsely green |
| **VI**: `design:lint` "clean" means exit 0 and zero errors, with 17 expected `orphaned-tokens` warnings | The linter has no option to silence a rule and the warnings come from tokens consumed by `tokens.css` | Editing `DESIGN.md` to reference every token from fake components would distort the design file |
| **Tooling**: a third, test-only image and a Compose override for the offline counter, and eight policy scripts | SEC-008 forbids logs, so the only evidence that an offline launch sent no request is a counter in a proxy in front of the app; SEC-004 to SEC-010 are only measurable if the repository checks them | Counting in the sibling's edge changes `sspc-api` (spec A-007); asserting the requirements by review alone leaves SC-008 unprovable. The proxy and scripts use only the Node standard library and never ship in a production image |
| **I**: the rule "every screen works offline after the first successful sign-in" is applied as "after the first load" | The shell has no sign-in, no user text and no API call (spec A-001); the screens it ships must still open offline, which is the intent of the rule | Waiting for sign-in would leave the shell unverifiable offline. The rule applies in full when the authentication feature arrives |
| **XI**: "a sync status indicator is always visible" is not met; the connection chip stands in | There is nothing to synchronize yet (no stored text, no API call) and the Stitch sync indicator belongs to the sync feature (spec A-001) | An indicator that always reads "synchronized" would be false information. The chip reports only the device's connection (spec A-012) |
| **IV**: a `ui` component may import another `ui` component by a one-level relative path (`../button/button`) | `SspcBanner`, `SspcDialog` and `SspcAppBar` embed `SspcButton`; duplicating the button's markup would break Principle V. The constitution lists what `ui` may import from outside itself and is silent on imports within `ui` | Forbidding it forces copy-paste of the button. Two or more levels, `core`, `features`, the router and `HttpClient` stay forbidden by lint (R-13) |
| **VII**: tests of scripts, the proxy and the site content check run in Vitest's node environment through a second config | Principle VII says every test is table-driven Vitest; these have no component to mount | `node --test` would break the principle for a handful of files; a second config keeps one runner and one style |

## Decisions needing the owner

Accepting the plan accepts these as written. `tasks.md` now exists, so reversing a decision also means editing the tasks it touches.

1. **Spec amended**: a full restart of the app opens the newest version (service worker behaviour), and About shows the storage state. See spec.md "Plan amendments".
2. **Missing inputs** (section 1 of research.md): confirm `Downloads/DESIGN.md` is `sspc-design/DESIGN.md`; the token script, site pages, the "02" document and the PR-template source are authored from the contracts here. Optionally (OI-9), add `stroke` and `elevation` groups to `DESIGN.md`: it states strokes and the floating shadow only in prose, so `tokens.css` derives them from `spacing.base` until then (research R-09, G11).
3. **Stitch design phase** (new): constitution v2.1.0 lets the agent write to Stitch with your approval of every call (T017, amended; commit it). Approve the permission model (`ask` on three write tools permanently, seven denied) and the limit of 5 review rounds per screen; then rename screens to the numbered convention and the project to the name the constitution uses, or amend the constitution (spec A-002); supply the About/links photos, the brand icon master (the scaffold's icons are placeholders) and the link destinations.
4. **Deviations in Complexity Tracking** above, plus `APP_BUILD`, the `ask` permissions for Stitch writes, and the `.gitignore` change for `.claude/settings.json`.
5. **Security design** (new): the insecure-connection notice needs a Stitch design (G10, task T019); the exceptions record ships empty and needs your name as approver when used; the counter proxy needs the sibling's compose file and `.env.local` at the quickstart's paths, which still move; the base-image digests of R-29 differ from the sibling's `caddy` pin because the tag was republished.
6. **Choices made while fixing the analysis findings** (review before implementing): the service worker registers when the app is stable and at the latest 5 s after start (`registerWhenStable:5000`), which backs the new 10-second offline guarantee of FR-005; the About photo lives in `public/images/` and is prefetched, with a build check (`scripts/check-ngsw-assets.mjs`) that every emitted image and font is in the prefetched group; "first usable screen" is timed on a 60 fps screen recording (FR-003); the narrowest supported screen is 320 CSS pixels (A-006); the Dependabot `tiptap` group waits until TipTap is a dependency; `caddy adapt` is checked by the `caddyfile` policy in the `security` job, not in the `image` job.

## Design phase (Stitch)

Phase 2 of [tasks.md](tasks.md) closes the Stitch gap (research G1, G2, G10) before any component or page is built from it. Details and rejected alternatives are in [research R-33](research.md).

- **What**: three screens (confirmation dialog, placeholder home "Início", insecure-connection notice), each in light and dark, created in the existing Stitch project through the Stitch MCP and then aligned with `DESIGN.md`.
- **Rule**: constitution Principle VI v2.1.0 (amended by T017): the agent may write to Stitch when the owner says so, when a screen is too far from `DESIGN.md` to fix in code, or when a screen is missing, always after asking, and the owner approves every write. This phase is the "missing screen" case.
- **Order**: commit the amendment (T017) → confirm the permissions and read the baseline (T018) → create the six screens (T019) → review and correct in a loop (T020) → record the result and re-run `/speckit-analyze` (T021) → scope check and close (T022).
- **Permissions**: one committed state in `.claude/settings.json`: the six read tools allowed; `generate_screen_from_text`, `edit_screens` and `apply_design_system` on `ask`, so the owner approves every call; the other seven write tools denied. The agent also asks in the conversation before each call (the permission prompt is a second gate). The `agent-settings` check accepts exactly this state.
- **Loop**: each round reads the screens back, writes the deviations from `DESIGN.md` into R-14, and corrects them with `edit_screens` or `apply_design_system` on the new screens only. It ends on a round with no deviation, or after 5 rounds per screen, when the owner accepts the deviation (name and date) or corrects it in Stitch.
- **Limits**: new screens only in this phase (the principle allows more, with the owner's naming or approval); no existing screen, design system or project is touched (baseline at T018, scope check at T022); `DESIGN.md` wins on any disagreement.

## Security and privacy design

Every SEC requirement has a named carrier in [research R-26](research.md); the points a reader would otherwise have to hunt for:

- **Browser and serving** (SEC-001, SEC-002, SEC-004, SEC-005): per-image headers and CSP, no access log and a filtered error log (R-27), explicit file allowlists, no source maps, no third-party URLs, an HTTPS-only service worker that shows a notice on plain HTTP ([http-serving.md](contracts/http-serving.md), [pwa-and-update.md](contracts/pwa-and-update.md)).
- **Pipeline** (SEC-006, SEC-007): scans fail on high and critical findings with or without a fix; a single dated exceptions record; eight policy checks run in the `security` and `test` jobs ([build-and-ci.md](contracts/build-and-ci.md), R-30, R-31). The scaffold's lockfile already carries five high advisories in development tooling, all with a fix available, so the first task refreshes it (R-30).
- **Evidence and hygiene** (SEC-008, SEC-010): the counter proxy and its Compose override replace the access log; the quickstart ends with a cleanup row and a record that a check keeps free of network identifiers ([quickstart.md](quickstart.md), R-28).
- **Content** (SEC-009): metadata check on images, link attributes asserted by the site content check.

## Handoffs to later features and to the owner

- The release feature must inspect the exact image selected for publication, and again after publication, and reject any catalogue-enabled output; this feature publishes nothing (spec "Published-image validation handoff").
- Future hosting owns HTTP redirection, HSTS, production logging and its privacy review.
- Before public launch the owner confirms permission to publish each name and photo, accepts the scraper exposure of the partnerships email, and reviews LGPD applicability (SEC-009, SEC-011).
