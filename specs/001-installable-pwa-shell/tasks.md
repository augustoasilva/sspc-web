---

description: "Task list for the installable PWA shell of SSPC Studio"
---

# Tasks: Installable PWA Shell

**Input**: Design documents from `/specs/001-installable-pwa-shell/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The constitution (Principles V, VII and IX) requires them: every `ui` component has a README test-case table, a CDK harness and table-driven Vitest tests with an axe check; scripts, the lint-rule proofs, the counter proxy and the site content check are tested in Vitest's node environment (research R-31, R-13). Tests are written first and must fail before the code they cover.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified on its own. Phases 1 to 3 are shared by every story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of [spec.md](spec.md) (US1 to US8); none for Setup, Foundational and Polish
- Paths are relative to the repository root (`/home/augusto/codes/sspc/sspc-web`). "Contract" means a file under `specs/001-installable-pwa-shell/contracts/`; "R-nn" is a decision in `research.md`; "SEC-nn" is in the spec.
- Test names follow the constitution: `it.each` over `{ name, input, output }`, case names "given …, when …, then …", bodies with `// given`, `// when`, `// then`.
- Components rely on the Angular 22 default change detection, which is `OnPush`: they omit `changeDetection` (an explicit `OnPush` is tolerated), and `ChangeDetectionStrategy.Default` or `.Eager` is a lint error. angular-eslint 22 reports only an explicit opt-out (research R-13).

## Owner inputs (some tasks cannot finish without them)

| Id | Input | Needed by |
|----|-------|-----------|
| OI-1 | Confirmation that `C:\Users\augus\Downloads\DESIGN.md` (`/mnt/c/Users/augus/Downloads/DESIGN.md`) is the intended design source | T016 |
| OI-2 | A 1024 px square master of the brand icon | T051 |
| OI-3 | The About photo and the links-page photo (WebP or JPEG; metadata is stripped by the tasks) | T093, T129 |
| OI-4 | The three link destinations: Instagram URL, TikTok URL, partnerships email address | T128 |
| OI-5 | The owner approves each Stitch write call of the design phase (T019, T020); if the loop hits its round limit, the owner decides whether to accept a deviation or correct it in Stitch | T019, T020 |
| OI-6 | An iPhone, and the `sspc-api` repository checked out beside this one with its local stack working | T069, T073, T075, T085, T095, T096, T104, T139 |
| OI-7 | Confirmation of the provisional Portuguese copy that no Stitch screen or spec fixes: the home message, the update-failure message (research G3). Not blocking | T091, T102 |
| OI-8 | `STITCH_API_KEY` set in the environment where Claude Code runs (never written in a file), and the Stitch project "Só Saio Pra Comer Design System" reachable with it | T012, T018 |
| OI-9 | Optional, not blocking: add `stroke` (1 px, 2 px) and `elevation` (the floating shadow) groups to `DESIGN.md`, which states them only in prose today; until then `tokens.css` derives them from `spacing.base` (research R-09, G11) | T024, T033 |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencies, build configuration, lint and test configuration, repository hygiene.

