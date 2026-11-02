# Contract: build, scripts and CI

**Feature**: [spec.md](../spec.md) | **Research**: R-05, R-09, R-13, R-18, R-19, R-20 | **Mirrors**: `sspc-api/specs/002-dev-flow-lan-pwa/contracts/ci-workflow.md`

## npm scripts

| Script | Does |
|--------|------|
| `design:lint` | `design.md lint DESIGN.md`; passes on exit 0 with zero errors (17 `orphaned-tokens` warnings expected, research R-09) |
| `tokens:build` | `node tools/build-tokens.mjs` → `src/app/ui/tokens/tokens.json` and `tokens.css`, and the light-only `site/assets/css/tokens.css` for the static site (the site has no build step, so its values are generated here, never edited by hand: FR-025) |
| `tokens:check` | `tokens:build` then `git diff --exit-code -- src/app/ui/tokens site/assets/css/tokens.css` |
| `prebuild`, `pretest` | `design:lint` then `tokens:build` (they need `DESIGN.md` and `tools/build-tokens.mjs`, so before T016 and T024 `ng build` and `ng test` are run directly) |
| `lint` | `eslint .` (boundaries, angular-eslint rules) and `stylelint "src/app/ui/**/*.scss" --allow-empty-input` (the flag keeps it from failing before the first `ui` stylesheet exists) |
| `build` | `ng build` (production by default; budgets enforced) |
| `test` | `ng test --no-watch` in CI; watch locally |
| `test:tools` | `vitest run --config vitest.tools.config.ts` (node environment): the policy scripts, the script tests (branch guard, tracked secrets, ngsw assets), the `design.md lint` gate (a broken token reference still fails), the lint-rule proofs, the counter proxy and, when `SITE_URL` is set, the site content check; table-driven like the app tests (research R-31) |
| `policy` | runs every check of `scripts/policy/` that needs no registry access or secrets (`caddyfile` runs the pinned Caddy image through Docker, so Docker must be available): `workflow`, `dockerfiles`, `agent-settings`, `caddyfile`, `image-metadata`, `validation-record`, `exceptions` |
| `audit` | `node scripts/policy/npm-audit.mjs` (needs the registry) |
| `start` | `ng serve` with `proxy.conf.json` |

## Build configuration (`angular.json`)

| Setting | Value |
|---------|-------|
| `prefix` | `sspc` |
| styles | `src/styles.scss`; component schematics default to SCSS |
| `define` (options) | `APP_VERSION='0.0.0+dev'`, `APP_BUILD='local'`, `SSPC_CATALOG=true` |
| `define` (production) | same keys, `SSPC_CATALOG=false`; CLI `--define` overrides key by key (verified); the Dockerfile passes all three from build arguments, `SSPC_CATALOG` defaulting to `false` |
| production `optimization.styles.inlineCritical` | `false` (CSP, research R-16) |
| production `optimization.fonts` | `false` (no build-time fetch or inlining of remote font CSS; SEC-002) |
| production `sourceMap` | `false`, stated explicitly (SEC-004) |
| budgets (production) | initial: warning 400 kB, error 600 kB; anyComponentStyle: warning 4 kB, error 8 kB (unchanged) |
| `serviceWorker` | `ngsw-config.json` (production) |
| `serve.options.proxyConfig` | `proxy.conf.json` (`/api` → `http://localhost:8080`) |

## CI workflow (`.github/workflows/ci.yml`)

Triggers, permissions, concurrency, pins and checkout rules as in research R-18: `pull_request` (bases `develop`, `main`; `opened`, `synchronize`, `reopened`, `edited`), `push` (`develop`, `main`), `workflow_dispatch`; `permissions: contents: read`; no secrets; no `paths-ignore`; every job without `if` or `continue-on-error` except `branch-guard`'s `if: github.event_name == 'pull_request'` (enforced by `workflow.mjs`, as are the triggers, the permissions, the concurrency block and the list of required jobs). Every job that runs `npm` or `node` sets Node up with `actions/setup-node` (`node-version: 24`, no cache); `branch-guard` runs only a shell script and needs no Node.

| Job (check name) | Steps | Fails when |
|------------------|-------|-----------|
| `lint` | `npm ci`; `npm run design:lint`; `npm run lint` (ESLint with boundaries, stylelint) | any rule error, a `design.md` error |
| `test` | `npm ci`; `npm test` (jsdom, no browser); `npm run test:tools` (includes the lint-rule proofs: each boundary and token rule must still fail on its bad case) | any test fails, an axe violation, a missing case table, a lint rule that no longer fails its bad case |
| `build` | `npm ci`; `npm run tokens:check`; `npm run build`; assert in `dist/sspc-web/browser`: no catalogue chunk, no `onload=`, no `*.map` or `sourceMappingURL`, no absolute `http(s)://` URL in `index.html`, `*.css`, `manifest.webmanifest`, `ngsw.json`, no `dataGroups` in `ngsw.json`, and every emitted image and font listed in the `app` group of `ngsw.json` | token drift, budget error (600 kB), build error, catalogue shipped, a source map, a third-party URL |
| `security` | full-history checkout; `npm ci` (the policy scripts import `yaml`); `npm run policy`; `npm run audit` (whole tree, development dependencies included, no `--omit`); gitleaks 8.30.1 (checksum-verified binary, `gitleaks git --redact`); `scripts/check-tracked-secrets.sh`; shellcheck of `scripts/*.sh` | a policy violation, a high/critical advisory without an unexpired exception, a finding, a tracked secret path |
| `image` | `npm ci` (the Trivy-ignore script and the site content test need the installed packages); buildx `sspc-web:ci` (context `.`), `sspc-site:ci` (context `site`) and the test-only `sspc-offline-proof:ci` (Dockerfile `tools/offline-proof/Dockerfile`), `load: true`, `push: false`, build args from the commit (never `SSPC_CATALOG=true`); `scripts/smoke-app.sh`, `scripts/smoke-site.sh`, `scripts/smoke-counter.sh`; Trivy v0.75.0 on all three images with the ignore file derived from `security/exceptions.yaml`: MEDIUM and lower reported (exit 0), `HIGH,CRITICAL` **whether or not a fix exists** fails | a smoke assertion, an unexcepted HIGH/CRITICAL, an expired exception |
| `branch-guard` | `scripts/check-branch-guard.sh "$BASE_REF" "$HEAD_REF"` (refs from `env:`; the script's own test, `scripts/check-branch-guard.test.mjs`, runs in the `test` job through `npm run test:tools`) | base `main` and head not exactly `release/X.Y.Z` or `hotfix/X.Y.Z` |

Event matrix and the advisory-only host limit (no branch protection on this plan) are those of the sibling contract; the PR template carries the owner's "before merging" self-check.

Helper script interfaces:
- `scripts/check-branch-guard.sh BASE HEAD`: exactly two arguments (else exit 2); base other than `main` passes with "not applicable"; base `main` requires the case-sensitive whole-string pattern `^(release|hotfix)/(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$` (pass says it checked the name only; failure names the safely rendered head and the allowed forms, exit 1). No `eval`; head never used as a format string.
- `scripts/check-tracked-secrets.sh`: checks `.gitignore` contains `.env*` and `*.key`; lists `git ls-files -z`, fails on `*.enc.yaml`, `*.key|crt|cer|der|pem|p12|pfx|mobileconfig`, `.env*`, `secrets/` paths. The `.mcp.json` key placeholder is checked by the `agent-settings` policy check below.
- `scripts/check-ngsw-assets.mjs DIR`: reads `DIR/ngsw.json`, lists the image and font files under `DIR` (`*.png`, `*.webp`, `*.jpg`, `*.jpeg`, `*.svg`, `*.woff2`, `*.ico`; the Angular worker files excepted) and exits non-zero naming each one that is not in the `app` asset group, because a lazy group is not cached by one online load (FR-005); run by the `build` job.
- `scripts/smoke-app.sh IMAGE`, `scripts/smoke-site.sh IMAGE` and `scripts/smoke-counter.sh IMAGE`: run the assertions of [http-serving.md](http-serving.md) and exit non-zero on the first failure, printing which one.

## Policy checks (`scripts/policy/`, research R-31)

Node standard library plus the existing `yaml` dev dependency; each file exports a function, has a command-line entry that exits non-zero with a named reason, and has a `*.test.mjs` with fixtures (a passing case and one failing case per rule, `it.each`).

| Check | Rule (spec) |
|-------|-------------|
| `workflow.mjs` | no `secrets.`; triggers only `pull_request`, `push` and `workflow_dispatch` (no `pull_request_target`), branches exactly `[develop, main]`, `pull_request` types exactly `opened, synchronize, reopened, edited`, and no `paths`, `paths-ignore`, `tags` or `tags-ignore`; every `uses:` pinned to a 40-hex commit; top-level `permissions` exactly `contents: read` and none at job level; the concurrency group and `cancel-in-progress` of research R-18; unique job names and no job-level `if` or `continue-on-error` except `branch-guard`'s; the six required jobs present; every checkout `persist-credentials: false`; no event data interpolated in `run`; every `docker run` and `image:` pinned by digest; every `curl`/`wget` download followed by `sha256sum --check` in its step (the last rule is ours, the others are the sibling's `check-workflow.sh`) (SEC-007, FR-029) |
| `dockerfiles.mjs` | every `FROM` has `@sha256:`; `ARG` names only `APP_VERSION`, `APP_BUILD`, `SSPC_CATALOG`; the site Dockerfile never copies `.` or `*`; runtime stages end with `USER 65532:65532`; Caddy stages run `setcap -r` (SEC-004, SEC-005, FR-030) |
| `agent-settings.mjs` | `.mcp.json` header is exactly `${STITCH_API_KEY}`; `.claude/settings.json` is exactly the state of §Stitch MCP configuration (six read tools allowed, three write tools on `ask`, seven denied); any other `mcp__stitch__` rule fails (Principle VI v2.1.0) |
| `caddyfile.mjs` | runs `caddy adapt` (pinned image) on both Caddyfiles: no access log, the `request delete` filter on the default log, every header of the contract (SEC-001, SEC-008) |
| `image-metadata.mjs` | no EXIF, XMP, textual or GPS metadata in committed JPEG, PNG or WebP files under `site/assets/img/` and `public/images/` (SEC-009) |
| `validation-record.mjs` | `validation.md`, when present, has the cleanup row and no address, hostname, fingerprint or log line (SEC-010) |
| `exceptions.mjs` | the record of `security/exceptions.yaml` is valid and unexpired; with `--trivy-out FILE` it writes the Trivy ignore file (SEC-006, research R-30) |
| `npm-audit.mjs` | `npm audit --json` over the whole tree; fails on any high or critical advisory not covered by an unexpired `npm` entry (SEC-006) |