- [x] T001 Refresh the dependency tree so the audit gate starts green: run `npm audit fix`; if a high advisory remains because the Angular packages pin each other's exact versions (`npm update` and partial installs fail with ERESOLVE), raise every `@angular/*`, `@angular/build`, `@angular/cli` and `@angular/compiler-cli` range together and regenerate the lockfile (`rm -rf node_modules package-lock.json && npm install`), which changes `package.json` as well as `package-lock.json` (done: core 22.2.4, build and cli 22.2.5; research R-30, outcome); then run `npm audit --audit-level=high` and record the result. Five high advisories (vite, undici, zod, `@modelcontextprotocol/server`, `@angular/cli`) were found on 2026-11-01, all with a fix available (research R-30). If any high or critical advisory remains with no fix, do not suppress it here: leave it for the exceptions record (T014, T111).
- [x] T002 Install dependencies in `package.json` and `package-lock.json` (research R-07). Exact versions: runtime `@angular/cdk@22.2.5` and `@lucide/angular@1.66.0` (never `lucide-angular`); development `style-dictionary@5.5.5`, `yaml@2.9.1`, `@google/design.md@0.4.0`, `axe-core@4.13.0`, `stylelint@17.16.0`, `postcss-scss@4.0.9`. Ranges, because Dependabot's groups move the lint tooling together: `eslint@^10`, `angular-eslint@^22`, `typescript-eslint@8.72` (patch range). Do not add `fake-indexeddb`, `dexie`, `uuid`, TipTap or Playwright. `npm ci` must finish with no peer-dependency error. Then run `npm audit --audit-level=high` again and record the result: these installs can add advisories that the refresh of T001 did not see (research R-30). Done: `@google/design.md@0.4.0` brought a high `zod` 3.x advisory with no 3.x fix, removed by the `package.json` `overrides` entry `"@google/design.md": {"zod": "^4.6.6"}` after `design.md lint` on the owner's file gave the same result with zod 4 (exit 0, 0 errors, 17 warnings, 1 info); research R-30 says when to drop it.
- [x] T003 [P] Edit `angular.json` (contract build-and-ci §Build configuration): project `prefix` `sspc`; `styles` `["src/styles.scss"]`; component schematics `style: scss`; `define` in options `APP_VERSION='0.0.0+dev'`, `APP_BUILD='local'`, `SSPC_CATALOG=true`, and in the production configuration the same keys with `SSPC_CATALOG=false`; production `optimization.styles.inlineCritical: false`, `optimization.fonts: false` (no build-time fetch of remote font CSS, SEC-002), `sourceMap: false`; budgets initial warning `400kB` and error `600kB`, `anyComponentStyle` warning `4kB` and error `8kB`; `serviceWorker: "ngsw-config.json"` in production; `serve.options.proxyConfig: "proxy.conf.json"`. String defines must keep their inner quotes.
- [x] T004 [P] Convert the scaffold to SCSS and the `sspc` prefix: rename `src/styles.css` to `src/styles.scss` and `src/app/app.css` to `src/app/app.scss` (`src/app/app.scss` empty; `src/styles.scss` keeps the scaffold's one-line comment until T026 rewrites it), set `selector: 'sspc-root'` and `styleUrl: './app.scss'` in `src/app/app.ts`, and change `<app-root>` to `<sspc-root>` in `src/index.html`.
- [x] T005 [P] Create `proxy.conf.json` with `{"/api": {"target": "http://localhost:8080", "secure": false, "changeOrigin": false}}` (research R-22).
- [X] T006 [P] Edit `tsconfig.json`: path aliases `@sspc/core/*` → `src/app/core/*`, `@sspc/ui/*` → `src/app/ui/*`, `@sspc/testing/*` → `src/testing/*` and no alias for features (research R-13). Create `src/app/core/build-constants.d.ts` declaring the global string constants `APP_VERSION` and `APP_BUILD` and the boolean `SSPC_CATALOG`.
- [x] T007 [P] Create `eslint.config.mjs` (flat config): typescript-eslint and angular-eslint recommended sets; `@angular-eslint/prefer-standalone`, `@angular-eslint/prefer-on-push-component-change-detection` and `@angular-eslint/template/prefer-control-flow` as `error`; component selector prefix `sspc`; the `no-restricted-imports` overrides of research R-13 for `src/app/ui/**` (no `@sspc/core/**`, `@sspc/features/**`, `@angular/router`, `@angular/common/http`, `dexie`, or relative paths climbing two or more levels), `src/app/features/**` (one override that covers every feature directory, present and future, and the virtual paths of the T029 proof; no `../../**`, no `@sspc/features/**`) and `src/app/core/**` (no `@sspc/features/**`, no `**/features/**`). Scope every config object with `files` (`src/**/*.ts` for the TypeScript sets and overrides, `src/**/*.html` for the template set) so the `.mjs` tools, scripts and site files are matched by no rule, and add global `ignores` for `dist/`, `.angular/`, `node_modules/` and `coverage/`; no extra dependency is needed for Node globals.
- [X] T008 [P] Create `stylelint.config.mjs` (core rules only, `postcss-scss` syntax, scoped to `src/app/ui/**/*.scss`): `color-no-hex`, `color-named: never`, `function-disallowed-list` for `rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color`, `unit-disallowed-list: [px, rem, em, pt, pc, cm, mm, in]`, and `declaration-property-value-disallowed-list` so `font-family` accepts only `var(...)` (research R-13). A size that has no spacing token uses the generated `--sspc-stroke-*`, `--sspc-focus-offset`, `--sspc-component-*` or `--sspc-elevation-*` custom properties, or `calc()` over `var(--sspc-spacing-base)` (research R-09); a literal `px` stays rejected.
- [X] T009 [P] Create `vitest.tools.config.ts`: `environment: 'node'`, `testTimeout: 30000` (ESLint and stylelint start-up), `include` `scripts/**/*.test.mjs`, `tools/**/*.test.mjs`, `site/tests/**/*.test.mjs`, no Angular plugin (research R-31). The Angular `@angular/build:unit-test` builder keeps running the jsdom suite under `src/`.
- [X] T010 [P] Edit `.gitignore`: add `.env*`, `*.enc.yaml`, `secrets/`, `*.key`; replace the `.claude` entry with `.claude/*` plus `!.claude/settings.json`; keep `.agents` ignored (research R-21).
- [X] T011 [P] Create `.dockerignore` for the app image: `node_modules`, `dist`, `.git`, `.github`, `specs`, `.specify`, `.claude`, `.agents`, `presets`, `site`, `tools/offline-proof`, `security`, `scripts`, `*.md` with `!DESIGN.md` re-included because the build needs it, and `.env*`.
- [X] T012 [P] Create `.mcp.json`: server `stitch`, `type: http`, `url: https://stitch.googleapis.com/mcp`, header `X-Goog-Api-Key` set to the literal text `${STITCH_API_KEY}` and never a key (contract build-and-ci §Stitch MCP configuration). Check first that `STITCH_API_KEY` is exported (OI-8): a project-scoped server named `stitch` takes precedence over a user-level server of the same name (scope order local, project, user; confirm with `claude mcp list` after creating the file), so with the variable unset the Stitch tools stop working in this project (research R-21).
- [X] T013 [P] Create `.claude/settings.json` with the Stitch permissions of [contracts/build-and-ci.md](contracts/build-and-ci.md) §Stitch MCP configuration: `permissions.allow` exactly `mcp__stitch__get_project`, `mcp__stitch__get_screen`, `mcp__stitch__list_projects`, `mcp__stitch__list_screens`, `mcp__stitch__list_design_systems`, `mcp__stitch__download_file`; `permissions.ask` exactly `mcp__stitch__generate_screen_from_text`, `mcp__stitch__edit_screens`, `mcp__stitch__apply_design_system`; `permissions.deny` exactly `mcp__stitch__create_project`, `delete_project`, `generate_variants`, `create_design_system`, `create_design_system_from_design_md`, `update_design_system`, `upload_design_md` (all prefixed `mcp__stitch__`). Principle VI v2.1.0: the agent may write to Stitch only after asking the owner, who approves every write.
- [X] T014 [P] Create `security/exceptions.yaml` containing a header comment that lists the fields of data-model.md §ExceptionRecord (`id`, `scope`, `target`, `rationale`, `compensating_controls`, `approver`, `approved`, `expires`) and the line `exceptions: []`.
- [X] T015 Add the npm scripts of contract build-and-ci §npm scripts to `package.json` (after T002): `design:lint` (`design.md lint DESIGN.md`, passes on exit 0 with zero errors; 17 `orphaned-tokens` warnings are expected), `tokens:build`, `tokens:check`, `prebuild` and `pretest` (design:lint then tokens:build), `lint` (`eslint .` then `stylelint "src/app/ui/**/*.scss" --allow-empty-input`; without the flag stylelint exits 1 with `NoFilesFoundError` until the first `ui` stylesheet exists in T033), `build`, `test`, `test:tools` (`vitest run --config vitest.tools.config.ts`), `policy` (runs the `scripts/policy` checks that need no registry access or secrets; the `caddyfile` check runs the pinned Caddy image through Docker, so Docker must be available), `audit` (`node scripts/policy/npm-audit.mjs`), `start`. `prebuild` and `pretest` need `DESIGN.md` (T016) and `tools/build-tokens.mjs` (T024), so until T024 exists run `ng build` and `ng test` directly.

---

## Phase 2: Design gap - the missing Stitch screens (Principle VI)

**Goal**: the confirmation dialog, the placeholder home "Início" and the insecure-connection notice exist in Stitch, in light and dark, and match `DESIGN.md`, before any component or page is built from them. The agent creates them through the Stitch MCP with the owner approving every write call, then reviews and corrects them in a loop that ends when a round finds no deviation.

**Independent Test**: the last round of the review record (research R-14, "Review of the new designs") shows no deviation for any of the six screens (three screens, two themes), and the screens and design systems read after the phase equal those read before it, plus the six new screens.

**⚠️ CRITICAL**: this phase must be complete before Phase 3 is, because the dialog, the notice and the home page are built from its output. In this phase Stitch writes are limited to the six new screens, and the owner approves every call (`ask`; constitution Principle VI v2.1.0).

- [X] T016 Copy the owner's design file to `DESIGN.md` at the repository root (source `/mnt/c/Users/augus/Downloads/DESIGN.md`; the review loop of T020 compares the Stitch screens with it; confirm with the owner that it is the right file, OI-1; research §1) and run `npm run design:lint`. Expected: exit code 0 and `errors: 0`; the 17 `orphaned-tokens` warnings are expected (research R-09).
- [x] T017 **Owner action (OI-5), done**: Principle VI was amended with `/speckit-constitution` as constitution v2.1.0 (MINOR) and committed in its own commit. The agent may generate or edit Stitch screens when the owner says so, when a screen is too far from `DESIGN.md` to be fixed locally in code, or when a screen is missing, always after asking the owner, who approves every write; it touches only screens it created and existing screens the owner names or approves, never deletes projects or screens, and never creates or changes design systems without explicit approval.
- [X] T018 Confirm the Stitch permissions and read the baseline. First check that `.claude/settings.json` (T013) has the six read tools allowed, `generate_screen_from_text`, `edit_screens` and `apply_design_system` on `ask`, and the other seven write tools denied, and that `STITCH_API_KEY` is set (OI-8). Then, read-only, write into `research.md` R-14 under "Design phase record": the id of the project "Só Saio Pra Comer Design System" (`list_projects`), the asset ids of its light and dark design systems (`list_design_systems`), and the ids and titles of all existing screens (`list_screens`). That list is the baseline T022 compares against.
- [X] T019 Create the six screens with `generate_screen_from_text` (`projectId` from T018, `deviceType` `MOBILE`, `designSystem` the light asset for the light screens and the dark asset for the dark ones; the owner approves each call: Before each Stitch write call, ask the owner in the conversation, naming the screen and quoting the prompt, and wait for a clear yes; the permission prompt of `.claude/settings.json` is a second gate, not the only one (Principle VI). Do not retry on a timeout, poll `get_screen` every 30 s at most 10 times). Three screens, each in light and dark: (a) **Dialog**: a confirmation dialog over a dimmed screen with a heading, a body saying that the update restarts the app and unsaved text will be lost, the primary action "Atualizar agora" and the secondary action "Agora não" (research G1; FR-012); (b) **Início**: app bar with the connection chip, a centered card with the name "SSPC Studio" and a short message that features are coming, tab bar "Início" and "Perfil", no primary action (research G2; FR-016); (c) **Insecure-connection notice**: the same page with an error-tone banner reading exactly "Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.", no action, no close control (research G10; SEC-001). Each prompt gives the roles and values of `DESIGN.md`, 48 px touch targets, the Portuguese copy, no external image or font, and names the existing banner, card and app-bar screens (listed in R-14) whose layout it must follow; it asks for a title in the `<number> <title>` convention. Record every new screen's id, real title and theme under "Design phase record". Create new screens only.
- [X] T020 **Review and iterate loop**: each round (1) read every new screen with `get_screen` and `download_file`; (2) compare it with `DESIGN.md` and the existing components: color roles, type scale, spacing, radius, elevation, touch targets of at least 48 px, contrast of at least 4.5:1, icons, exact copy, and light/dark parity (same layout, only the theme tokens differ); (3) write the deviations into research R-14 "Review of the new designs" as one table (round, screen, theme, item, expected, found); (4) if there is none, end the loop; (5) otherwise correct with `edit_screens` (`selectedScreenIds` only the screens created in T019, the prompt listing the exact corrections) or, for token-level deviations, `apply_design_system` on those screens only (instance ids from `get_project`), the owner approving each call, then start the next round. Stop rule: at most 5 rounds per screen; if a deviation remains, stop and ask the owner either to accept it (recorded in R-14 with name and date) or to correct it in Stitch. `DESIGN.md` wins on any disagreement. Never edit, delete or apply a design system to a screen T019 did not create; never call any other write tool. Each `edit_screens` or `apply_design_system` call is asked in the conversation first, like those of T019 (same wording, same wait for a yes).
- [X] T021 Record the aligned designs: in `research.md` R-14 replace the gaps G1, G2 and G10 with the final layout, states, spacing, copy and screen ids and titles (the format of the other screens in R-14); remove the "starting values" marks from `contracts/ui-components.md` (§SspcDialog) and `research.md`; add the three new screens, light and dark, to the Design Reference table of `spec.md`; set `plan.md` Complexity Tracking row 1 to "resolved by Phase 2" and the Constitution Check rows V and VI to ✔. Finish by re-running `/speckit-analyze`: the designs must cause no new finding in the spec, plan or tasks, which were written before them (plan Complexity Tracking, residual deviation).
- [X] T022 Close the phase: read `list_screens` and `list_design_systems` again and confirm that only the six new screens differ from the baseline of T018 (FR-039, SC-012); confirm that `.claude/settings.json` is unchanged; write the closing date and the number of review rounds in research R-14 "Design phase record".

---

## Phase 3: Foundational (Blocking Prerequisites)

**Purpose**: the design-source pipeline, fonts, test infrastructure, lint-rule proof, the connection service, the seven `ui` components and the app shell. Every user story builds on these.

**⚠️ CRITICAL**: no user story work can begin until this phase is complete. The dialog, the insecure-connection notice and the home page are built from the Stitch screens of Phase 2, so this phase cannot be complete before Phase 2 is.

### Design source, tokens and fonts

- [X] T023 [P] Write the failing tests `tools/design-lint.test.mjs` (the Principle VI gate under the `zod` override of T002, research R-30: `design.md lint` on a small valid `DESIGN.md` fixture exits 0, and on a copy with one `{colors.…}` reference made unresolvable exits non-zero with a `broken-ref` error) and `tools/build-tokens.test.mjs` (table-driven, tools config): given a small `DESIGN.md` fixture, then `tokens.json` follows the W3C Design Tokens format (`$type`/`$value`) with `dark-*` colors under a `dark` group and the same role names; `tokens.css` has light values on `:root`, dark values inside `@media (prefers-color-scheme: dark)`, `color-scheme: light dark`, variables prefixed `--sspc-` and one `.type-<name>` class per typography scale, carrying `font-variation-settings` from the `fontVariation` field and a generic font fallback after the token's family; two runs produce byte-identical output (sorted keys, no timestamps); the site output is light only; the dimension properties of `components` appear as `--sspc-component-<name>-<prop>` (for example `--sspc-component-fab-size: 60px`); `--sspc-stroke-hairline`, `--sspc-stroke-focus`, `--sspc-focus-offset` and `--sspc-elevation-floating` are present and written over `var(--sspc-spacing-base)`, never as a literal `px`; a fixture that defines `stroke` or `elevation` groups uses those instead.
- [X] T024 Implement `tools/build-tokens.mjs` (research R-09): read the YAML front matter of `DESIGN.md` with `yaml`, write `src/app/ui/tokens/tokens.json`, run `style-dictionary` to write `src/app/ui/tokens/tokens.css`, and also write the light-only `site/assets/css/tokens.css` for the static site (create output directories when missing: the app image build context excludes `site/`); run it and keep the three generated files for commit; never edit them by hand. Besides `colors`, `typography`, `rounded` and `spacing`, emit the dimension properties of `components` and the derived stroke, focus-offset and elevation tokens of research R-09. Style Dictionary's built-in `css/variables` format takes a nested `selector` array (`['@media (prefers-color-scheme: dark)', ':root']`) for the dark block; the `.type-*` classes and `color-scheme` need a small custom format. Then run `npm run tokens:check` (no diff) and `npm run test:tools`.
- [X] T025 [P] Add the self-hosted font: Bricolage Grotesque, variable WOFF2, Latin subset keeping all three axes, `wght` (200–800), `wdth` (75–100) and `opsz` (12–96), because every typography scale of `DESIGN.md` sets `'wdth'` and `'opsz'` in `fontVariation` (dropping `wdth` would render every heading at normal width), `font-display: swap`, `@font-face` descriptors `font-weight: 200 800` and `font-stretch: 75% 100%`, as `src/assets/fonts/bricolage-grotesque-latin.woff2` with the upstream `OFL.txt` beside it (research R-10). Record the resulting file size in `research.md` R-10.
- [X] T026 Write `src/styles.scss`: `@font-face` for the self-hosted font (descriptors `font-weight: 200 800`, `font-stretch: 75% 100%`, `font-display: swap`), import of `src/app/ui/tokens/tokens.css`, page reset, `color-scheme: light dark`, base typography from the tokens, `prefers-reduced-motion` base rule that removes non-essential animation, and the safe-area custom properties built from `env(safe-area-inset-*)`. No remote font or stylesheet (SEC-002).

### Test infrastructure and lint-rule proof

- [X] T027 [P] Create `src/testing/a11y.ts` exporting `expectNoA11yViolations(fixture)` that runs `axe-core` 4.13.0 on the fixture's native element and fails with the violation ids (research R-24); it also prints the `incomplete` ids other than `color-contrast` for review. Under jsdom axe reports `color-contrast` as `incomplete`, never as a violation (verified: it needs canvas), so contrast is not asserted by axe: the tokens are asserted by T076 and the screens on the device by T085 and T095. jsdom cannot switch the theme either, so component specs run axe once per variant and state.
- [X] T028 [P] Create `src/testing/fakes.ts`: `FakeSwUpdate` (controllable `versionUpdates`, `unrecoverable`, `isEnabled`, `checkForUpdate`, `activateUpdate`), a fake `navigator.storage` (`persisted`, `persist`), `FakeConnectivity`, a fake `SecureContext` whose default is secure (jsdom implements none of `isSecureContext`, `navigator.storage` and `navigator.serviceWorker`: all `undefined`, research R-24), and a `provideShellFakes()` helper (research R-24).
- [X] T029 [P] Write the ESLint rule proof `tools/lint-rules.test.mjs` (tools config, Vitest node environment, because the Angular unit-test builder bundles for the browser and cannot load the Node-only ESLint API; table-driven `{ name, input: { filePath, code }, output: { ruleId } }`; research R-13). Call `new ESLint()` and `lintText(code, { filePath })` on inline code at virtual paths so the overrides of `eslint.config.mjs` apply and no fixture file exists for `tsc` or `eslint .` to pick up. Bad cases, each failing with its expected `ruleId`: `src/app/ui/button/x.ts` importing `@sspc/core/x`; the same importing `@angular/router`; the same with a `../../` import; `src/app/features/home/pages/x.ts` importing `../../../about/about.routes`; `src/app/core/x.ts` importing `@sspc/features/x`; a component with `changeDetection: ChangeDetectionStrategy.Default` (angular-eslint 22 reports only an explicit opt-out; a component that omits `changeDetection` is `OnPush` by default and gets no message, research R-13); a non-standalone component; a template (virtual `.html` path) using `*ngIf`. Good cases with no message: `src/app/ui/banner/x.ts` importing `../button/button` (one level inside `ui` is allowed; plan Complexity Tracking), `src/app/features/home/pages/x.ts` importing `../home.routes`, and a component that omits `changeDetection` (and one that sets `OnPush`). The inline code must use what it imports so that `@typescript-eslint/no-unused-vars` stays silent. Confirm the test fails when one override is removed from `eslint.config.mjs`.
- [X] T030 [P] Write the stylelint rule proof in the same style, `tools/stylelint-rules.test.mjs` (tools config, table-driven): call `stylelint.lint({ code, codeFilename, configFile: 'stylelint.config.mjs', customSyntax: 'postcss-scss' })` on inline SCSS at a virtual `src/app/ui/button/x.scss` path: bad cases for a hex color, `rgb()`, `16px`, and a literal `font-family`; good case using only `var(--sspc-…)`, `0` and `%`. Each bad case fails with its expected rule; the good case passes.

### Core service used by the shell

- [X] T031 [P] Write the failing test `src/app/core/connectivity.spec.ts`, then implement `src/app/core/connectivity.ts` (class `Connectivity`; data-model §ConnectionState). Constraints to quote in the test cases: "Initial value read synchronously from `navigator.onLine`; updated by the window `online` and `offline` events; no server contact"; `label` is "Conectado" when online and "Sem conexão" otherwise; `valueLabel` is "Online" and "Offline"; "never `undefined`; change visible within 2 s (FR-008)". The test uses `vi.useFakeTimers` and dispatches the window events. Add a flap case (spec edge case "Connectivity flaps"): `offline` then `online` within the same second leaves the value `true` with the labels "Conectado" and "Online", never the intermediate state.

### `ui` components (each: README spec, harness, tests first, then implementation)

Each component lives in `src/app/ui/<name>/` as `<name>.ts`, `<name>.html`, `<name>.scss`, `<name>.harness.ts`, `<name>.spec.ts`, `README.md`. The README is framework-neutral (purpose, variants, states, inputs, events, accessibility, table of test cases). Styles use tokens only; sizes without a spacing token (focus ring, hairline, the FAB's 60 px, shadow) come from the generated `--sspc-stroke-*`, `--sspc-focus-offset`, `--sspc-component-*` and `--sspc-elevation-*` properties (T024); icons come one by one from `@lucide/angular`; no copy lives in a component. See [contracts/ui-components.md](contracts/ui-components.md) and research R-14 for measurements.

- [X] T032 [P] SspcButton specification: `src/app/ui/button/README.md` (variants `primary|secondary|ghost|destructive`, shapes `pill|fab|fab-extended`, `loading`, `pressed`, states default/pressed/loading/disabled/focus-visible, 48 px target, disabled opacity .4, pressed scale .98 removed under reduced motion), `button.harness.ts` (CDK `ComponentHarness`: click, `isLoading()`, `isDisabled()`, `isPressed()`, text) and failing `button.spec.ts` from the seed cases in the contract plus axe for every variant and state (contrast is asserted by T076, not by axe under jsdom).
- [X] T033 SspcButton implementation: `src/app/ui/button/button.ts`, `button.html`, `button.scss` (selectors `button[sspc-button]` and `a[sspc-button]`, `OnPush`, signal inputs `variant`, `shape`, `loading`, `pressed`, slots default and `[icon]`; `loading` sets `aria-busy` and swallows clicks; `pressed` defined makes it a toggle with `aria-pressed`; the `fab` shapes are `--sspc-component-fab-size` square and carry `--sspc-elevation-floating`). Make `button.spec.ts` pass.
- [X] T034 [P] SspcStatusChip specification: `src/app/ui/status-chip/README.md`, `status-chip.harness.ts`, failing `status-chip.spec.ts` (tones `positive|neutral|attention`, `dot`, `role="status"` for live state, label 12/600, padding 8×4 (`spacing-2` × `spacing-1`, research G11), pill; axe for every tone).
- [X] T035 SspcStatusChip implementation: `src/app/ui/status-chip/status-chip.ts`, `.html`, `.scss`. Make its spec pass.
- [X] T036 [P] SspcBanner specification: `src/app/ui/banner/README.md`, `banner.harness.ts`, failing `banner.spec.ts`. Contract: `tone` `info|error`; `actionLabel` optional ("when absent no action is rendered"); `busy` ignored without an action; no close control; `role="status"`; radius 20, padding 16; seed cases include a long message truncating at 320 px with the action reachable, `busy` disabling the action, `tone=error` text and container tokens at ≥ 4.5:1 in both themes (asserted by T076 on the tokens, not by axe), no `actionLabel` rendering no button, and a message that wraps instead of truncating when no action competes for the row.
- [X] T037 SspcBanner implementation: `src/app/ui/banner/banner.ts`, `.html`, `.scss` (uses `SspcButton` from `../button/button`; one-level relative import is allowed; DESIGN.md lists the update banner among the elements that carry the soft shadow, so it uses `--sspc-elevation-floating`). Make its spec pass.
- [X] T038 [P] SspcDialog specification: `src/app/ui/dialog/README.md` (written from the Stitch design aligned in T021), `dialog.harness.ts`, failing `dialog.spec.ts`: `open` model, `heading`, `description`, `primaryLabel`, `secondaryLabel`, outputs `primary` and `secondary`, `role="alertdialog"`, modal, focus trapped, initial focus on the secondary action, Escape and scrim click act as secondary, focus returns on close; seed cases from the contract; axe once for the open state.
- [X] T039 SspcDialog implementation: `src/app/ui/dialog/dialog.ts`, `.html`, `.scss` (CDK `A11yModule` focus trap, panel radius 28, `surface-container`, padding 20, stacked actions primary over secondary, panel shadow `--sspc-elevation-floating`, scrim `inverse-surface` at 50 %). These values follow the Stitch design aligned in T021 and recorded in research R-14, which replaces the research G1 starting values. Make its spec pass.
- [X] T040 [P] SspcAppBar specification: `src/app/ui/app-bar/README.md`, `app-bar.harness.ts`, failing `app-bar.spec.ts` (`heading`, `overline`, `showBack`, `backLabel`, slot `[end]`, output `back`, 64 px plus the top safe area, `role="banner"`, back target 48×48 with an accessible name).
- [X] T041 SspcAppBar implementation: `src/app/ui/app-bar/app-bar.ts`, `.html`, `.scss` (tonal `surface` background, no blur and no shadow (DESIGN.md: depth comes from tonal layers, and research R-14 records no blur or shadow on the Stitch header), safe-area padding from `env()` custom properties). Make its spec pass.
- [X] T042 [P] SspcTabBar specification: `src/app/ui/tab-bar/README.md`, `tab-bar.harness.ts`, failing `tab-bar.spec.ts` (`items` `{ id, label, path, icon }[]`, `activeId`, `ariaLabel`, output `itemSelect(id)` (renamed from `select`, see contracts/ui-components.md), anchors with `href` plus `preventDefault()` then emit, `aria-current="page"`, items ≥ 48×48, height 64 plus the bottom safe area).
- [X] T043 SspcTabBar implementation: `src/app/ui/tab-bar/tab-bar.ts`, `.html`, `.scss`. Make its spec pass.
- [X] T044 [P] SspcListRow specification: `src/app/ui/list-row/README.md`, `list-row.harness.ts`, failing `list-row.spec.ts` (`label` input, slots `[icon]` 20 px and default value right-aligned, min height 40, hairline divider, label 16/400).
- [X] T045 SspcListRow implementation: `src/app/ui/list-row/list-row.ts`, `.html`, `.scss` (selector `li[sspc-list-row]`). Make its spec pass.

### App shell

- [X] T046 Create the lazy routes (data-model §Navigation): `src/app/app.routes.ts` with `/` → `features/home/home.routes.ts`, `/sobre` → `features/about/about.routes.ts` (tab label "Perfil", spec A-014), and `**` redirecting to `/`, the table being built by an exported `buildRoutes(catalogRoute?: Route): Routes` (the seam T078 tests; T084 supplies the argument); minimal pages `src/app/features/home/pages/home.ts` and `src/app/features/about/pages/about.ts` (heading only, `OnPush`, standalone) that US4 completes. Route `data.title` carries the app-bar title ("Início", "Sobre").
- [X] T047 Write the shell: `src/app/app.ts`, `app.html`, `app.scss` — `SspcAppBar` (title from the route, back control on `/sobre`, `Connectivity` chip in the `[end]` slot: positive with dot and `wifi` for "Conectado", neutral with `wifi-off` for "Sem conexão"), a banner slot in the page flow under the bar (empty for now), `<router-outlet>`, `SspcTabBar` ("Início" `/`, "Perfil" `/sobre`, `ariaLabel` "Principal"). Content respects the safe areas. Replace the scaffold `src/app/app.spec.ts` with a harness-based, table-driven shell spec (chip text per connection state, tab navigation, title per route).
- [X] T048 [P] Add `src/app/app.config.spec.ts` asserting the app boots zoneless: no `zone.js` import, no zone provider, `NgZone` resolves to the no-op zone (research R-06). Do not add `provideZonelessChangeDetection` unless this test fails.
- [X] T048a [P] Write `tools/component-metrics.test.mjs` (tools config, table-driven): from the generated `src/app/ui/tokens/tokens.json`, compute the WCAG contrast of the text and background pairs of the seven Phase 3 components (button, status chip, banner, dialog, app bar, tab bar, list row), light and dark, each at least 4.5:1 (3:1 for large text); and check that every target-size token (`component-*-height`, `component-*-size`, `component-fab-size`) is at least 48 px. This is the automated check decided on 2026-11-02 (spec.md Clarifications, FR-023, SC-006); the layout itself is confirmed on the iPhone (T085, T095). Runs in `npm run test:tools`.

**Checkpoint**: tokens generated, shell renders Início and Sobre with the connection chip, all seven `ui` components pass their specs. User stories can start.

---

## Phase 4: User Story 1 - Add to the Home Screen and open as a standalone app (Priority: P1) 🎯 MVP

**Goal**: the app installs from Safari with the right name and icon and opens full screen, clear of the screen edges, quickly.

**Independent Test**: on an iPhone, add the app to the Home Screen, close Safari, tap the icon: full screen, no address bar, content clear of the notch and home indicator, first screen within 1 s (verified in T075; static assertions run in CI).

### Tests for User Story 1

- [X] T049 [P] [US1] Write the failing `tools/pwa-static.test.mjs` (tools config, table-driven) reading `public/manifest.webmanifest` and `src/index.html` per [contracts/pwa-and-update.md](contracts/pwa-and-update.md): manifest `name`/`short_name` "SSPC Studio", `lang` `pt-BR`, `start_url`/`scope`/`id` `/`, `display` `standalone`, `background_color` and `theme_color` `#FFF9F3`, icons with separate `any` and `maskable` entries (never `"maskable any"`) at 192 and 512; `index.html` has `<html lang="pt-BR">`, `<title>SSPC Studio</title>`, `<base href="/">`, a viewport with `viewport-fit=cover` and neither `maximum-scale` nor `user-scalable=no`, the manifest link, `apple-touch-icon` 180, `mobile-web-app-capable` and `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, two `theme-color` metas (light `#FFF9F3`, dark `#1C211A`), a Portuguese `<noscript>`, no inline script, no inline event handler, no remote font or stylesheet.

### Implementation for User Story 1

- [X] T050 [US1] Add `<noscript>` text and the metadata tags to `src/index.html` exactly as the contract lists them (this edit also makes T049 pass for the HTML half).
- [X] T051 [P] [US1] Produce the icon set from the owner's 1024 px master (OI-2) into `public/icons/`: `icon-192-any.png`, `icon-512-any.png`, `icon-192-maskable.png`, `icon-512-maskable.png` (artwork inside the 80 % safe zone), an opaque `apple-touch-icon-180.png`, and `public/favicon.ico`; delete the scaffold's `icon-72x72.png` to `icon-384x384.png`; document the command used in `research.md` R-11, not in `public/`, which is copied as is into the served tree where SEC-005 allows no `.md` file (no new dependency). Until the master arrives keep the scaffold icons and leave this task open: SC-007 cannot pass with placeholders.
- [X] T052 [P] [US1] Rewrite `public/manifest.webmanifest` per the contract (the table in [contracts/pwa-and-update.md](contracts/pwa-and-update.md) §Web app manifest), with `description` the About description in Portuguese.
- [X] T053 [US1] Standalone layout polish in `src/styles.scss` and `src/app/app.scss`: `min-height: 100dvh`, content padded by the safe-area properties on the top, sides and bottom, `overscroll-behavior: none`, no text-size inflation, tap highlight removed; verify `viewport-fit=cover` does not clip the app bar or tab bar.
- [X] T054 [US1] Run `npm run build` and record the initial JS size in `research.md` R-25 (baseline 222.37 kB raw; the warning threshold is 400 kB). If the size exceeds 400 kB, apply the levers named there (lazy routes, `@defer` for the dialog, icon-by-icon imports) before continuing.

**Checkpoint**: `npm run test:tools` passes the static PWA assertions; the shell opens standalone in a desktop browser. Device proof is T075.

---

## Phase 5: User Story 2 - Open with no connectivity after the first load (Priority: P1)

**Goal**: after one online load, every screen opens offline, including a cold launch; the worker runs only in a secure context.

**Independent Test**: open the installed app once online, enable airplane mode, force-quit it, launch it, visit every screen (verified in T075); unit and static tests below run in CI.

### Tests for User Story 2

- [X] T055 [P] [US2] Write the failing `tools/ngsw-config.test.mjs` (tools config, table-driven) on `ngsw-config.json`: group `app` is `prefetch` and lists `/index.html`, `/manifest.webmanifest`, `/favicon.ico`, `/*.css`, `/*.js`, `/media/*.woff2`, `/icons/*.png`, `/images/*.webp`; group `assets` is `lazy` with `updateMode: prefetch` for `/**/*.(svg|jpg|jpeg|png|webp|avif|gif|woff2)`; `index` is `/index.html`; there is **no `dataGroups` key** (SEC-002). Also write the failing `scripts/check-ngsw-assets.test.mjs` (tools config, table-driven; contract pwa-and-update §ngsw-config rule): given a build directory listing and its `ngsw.json`, the script exits non-zero and names the file when an emitted `*.png`, `*.webp`, `*.jpg`, `*.jpeg`, `*.svg`, `*.woff2` or `*.ico` is missing from the `app` asset group (a file only in the lazy `assets` group fails, because one online load does not cache it), and exits 0 when every such file is in `app`; the worker files (`ngsw*.js`, `safety-worker.js`, `worker-basic.min.js`) are ignored.
- [X] T056 [P] [US2] Write the failing `src/app/core/secure-context.spec.ts` (data-model §SecureContext): `secure` is `window.isSecureContext`; when false the `message` is exactly “Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.”; table cases for secure, insecure and `undefined` (jsdom, a very old browser), where `undefined` counts as insecure.
- [X] T057 [P] [US2] Extend `src/app/app.spec.ts` with failing cases: given an insecure origin, when the shell renders, then the banner slot shows the message with tone `error`, no action and no close control; given a secure origin, then no such banner.

### Implementation for User Story 2

- [X] T058 [US2] Rewrite `ngsw-config.json` per [contracts/pwa-and-update.md](contracts/pwa-and-update.md) §ngsw-config (fonts, manifest icons and the About photo in the prefetched `app` group so one load is enough, research R-02); keep `navigationRequestStrategy` at its default `performance`; add no `dataGroups`. Implement `scripts/check-ngsw-assets.mjs DIR` (Node standard library: reads `DIR/ngsw.json`, lists the image and font files under `DIR`, prints and fails on each one missing from the `app` group). Make both T055 tests pass.
- [X] T059 [US2] Implement `src/app/core/secure-context.ts` (class `SecureContext`, and the exported function `isSecureOrigin()` that returns `globalThis.isSecureContext === true`): constant `secure` = `isSecureOrigin()`, `message` as above, nothing else.
- [X] T060 [US2] Edit `src/app/app.config.ts`: `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() && isSecureOrigin() (from T059, never the bare identifier `isSecureContext`), registrationStrategy: 'registerWhenStable:5000' })` (contract §Secure context; the scaffold's 30000 becomes 5000 so the offline start holds 10 s after the first load, FR-005; the app has no install control of its own).
- [X] T061 [US2] In `src/app/app.ts` and `app.html` render the insecure-connection notice in the banner slot with `SspcBanner` (`tone="error"`, no `actionLabel`) when `SecureContext.secure` is false (Stitch design aligned in T021). Make T057 pass.
- [X] T062 [US2] Add the offline-start behaviours that need code beyond configuration: confirm in `src/app/app.spec.ts` that the shell makes no network request at startup (no `HttpClient` provider anywhere in `src/app`), and that the chip updates within the 2 s of FR-008 (reuses T031). Fix anything the specs reveal.

**Checkpoint**: unit and static suites green; a production build contains `ngsw.json` with no `dataGroups`.

---

## Phase 6: User Story 3 - Verify the installed app on an iPhone over the home network (Priority: P1)

**Goal**: the app image runs in the `sspc-api` local stack under its restrictions, the offline proof counter works, and the written procedure can be run and recorded.

**Independent Test**: follow [quickstart.md](quickstart.md) sections B and D from a clean checkout and fill the record; every offline launch shows a counter difference of 0.

### Tests for User Story 3

- [X] T063 [P] [US3] Write the failing `tools/offline-proof/counter-proxy.test.mjs` (tools config, table-driven; contract http-serving §Files): N forwarded requests (GET with query string, HEAD, POST, with cookies) read back as N through `count.mjs`; a conditional request answered `304` is counted and passes through; the proxy process printed nothing and wrote no file; the control socket has mode `0600`; the socket is gone after `SIGTERM`; an unreachable upstream answers `502` with an empty body and still counts.
- [X] T064 [P] [US3] Write `scripts/smoke-app.sh IMAGE` implementing assertions 1 to 10 of [contracts/http-serving.md](contracts/http-serving.md) §Smoke assertions (run the image with `--user 65532:65532 --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges:true`; list the served tree with `docker create` and `docker cp`, never a shell in the image); it exits non-zero on the first failure and names it. Assertion 1 expects `<sspc-root>`; assertions 2 and 4 include `no-cache` on `/` and `/sobre`, and `404` without `immutable` for an absent hashed name and an absent icon. It fails until T066.

### Implementation for User Story 3

- [X] T065 [US3] Write the app `Caddyfile` ([contracts/http-serving.md](contracts/http-serving.md)): global options `admin off`, `auto_https off`, `servers { protocols h1 }` and the filtered default `log` block (`request delete`); site block `:8080` with `root * /srv`, then the routing structure of contract §App routes (prototyped and run on the pinned image, research R-17): `@hashed` (`path_regexp` of `-[A-Z0-9]{8}\.(js|css|woff2)$` **and** `file {path}`) handled by `handle @hashed { header Cache-Control "public, max-age=31536000, immutable"; file_server }`, and a default `handle` with `Cache-Control: no-cache`, the SPA fallback `rewrite` only for a path with no extension and no file (`@spa { not path_regexp \.[A-Za-z0-9]+$; not file {path} }`) and `file_server`, so that a path with an extension and no file answers `404`, never the fallback page and never `immutable`; the four security headers with the app CSP exactly as the contract's header table gives it (no `data:` or `blob:`); **no `log` directive in the site block**.
- [X] T066 [US3] Write the app `Dockerfile` (contract §Image runtime contract, research R-08 and R-29): `FROM node:24.22.2@sha256:e7add2a490bb17d97b485b8641bd88455fff7839ade0f5eba493c3508124d413 AS build`; `ARG APP_VERSION=0.0.0+dev`, `ARG APP_BUILD=local`, `ARG SSPC_CATALOG=false` and no other `ARG`; `npm ci`; `npm run build -- --define "APP_VERSION='${APP_VERSION}'" --define "APP_BUILD='${APP_BUILD}'" --define "SSPC_CATALOG=${SSPC_CATALOG}"`; final stage `FROM caddy:2.11.7@sha256:36c24ad91a7ff7bc4c87fe22bfa8df3c4b18da0773d73fc12ee2c52b98c0bb7e`; `setcap -r /usr/bin/caddy`; create `/data` and `/config` owned by `65532:65532`; `VOLUME ["/data", "/config"]`; copy `dist/sspc-web/browser` to `/srv` and the `Caddyfile` to `/etc/caddy/Caddyfile`; `USER 65532:65532`; `EXPOSE 8080`; entrypoint `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile`.
- [X] T067 [P] [US3] Implement `tools/offline-proof/counter-proxy.mjs` and `tools/offline-proof/count.mjs` per [contracts/http-serving.md](contracts/http-serving.md) §Files (Node standard library only; `UPSTREAM`, `LISTEN_PORT`, `COUNT_SOCKET` defaults; count before forwarding; socket mode `0600`; remove it on `SIGTERM`/`SIGINT`; no output of any kind). Make T063 pass.
- [X] T068 [P] [US3] Create `tools/offline-proof/Dockerfile` (`FROM node:24.22.2-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85`, remove npm and npx, copy only the two scripts to `/app`, `USER 65532:65532`, entrypoint `node /app/counter-proxy.mjs`, no control port exposed) and `tools/offline-proof/Dockerfile.dockerignore` (`*`, then `!tools/offline-proof/counter-proxy.mjs`, `!tools/offline-proof/count.mjs`).
- [X] T069 [US3] Create `tools/offline-proof/compose.override.yaml` per the contract: service `web` has `image: sspc-offline-proof:local` (an explicit name: the default `deploy-web` is the name the sibling's `make stack` gives the base `web` that it rebuilds, which would overwrite the counter image) and builds `tools/offline-proof/Dockerfile` from context `../../sspc-web`, `depends_on: [web-app]`, `UPSTREAM=http://web-app:8080`, no published ports, base restrictions kept; new service `web-app` with `profiles: [web]`, `image: sspc-web-app:${APP_TAG:-first}` (each build keeps its own tag and is swapped in without a rebuild, quickstart D1), the repository `Dockerfile`, build args `SSPC_CATALOG: "true"`, `APP_VERSION: ${APP_VERSION:-0.0.0+dev}`, `APP_BUILD: ${APP_BUILD:-local}`, the same five restrictions, no published ports. Validate with `$COMPOSE config --quiet` (quickstart D1) and by reading `web` and `web-app` in `$COMPOSE config --format json`, printing only those two services because the file also holds secrets. This design was checked that way on 2026-11-01 against `../sspc-api/deploy/compose.local.yaml` **(check: that repository still changes; at revision `f7ee750` its `web` service has profile `web`, context `../../sspc-web`, user `65532:65532`, `read_only`, `tmpfs /tmp`, `cap_drop ALL`, `no-new-privileges` and no ports)**.
- [X] T070 [P] [US3] Write `scripts/smoke-counter.sh IMAGE` (contract §Smoke assertions, counter image): start a stub upstream and the counter image under the restrictions, send N requests, assert `count.mjs` prints N and the container produced no output; assert the two production images contain no `tools/` content.
- [ ] T071 [US3] Build and run the app image exactly as the stack does ([quickstart.md](quickstart.md) section B), run `scripts/smoke-app.sh sspc-web:local` until it passes, and fix the Caddyfile or Dockerfile for any failure (including zero `"level":"error"` lines and no line that mentions a request).
  - Decision (2026-11-02): assertion 8 (version in `main-*.js`) is deferred to T089, the About version display; `scripts/smoke-app.sh` runs it only with `SMOKE_CHECK_VERSION=1`. T071 closes in Phase 8 with that flag set.
- [X] T072 [US3] Run the insecure-origin check of quickstart section B on the computer (container published on `0.0.0.0`, opened by the computer's LAN address, never `localhost`): the SEC-001 message shows, no service worker is registered, and the app shows no install control (the browser's own Add to Home Screen is outside its control, SEC-001). Fix `src/app/app.config.ts` or the shell if it fails.
- [X] T073 [US3] Run the web-option-off check at the top of quickstart D1 (Story 3, scenario 6: the API health answers 200, the app address does not serve the app; record both codes), then start the stack with the override ([quickstart.md](quickstart.md) D1, **(check)** every sibling command against `../sspc-api/deploy/RUNBOOK.md`; verified at revision `f7ee750` on 2026-11-01: targets `stack` and `stack-down`, per-start `LAN_ENABLE`, service `web` in profile `web`), take a counter read, send one `curl http://localhost:8080/manifest.webmanifest`, take a second read: the difference must be exactly 1 (SEC-008). Update the quickstart commands if the sibling changed.
- [X] T074 [P] [US3] Create `specs/001-installable-pwa-shell/validation.md` as the empty record of [quickstart.md](quickstart.md) D5 (the fields of the record table in quickstart D5 and of data-model §VerificationRecord: date, iPhone model and iOS version, app version and build, storage protection, D1 web option off (the two codes), D2 steps 1–4 with whether the 10-second wait was enough and the frame count of each of the 5 online launches, D2 step 5 (About first, offline), D2 step 6 (resume), D3 condition 1 with the counter difference and the frame count of each of 5 launches, D3 condition 2, interrupted first load, D4 steps 3–12, total time of the procedure for SC-009, cleanup row, accepted design deviations). Fill it only with the exclusions of SEC-010 in mind: no addresses, hostnames, device identifiers, fingerprints or log lines.
- [X] T075 [US3] On the iPhone (OI-6), run quickstart D1, D2 steps 1–2 and D3 (the Início and Sobre screens are still stubs here; D2 steps 3 to 6 are checked in T085 and T095) and time this part of the procedure (an early estimate only: D2 steps 3 to 6 and D4 are still to run, so T139 decides SC-009): trust check and no certificate warning (do not bypass a warning, SEC-001), install to the Home Screen, wait 10 seconds after the first load (FR-005), 5 airplane-mode launches with the counter difference recorded, 5 launches with Wi-Fi on and the stack stopped (`$COMPOSE down`, then restart and re-apply the D1 override as quickstart D3 says), the frame count of the 5 online launches of D2 step 2 and of the 5 airplane-mode launches of D3 (these are the 10 launches of SC-001; FR-003: 60 frames or fewer), and the interrupted first load. Write the results into `validation.md`. SC-001 and SC-002 are decided here, for the screens that exist at this point.

**Checkpoint**: the app image passes its smoke test, the counter proves the offline start, and `validation.md` holds the D1–D3 results.

---

## Phase 7: User Story 5 - Portuguese interface in light and dark themes (Priority: P2)

**Goal**: everything readable is Brazilian Portuguese; the app follows the device appearance live; the development catalogue shows every component and state in both themes and does not exist in production.

**Order**: this phase runs before User Story 4 on purpose. Principle V says every new screen starts from the catalogue (`/_ds`) and every `ui` component ships a catalogue entry, so the catalogue and its sections exist before the Início and Sobre pages are built.

**Independent Test**: switch the iPhone between light and dark while the app is open and compare each catalogue section with its Stitch component board (device check in T085; the same comparison for Início and Sobre is in T095).

### Tests for User Story 5

- [ ] T076 [P] [US5] Write `tools/contrast.test.mjs` (tools config, table-driven; extends T048a from the Phase 3 components to every pair in the catalogue): from the generated `src/app/ui/tokens/tokens.json` compute WCAG contrast for every foreground/background pair the components use (button, banner, chip, tab bar, app bar, About card, dialog), light and dark; each is at least 4.5:1 (3:1 for large text, 18 px bold or 24 px). The `tone=error` banner text on its container is in the list. The focus ring (`tertiary` on `surface`, `dark-tertiary` on `dark-surface`) is a non-text indicator and must reach 3:1 (WCAG 1.4.11): 3.20:1 light and 6.92:1 dark, computed on 2026-11-01.
- [ ] T077 [P] [US5] Write the failing `src/app/features/catalog/pages/catalog.spec.ts`: the catalogue lists the seven components, each with all its variants and states; it contains one text input bound to a typed reactive form control (`FormControl<string>`, Principle III); sections can render with the opposite theme through a scoped `color-scheme` wrapper.
- [ ] T078 [P] [US5] Write the failing `src/app/app.routes.spec.ts` on `buildRoutes(catalogRoute?)` (T046, T084): given a catalogue route (a stub with `loadChildren`), then the table has `_ds` before `**`; given `undefined`, then it has no `_ds`; `**` redirects to `/` in both. The build constants are replaced by literals in the unit-test build too (research R-05), so the flag cannot be toggled in a test; that the production build omits the catalogue is proved by the build assertion of T084 and T118, not by this spec.

### Implementation for User Story 5

- [ ] T079 [US5] Create the catalogue feature `src/app/features/catalog/catalog.routes.ts` and `pages/catalog.ts` (selector `sspc-catalog`, the ASCII marker that T084, T118 and the smoke test grep for), `catalog.html`, `catalog.scss`: intro card (“Catálogo do Desenvolvedor”, v1.0.0 as in research R-14 §0), context row, accordion sections with count badges, scoped opposite-theme wrapper, and one text input bound to a `FormControl<string>` (typed reactive form, Principle III) for the update test.
- [ ] T080 [P] [US5] Catalogue section for SspcButton: `src/app/features/catalog/pages/sections/button-section.ts` (+ `.html`) showing all variants, shapes and states from research R-14 §1.1.
- [ ] T081 [P] [US5] Catalogue section for SspcBanner: `…/sections/banner-section.ts` (+ `.html`): info, error, with and without action, busy.
- [ ] T082 [P] [US5] Catalogue section for SspcDialog: `…/sections/dialog-section.ts` (+ `.html`) with an open/close trigger.
- [ ] T083 [P] [US5] Catalogue sections for SspcStatusChip, SspcListRow, SspcAppBar and SspcTabBar: `…/sections/status-chip-section.ts`, `list-row-section.ts`, `app-bar-section.ts`, `tab-bar-section.ts` (+ `.html` each) with every tone, variant and state.
- [ ] T084 [US5] Register `/_ds` in `src/app/app.routes.ts` only when the global `SSPC_CATALOG` is true (`export const routes = buildRoutes(SSPC_CATALOG ? { path: '_ds', loadChildren: () => import('./features/catalog/catalog.routes') } : undefined);`: the import sits in a branch on the build-time constant, so the bundler drops it, and the lazy chunk with it, when the constant is false; research R-15, verified). Make T078 pass. Run `npm run build` and confirm the lazy chunk is not emitted (no file under `dist/sspc-web/browser` contains `sspc-catalog`, the marker also asserted in T118 and the smoke test).
- [ ] T085 [US5] Verify on the iPhone (quickstart D2 step 4), with the test build open at `/_ds`: switch light/dark with the app open (live, no reload), larger text sizes do not clip, reduced motion removes animation; compare every catalogue section with the Stitch component boards (research R-14 §0, §1.1, §1.5) and write each unaccepted deviation into `validation.md` for the owner (SC-007). The same comparison for Início and Sobre is part of the US4 device check (T095).

**Checkpoint**: `/_ds` works in development and is absent from a production build.

---

## Phase 8: User Story 4 - Home screen and About show the version and connection (Priority: P2)

**Goal**: the placeholder home and the About screen show name, description, version with build reference, connection state and storage protection, with no loading state.

**Order**: this phase runs after User Story 5 (the catalogue), so both pages are composed from components already shown there (Principle V).

**Independent Test**: open the app, go to About, compare the version with the one built, toggle airplane mode and watch the state change within 2 s (device checks in T095 and T096).

### Tests for User Story 4

- [ ] T086 [P] [US4] Write the failing `src/app/core/app-version.spec.ts` (table-driven; data-model §AppVersion). The unit-test build replaces the build constants with literals, so the cases supply other values through the injection token `APP_BUILD_INFO` with TestBed providers (research R-05). Quote: "`version` … Source: build-time constant `APP_VERSION`, read through the injection token `APP_BUILD_INFO`; falls back to `0.0.0+dev` when the token carries no version"; "`build` … `local` when not provided"; "`kind` … `dev` when `version` ends with `+dev` (FR-018); `prerelease` when it carries a `-…` or `+rc.…` part; otherwise `release`"; "`display` … `"<version> (<build>)"`". Cases: `0.0.0+dev`/`local`, `1.2.3`, `1.2.3-test.4`, `1.2.3+rc.1`, a token with no version or build.
- [ ] T087 [P] [US4] Write the failing `src/app/core/storage-persistence.spec.ts` (data-model §StorageProtection, SEC-012). Quote: "read `persisted()` first; call `persist()` only when false and no previous request is recorded in `localStorage` (key `sspc.storage.requested` …). The key is written **before** `persist()` is called, so a browser prompt that is dismissed still counts as the one request per browser profile and is never repeated"; states `pending`, `granted` ("Protegido no aparelho"), `denied` and `unsupported` ("Não protegido"); never blocks start-up. Cases: already persisted, granted, refused, dismissed then restarted (no second call), API missing, non-secure origin.
- [ ] T088 [P] [US4] Write the failing page specs `src/app/features/home/pages/home.spec.ts` and `src/app/features/about/pages/about.spec.ts` (harness-based, table-driven, fakes from T028): home shows "SSPC Studio", the provisional message “Em breve, o seu caderno de campo vai morar aqui.” and a way to reach About; About shows, online or offline, name, description “Curadoria independente, relatos sinceros de mesa e documentação gastronômica artesanal.”, “Versão” with `display`, “Conexão” “Online”/“Offline”, “Armazenamento” per state, a back control to the previous screen, never a loading or unknown state, and the connection value changes with the fake within 2 s.

### Implementation for User Story 4

- [ ] T089 [P] [US4] Implement `src/app/core/app-version.ts` (class `AppVersion` and the injection token `APP_BUILD_INFO`, `{ version?: string; build?: string }`, whose default factory reads the globals declared in `build-constants.d.ts` guarded with `typeof … !== 'undefined'`; `AppVersion` derives `version`, `build`, `kind` and `display` from the token; research R-05). Make T086 pass.
- [ ] T090 [P] [US4] Implement `src/app/core/storage-persistence.ts` (class `StoragePersistence`, signal state) and call it once from an environment initializer in `src/app/app.config.ts`. Make T087 pass.
- [ ] T091 [US4] Complete the home page `src/app/features/home/pages/home.ts`, `home.html`, `home.scss` (centered card in the empty-state language, name “SSPC Studio”, the provisional message, no primary action; from the Stitch design aligned in T021; research R-14 G2).
- [ ] T092 [US4] Complete the About page `src/app/features/about/pages/about.ts`, `about.html`, `about.scss` per research R-14 §2.9: hero (badge, 80 px monogram with `utensils`, gold `star` badge, title, description), photo block with caption “Registro pessoal • Arquivo Gastronômico”, info card of `SspcListRow` rows (Versão pill, Conexão chip, Armazenamento chip; no “Última sincronização”, no “Sair da conta”), footer wordmark, quote “Em mais um review sincero.” and “Teresina, Piauí”; use `SspcAppBar` with the back control. Make T088 pass.
- [ ] T093 [US4] Photo block (research G7): until the owner supplies the photo (OI-3) render a gradient block from tokens with the caption; when supplied, add `public/images/about-hero.webp` (WebP, at most 40 kB; `public/` is copied as is, `src/assets/` is not an assets folder in `angular.json`), strip its metadata first, and show it with `<img src="images/about-hero.webp" width height alt="">` above the caption (the caption carries the meaning; the owner may supply a description for `alt`). It is served from `'self'` (a remote image is forbidden by SEC-002) and prefetched by the `app` group of `ngsw-config.json` (T058), so About works on the first offline visit; `scripts/check-ngsw-assets.mjs` fails the build if it is not.
- [ ] T094 [US4] Add the shell-level assertion that the connection chip is visible on every route (Início and Sobre) to `src/app/app.spec.ts` (US4 scenario 7).
- [ ] T095 [US4] Verify US4 on the installed app (quickstart D2 step 3): chip, About rows, version `0.0.0+dev (local)` equals the build, record the observed “Armazenamento” value in `validation.md` (answers research R-04); compare Início and Sobre with their Stitch designs in light and dark (research R-14 §2.9) and write each unaccepted deviation into `validation.md` for the owner (SC-007); then run quickstart D2 step 5 (About first, offline: no missing photo or font, Story 2 scenario 7) and step 6 (resume after switching apps, Story 1 scenario 4).
- [ ] T096 [US4] Verify the 2 s state change on About by toggling airplane mode (US4 scenario 5); note the result in `validation.md`.

**Checkpoint**: Início and Sobre complete; the About version equals the injected version.

---

## Phase 9: User Story 6 - Be told about a new version and update when I choose (Priority: P2)

**Goal**: a non-blocking notice appears when a newer version is ready, never interrupts typing, and the user updates when they choose, with a dialog only if text is unsaved.

**Independent Test**: install a test build, deploy a second one, type into the catalogue input, wait for the notice, keep typing, then tap “Atualizar” (device check in T104).

### Tests for User Story 6

- [ ] T097 [P] [US6] Write the failing `src/app/core/unsaved-work.spec.ts` (data-model §UnsavedWork): a source registers a `dirty` signal and unregisters on destroy; `hasUnsaved()` is "true when any registered source is dirty".
- [ ] T098 [P] [US6] Write the failing `src/app/core/app-update.spec.ts` (table-driven, `FakeSwUpdate`, `vi.useFakeTimers`; data-model §UpdateState and [contracts/pwa-and-update.md](contracts/pwa-and-update.md) §Update contract). Cases: `VERSION_READY` → `ready`; tap with no unsaved work → `applying` then `activateUpdate()` then reload; tap with unsaved work → `confirming`; "Agora não" → `ready`; "Atualizar agora" → `applying`; `activateUpdate()` rejects or `unrecoverable` → `failed` and retry; a second `VERSION_READY` for a newer version while `ready` keeps `ready`, and one activation then lands on the latest (Story 6 scenario 9); `VERSION_INSTALLATION_FAILED` stays `idle`; `checkForUpdate()` at start, on `visibilitychange` to visible and on `online`, at most once per 30 s; service worker disabled (development or non-secure) stays `idle`; tapping while offline behaves exactly like online (activation needs no network).
- [ ] T099 [P] [US6] Write the failing shell cases in `src/app/app.spec.ts`: the banner “Nova versão disponível” with action “Atualizar” appears when `ready`, stays across route changes, has no close control and hides nothing; the dialog appears only with unsaved text and offers “Atualizar agora” and “Agora não”; “Agora não” leaves text, focus and banner unchanged; failure shows the failure copy with a retry action.

### Implementation for User Story 6

- [ ] T100 [P] [US6] Implement `src/app/core/unsaved-work.ts` (class `UnsavedWork`). Make T097 pass.
- [ ] T101 [US6] Implement `src/app/core/app-update.ts` (class `AppUpdate`; `SwUpdate.versionUpdates` converted with `toSignal` at the edge; state signal per data-model; throttled checks; `activateUpdate()` then `document.location.reload()`). Make T098 pass.
- [ ] T102 [US6] Wire the shell: in `src/app/app.ts` and `app.html` show the update banner in the banner slot (`SspcBanner` `tone="info"`, icon `refresh-cw`, `actionLabel` “Atualizar”, `busy` while applying) and the `SspcDialog` inside `@defer` (heading and body as the Stitch design of T021 words them, warning that the update restarts the app and the text will be lost; “Atualizar agora” primary, “Agora não” secondary), failure banner “Não foi possível atualizar. Tente de novo.” with action “Tentar de novo” (provisional copy, research G3; owner to confirm). An offline tap needs no message: it applies the update. Make T099 pass.
- [ ] T103 [US6] Register the catalogue's text input with `UnsavedWork` in `src/app/features/catalog/pages/catalog.ts` (dirty while the `FormControl<string>` value is not empty) so "typing is not interrupted" can be verified (spec A-004).
- [ ] T104 [US6] Verify on the iPhone (quickstart D4 steps 1–12 with the D1 override running; **(check)** the compose commands): banner within 5 s (SC-004), typing in the catalogue input untouched with the keyboard open (20 trials for SC-003, D4 step 12: a trial is one banner appearance while typing), banner persists across screens and background, dialog behaviour, version switches to `0.0.1+dev (second)` (SC-005), force-quit applies the update, offline tap applying the update (no connection needed), the failure banner's copy (covered by the shell test and the catalogue, not reproducible on the device), rollback offered as an update, several deployed versions going straight to the latest (scenario 9), and an appearance change (light/dark) while the banner and while the dialog are open: both stay open and switch theme. Record in `validation.md`.

**Checkpoint**: the whole update flow works on the device with the test build.

---

## Phase 10: User Story 7 - Every pull request is linted, tested, built and scanned (Priority: P3)

**Goal**: one workflow runs lint, test, build, security, image and branch-guard on every pull request and push, publishes nothing and holds no secrets; every SEC requirement of the pipeline is enforced by a check.

**Independent Test**: open a clean pull request, then pull requests that break each check in turn (lint error, failing test, size over budget, vulnerable dependency, exposed secret, image finding, site content); each is named and fails (T123).

### Policy checks (each: failing `*.test.mjs` first, table-driven in the tools config, then the script; research R-31, [contracts/build-and-ci.md](contracts/build-and-ci.md) §Policy checks)

- [ ] T105 [P] [US7] `scripts/policy/workflow.mjs` + `scripts/policy/workflow.test.mjs`: fails on any of these, with one failing case per rule (the rules of `../sspc-api/scripts/check-workflow.sh`, which uses awk to avoid a YAML dependency, parsed here with the `yaml` package we already have; the last rule is ours, not the sibling's): a `secrets.` reference; a trigger other than `pull_request`, `push` and `workflow_dispatch` (so `pull_request_target` fails), `pull_request` or `push` branches other than exactly `[develop, main]`, `pull_request` types other than exactly `opened, synchronize, reopened, edited`, or any `paths`, `paths-ignore`, `tags` or `tags-ignore` filter; an action not pinned to a 40-hex commit; top-level `permissions` other than exactly `contents: read`, or any job-level `permissions`; a concurrency group or `cancel-in-progress` other than the ones of T117; a duplicate job name; a job-level `if` or `continue-on-error`, except `branch-guard`'s exact `if: github.event_name == 'pull_request'`; a missing required job (`lint`, `test`, `build`, `security`, `image`, `branch-guard`); a checkout without `persist-credentials: false`; event data (`github.event.*`, `github.head_ref`, `github.base_ref`) interpolated inside `run`; a `docker run` or `image:` reference without an `@sha256:` digest; a `curl`/`wget` download without a `sha256sum --check` in the same step.
- [ ] T106 [P] [US7] `scripts/policy/dockerfiles.mjs` + test: every `FROM` has `@sha256:`; `ARG` names only `APP_VERSION`, `APP_BUILD`, `SSPC_CATALOG`; the site Dockerfile never copies `.` or `*`; runtime stages end with `USER 65532:65532`; Caddy stages run `setcap -r`. Covers `Dockerfile`, `site/Dockerfile`, `tools/offline-proof/Dockerfile`.
- [ ] T107 [P] [US7] `scripts/policy/agent-settings.mjs` + test: `.mcp.json` header is exactly `${STITCH_API_KEY}`; `.claude/settings.json` has exactly the state of T013: allow = the six read tools, ask = `generate_screen_from_text`, `edit_screens`, `apply_design_system`, deny = the other seven write tools. A write tool in `allow`, a missing `ask` or `deny`, or any other `mcp__stitch__` rule fails (Principle VI v2.1.0).
- [ ] T108 [P] [US7] `scripts/policy/caddyfile.mjs` + test: runs `caddy adapt` through the pinned image on `Caddyfile` and `site/Caddyfile`; fails on an access log, a missing `request delete` filter on the default log, or a missing header of the contract (app and site CSPs differ). In the adapted JSON the default log is `logging.logs.default.encoder` with `format: "filter"`, `wrap: { format: "json" }` and `fields.request.filter: "delete"`, and `apps.http.servers.*` has no `logs` key when there is no access log (research R-27).
- [ ] T109 [P] [US7] `scripts/policy/image-metadata.mjs` + test (fixtures built in the test): fails when a JPEG, PNG or WebP under `site/assets/img/` or `public/images/` carries EXIF, XMP, textual or GPS metadata (marker and chunk scan, no dependency).
- [ ] T110 [P] [US7] `scripts/policy/validation-record.mjs` + test: for `specs/001-installable-pwa-shell/validation.md`, fails on an IPv4 or IPv6 address, a `.local`, `.lan` or `.home` hostname, a colon-separated or 64-hex fingerprint, a JSON log line, or a missing cleanup row.
- [ ] T111 [P] [US7] `scripts/policy/exceptions.mjs` + test (data-model §ExceptionRecord). Quote: "`expires` is at most 30 days after `approved` and not in the past, otherwise the gate fails"; every field non-empty; no duplicates; `--trivy-out FILE` writes a Trivy ignore file from the unexpired `image` entries (`id`, `statement` = rationale, `expired_at` = `expires`).
- [ ] T112 [P] [US7] `scripts/policy/npm-audit.mjs` + test (stubbed `npm audit --json` output): audits the whole tree with no `--omit`, fails on any high or critical advisory not covered by an unexpired `npm` entry of `security/exceptions.yaml`, prints each advisory it fails on.
- [ ] T113 [P] [US7] `scripts/check-tracked-secrets.sh` + `scripts/check-tracked-secrets.test.mjs`: requires `.gitignore` to contain `.env*` and `*.key`; fails on tracked `*.enc.yaml`, `*.key|crt|cer|der|pem|p12|pfx|mobileconfig`, `.env*`, `secrets/` paths (derived from `../sspc-api/scripts/check-tracked-secrets.sh`: its `.enc.yaml`, key and certificate extensions, `.env` and `secrets/` rules; the sibling's rules for its own tree (`caddy-local-*`, `sspc/`, `caddy-local-data` and the like) do not apply here, and the `.gitignore` check is new).
- [ ] T114 [P] [US7] `scripts/check-branch-guard.sh BASE HEAD` + `scripts/check-branch-guard.test.mjs` per the contract: exactly two arguments else exit 2; base other than `main` passes "not applicable"; base `main` requires the case-sensitive whole-string pattern `^(release|hotfix)/(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`; the head is never used as a format string and there is no `eval`.
- [ ] T115 [P] [US7] Create `.gitleaks.toml` as `../sspc-api/.gitleaks.toml` is: `[extend] useDefault = true`, without the sibling's allowlist for its own `SENTINEL-…` test placeholders (this repository has none, so there are no allowlist entries and no exceptions checker), and add `.github/dependabot.yml` per [contracts/build-and-ci.md](contracts/build-and-ci.md) §Dependabot (`npm` `/` with groups `angular` and `all`, no `tiptap` group until TipTap is a dependency; `docker` `/`, `/site`, `/tools/offline-proof`; `github-actions` `/`; weekly; `target-branch: develop`).
- [ ] T116 [P] [US7] Write `.github/pull_request_template.md` per research R-20 (sections Architecture, Tests, Design, Offline and iPhone, Security with the owner confirmations of SEC-009 and SEC-011 and the box “every Stitch write in this work was approved by the owner and is listed”, Delivery, “Before merging” self-check for the advisory gates, Deploy notes, Related).

### Workflow

- [ ] T117 [US7] Create `.github/workflows/ci.yml` skeleton: triggers `pull_request` (bases `develop`, `main`; types `opened`, `synchronize`, `reopened`, `edited`), `push` (`develop`, `main`), `workflow_dispatch`; top-level `permissions: contents: read`; concurrency group `${{ github.workflow }}-${{ github.event_name }}-${{ github.event.pull_request.number || github.run_id }}` with `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`; the pinned action SHAs of research R-18, plus `actions/setup-node` with `node-version: 24` and no cache in every job that runs `npm` or `node`; no secrets, no `paths-ignore`; every `checkout` with `persist-credentials: false`.
- [ ] T118 [US7] Add jobs `lint` (`npm ci`, `design:lint`, `lint`), `test` (`npm ci`, `npm test`, `npm run test:tools`) and `build` (`npm ci`, `tokens:check`, `npm run build`, then assert in `dist/sspc-web/browser`: no catalogue chunk (no file contains `sspc-catalog`), no `onload=`, no `*.map` or `sourceMappingURL`, no absolute `http(s)://` URL in `index.html`, `*.css`, `manifest.webmanifest`, `ngsw.json`, no `dataGroups` in `ngsw.json`, and `node scripts/check-ngsw-assets.mjs dist/sspc-web/browser` passes) to `.github/workflows/ci.yml`.
- [ ] T119 [US7] Add job `security` (full-history checkout; `npm ci`, because the policy scripts import `yaml`; `npm run policy`; `npm run audit`; gitleaks 8.30.1 from the release tarball verified against SHA-256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`, then `gitleaks git --redact`; `scripts/check-tracked-secrets.sh`; shellcheck of `scripts/*.sh`) to `.github/workflows/ci.yml`.
- [ ] T120 [US7] Add job `image` (`npm ci`, needed by the Trivy-ignore script and by the site content test that `smoke-site.sh` runs; buildx `sspc-web:ci` context `.`, `sspc-site:ci` context `site`, `sspc-offline-proof:ci` Dockerfile `tools/offline-proof/Dockerfile`; `load: true`, `push: false`, never `SSPC_CATALOG=true`; run `scripts/smoke-app.sh`, `scripts/smoke-site.sh`, `scripts/smoke-counter.sh`; derive the Trivy ignore file with `node scripts/policy/exceptions.mjs --trivy-out "$RUNNER_TEMP/trivyignore.yaml"`; Trivy v0.75.0 on all three images reporting MEDIUM and lower with exit 0, then failing on `HIGH,CRITICAL` with **no** `ignore-unfixed`) to `.github/workflows/ci.yml`.
- [ ] T121 [US7] Add job `branch-guard` (`if: github.event_name == 'pull_request'`; refs passed through `env:`; runs `scripts/check-branch-guard.sh "$BASE_REF" "$HEAD_REF"`; its test, T114, runs in the `test` job with the other tool tests) to `.github/workflows/ci.yml`, then run `node scripts/policy/workflow.mjs .github/workflows/ci.yml` and fix any finding.
- [ ] T122 [US7] Run every job's commands locally in CI order (`npm run design:lint`, `lint`, `test`, `test:tools`, `build`, `policy`, `audit`, the three smoke scripts) and fix what fails; confirm the whole workflow finishes in under 10 minutes on GitHub once pushed (SC-008).
- [ ] T123 [US7] Owner action: on a throwaway branch break each check once (a lint error, a failing test, a build over the 600 kB error budget, a vulnerable dependency, a committed key-like string, an image with a high finding, a removed required site item) and confirm the matching job fails and is named on the pull request; record the outcome in the pull request description (SC-008).

**Checkpoint**: a clean pull request is green and every deliberate break is caught.

---

## Phase 11: User Story 8 - The static profile site, built as its own image (Priority: P3)

**Goal**: sosaiopracomer.com's home and links pages exist as static files in `site/`, built into their own image, with a content check.

**Independent Test**: build and run the site image under the restrictions, run the content check, open both pages on phone-sized and desktop-sized windows (quickstart section C).

### Tests for User Story 8

- [ ] T124 [P] [US8] Write the failing `site/tests/content.test.mjs` (tools config; reads `SITE_URL`, skipped when unset; table-driven; `fetch` only; data-model §SitePage and §SiteLink): home contains “Edição digital • Em obras”, “Só Saio Pra Comer”, “Guia gastronômico”, “Reviews sinceros de restaurantes em Teresina.”, the coming-soon message, a “Ver nossos links” link whose target is the links page and which resolves, and “Teresina, Piauí”; the links page loads directly and contains the photo, name, tagline, exactly three links (Instagram, TikTok, “Parcerias com marcas”) and the advertising-disclosure note; the two web destinations are well-formed `https://` URLs with `target="_blank"` and `rel="noopener noreferrer"`; the third is a valid `mailto:`; no absolute URL is loaded by either page except those links; no response of either page carries a `Set-Cookie` header (FR-035); no outside site is contacted.
- [ ] T125 [P] [US8] Write `scripts/smoke-site.sh IMAGE` (contract §Smoke assertions, site image): run under the restrictions; `GET /` and `/links/` return 200; `GET /nope`, `/Dockerfile`, `/Caddyfile`, `/tests/content.test.mjs` return 404; the site CSP, the other three headers and `Cache-Control: no-cache` (also on `/nope`); no `Set-Cookie` header on either page; zero error log lines and no line that mentions a request; the served tree contains only `index.html`, `links/index.html`, `assets/{css,fonts,img}/`; then run the content test with `SITE_URL`.

### Implementation for User Story 8

- [ ] T126 [P] [US8] Add the site fonts and styles: copy the self-hosted WOFF2 and `OFL.txt` to `site/assets/fonts/`, add its `@font-face` with the descriptors of T026; write `site/assets/css/site.css` using the generated `site/assets/css/tokens.css` (T024) for every color, size and font, full-width pill link buttons (`link-button` in `DESIGN.md`), mobile and desktop layouts for the home page and a centered mobile layout for the links page on wide screens (spec A-003); no inline styles and no scripts (the site CSP forbids both).
- [ ] T127 [US8] Write `site/index.html` from the Stitch screens “Página Temporária (Mobile)” and “(Desktop)” (research R-14 §Site screens): `lang="pt-BR"`, the FR-033 content, the decorative arch and blobs as inline SVG, the “Ver nossos links” button linking to `/links/`. Make the home half of T124 pass.
- [ ] T128 [US8] Write `site/links/index.html` from “Links - Só Saio Pra Comer”: photo, name “SÓ SAIO PRA COMER”, tagline, three pill links with generic icons (no social-network logos, per `DESIGN.md`), the disclosure note and footer. Destinations come from the owner (OI-4); web links carry `target="_blank" rel="noopener noreferrer"`, the email link is `mailto:`. Make the links half of T124 pass.
- [ ] T129 [P] [US8] Add the links-page photo to `site/assets/img/` (OI-3; metadata stripped before commit; the owner confirms permission to publish each name and photo, SEC-009); until supplied use a token-based placeholder block and leave this task open.
- [ ] T130 [US8] Write `site/Caddyfile`: same global options and filtered default log as the app, no `log` directive in the site block, `root * /srv`, `try_files {path} {path}/index.html`, `redir /links /links/` for the slash-less path, unknown paths `404` with a plain page, the site CSP and the other three headers exactly as [contracts/http-serving.md](contracts/http-serving.md) §Site gives them (copy the CSP from there; the contract is the only place it is written out), `Cache-Control: no-cache` on every response, the 404 page included (the site has no hashed assets, and a matcher on `*.html` would miss `/links/`; verified on the pinned image, where the 404 page also keeps the security headers), no SPA fallback, no cookies.
- [ ] T131 [US8] Write `site/Dockerfile` and `site/.dockerignore`: `FROM caddy:2.11.7@sha256:36c24ad91a7ff7bc4c87fe22bfa8df3c4b18da0773d73fc12ee2c52b98c0bb7e`, `setcap -r /usr/bin/caddy`, `/data` and `/config` owned by `65532:65532` with `VOLUME`, `COPY index.html`, `COPY links/` and `COPY assets/` into `/srv` by name (never `COPY . .`), the `Caddyfile`, `USER 65532:65532`; `.dockerignore` is `*` then `!index.html`, `!links/`, `!assets/`, `!Caddyfile`.
- [ ] T132 [US8] Build and run the site image exactly as in [quickstart.md](quickstart.md) section C, run `scripts/smoke-site.sh sspc-site:local` until it passes, and compare the pages with the three Stitch screens at phone and desktop widths (SC-010: two taps to any link, pages visible within 2 s).

**Checkpoint**: the site image builds and runs without the app, and its content check passes.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: finish what spans stories and close the device record.

- [ ] T133 [P] Rewrite `README.md` for this repository: what it is, the two images, the npm scripts, how to run the local gates and the container, and links to [quickstart.md](quickstart.md) and [plan.md](plan.md); remove the scaffold text.
- [ ] T134 Run [quickstart.md](quickstart.md) sections A and B end to end on the computer (A1 to A13, including the desktop-browser tab check A13, and B with the insecure-origin check) and fix any deviation in code or in the quickstart text.
- [ ] T135 Run [quickstart.md](quickstart.md) section C and confirm the app and site images are separate artefacts that build independently (SC-011): change one file in `site/`, rebuild both, and confirm the app image ID does not change.
- [ ] T136 Confirm the scan gate on the final lockfile: `npm run audit` and Trivy on the three images pass without exceptions, or every exception in `security/exceptions.yaml` has all fields, an approver and an expiry within 30 days.
- [ ] T137 Confirm the initial JS budget on the final build (below 400 kB raw) and write the final number into `research.md` R-25.
- [ ] T138 Review the constitution compliance of the finished code (Principles III to VII, IX, XIII): grep for `NgModule`, `*ngIf`, `*ngFor`, `ChangeDetectionStrategy.Default` or `.Eager`, literal colors or sizes in `src/app/ui`, English UI strings, and any date, time or number formatting that does not use `pt-BR` (FR-020; the shell shows none today), and confirm that `.claude/settings.json` still has the three Stitch write tools on `ask` and the other seven denied, and fix.
- [ ] T139 Complete `specs/001-installable-pwa-shell/validation.md` with every step of quickstart D (including accepted design deviations from research G1–G11) and the total time of one complete run of D1 to D4 (SC-009: 30 minutes or fewer, phone trust already done; if it takes longer, the owner accepts the time or revises SC-009), then perform the end-of-period cleanup of D5 (remove the override with `$COMPOSE rm -sf web web-app`, stop LAN exposure, remove the local authority trust and profile from the phone, clear site data and the installed app), tick the cleanup row, and run `npm run policy` so the record check passes (SEC-010).
- [ ] T140 Owner action before any public launch (SEC-009, SEC-011): confirm permission to publish each name and photo, accept the scraper exposure of the partnerships email, and review LGPD applicability with qualified advice if unsure; record the confirmation in the pull request description.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies. T002 before T015; T003 and T004 touch different files but both must land before the first build. `prebuild` and `pretest` (T015) need T016 and T024, so until T024 exists the first builds and tests run through `ng build` and `ng test`.
- **Design gap (Phase 2)**: depends on Setup (T012 and T013 for the Stitch connection and permissions) and on the owner. Order: T016 (`DESIGN.md`) and T017 (the constitution amendment, committed) → T018 (permissions and baseline) → T019 (create) → T020 (review loop) → T021 (record) → T022 (scope check, close). The owner approves every write call of T019 and T020. The phase must be complete before Phase 3 is complete. While the owner works on the designs, the Phase 3 tasks that do not use them may start; the dialog (T038, T039), the insecure-connection notice (T061), the catalogue's dialog section (T082), the home page (T091) and the update wiring (T102) wait for T021.
- **Foundational (Phase 3)**: depends on Setup and, for the tasks just named, on Phase 2. Blocks every story. Inside it: T016 (done in Phase 2) → T023/T024 (tests then generator) → T026 (T023/T024 also come before any task that runs `npm test` or `npm run build`, because `pretest` and `prebuild` call `tokens:build`; until then run `ng test` or `ng build` directly); component specs (T032, T034, T036, T038, T040, T042, T044) can all start once T027 and T028 exist; T037 and T039 need T033; the shell (T047) needs T031, T035, T041, T043; T046 before T047.
- **User stories (Phase 4 onward)**: all start after Phase 3.
  - **US1, US2** are independent of each other.
  - **US3** needs the shell of Phase 3 and benefits from US1 and US2 (T075 verifies Stories 1 and 2 on the device); its image tasks (T064 to T071) only need Phase 3; T072 also needs the secure-context code of US2 (T059 to T061). Every device check (T075, T085, T095, T096, T104) needs the stack path of T069 and T073, and all but T075 need the app already installed by T075.
  - **US5** (catalogue and themes) needs Phase 3 and runs before US4: Principle V has every screen start from the catalogue. **US4** needs Phase 3 and follows US5 (its pages use components already in the catalogue). **US6** needs Phase 3, T079 (catalogue shell) for T103, and T069/T073 for the device check T104.
  - **US7** needs US3 (app image, smoke scripts) and US8 (site image) before its `image` job (T120) can pass, but its policy scripts (T105 to T116) can start after Phase 3.
  - **US8** needs only T024 (site tokens) and Setup.
- **Polish (Phase 12)**: after the stories it covers; T139 last.

### Within Each User Story

- Tests first and failing, then implementation, then the device check.
- Component specs (README, harness, tests) before component code; services before the pages and shell wiring that use them.

### Parallel Opportunities

- Setup: T003 to T014 are all different files.
- Design gap: sequential; every Stitch write waits for the owner's approval.
- Foundational: T023, T025, T027 to T031, and every component specification task (T032, T034, T036, T038, T040, T042, T044) can run together as separate files (a task that runs `npm test` waits for T024 or uses `ng test`); after T033, T037 and T039 can run together with T035, T041, T043, T045.
- US7: T105 to T116 are independent files and can all run together.
- US8: T124, T125, T126 can run together; T127 and T128 touch different files.
- Different stories can be built by different people once Phase 3 is done.

---

## Parallel Example: Foundational `ui` components

```bash
# After T027 (axe helper) and T028 (fakes), launch all component specifications together:
Task: "SspcButton specification: src/app/ui/button/README.md, button.harness.ts, button.spec.ts"      # T032
Task: "SspcStatusChip specification: src/app/ui/status-chip/…"                                         # T034
Task: "SspcBanner specification: src/app/ui/banner/…"                                                  # T036
Task: "SspcDialog specification: src/app/ui/dialog/…"                                                  # T038
Task: "SspcAppBar specification: src/app/ui/app-bar/…"                                                 # T040
Task: "SspcTabBar specification: src/app/ui/tab-bar/…"                                                 # T042
Task: "SspcListRow specification: src/app/ui/list-row/…"                                               # T044
```

## Parallel Example: User Story 7 policy checks

```bash
Task: "scripts/policy/workflow.mjs + workflow.test.mjs"          # T105
Task: "scripts/policy/dockerfiles.mjs + dockerfiles.test.mjs"    # T106
Task: "scripts/policy/agent-settings.mjs + test"                 # T107
Task: "scripts/policy/caddyfile.mjs + test"                      # T108
Task: "scripts/policy/image-metadata.mjs + test"                 # T109
Task: "scripts/policy/validation-record.mjs + test"              # T110
Task: "scripts/policy/exceptions.mjs + test"                     # T111
Task: "scripts/policy/npm-audit.mjs + test"                      # T112
```

---

## Implementation Strategy

### MVP First (User Stories 1 to 3)

1. Phase 1: Setup. 2. Phase 2: Design gap (the three Stitch screens, with the owner approving each write). 3. Phase 3: Foundational (blocks everything). 4. US1, US2 and US3.
5. **Stop and validate on the iPhone** (T075): installable, opens offline, counter difference 0. The app is only a shell with a home and a stub About, but the P1 promises are provable.

### Incremental Delivery

1. Setup, then the design phase, then Foundational → shell renders with the seven components.
2. US1 → US2 → US3 (MVP, device-verified).
3. US5 (catalogue and themes) → US4 (real home and About) → US6 (update flow), each verified on the device with its own task. The catalogue comes first so that every screen starts from it (Principle V).
4. US7 (pipeline) and US8 (site) are P3 and can run in parallel with US4 to US6 once Phase 3 is done; US7's `image` job waits for US3 and US8.
5. Polish, then the closing cleanup (T139).

### Parallel Team Strategy

After Phase 3: one person on US1–US3 (device path), one on US4–US6 (screens and update), one on US7–US8 (pipeline and site).

---

## Requirement coverage map

Every functional requirement, security requirement and measurable outcome of [spec.md](spec.md) maps to at least one task. Where a requirement is decided on the device, the device task is listed last. The tasks cited nowhere below are setup, test-infrastructure and documentation tasks that serve a constitution principle rather than a spec requirement: T002, T004, T005, T009, T010, T028, T048, T114 and T133.

| Requirement | Tasks |
|-------------|-------|
| FR-001 installable, name, icon, colors | T049, T050, T051, T052, T075 |
| FR-002 standalone, safe areas | T026, T047, T049, T050, T053, T075 |
| FR-003 first usable screen within 1 s | T054, T075 |
| FR-004 desktop browser, no install needed | T134 (A13) |
| FR-005 offline after one load, images and fonts included | T055, T058, T060, T062, T075, T095 |
| FR-006 interrupted first load | T058, T075 |
| FR-007 no browser error page | T058, T065, T075 |
| FR-008 connection chip and About state | T031, T047, T062, T094, T096 |
| FR-009 update checks | T098, T101 |
| FR-010 non-blocking notice | T099, T102, T104 |
| FR-011 no reload, focus kept | T098, T101, T104 |
| FR-012 update, dialog on unsaved text | T019, T020, T021, T038, T039, T097, T098, T099, T100, T101, T102, T103, T104 |
| FR-013 update failure | T098, T102, T104 |
| FR-014 one coherent version | T058, T104 |
| FR-015 current version keeps working | T098, T104 |
| FR-016 placeholder home | T019, T020, T021, T088, T091 |
| FR-017 About content, storage request | T087, T088, T090, T092, T093 |
| FR-018 version identifier | T006, T086, T089 |
| FR-019 only existing destinations | T046, T047, T094 |
| FR-020 Brazilian Portuguese, `pt-BR` | T049, T050, T138 |
| FR-021 light and dark, live | T023, T024, T026, T085 |
| FR-022 match the Stitch designs | T019, T020, T021, T085, T095 |
| FR-023 touch targets, contrast, text size, motion | T026, T027, T032 to T045, T076, T085 |
| FR-024 catalogue, development only | T077 to T084 |
| FR-025 single design source | T015, T016, T023, T024 |
| FR-026 gates on every pull request | T007, T008, T029, T030, T113, T115, T117 to T123 |
| FR-027 size budget | T003, T054, T137 |
| FR-028 gates after merge | T117 |
| FR-029 no publish, no deploy secrets | T105, T117 |
| FR-030 app image, restricted runtime | T064, T065, T066, T071, T106, T131 |
| FR-031 separate images | T131, T135 |
| FR-032 images scanned | T120, T136 |
| FR-033 site home page | T124, T125, T126, T127 |
| FR-034 site links page | T124, T126, T128, T129 |
| FR-035 static site, no cookies, no logs | T065, T108, T124, T125, T130 |
| FR-036 written iPhone procedure | T073, T075, T085, T095, T104, T139 |
| FR-037 verification record | T074, T075, T110, T139 |
| FR-038 pointer to the API's trust procedure | quickstart D1, T075 |
| FR-039 missing Stitch screens created and aligned | T012, T013, T017, T018, T019, T020, T021, T022, T107 |
| SEC-001 secure context, headers | T019, T056, T057, T059, T060, T061, T065, T072, T075, T130 |
| SEC-002 no third-party requests, no API caching | T003, T025, T055, T058, T118, T124 |
| SEC-003 update integrity and recovery | T058, T104 |
| SEC-004 no source maps, catalogue off | T003, T066, T106, T118, T120 |
| SEC-005 allowlisted contents, pinned bases | T011, T064, T066, T106, T131 |
| SEC-006 scan gates, exceptions record | T001, T014, T111, T112, T119, T120, T136 |
| SEC-007 CI hardening | T105, T117, T119 |
| SEC-008 no access logs, request counter | T063, T065, T067 to T070, T073, T130 |
| SEC-009 image metadata, link attributes, owner confirmations | T093, T109, T116, T128, T129, T140 |
| SEC-010 test hygiene, cleanup row | T074, T110, T139 |
| SEC-011 public reachability, LGPD, permissions | T116, T140 |
| SEC-012 storage request flag | T087, T090 |
| SC-001 launch time | T075 |
| SC-002 offline cold launches | T075 |
| SC-003 typing preserved | T104 |
| SC-004 notice within 5 s | T104 |
| SC-005 version after update | T104 |
| SC-006 Portuguese and contrast | T076, T085, T138 |
| SC-007 no unaccepted deviation | T085, T095 |
| SC-008 checks catch deliberate breaks | T122, T123 |
| SC-009 procedure within 30 minutes | T074, T075, T139 |
| SC-010 site taps and load time | T132 |
| SC-011 separate artefacts | T135 |
| SC-012 clean final review, existing screens unchanged | T018, T020, T022 |

---

## Notes

- [P] tasks touch different files and depend on nothing unfinished.
- The agent writes to Stitch only after asking the owner, who approves every call (constitution Principle VI v2.1.0; `ask` permissions in `.claude/settings.json`, checked by `agent-settings`). In Phase 2 it creates the six missing screens and edits only those; no existing screen, design system or project is touched.
- Nothing here commits, pushes or publishes; the optional git hooks are the owner's to run.
- Tasks that need the iPhone or the sibling stack are marked OI-6 and **(check)** where a sibling command may have moved.
- Stop at any checkpoint to validate a story on its own.