## Dependabot (`.github/dependabot.yml`)

Ecosystems and directories: `npm` `/`; `docker` `/`, `/site` and `/tools/offline-proof` (digest pins are updated through reviewed pull requests, SEC-005); `github-actions` `/`. All `weekly`, all `target-branch: develop`. npm groups: `angular` (`@angular/*`) and `all` (everything else); a `tiptap` group is added when TipTap becomes a dependency.

## `.gitignore` additions

`.env*`, `*.enc.yaml`, `secrets/`, `*.key`; and replace the `.claude` entry with `.claude/*` plus `!.claude/settings.json` so the committed agent settings are tracked while skills and local state are not.

## Stitch MCP configuration

`.mcp.json`: server `stitch`, `type: http`, `url: https://stitch.googleapis.com/mcp`, header `X-Goog-Api-Key` set to `${STITCH_API_KEY}` (never a literal). `.claude/settings.json` (one state, committed): `permissions.allow` = `mcp__stitch__get_project`, `get_screen`, `list_projects`, `list_screens`, `list_design_systems`, `download_file`; `permissions.ask` = `generate_screen_from_text`, `edit_screens`, `apply_design_system` (Claude Code asks the owner before every call, as Principle VI v2.1.0 requires); `permissions.deny` = `create_project`, `delete_project`, `generate_variants`, `create_design_system`, `create_design_system_from_design_md`, `update_design_system`, `upload_design_md` (all `mcp__stitch__…`). Nothing else is permitted. The agent writes to Stitch only after asking the owner in the conversation and waiting for a clear yes; the `ask` permission is a second gate, because a permission prompt may not appear in every permission mode (constitution Principle VI v2.1.0).

Tools outside both Stitch lists require explicit approval. Downloads are confined to a temporary directory outside the repository and removed after inspection. Treat all Stitch output as untrusted: never execute it or copy generated code or markup into the project. CI validates the allowed and denied lists and the key placeholder with the `agent-settings` policy check; a new unclassified tool must not be silently allowed.
