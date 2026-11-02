# Research: Installable PWA Shell

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-01

Status words: **Verified** = checked on this machine on the date above (the command or file is named). **To verify** = cannot be checked without the iPhone or the owner; it is a task in [quickstart.md](quickstart.md) or an open item in section 4.

## 1. Inputs that were not found

The plan input cites material that is not on this machine (searched under `~/codes`, `~/` and the Windows user folders):

| Cited as | Found? | What the plan does |
|----------|--------|--------------------|
| `sspc-design/DESIGN.md` | A candidate exists: `C:\Users\augus\Downloads\DESIGN.md` (16.6 kB, 62 colors including 31 `dark-*`, 13 typography scales, 6 radii, 15 spacing tokens, 23 components). The copy embedded in the Stitch project theme is truncated (3.7 kB, no dark tokens), so it is not used. | Copy the Downloads file to `DESIGN.md`; the owner confirms it is the right one. |
| `sspc-design/tokens` (build script) | No | Write `tools/build-tokens.mjs` from the contract in R-09. |
| `sspc-design/site` (pages) | No | Author `site/` from the Stitch site screens recorded in R-14 and the content fixed by FR-033/FR-034. |
| `02 §3.3`, `§5.3`, `§8.1.2`, `§2` | No | Use the constraints stated inline in the input and the sibling repo's own files (`deploy/compose.local.yaml`, `deploy/RUNBOOK.md`, `specs/002-dev-flow-lan-pwa/contracts/ci-workflow.md`). |
| `pr-templates/sspc-web` | No | Adapt `sspc-api/.github/pull_request_template.md` to the frontend (R-20). |

## 2. Decisions

### R-01 Update semantics of the Angular service worker (Verified)

- **Finding**: in `node_modules/@angular/service-worker/ngsw-worker.js` (`assignVersion`, lines 1934–1976) a **navigation request** from a client pinned to an older version is re-assigned to the latest version (the client is told through `updateClient`), and a client with no assignment gets the latest. So a page reload, and a relaunch of the installed app after a force-quit, always start the newest downloaded version. Only a page that keeps running (backgrounded and resumed, or moving between routes) stays on its version.
- **Decision**: the notice is driven by `SwUpdate.versionUpdates` (`VERSION_READY`). The spec was amended (spec.md, "Plan amendments") so that a full restart counts as updating. A custom service worker that pins clients was rejected: it replaces `@angular/service-worker`, which the plan input mandates, and it would keep the user on an old version for no benefit.
- **Check timing (FR-009)**: Angular checks at registration and, scheduled when the worker is idle, on each navigation request (`check-updates-on-navigation`, verified in `ngsw-worker.js`). `registerWhenStable:30000` was the scaffold's value; it becomes `registerWhenStable:5000` so the offline start is guaranteed 10 s after the first load (FR-005, analysis A2; the quickstart records the observed time). In addition `AppUpdate` calls `checkForUpdate()` once after startup, on `visibilitychange` to visible and on the `online` event, at most once per 30 s. SC-004 (notice within 5 s of those events) is measured in the quickstart.
- **Activation**: `activateUpdate()` then `document.location.reload()`, as the input says. `activateUpdate()` only switches the client to the version already downloaded (`updateClient` in `ngsw-worker.js`, reached by the `ACTIVATE_UPDATE` message) and makes no request, so it works offline: a tap on "Atualizar" while offline applies the update, and the failure path is reserved for a rejected activation or `SwUpdate.unrecoverable`. If `activateUpdate()` rejects, or `SwUpdate.unrecoverable` fires, the notice shows the failure text and a retry (FR-013).
- **Unsaved text (FR-012)**: tapping "Atualizar" asks `UnsavedWork` (core) whether any field is dirty; if so a dialog opens (R-12, R-14 G1).

### R-02 Offline behaviour and `ngsw-config.json` (Verified for the scaffold, To verify on the iPhone)

- Keep the `app` group (`prefetch`) and the `assets` group (`lazy`, `updateMode: prefetch`); no `dataGroups` (nothing calls `/api` yet). Add fonts (`/media/*.woff2`), the manifest icons and the About photo (`/images/*.webp`) to the `app` group so a first load is enough to open offline (FR-005, FR-006). A `lazy` group caches a file only after it is first requested, so an image left in `assets` is missing when the first offline visit is to the screen that uses it (analysis G1); the `build` job asserts that every emitted image and font is in the `app` group. Verified on 2026-11-01: with the scaffold's `ngsw-config.json` a CSS-referenced font is emitted as `/media/<name>-<hash>.woff2` and listed in the lazy `assets` group, so the explicit `/media/*.woff2` entry in `app` is required.
- Keep the default `navigationRequestStrategy` (`performance`): `index.html` is served from cache, which is what an offline cold launch needs.
- `navigator.storage.persist()` (R-04) reduces the risk that iOS clears the stored files of a rarely used app (edge case in the spec).

### R-03 Connectivity (spec A-012)

`Connectivity` (core) exposes `online = signal(navigator.onLine)` updated from the window `online` and `offline` events. It never contacts a server. Initial value is read synchronously at construction, so there is no unknown state (FR-008).

### R-04 Storage protection (To verify on the iPhone)

`StoragePersistence` (core): at start `navigator.storage.persisted()`; if false and not asked before (flag in `localStorage`, so browsers that prompt do not ask twice), call `persist()`. State signal: `granted | denied | unsupported`. Whether Safari on iOS grants `persist()` for the Home Screen app is **not known from here**; the quickstart records the observed value. Copy for the three states is in R-14 (G6).

### R-05 Build-time version (Verified)

- `ng build --define KEY=VALUE`: string values must be quoted (schema text in `@angular/build` `application/schema.json`).
- **Verified experiment** (throwaway copy of the scaffold): `angular.json` `define` holds `APP_VERSION='0.0.0+dev'`, `APP_BUILD='local'`, `SSPC_CATALOG=true` (production: `false`); a CLI `--define "APP_VERSION='7.7.7+rc.1'"` **merges key by key**: the version changed, the other keys kept their values.
- **Decision**: `angular.json` carries the local defaults; the Dockerfile passes `APP_VERSION` and `APP_BUILD` (short commit) from build arguments. Code reads them through `core/app-version.ts`, which takes them from an injection token (`APP_BUILD_INFO`) whose default factory reads the globals, guarded with `typeof APP_VERSION !== 'undefined'` (tooling that does not apply the defines falls back to `0.0.0+dev`). **Verified in the Angular source**: the `@angular/build:unit-test` builder passes the build target's `define` to the bundler (`builder.js`), so in unit tests the constants are literals (`'0.0.0+dev'`, `'local'`, `true`) and cannot be stubbed; tests supply other values through the token, and the route table through `buildRoutes` (R-15).
- `APP_BUILD` is an addition to the input: the About design shows "1.0.0 (a1b2c3d)" and FR-017 asks for the short build reference. Local builds show `local`.

### R-06 Zoneless (Verified)

Angular 22.2.4 with no `zone.js` in `node_modules` and no zone provider in `app.config.ts`: the scaffold is already zoneless. `provideZonelessChangeDetection` is still exported but is not added; a test asserts that the app boots without it (a task in tasks.md).

### R-07 Dependencies and versions (Verified with `npm view` on 2026-11-01)

| Package | Version | Kind | Justification (Principle VIII) | Note |
|---------|---------|------|--------------------------------|------|
| `@angular/cdk` | 22.2.5 | runtime | Allowed. Dialog, focus trap, harnesses | Not installed yet. Peer `@angular/core ^22 \|\| ^23` |
| `@lucide/angular` | 1.66.0 | runtime | Allowed (Lucide) | **Replaces `lucide-angular@1.0.0` from the input**: that package is deprecated ("Please use @lucide/angular instead") and its peer range is `13.x - 21.x`, which `npm install` rejects with Angular 22. `@lucide/angular` peers `>=17`, ISC |
| `style-dictionary` | 5.5.5 | dev | Allowed dev-only | Reads W3C tokens |
| `yaml` | 2.9.1 | dev | Allowed dev-only | Front matter of `DESIGN.md` |
| `@google/design.md` | 0.4.0 | dev | Allowed dev-only | `design.md lint`; its `zod` dependency is overridden to `^4.6.6` in `package.json` (R-30) |
| `axe-core` | 4.13.0 | dev | Allowed | `expectNoA11yViolations` |
| `eslint` 10.x, `angular-eslint` 22.x, `typescript-eslint` 8.72.x | latest | dev | Tooling named in Principle III/IV | `typescript-eslint` accepts TypeScript `<6.1`, so 6.0.3 is fine |
| `stylelint` 17.16.0, `postcss-scss` | latest | dev | Tooling named in Principle V | SCSS syntax; only core rules (no plugin) |
| `@angular/service-worker` 22.2.4 | installed | runtime | already present | `@angular/pwa` is **not** added: the scaffold already contains what `ng add @angular/pwa` generates (manifest, icons, `ngsw-config.json`, `provideServiceWorker`); the files are edited in place |
| `vitest` 5.0.5, `jsdom` 30 | installed | dev | already present | `@angular/build:unit-test` |

The Angular framework packages installed are 22.2.4 (`@angular/build` and `@angular/cli` 22.2.5), not the scaffold's 22.2.1; the reason is in R-30. The service-worker behaviour of R-01 was checked on 22.2.1 and the relevant function (`assignVersion`) is unchanged at the same line in 22.2.4.

Not added: `fake-indexeddb`, `dexie`, `uuid`, TipTap, Playwright (no data, no editor and no browser end-to-end flow in this feature).

### R-08 Container (Verified by experiment with Docker 29.9.2)

Throwaway image on `caddy:2.11-alpine`, run exactly like the local stack runs `web` (user 65532, `read_only`, `tmpfs /tmp`, `cap_drop ALL`, `no-new-privileges`):

| Experiment | Result |
|------------|--------|
| Stock `caddy` under those restrictions | `exec /usr/bin/caddy: operation not permitted` (the binary carries `cap_net_bind_service=ep`) |
| Image with `setcap -r /usr/bin/caddy` (`setcap` was already present in the image, no `apk add` needed) | `getcap` empty; Caddy starts and serves `200`, SPA fallback works |
| Same, `/data` and `/config` only chown'd to 65532 | Serves, but logs 3 errors/warnings (`autosave.json` and `instance.uuid`: read-only file system) because the root filesystem is read-only |
| Same, plus `VOLUME ["/data", "/config"]` | **0 error lines**, `200` |
| `persist_config off` instead of `VOLUME` | Still logs the `/data/caddy` storage errors |

**Decision**: `setcap -r`, `USER 65532:65532`, `/data` and `/config` created and chown'd, **and `VOLUME ["/data", "/config"]`** (the local stack then gets writable anonymous volumes; in the cluster the `emptyDir` mounts replace them). Global options: `admin off`, `auto_https off`, `servers { protocols h1 }` (silences the HTTP/2 and HTTP/3 warnings; the edge talks HTTP/1.1 to `web:8080`).
**Access evidence (superseded by SEC-008)**: neither image writes an access log, and the evidence for FR-037 is the local request counter designed in R-28. The logging behaviour behind that decision was measured in R-27.

### R-09 Design tokens pipeline (Verified for lint; contract for the script)

- **Lint (Verified)**: `design.md lint DESIGN.md` (0.4.0) on the Downloads copy: exit 0, `errors: 0`, 17 warnings, all `orphaned-tokens` (tokens used by `tokens.css` but not by a `components:` entry: `tertiary-ink`, `neutral`, `earth`, `success`, and 13 `dark-*`). The CLI has no flags other than `--format`. **Decision**: "design:lint clean" (Principle VI) means exit code 0 and `summary.errors == 0`; the `orphaned-tokens` warnings are expected and listed here. A new warning rule is a failure review item.
- **`tools/build-tokens.mjs` contract**: reads the YAML front matter of `DESIGN.md` with `yaml`; writes `src/app/ui/tokens/tokens.json` in the W3C Design Tokens format (`$type`/`$value`; `dark-*` colors under a `dark` group with the same role names); runs `style-dictionary` to write `tokens.css`: light values on `:root`, dark values in `@media (prefers-color-scheme: dark)` on `:root`, `color-scheme: light dark`, CSS variables prefixed `--sspc-`, and one `.type-<name>` class per typography scale carrying `font-family` (the token's family followed by a generic `system-ui, sans-serif` fallback), `font-size`, `font-weight`, `line-height`, `letter-spacing` when present, and `font-variation-settings` from the non-W3C `fontVariation` field (all 13 scales set it, for example `'wdth' 75, 'opsz' 96`). Style Dictionary 5.5.5 (checked in `node_modules`): its built-in `css/variables` format takes a nested `selector` array, which gives the dark `@media` block; the `.type-*` classes and `color-scheme` need a small custom format. Output is deterministic (sorted keys, no timestamps) so `git diff --exit-code` is a valid gate. Beyond those four groups it also emits (i) the dimension properties (`…px`) of the `components` entries as `--sspc-component-<name>-<prop>` (for example `--sspc-component-fab-size: 60px`, which the FAB needs and `spacing` lacks), and (ii) derived tokens for what `DESIGN.md` states only in prose, each written as an expression over `var(--sspc-spacing-base)` and never as a literal `px`: `--sspc-stroke-hairline` (base / 4, the 1 px borders and dividers), `--sspc-stroke-focus` and `--sspc-focus-offset` (base / 2, the 2 px focus ring), and `--sspc-elevation-floating` (the soft, low, forest-tinted shadow of the FAB, dialogs and the update banner: offsets and blur are multiples of the base and the color is a `color-mix` of the `primary` token, with the geometry taken from the dialog aligned in T021). If `DESIGN.md` later defines `stroke` or `elevation` groups (owner input OI-9) the generator uses them instead and the derived values go away.
- **Theme (FR-021)**: follows the device with the media query; no in-app switch (A-005). `index.html` carries two `theme-color` meta tags (light/dark media).
- **Scripts**: `design:lint`, `tokens:build`, `tokens:check` (build then `git diff --exit-code -- src/app/ui/tokens`), `prebuild` and `pretest` run lint then build.

### R-10 Fonts

Bricolage Grotesque, variable WOFF2, Latin subset (includes Portuguese diacritics), all three axes kept (`wght` 200–800, `wdth` 75–100, `opsz` 12–96: every typography scale of `DESIGN.md` sets `'wdth'` and `'opsz'` in `fontVariation`, and the display, headline and wordmark scales use the condensed widths 75 to 80, so dropping `wdth` would change every heading), `@font-face` with `font-weight: 200 800` and `font-stretch: 75% 100%`, `font-display: swap`, `OFL.txt` alongside, under `src/assets/fonts/`, referenced from `tokens.css`/`styles.scss` so the builder hashes them under `media/`. Subsetting happens once at implementation time with the upstream OFL font; the file size is recorded and counted in the offline cache (not in the JS budget). Verified that the Stitch screens load the font from Google Fonts, which the CSP (`default-src 'self'`) and offline use forbid: self-hosting is mandatory.

**Recorded (2026-11-02, T025):** `src/assets/fonts/bricolage-grotesque-latin.woff2`, 152 316 bytes (148.7 KiB), subset from the upstream `BricolageGrotesque[opsz,wdth,wght].ttf` with `subset-font` (Latin, Latin-1, Latin Extended-A, Portuguese punctuation). Checked with fontkit: axes `wght` 200–800, `wdth` 75–100, `opsz` 12–96 all kept; 320 glyphs; `ã` and `ç` present. `OFL.txt` beside it. The production build emits it under `media/` with a content hash.

### R-11 Icons

`@lucide/angular`, imported one icon at a time to keep the budget. Mapping from the Material Symbols used in Stitch (the design says "Lucide", Principle V):

| Stitch (Material) | Lucide | Where |
|-------------------|--------|-------|
| `wifi` / `wifi_off` | `wifi` / `wifi-off` | connection chip, About row |
| `arrow_back` | `arrow-left` | About back control |
| `home`, `person` | `house`, `user` | tab bar (Início, Perfil) |
| `update` (board) | `refresh-cw` | update banner (see G3) |
| `restaurant`, `stars` | `utensils`, `star` | About monogram |
| `menu_book` | `book-open` | About badge |
| `terminal`, `security`, `verified_user` | `terminal`, `shield`, `shield-check` | About rows |
| `location_on` | `map-pin` | About footer |
| `check`, `add`, `delete` | `check`, `plus`, `trash-2` | button variants, FAB, destructive |

### R-12 `ui` component set (deviation from the input: 7 components, not 2)

The input names `SspcButton` and `SspcBanner`. The spec and Principle V need five more: Principle V says anything missing becomes a `ui` component before a page uses it, and FR-008, FR-012, FR-016, FR-017 and FR-019 need them.

| Component | Needed by | Stitch source |
|-----------|-----------|---------------|
| `SspcButton` | FR-024 (1.1 Botões) | boards, section "Botões" |
| `SspcBanner` | FR-010 (1.5 Banner) | "Feedback" section, 2.8 |
| `SspcDialog` | FR-012, FR-024 (1.5 Diálogo) | **none, see G1** |
| `SspcStatusChip` | FR-008 | 2.8/2.9 header chip, About "Online" chip |
| `SspcListRow` | FR-017 | About card rows |
| `SspcAppBar` | FR-008, FR-017 | headers of 2.8/2.9 |
| `SspcTabBar` | FR-016, FR-019 | bottom navigation |

Each ships with README specification, CDK harness, table-driven tests with the axe check, and a catalog entry. If the owner prefers the minimum, `SspcListRow`, `SspcAppBar` and `SspcTabBar` can be page markup built from tokens, at the cost of breaking Principle V; this is a decision for the owner, recorded in plan.md Complexity Tracking.

### R-13 Lint rules (design; the rules themselves are tested with fixtures)

- **Path aliases** in `tsconfig.json`: `@sspc/core/*`, `@sspc/ui/*`, `@sspc/testing/*`. There is no alias for features.
- **`no-restricted-imports` overrides** (ESLint flat config):
  - `src/app/ui/**`: forbid `@sspc/core/**`, `@sspc/features/**`, any relative path that climbs 2 or more levels (`../../**`; `ui` is flat: `ui/<component>/file.ts`), `@angular/router`, `@angular/common/http`, `dexie`.
  - `src/app/features/**` (one override for every feature directory, present and future, so it also applies to the virtual paths of the rule proof): forbid `../../**` (this blocks both other features and everything outside the feature through relative paths) and `@sspc/features/**`; cross-area imports go through `@sspc/ui` and `@sspc/core`.
  - `src/app/core/**`: forbid `@sspc/features/**` and `**/features/**`.
- **Rule tests**: `tools/lint-rules.test.mjs` (Vitest, node environment; the Angular unit-test builder bundles for the browser and would not load the Node-only ESLint and stylelint APIs). A table of `{ name, input: { filePath, code }, output: { ruleId or message } }` cases calls `ESLint.lintText` and `stylelint.lint` on inline code at virtual paths (for example `src/app/ui/button/x.ts`, so the `ui` overrides apply), with no fixture files that `tsc` or `eslint .` could pick up. This proves the rules fail, not only that clean code passes. Intra-`ui` imports of one level (`../button/button`) are allowed; two or more levels are not.
- **angular-eslint** errors: `prefer-standalone`, `prefer-on-push-component-change-detection`, `template/prefer-control-flow`; selector prefix `sspc` (the scaffold has `app`, changed in `angular.json` and the ESLint config). In angular-eslint 22.6.0 the on-push rule reports only an explicit `changeDetection: ChangeDetectionStrategy.Default` or `.Eager`: `OnPush` is the Angular 22 default, so omitting the property is compliant and an explicit `OnPush` is allowed (`allowExplicitOnPush`); the rule proof therefore uses `Default` as its bad case. Verified on 2026-11-01 by linting 13 inline cases at virtual paths with the repository's config: the boundary overrides (7 bad, 2 good), `prefer-standalone`, the selector prefix and `prefer-control-flow` behave as specified.
- **stylelint** (core rules only, no plugin, `postcss-scss` syntax) for `src/app/ui/**/*.scss`: `color-no-hex`, `color-named: never`, `function-disallowed-list` for `rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color`, `unit-disallowed-list: [px, rem, em, pt, pc, cm, mm, in]`, and `declaration-property-value-disallowed-list` so `font-family` accepts only `var(...)`. Sizes must come from tokens (`var(--sspc-…)`), plus unitless `0` and `%`; a size with no spacing token (1 px hairline, 2 px focus ring and offset, the FAB's 60 px, shadow geometry) uses the generated `--sspc-stroke-*`, `--sspc-focus-offset`, `--sspc-component-*` and `--sspc-elevation-*` properties (R-09) or `calc()` over `var(--sspc-spacing-base)`. Component styles live in external `.scss` files.

### R-14 Stitch reading (the five screens, light and dark)

Read through the Stitch tools (`get_project`, `list_screens`, `get_screen`, `download_file`; read only) on 2026-11-01. Stitch HTML/CSS was **read for measurements and copy and not copied**. Where Stitch and `DESIGN.md` disagree, `DESIGN.md` wins (Principle VI): tap target 48 px, `gutter` 16, `margin` 20, radii 8/14/20/28.

**Mapping of the cited names** (the cited numbered names do not exist in Stitch; titles below are the real ones):

| Cited | Stitch screen (project "Só Saio Pra Comer Design System") | Id |
|-------|------------------------------------------------------------|----|
| 0 Quadro do design system | "Design system" / "Design system (Dark Theme)" (accordion catalogue "Catálogo do Desenvolvedor · v1.0.0"); alternative board "Componentes do Design System" / "(Dark Theme)" | `594d5ef0…`, `08d47242…`; `6a91f1ef…`, `a4157d93…` |
| 1.1 Botões | Section "1. Botões (12 estados)" of "Design system"; "Folha de Estilos: Botões" of "Componentes" | same |
| 1.5 Banner e diálogo | Section "5. Feedback & Notificações" (update banner, offline strip, empty state). **No dialog anywhere** | same |
| 2.8 Nova versão disponível | "Visitas (Com Atualização) - SSPC Studio" / "(Com Atualização - Dark Theme)" | `f02acaa5…`, `dc4df4cf…` |
| 2.9 Sobre | "Sobre - SSPC Studio" / "Sobre (Dark Theme) - SSPC Studio" | `67004c01…`, `506594ca…` |

The canonical source for button states is "Design system" (it calls itself "Inventário canônico"); "Componentes" differs in details (disabled style, heights) and is used only for what the first lacks.

#### 0 Quadro do design system (catalogue; becomes the `/_ds` catalogue)

- **Layout**: fixed header 64 px (back, "Componente Detalhe", avatar), then a context row (connection chip "Conectado" and "Mobile 390×844"), an intro card ("Catálogo do Desenvolvedor · v1.0.0", "Design system", one-line description), then accordion sections 1 to 6, each with a count badge ("12 estados", "9 chips", "4 estados", "3 variantes", "3 componentes", "3 blocos"), then a fixed bottom nav. Spacing: page padding 16, section gap 12, card padding 14, grid gap 10.
- **Used by this feature**: sections 1 (Botões), 2 (chips: "Sem conexão" sync bar, connection chip) and 5 (Feedback). Sections 3, 4 and 6 (form fields, visit list, editor) belong to later features and are not built.
- **Dark**: surface `#1C211A`, cards `#21271F` with 1 px `#2E352B`/`#3A4236` borders, primary `#8CA87C`.

#### 1.1 Botões

| Variant | Height / shape | Light | Dark | States |
|---------|----------------|-------|------|--------|
| Primary | 48 px, pill | bg `#414B3B`, text `#FFF9F3`; pressed `#353D30` | bg `#8CA87C`, text `#1C211A`; pressed `#7A956B` | default, pressed, loading (16 px spinner + "Salvando..."), disabled |
| Secondary | 44 px in the catalogue, 48 px in "Componentes" (use 48) | bg `#DCE6D3`, text `#2C3428`; pressed `#b2cfa0` | bg `#2E3A29`, text `#DCE6D3`, 1 px border `#3A4236`; pressed `#2E352B` | same four |
| Ghost | 44 px (use 48) | transparent, text `#414B3B`; pressed bg `#F6ECE0` | transparent, text `#F4EDE3`; pressed bg `#252B22` | same four |
| Toggle ("Terminei minha nota") | 48 px, label left, 24 px indicator right | off: bg `#FBF3EA`; on: bg `#414B3B` + check | off: `#21271F`; on: `#8CA87C` | unchecked, checked |
| FAB | 60×60, radius 28 (squircle); extended: 60 px tall, "Nova visita" | bg `#414B3B` | bg `#8CA87C` | normal, pressed, extended |
| Destructive | 48 px, trash icon + "Excluir visita" | bg `#A1402B`, text `#FFF9F3` | bg `#A1402B`, text `#F4EDE3` | default, pressed `#5E2014` (dark) |

Typography: label-md 14/600 (catalogue), label-lg 16/600 in DESIGN.md (**DESIGN.md wins: label-lg**). Disabled: opacity .6 with `surface-container-high` background in the catalogue; opacity .4 in "Componentes" (**decision: opacity .4**, one rule that works in both themes). Pressed also scales to .98 in "Componentes" (kept, removed under reduced motion).
Copy used: "Salvar", "Salvando...", "Criar visita", "Cancelar", "Terminei minha nota", "Nova visita", "Excluir visita", "Atualizar" (banner), "Atualizar agora" and "Agora não" (dialog).

#### 1.5 Banner e diálogo

- **Banner (update)**: strip with radius 12 (catalogue) or 20 (2.8), padding 12–16, one icon, one message, one action. Light bg `#E8EFE1`, text `#2C3428`; dark bg `#2E3A29`, text `#DCE6D3`, 1 px border `#3A4236`. DESIGN.md `banner`: bg `secondary-container`, radius `lg` (20), padding 16, body-sm → **radius 20, padding 16**.
- **Offline strip** (not used by the shell): `cloud_off` icon, "Modo offline · Alterações serão salvas localmente" (pill) or "Tudo fica salvo neste aparelho. Sincronizamos quando o sinal voltar." (radius 14). Both promise saving and sync, which the shell does not have, so they are **not** built here.
- **Dialog**: not designed (G1).

#### 2.8 Nova versão disponível

- **Layout** (390 px wide): fixed header 64 px: left stack (overline "SSPC STUDIO • THE" 12/600 uppercase wide-tracked + 4 px dot, then title "Visitas" 18/600), right the connection chip. The banner sits **in the page flow** (not floating) right under the header: outer padding top 14, sides 20 (DESIGN.md `margin`), card radius 20, padding 16, row: icon + "Nova versão disponível" (14/600, truncates) on the left, "Atualizar" button on the right. Content below is pushed down; nothing is covered (matches FR-010). No close control (matches the clarification).
- **Connection chip**: pill, padding 10×4, gap 6; 8 px dot (`success`) + wifi icon 15 px + "Conectado" 12/600. Light bg `#E8EFE1`/text `#2C3428`; dark bg `#2E3A29`/text `#DCE6D3`. Offline variant (from "Visitas (Offline)"): no dot, `wifi-off` icon, "Sem conexão", bg `surface-container-high`, text `earth`.
- **Action button**: 44 px high, padding 16, pill; light bg `#414B3B` text `#FFF9F3`; dark bg `#8CA87C` text `#1C211A` bold. **Use SspcButton primary, 48 px** (DESIGN.md tap target).
- **Bottom nav**: 64 px, items min 44×44 (use 48), icon 22 + label 12/600; entries "Início", "Visitas", "Perfil"; active item bold in `primary`.
- **Copy**: "Nova versão disponível", "Atualizar". Failure text and the dialog are not designed (G1, G3).

#### 2.9 Sobre

- **Header**: back button 44×44 (use 48) with `arrow_back` 24, title "Sobre" 22/650, right the connection chip with a pulsing dot (pulse removed under reduced motion).
- **Body** (padding 20, top 64 + 14): centered hero: badge "Caderno de campo · Teresina, PI" (book icon, 12/600), monogram 80 px circle with a 64 px inner circle and a utensils icon 32 px, gold 28 px star badge at the bottom-right, title "SSPC Studio" 28/700, description "Curadoria independente, relatos sinceros de mesa e documentação gastronômica artesanal." 16/400 in a 280 px column. Photo block: full width, 144 px high, radius 20, caption "Registro pessoal • Arquivo Gastronômico" over a bottom gradient (**remote image, see G7**).
- **Info card**: bg `surface-container-low`, radius 20, padding 20, row gap 14, hairline separators (`outline-variant`, 1 px). Rows (min 40 px): icon 20 + label 16/400 on the left, value on the right:

  | Row | Value in Stitch | In this feature |
  |-----|-----------------|-----------------|
  | Versão | pill "1.0.0 (a1b2c3d)" (14/600, bg `surface-container-lowest`, radius 8) | version + `APP_BUILD` |
  | Conexão | chip "Online" with pulsing dot | "Online" / "Offline" (offline label inferred, G5) |
  | Armazenamento | `shield-check` + "Protegido no aparelho" | storage state (R-04; denied copy inferred, G6) |
  | Última sincronização | "Agora há pouco" | **not built** (A-001) |

- **Sign-out** (ghost button "Sair da conta", logout icon): **not built** (A-001).
- **Footer**: gold sparkle 20, wordmark "SÓ SAIO PRA COMER" 17/800 uppercase, wide tracking, quote “Em mais um review sincero.” italic 14, `map-pin` 14 + "Teresina, Piauí" 12/600 in `outline`.
- **Dark**: page `#1C211A`, header border-bottom `#3A4236`, card `#21271F` with 1 px `#3A4236`, version pill `#171B15` with border, labels `#CFC6B6`, chip bg `#2E352B`.

#### Gaps and discrepancies for the owner (agent never edits Stitch)

| # | Gap | Plan default |
|---|-----|--------------|
| G1 | **No dialog design** (needed by FR-012 and FR-024) | Build `SspcDialog` from tokens and the banner/card language: radius 20, `surface-container-low`, padding 20, title `title-lg`, body `body-md`, actions stacked: primary "Atualizar agora" over ghost "Agora não"; scrim `inverse-surface` at 50 %. Aligned in Phase 2 (T019 to T021): the Stitch layout and copy are recorded in R-14, with the accepted deviations and their code dispositions. |
| G2 | **No placeholder home design** (only the "Início" nav entry) | Header as in 2.8 (title "Início"), banner slot, and a centered card using the empty-state language: name "SSPC Studio", message "Em breve, as visitas e os textos da sua equipe aparecerão aqui." (the approved Stitch copy, provisional until OI-7 is confirmed), no primary action. Aligned in Phase 2 (T019 to T021): the Stitch layout and copy are recorded in R-14, with the accepted deviations and their code dispositions. |
| G3 | Banner icon differs: 2.8 uses a pulsing back chevron (`arrow_back_ios_new`), the catalogue uses `update`; the catalogue appends "(v1.1)" | `refresh-cw`, no version suffix. Update-failure copy (provisional): "Não foi possível atualizar. Tente de novo." with action "Tentar de novo" |
| G4 | Button/tap-target heights 44 and 32 px vs DESIGN.md 48 px | 48 px everywhere |
| G5 | Offline About value not drawn | "Offline", same chip with the offline look of the header chip |
| G6 | Storage "denied/unsupported" not drawn | "Não protegido" with `shield` icon in the neutral chip style |
| G7 | About photo is a remote image generated in Stitch; the CSP and offline use forbid remote images | Self-hosted asset supplied by the owner (`public/images/about-hero.webp`, WebP, ≤ 40 kB), shown with an `<img>` and prefetched by the worker (R-02). Until provided: a gradient block from tokens with the same caption |
| G8 | Stitch screens disagree with each other on `gutter`/`margin` (20/24 vs 16/20) and on some light/dark colors | `DESIGN.md` values only |
| G9 | Second nav entry is "Perfil" in every design; the shell has no profile | Entry labelled "Perfil" opens `/sobre` (A-014) |
| G10 | **No design for the insecure-connection notice** required by SEC-001 (message “Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.”) | Reuse `SspcBanner` with `tone="error"` and no action, in the banner slot under the header, using the offline/error container colors of the boards. Aligned in Phase 2 (T019 to T021): the Stitch layout and copy are recorded in R-14, with the accepted deviations and their code dispositions. |
| G11 | Stitch sizes and effects outside the DESIGN.md scale: chip padding 10×4 and gap 6, tab bar icon 22 px, 1 px dark-theme borders and list hairlines, a header with blur or shadow (none is recorded above), and a focus ring in tertiary ink in the first draft of the contract | Snapped to DESIGN.md: chip padding 8×4 and gap 8, tab bar icon 24 px, borders and hairlines `--sspc-stroke-hairline` (1 px, derived from `spacing.base`), no header blur or shadow (DESIGN.md gives the soft shadow, `--sspc-elevation-floating`, only to the FAB, dialogs and the update banner), focus ring 2 px in `tertiary` (Old Gold, which DESIGN.md names for focus rings; 3.20:1 on `surface`, 6.92:1 for `dark-tertiary` on `dark-surface`) with `--sspc-focus-offset`, tested at 3:1 as a non-text indicator. `DESIGN.md` states strokes and the shadow only in prose, so `tokens.css` derives them (R-09); owner input OI-9 would move them into `DESIGN.md` |

#### Site screens (mobile "Página Temporária (Mobile)" `c1f308b6…`, desktop `e2e7afaa…`, "Links - Só Saio Pra Comer" `d503e261…`; light only)

- **Home**: tag "EDIÇÃO DIGITAL • EM OBRAS" (top-left pill) and a location tag (top-right); decorative arch with sparkles around the wordmark "SÓ SAIO PRA COMER" and "GUIA GASTRONÔMICO"; headline "Reviews sinceros de restaurantes em Teresina." (bold, centered); text "Estamos preparando a mesa. O site chega em breve."; button "Ver nossos links →" (full width pill, Forest Ink, 56 px); quote "Em mais um review sincero." and "TERESINA, PIAUÍ"; two soft blobs (dark green top-right, sage bottom-left) and a faint fork-and-knife shape.
- **Links**: arch-framed photo (couple at a table; remote image, same rule as G7), name "SÓ SAIO PRA COMER", tagline "Reviews sinceros de restaurantes em Teresina, por Ilzy e Augusto.", three full-width 64 px pill links with a 40 px leading icon circle, title, handle and a chevron: **Instagram** (camera icon), **TikTok** (play icon), **Parcerias com marcas** (mail icon, email address), then a soft note "Reviews sinceros não estão abertos para publi. Projetos com marcas são conteúdo autoral e sempre identificados como publicidade.", then "Em mais um review sincero." and "Teresina, Piauí". `DESIGN.md` forbids drawing social-network logos: generic icons only (matches the design).
- The handles and the email address are public content the owner supplies; the plan does not copy them into the spec.

#### Design phase record (filled by T018 to T022)

Baseline read at T018 (read-only, 2026-11-02):

- **Project**: `projects/14078586146997056175`, "Só Saio Pra Comer Design System" (owned; the constitution's "SSPC Studio" is the name the screens use in their titles).
- **Design systems** (`list_design_systems`): "Só Saio Pra Comer (Dark Theme)", asset `assets/5d721614eea54b4db7da064a0706adb3`, colour mode DARK, primary `#8ca87c`; "Só Saio Pra Comer", asset `assets/c1c6c94a7af14f60b4069d1071e24e00`, colour mode LIGHT, primary `#414b3b`.
- **Existing screens**: 27, not 31 (a count error in the first draft of this record). Their ids and titles are in the Stitch project; none is a dialog, a placeholder home or an insecure-connection notice (gaps G1, G2, G10 stand). Titles follow "Title - SSPC Studio" or "Title - Só Saio Pra Comer", not the `<number> <title>` convention of the constitution.
- `DESIGN.md` copied to the repository root from the owner's file (T016); `npm run design:lint`: 0 errors, 17 `orphaned-tokens` warnings, as expected.

Per new screen (T019): id, real title, theme, device type, the prompt used, the date. Phase closed on: 2026-11-02, after 1 review round (round 2 was not run: the Stitch edits did not persist, and the owner accepted the remaining deviations).

| # | Screen | Real title (from Stitch) | Theme | Device | Id | Date |
|---|--------|--------------------------|-------|--------|----|------|
| 1 | Dialog | Confirmação de Atualização (Mobile) - SSPC Studio | light | MOBILE | `d3bb60db0d1f424892279f8c237b8c9c` | 2026-11-02 |
| 2 | Dialog | Confirmação de Atualização (Mobile - Dark Theme) - SSPC Studio | dark | MOBILE | `445d574450b74b5083bb376190890392` | 2026-11-02 |
| 3 | Início | Início (Mobile) - SSPC Studio | light | MOBILE | `21e45cf522dc45bfa90fa4600f927def` | 2026-11-02 |
| 4 | Início | Início (Mobile - Dark Theme) - SSPC Studio | dark | MOBILE | `3a0ac619ca354a24b1c522bde7f4ef8a` | 2026-11-02 |
| 5 | Insecure-connection notice | Início (Aviso de Conexão - Mobile) - SSPC Studio | light | MOBILE | `4e3c5cec9f9f49bea2bf0b8da55dbc58` | 2026-11-02 |
| 6 | Insecure-connection notice | Início (Aviso de Conexão - Mobile - Dark Theme) - SSPC Studio | dark | MOBILE | `c934ee1d3af543688c193df5033956fb` | 2026-11-02 |

Note: the first generation of all six (DESKTOP 2560×2048, ids `a4e5c269…`, `7e2aefb0…`, `58572cfb…`, `754213ef…`, `5ac6fcbd…`, `a794d1fb…`) was deleted by the owner and replaced by the six above, which the owner regenerated as mobile. Those six desktop screens are no longer in the project and are not part of the design phase; the regenerated screens are the ones T020 reviews.

Prompt used for the first (desktop) dialog, now replaced: mobile confirmation dialog, light, over a dimmed "Início" screen; heading "Nova versão disponível"; body "Atualizar agora reinicia o app. Texto não salvo será perdido."; stacked 48 px pills "Atualizar agora" (primary) and "Agora não" (primary-container); no close icon; Portuguese only; layout of "Visitas - SSPC Studio". Stitch's reply also offered a dark-theme version and a loading state, which are not in T019 and were not used.

#### Review of the new designs (filled by T020, finalised by T021)

Round 1 (2026-11-02), read with `download_file` from the six regenerated mobile screens (ids in the table above). Each row is one deviation: item, expected (`DESIGN.md` token or spec copy), found in Stitch.

| Round | Screen | Theme | Item | Expected | Found |
|-------|--------|-------|------|----------|-------|
| 1 | Dialog | light | Title size | `headline-md` 28px | 26px |
| 1 | Dialog | light | Background behind the dialog | dimmed "Início" (spec) | dimmed "Visitas" list under an "Início" header |
| 1 | Dialog | dark | Card padding | 20px | 24px (`p-6`) |
| 1 | Dialog | dark | Secondary button text | `on-primary-container` `#E4EDDB` | `#F4EDE3` |
| 1 | Início | light | Footer copy | only the name and the message (spec FR-016) | extra line "Só Saio Pra Comer • Teresina, PI" and a decorative emblem with a second line of text |
| 1 | Insecure notice | light | Header chip | none specified (connection chip shows "Conectado") | chip "Offline" with a red dot; the spec copy is not "Offline" |
| 1 | Insecure notice | light | Banner | `body-sm` 14px, radius 20px, padding 16px | inline style: 13px, radius 18px, padding 14px 16px |
| 1 | Insecure notice | dark | Header chip | none specified | chip "Offline" with a red dot |
| 1 | Insecure notice | dark | Card copy | name only (spec: no other text) | extra line "Ambiente de Gestão Gastronômica" |
| 1 | Insecure notice | dark | Card padding | 20px | 24px (`p-6`) |

Checked and matching: 28px radius on the dialog and cards; 48px button heights; primary and secondary button colours in both themes; banner colours and copy; Início tab bar (Início, Visitas, Perfil) and the active tab tint; the connection chip "Conectado" on the home screens; light and dark parity of the Início layout.

Devices: all six are `MOBILE` (the owner regenerated them). The Stitch artboards include an iOS status bar (9:41) and a home indicator; they are device chrome, not design, and are left as they are.

Edits applied in round 1 (owner approved each call):

- **Edit 1, dialog light** (`d3bb60db0d1f424892279f8c237b8c9c`): title set to 28px; background replaced by the dimmed Início screen. The edit added the footer line "✦ Só Saio Pra Comer • Teresina, PI ✦" inside the background card. That is extra copy, the same deviation as Início light in round 1. Not yet fixed; round 2 checks it.

- **Edit 2, dialog dark** (`445d574450b74b5083bb376190890392`): card padding set to 20px; secondary button text set to `#E4EDDB`. Applied (DOM operations confirmed).
- **Edit 3, Início light** (`21e45cf522dc45bfa90fa4600f927def`): footer line 'Só Saio Pra Comer • Teresina, PI' removed (DOM operation confirmed). Icon, title, message, chip and tab bar kept.
- **Edit 4, insecure notice light** (`4e3c5cec9f9f49bea2bf0b8da55dbc58`): 'Offline' chip removed; banner set to 14px, 20px radius, 16px padding (DOM operations confirmed). Banner copy, name-only card and tab bar kept.
- **Edit 5, insecure notice dark** (`c934ee1d3af543688c193df5033956fb`): 'Offline' chip removed; line 'Ambiente de Gestão Gastronômica' removed; card padding set to 20px; banner kept at 14px / 20px radius / 16px padding (DOM operations confirmed).
- The dark Início (`3a0ac619ca354a24b1c522bde7f4ef8a`) had no round-1 deviation, so no edit.

Round 2 check (2026-11-02): the five round-1 edits (1 to 5 above) are NOT in the stored screens. `edit_screens` returned DOM operations for each, but re-downloading the HTML with `download_file` (both the `fileEntries/html` name and the `files/<id>` name, for the light dialog) still shows the original markup: 26px title, dimmed Visitas background, `p-6` padding, "Offline" chips, the footer line and "Ambiente de Gestão Gastronômica". Until the saved file shows the change, the edits are not applied; this is recorded as an open issue, not as a fix. Dark Início was not edited and is unchanged.

Re-check after a 2-minute wait (2026-11-02): the light dialog's saved HTML is unchanged (26px title, Visitas background). The edits have not synced.

**Owner decision (2026-11-02, Augusto Silva):** the six mobile screens are close enough to the design source. The remaining round-1 deviations are accepted (SC-012: "the owner has accepted the remaining deviation by name and date"). They are fixed in the repository, not in Stitch. Where a Stitch screen and `DESIGN.md` disagree, `DESIGN.md` wins (FR-025), so the components are built from the tokens. Disposition:

| Round-1 deviation | Disposition in the code |
|-------------------|-------------------------|
| Dialog title 26px (light) | `SspcDialog` uses `headline-md` 28px (T038, T039) |
| Dialog card padding 24px (dark) | `SspcDialog` padding 20px (T039) |
| Dialog secondary text `#F4EDE3` (dark) | `SspcDialog` secondary label uses `on-primary-container` (T039) |
| Dialog background shows "Visitas" (light and dark) | The dialog overlays the current screen; the background is not a design element (accepted) |
| Início footer line "Só Saio Pra Comer • Teresina, PI" and decorative emblem | Not built; the home card has the name and the provisional message only (T091, T102; OI-7) |
| Notice "Offline" chip (light and dark) | Not built; the app-bar connection chip reports the device connection as A-012 requires |
| Banner 13px / 18px radius / 14px padding (light) | `SspcBanner` `error` tone uses `body-sm` 14px, radius 20, padding 16 (T061) |
| Notice card line "Ambiente de Gestão Gastronômica" (dark) | Not built; the card has the name only |
| Notice card padding 24px (dark) | Card padding 20 (T061) |
| Stitch artboards show an iOS status bar (9:41) and home indicator | Device chrome, not part of the design; not built |

Rounds: 1 (review done; the owner accepted the remaining deviations and they move to the code, see above).

**Correction (2026-11-02, T022 re-check):** the earlier statement that the five Stitch edits did not persist was wrong. Re-listing the project shows new HTML file ids for five of the six screens (all except the dark Início), so the edits were saved after the earlier reads. The light dialog now has the 28px title and an Início-style dimmed background, but that background card carries new copy ("Avaliações culinárias sincronizadas e prontas para edição") and has no tab bar. The owner (Augusto Silva) accepted this new copy on 2026-11-02; it is part of the accepted design. It appears only in the dimmed background, which is not a design element for the dialog. Closed on 2026-11-02 after 1 review round. Round 2 is blocked until the edits show in the saved screens. Round 2: re-read all six screens and check the fixes; the light dialog's background still has the footer line from edit 1, so round 2 will raise it. Next: remaining edits (one approved call per screen), then round 2 reads all six screens again.

### R-15 Catalogue excluded from production (Verified)

A global constant `SSPC_CATALOG` (`true` in `angular.json` options, `false` in the production configuration) guards the route object `{ path: '_ds', loadChildren: () => import(...) }`, which `app.routes.ts` passes to the exported `buildRoutes(catalogRoute)` as `SSPC_CATALOG ? { … } : undefined`, so the dynamic import sits in a branch the bundler removes when the constant is false and the table assembly stays testable (the constant is a literal in unit tests too, R-05). Verified experiment (first with `routes.push`, again on 2026-11-01 on a throwaway copy of the scaffold with the `buildRoutes` form): with `false` the lazy chunk is **not emitted** (the marker `sspc-catalog`, the catalogue page's selector, is absent from `dist`), with `true` (development) a lazy chunk containing it is. The marker is ASCII because esbuild escapes non-ASCII characters in strings. The quickstart and CI grep the production `dist` for it to prove FR-024. The Dockerfile exposes the constant as the build argument `SSPC_CATALOG` (default `false`) so the iPhone update test can use a **test build** that keeps the catalogue's input (A-004); release builds never pass it and the image smoke test asserts the default image has none.

### R-16 CSP and the build output

- The input's CSP has no `script-src`, so `default-src 'self'` applies: inline scripts and inline event handlers are blocked. Angular's critical-CSS inlining can emit `<link … media="print" onload="this.media='all'">`.
- **Verified** with the scaffold (empty stylesheet): `index.html` has no `onload` and no inline script. **Verified again on 2026-11-01** on a throwaway copy of the scaffold with a stylesheet and a CSS-referenced font: still no `onload`, no inline script and no absolute URL in `index.html`, the CSS or `ngsw.json`; the check stays in the image smoke test and the `build` job for the real styles. **Decision**: set `optimization.styles.inlineCritical: false` in the production configuration (costs one render-blocking stylesheet from cache, offline anyway) and add a smoke check to the image job: no `onload=` and no inline `<script>` in `index.html`.
- `style-src 'self' 'unsafe-inline'` is kept as given (Angular component styles are injected as `<style>`).
- `img-src 'self'` (SEC-001; data, blob and remote images are not allowed), `connect-src 'self'`, `worker-src 'self'`, `manifest-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`. The edge in the stack adds no CSP of its own (checked in `deploy/Caddyfile.local`), so this one is the only policy.

### R-17 Caddyfile rules (app)

As the input, plus: hashed assets regex extended to fonts and media: `-[A-Z0-9]{8}\.(js|css|woff2)$` (Angular hashes CSS-referenced fonts under `media/`; **verified on 2026-11-01**: a CSS-referenced `src/assets/fonts/probe-latin.woff2` is emitted as `media/probe-latin-PSM2MS7Y.woff2`, which matches the regex); `Cache-Control: no-cache` on every response except an existing hashed file (the HTML at `/`, `/sobre` and `/_ds` included); the SPA fallback applies only to a path with no extension and no file, and an absent file with an extension answers `404`; `Content-Type` and `Service-Worker-Allowed` untouched; plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` minimal (no camera/mic/geolocation). No HSTS here: TLS ends at the edge, which currently disables automatic redirects (`auto_https disable_redirects` in the sibling's `Caddyfile.local`) and publishes plain HTTP only on the host's loopback; redirects and HSTS belong to the future hosting feature (SEC-001). No access log and a filtered error log (R-27). Validation in CI: `caddy adapt` of both Caddyfiles runs in the `policy` checks of the `security` job (`caddyfile.mjs`) with the pinned image; the `image` job's smoke assertions then exercise the running containers.

**Prototype (Verified on 2026-11-01)**: the first draft of these rules (`header @nocache` for five paths, `header @hashed` by regex, `try_files {path} /index.html`) was run on the pinned image under the stack's restrictions and had two defects. `/`, `/sobre` and `/_ds` carried no `Cache-Control`, because `header` matchers run before the fallback and see the original path. An absent hashed-looking file such as `/missing-ABCD1234.js` was answered as `200 text/html` with `Cache-Control: ... immutable`, a year of caching for the fallback page, which a request that misses during a rolling deploy would leave in the browser cache. Layered `header` directives also cannot be relied on (a later catch-all overrode an earlier specific one). The structure in contract §App routes (`handle @hashed` with `path_regexp` and `file`, then a default `handle` with `no-cache`, the extensionless fallback and `file_server`) gives: `no-cache` on `/`, `/sobre`, `/_ds`, `/index.html`, `ngsw.json`, `ngsw-worker.js`, `safety-worker.js` and `manifest.webmanifest`; `immutable` on the existing hashed `.js`, `.css` and `.woff2`; `404` with `no-cache` on an absent hashed name and on an absent `/icons/*.png`; zero error lines and no line that mentions a request; the security headers on every response. Site: `Cache-Control: no-cache` on every response gives `no-cache` on `/`, `/links/`, the stylesheet and the 404 page, which also carries the security headers from the `handle_errors` route; `redir /links /links/` answers `302`.

### R-18 CI (`.github/workflows/ci.yml`)

Mirrors `sspc-api/specs/002-dev-flow-lan-pwa/contracts/ci-workflow.md`, which is the reference the input points to.

- **Deviation from the input: no `paths-ignore`.** The input says to copy the sibling's "paths-ignore", but the sibling has none and its contract and policy script **prohibit** it ("no `paths-ignore` or other automatic required-gate skip paths": a skipped required check blocks merging, or is mistaken for success). The spec requires every pull request to show every result (FR-026, SC-008). So the web workflow has no path filters.
- Triggers: `pull_request` (bases `develop`, `main`; types `opened`, `synchronize`, `reopened`, `edited`), `push` (branches `develop`, `main`), `workflow_dispatch`. Top-level `permissions: contents: read`, no secrets, concurrency group `${{ github.workflow }}-${{ github.event_name }}-${{ github.event.pull_request.number || github.run_id }}` with `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`. Every `checkout` has `persist-credentials: false`; refs reach scripts through `env:`.
- Jobs: `lint` (ESLint with boundary rules, stylelint, `design:lint`), `test` (`ng test --no-watch`, jsdom, no browser; plus the tool tests of R-31 and the lint-rule proofs of R-13 in Vitest's node environment), `build` (`npm run build`, `tokens:check`, production budgets, grep for the catalogue chunk, `onload=` and source maps), `security` (full-tree `npm audit` through the exceptions-aware wrapper of R-30, gitleaks 8.30.1, tracked-secret path guard, workflow/Dockerfile/agent-settings/Caddyfile/image-metadata/validation-record/exceptions policy checks of R-31), `image` (buildx the two production images and the test-only counter image, smoke tests, Trivy), `branch-guard` (`if: github.event_name == 'pull_request'`, pattern `^(release|hotfix)/(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$` for base `main`, otherwise "not applicable"; the same names-only caveat as the sibling).
- **Security job details**: gitleaks installed from the release tarball with the sibling's pinned SHA-256 (`551f6fc8…2470eb`, linux x64 8.30.1) and `gitleaks git --redact` over full history (`fetch-depth: 0`); the sibling's `scripts/check-tracked-secrets.sh` is adapted (it rejects tracked `*.enc.yaml`, key/cert files, `.env*`, `secrets/`; its rules for the sibling's own tree are dropped and a `.gitignore` check is added); `.gitignore` gains `.env*`, `*.enc.yaml`, `secrets/`, `*.key`.
- **Image job**: `docker/build-push-action` with `push: false`, `load: true` for `sspc-web:ci` (context `.`) and `sspc-site:ci` (context `site`), `APP_VERSION` and `APP_BUILD` build args; smoke tests run each image under the stack's restrictions (user 65532, read-only, tmpfs `/tmp`, `cap_drop ALL`, `no-new-privileges`) and assert: `200` on `/`, SPA fallback on `/sobre`, the cache and CSP headers, `ngsw.json` present with `no-cache`, no `onload=`, zero `error`-level log lines; the site smoke runs the content check of Story 8 (Vitest in the node environment, table-driven, `fetch` only, no new dependency; R-31). Trivy v0.75.0: report MEDIUM and lower with exit 0, then fail on `HIGH,CRITICAL` **whether or not a fix exists** (no `ignore-unfixed`), honouring only the unexpired entries of the exceptions record (R-30).
- **Action pins** (full commit SHAs; reused from the sibling and resolved with `gh api` today):

  | Action | Tag | SHA |
  |--------|-----|-----|
  | `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
  | `actions/setup-node` | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
  | `docker/setup-buildx-action` | v4.4.1 | `f87e5991a6d7451dcb8d9637bfbc97413f497069` |
  | `docker/build-push-action` | v7.4.0 | `c3c9e263c25d99ce0380d002d59b67737d91b0dc` |
  | `aquasecurity/trivy-action` | v0.36.0 | `ed142fd0673e97e23eac54620cfb913e5ce36c25` |

  All five SHAs were re-checked against the upstream tags on 2026-11-01 (`git ls-remote` of each tag, annotated tags dereferenced), the gitleaks SHA-256 against the release checksum file, and the Trivy tag `v0.75.0` exists.

  Base images are pinned by digest (SEC-005 makes this a requirement; digests in R-29) and a policy check fails any `FROM` without `@sha256:`; Dependabot (`docker` ecosystem) proposes the updates as reviewed pull requests.
- **Host limits** (sibling decision D-003): branch protection is unavailable on this plan, so the checks are advisory; the PR template carries the owner's "before merging" checklist.

### R-19 Dependabot

`.github/dependabot.yml`: `npm` (directory `/`; groups: `angular` for `@angular/*` and `all` for the rest; a `tiptap` group joins when TipTap becomes a dependency), `docker` for `/`, `/site` and `/tools/offline-proof`, `github-actions` for `/`; weekly; `target-branch: develop` on every entry.

### R-20 Pull request template

`pr-templates/sspc-web` was not found. `.github/pull_request_template.md` adapts the sibling's: title in Conventional Commits; "What and why"; "Spec Kit" (feature folder, `/speckit-converge` result); "Acceptance scenarios" with ticks; "How to test"; checklist sections **Architecture** (no `ui` import of app code, no feature-to-feature import, `ui` components with README/harness/axe test/catalogue entry), **Tests** (`it.each` with `{ name, input, output }`, given/when/then names and sections, harnesses only), **Design** (Stitch screens listed light and dark, `DESIGN.md` and tokens in sync, copy in Portuguese), **Offline and iPhone** (verified on the installed app, record attached, airplane-mode and stack-stopped launches), **Security** (no secrets; CSP unchanged or justified), **Delivery** (CI green: lint, test, build, security, image, `branch-guard`; commits signed); "Before merging" (D-003 self-check); "Deploy notes"; "Related" (matching `sspc-api` PR).

### R-21 Stitch MCP access and the agent settings

- `.mcp.json` at the repository root: `{"mcpServers":{"stitch":{"type":"http","url":"https://stitch.googleapis.com/mcp","headers":{"X-Goog-Api-Key":"${STITCH_API_KEY}"}}}}` (URL and header name copied from the user-level configuration on this machine; the key is never written to the file). A project-scoped server named `stitch` takes precedence over a user-level server of the same name (scope order local, project, user; confirm with `claude mcp list` after T012), so `STITCH_API_KEY` must be exported first (OI-8) or the Stitch tools stop working in this project.
- `.claude/settings.json` (committed): `permissions.allow` the six read tools (`mcp__stitch__get_project`, `get_screen`, `list_projects`, `list_screens`, `list_design_systems`, `download_file`); `permissions.ask` `generate_screen_from_text`, `edit_screens` and `apply_design_system`, so Claude Code asks the owner before each call (Principle VI v2.1.0: the agent may write to Stitch only after asking, and the owner approves every write); `permissions.deny` the other seven write tools (`create_project`, `delete_project`, `generate_variants`, `create_design_system`, `create_design_system_from_design_md`, `update_design_system`, `upload_design_md`). The `ask` and `deny` lists are additions to the input; they enforce Principle VI mechanically (R-33).
- **`.gitignore` currently ignores `.claude` entirely**, which would drop `settings.json`. Change the "Speckit Github" entries to `.agents` and `.claude/*` with `!.claude/settings.json`.

### R-22 Dev proxy

`proxy.conf.json`: `{"/api": {"target": "http://localhost:8080", "secure": false, "changeOrigin": false}}`, wired in `angular.json` `serve.options.proxyConfig`. The API's `make run` binds `127.0.0.1:8080` (sibling README); nothing in this feature calls `/api`.

### R-23 Static site

Plain static files in `site/` (no build step, no dependency): `index.html`, `links/index.html`, `assets/` (CSS from the site tokens, self-hosted font, owner-supplied photo and icons as inline SVG), `Caddyfile` (same hardening as the app, `try_files {path} {path}/index.html`, no SPA fallback, `404` otherwise, site-specific stricter CSP, no access log) and `Dockerfile` (`caddy:2.11.7@sha256:…`, `setcap -r`, `USER 65532`, `/srv`, same `VOLUME`s). `DESIGN.md` `link-button` fixes the links style (full-width pills, leading generic icon). Light only (Stitch has no dark site design). The content check is a Vitest file (node environment, `fetch` only) run against the running image.

SEC-005 and SEC-009 add three rules. (1) **Explicit allowlist**: the Dockerfile copies named paths only (`index.html`, `links/`, `assets/`, never `COPY . .`), and `site/.dockerignore` excludes everything else (`*`, then `!index.html`, `!links/`, `!assets/`); `Dockerfile`, `Caddyfile`, `tests/` and any source therefore cannot reach `/srv`. (2) **Outside links**: each of the two web links carries `target="_blank"` and `rel="noopener noreferrer"`; the email link is a `mailto:` anchor; the content check asserts all three. (3) **Image metadata**: `site/assets/img/*` and `public/images/*` pass the metadata check of R-31 (no EXIF, XMP, text or GPS chunks) before they are committed.

### R-24 Tests

Vitest 5.0.5 through `@angular/build:unit-test` (jsdom) with `TestbedHarnessEnvironment`; `src/testing/` holds `expectNoA11yViolations(fixture)` (axe-core 4.13.0, run on each component in each variant), a `FakeSwUpdate`, a fake `navigator.storage`, and a `FakeConnectivity`. jsdom 30 (verified) implements none of `isSecureContext` (even on an https URL), `navigator.storage` and `navigator.serviceWorker`, so those are `undefined` in unit tests and the fakes provide them; `navigator.onLine` is `true`. Time uses `vi.useFakeTimers` (the 30 s check throttle). Test names follow the constitution's `given … when … then …`. No Playwright now. Scripts, the counter proxy and the site content check are tested in Vitest's node environment (R-31).

### R-25 Budget (Verified baseline)

`angular.json` currently has 500 kB/1 MB; change to **400 kB warning, 600 kB error** (Principle IX). Baseline of the bare scaffold: **222.37 kB raw** initial JS, 61 kB estimated transfer (`ng build`, 2026-11-01). Router, CDK dialog, seven components and icons must fit in the remaining ~175 kB before the warning: lazy routes, `@defer` for the dialog, one-by-one icon imports.

### R-26 Security and privacy requirements (SEC-001 to SEC-012) mapped to the design

Added to the spec after the security review. This table is the trace from each requirement to the artefact that carries it; the sections named hold the reasoning.

| Requirement | Design | Where |
|-------------|--------|-------|
| SEC-001 headers, HTTPS-only service worker, insecure-connection message | Headers and CSP per image (site stricter); `SecureContext` guard registers the worker and shows the notice only per `window.isSecureContext`; no in-app install control | [http-serving.md](contracts/http-serving.md), [pwa-and-update.md](contracts/pwa-and-update.md), R-32, gap G10 |
| SEC-002 no third-party requests, cache only public assets | CSP `connect-src 'self'`, no remote font/image; no `dataGroups`; build assertions on absolute URLs and on `ngsw.json` | R-32, [http-serving.md](contracts/http-serving.md) smoke 9–10 |
| SEC-003 update origin, integrity, recovery | Angular worker verifies hashes against `ngsw.json` from its own origin; a rollback is an ordinary update; reinstall path in the quickstart | R-01, R-32, quickstart D4 step 11 |
| SEC-004 no source maps, no secret build args, catalogue test build never published | `sourceMap: false`, `*.map` assertion, Dockerfile `ARG` allowlist, release-feature handoff | R-31, [http-serving.md](contracts/http-serving.md) |
| SEC-005 image contents, digest pins | Explicit `COPY` allowlists, tree assertion, digests in R-29, pin check | R-23, R-29, R-31 |
| SEC-006 scan severity, exceptions | No `ignore-unfixed`, full-tree `npm audit`, one exceptions record with 30-day expiry | R-18, R-30 |
| SEC-007 CI trust | Workflow policy check (SHA pins, read-only token, no persisted credentials, no secrets, no `pull_request_target`, verified downloads) | R-18, R-31 |
| SEC-008 no access logs, local counter | No `log` directive, error-log filter; counter proxy and Compose override | R-27, R-28 |
| SEC-009 image metadata, link rules, owner confirmations | Metadata check; `rel`/`target` assertions; owner items in plan and PR template | R-23, R-31, R-20 |
| SEC-010 LAN test hygiene | Quickstart cleanup rows; validation-record check rejecting addresses, hostnames, fingerprints and log lines | R-31, quickstart D5 |
| SEC-011 public reachability, LGPD | Documentation only: owner review before launch | plan "Decisions needing the owner" |
| SEC-012 storage prompt | Flag recorded **before** `persist()` so dismissal counts; usable when refused | R-32, [data-model.md](data-model.md) |

### R-27 Logging (Verified by experiment, Docker 29.9.2, `caddy:2.11.7`)

Run exactly like the stack runs `web` (user 65532, read-only root, `cap_drop ALL`, `no-new-privileges`), one Caddyfile with no `log` directive and one with a global `log { format filter { wrap json; fields { request delete } } }`, then requests with a cookie, an authorization header, a query string and a malformed path.

| Observation | Result |
|-------------|--------|
| Access log with no `log` directive | **None**: requests for `/`, a 404, a 403 (unreadable file) and a 400 (bad escape) wrote no line |
| Error log on a handled 5xx (forced with an `error /boom 500` route) without the filter | One line with the client address, port, host, **full URI including the query string**, and request headers such as `User-Agent` (`Cookie` and `Authorization` are redacted by Caddy) |
| Same request with the filter | One line with only `status`, `duration` and `err_id`: the whole `request` object is gone |

**Decision**: no `log` directive for access, and the global filtered default log in both Caddyfiles, so SEC-008 ("no access log", and `Operational error logs MUST NOT include request details`) holds even for a 5xx. The check is structural (`caddy adapt` output must carry the delete filter) because a 5xx cannot be forced on the production routes; the experiment is the evidence that the filter works. The adapted JSON (checked on 2026-11-01 for the prototype Caddyfiles of R-17) has `logging.logs.default.encoder` = `{ "format": "filter", "wrap": { "format": "json" }, "fields": { "request": { "filter": "delete" } } }` and no `logs` key under `apps.http.servers.<name>` (an access log would add one), which is what `caddyfile.mjs` asserts.

### R-28 Local request counter (Verified prototype)

SEC-008 requires an opt-in counter between the local edge and the app, kept in memory, read only by a command inside its container. A throwaway prototype (Node 24, standard library only) was run against a stub upstream:

| Check | Result |
|-------|--------|
| Three requests (a GET with a query string, a HEAD, a conditional GET answered `304` with a cookie) | count read back as exactly `3`; the `304` and the HEAD pass through unchanged |
| Output of the proxy process | empty (no stdout, no stderr, no file) |
| Control channel | a Unix socket (mode `600`), not a network listener; a one-line client prints the integer |
| Lifecycle | the counter lives only in the process; the socket is removed on exit (the prototype forgot this; the contract requires it) |

**Decision** (contract in [http-serving.md](contracts/http-serving.md), "Local-only request counter"): `tools/offline-proof/` holds `counter-proxy.mjs`, `count.mjs`, a `Dockerfile` (`node:24.22.2-alpine` pinned by digest, npm removed to keep the scan surface small, user 65532) and `compose.override.yaml`. The override renames nothing in the sibling repository: it makes the existing `web` service build the proxy and adds `web-app` (the real app, `SSPC_CATALOG=true` for the update test) behind it, so the edge's `web:8080` upstream reaches the counter first. A Compose override is the only way to do this without editing `sspc-api` (spec A-007). Alternatives rejected: counting in the edge (a change to the sibling and its logging), Caddy metrics (needs the admin API, which is HTTP and off), counting log lines (SEC-008 forbids logs).

Sibling facts checked on 2026-11-01 at revision `f7ee750`, the revision the quickstart pins. `deploy/compose.local.yaml` defines `web` with `profiles: [web]`, `build.context: ../../sspc-web`, `user: 65532:65532`, `read_only`, `tmpfs /tmp`, `cap_drop ALL`, `no-new-privileges` and no published ports, so the override's merge by service name and its relative context hold. The edge (`deploy/Caddyfile.local`) proxies everything outside `/api/*` to `web:8080` over HTTP/1.1 and sets no response header, so the app's CSP is the only policy. The Makefile targets are `stack` (it runs `docker compose … up -d --build --wait` and honours `COMPOSE_PROFILES`) and `stack-down` (a plain `docker compose … down`); `LAN_ENABLE=1` is per start and never persisted (runbook). With Docker Compose 5.6.1 a plain `down` does not stop profile-gated services (`web` and `web-app` stay up and the network is reported in use), so the quickstart stops the stack with `$COMPOSE down`, which carries the profile and the override. The files that T105, T113 and T115 port (`scripts/check-workflow.sh`, `scripts/check-tracked-secrets.sh`, `.gitleaks.toml`), the PR template and the CI contract all exist at that revision. The override design was checked with `docker compose config` against that revision on 2026-11-01: `web` and `web-app` merge as described (profile `web`, the five restrictions, no published ports, build contexts that resolve to this repository, `web-app` named from `APP_TAG`); `web` gets an explicit image name because the default `deploy-web` is the one `make stack` gives the base `web`.

### R-29 Base image pins (Verified with `docker buildx imagetools inspect`, 2026-11-01)

| Use | Reference |
|-----|-----------|
| App builder stage | `node:24.22.2@sha256:e7add2a490bb17d97b485b8641bd88455fff7839ade0f5eba493c3508124d413` |
| Final stage of both images | `caddy:2.11.7@sha256:36c24ad91a7ff7bc4c87fe22bfa8df3c4b18da0773d73fc12ee2c52b98c0bb7e` (index digest) |
| Counter proxy | `node:24.22.2-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85` |

The sibling's compose pins `caddy:2.11.7@sha256:504a44d7…` (reviewed 2026-10-25), also an index digest; the tag has been republished since, so the two repositories pin different builds of the same tag. Both are valid; Dependabot's `docker` ecosystem proposes the move, and the implementer re-resolves the digests when writing the Dockerfiles. The plan input said `node:24` and `caddy:2.11`; the exact patch tags are the tag part of the pin. The digests were re-resolved on 2026-11-01: `docker pull caddy:2.11.7@sha256:36c24ad9…` succeeds, and the local `node:24` and `node:24-alpine` images carry the digests `e7add2a4…` and `8a32c8cf…`.

### R-30 Scan exceptions record (SEC-006)

One version-controlled file, `security/exceptions.yaml`, ships empty (`exceptions: []`). Each entry: `id` (CVE or GHSA), `scope` (`image` or `npm`), optional `target` (image or package name), `rationale`, `compensating_controls`, `approver`, `approved` (date), `expires` (date). Rules, enforced by `scripts/policy/exceptions.mjs`: every field present and non-empty; `expires` is at most 30 days after `approved`; an entry whose `expires` is in the past fails the gate (it is not silently dropped); duplicates fail.

- **Images**: the script writes a Trivy ignore file from the unexpired `image` entries (`id`, `statement` = rationale, `expired_at` = `expires`) and the workflow passes it to Trivy, so Trivy itself also stops honouring an expired entry. This mirrors the sibling's `.trivyignore.yaml` / `check-trivyignore.sh`, with the extra fields SEC-006 asks for, which Trivy's format lacks.
- **npm**: `npm audit` has no exception mechanism, so `scripts/policy/npm-audit.mjs` runs `npm audit --json` over the **whole** dependency tree (development dependencies included, because they run during the image build), collects every high or critical advisory, and fails on any not covered by an unexpired `npm` entry.
- Gitleaks uses the sibling's `[extend] useDefault = true` and drops the sibling's allowlist, which covers `SENTINEL-…` test placeholders that only the sibling has; so there are no exceptions and no exceptions checker, and SEC-006 does not extend to it.
- **Verified on the scaffold today** (`npm audit --json`, 2026-11-01): five high-severity packages, all development-time and transitive (`@angular/cli` through `@modelcontextprotocol/server`, `undici` through `jsdom`, `vite`, `zod`), so the gate would be red on the first run. Every one reports `fixAvailable: true`, and `npm audit fix --dry-run` plans only patch-level bumps (`vite` 8.3.2 to 8.3.5, `undici` 8.11.2 to 8.12.3, `zod` 4.6.5 to 4.6.6, `rolldown`, `postcss`, among others). The first implementation task therefore refreshes the dependency tree before any code is written; the dry run proved too optimistic, see the outcome below. An exception is for a finding with no fix and lasts at most 30 days.

- **Outcome at implementation (T001 and T002, 2026-11-01)**: `npm audit fix` and `npm update` left one high advisory, because `vite` is pinned exactly (8.3.0) inside `@angular/build` 22.2.1 and the Angular packages pin each other's exact peers (22.2.1 `forms` needs 22.2.1 `common`), so no partial upgrade resolves (ERESOLVE). The fix was to raise every Angular range together (`@angular/*` `^22.2.4`; `@angular/build` and `@angular/cli` `^22.2.5`, because the latest `@angular/core` is 22.2.4 and the latest build and cli are 22.2.5) and regenerate the lockfile (`rm -rf node_modules package-lock.json && npm install`): `npm audit` then reported 0 vulnerabilities. T001 therefore changes the ranges in `package.json`, not only the lockfile. T002 then added one high advisory, `zod` 3.25.76 (no 3.x fix) through `@google/design.md` 0.4.0, removed by the `package.json` entry `overrides: { "@google/design.md": { "zod": "^4.6.6" } }` after checking that the design linter gives the same result with zod 4 (exit 0, 0 errors, 17 warnings, 1 info); the failure path was checked too: a copy of the file with one `{colors.…}` reference made unresolvable exits 1 with `errors: 1` (rule `broken-ref`), and T023 keeps that case as a test. Drop the override when `@google/design.md` releases a version that depends on zod 4.6.6 or later. If it ever breaks the linter, the fallback is an `npm` entry in `security/exceptions.yaml` approved by the owner. After T002 only moderate and low advisories remain (the eslint and minimatch chain, which has no fix, and style-dictionary's dependencies); `npm audit --audit-level=high` exits 0 and `npm ci` completes with no peer-dependency error.

### R-31 Policy checks and tool tests

The requirements above are only measurable if the repository checks them. Each check is a small Node script under `scripts/policy/` (standard library plus the existing `yaml` dev dependency), exports a function and has a command-line entry, and is tested with fixtures. Tests for scripts, the counter proxy and the site content check use Vitest in its node environment through `vitest.tools.config.ts`, so Principle VII (`it.each` over `{ name, input, output }`, given/when/then) applies to them as to the app; the Angular unit-test builder keeps running the jsdom suite.

| Check | Fails when |
|-------|-----------|
| `workflow` (the sibling's `check-workflow.sh` rules, parsed with the `yaml` package instead of awk, plus a download-checksum rule of ours) | the workflow references `secrets.`; has a trigger other than `pull_request`, `push` and `workflow_dispatch`, branches other than exactly `[develop, main]`, `pull_request` types other than exactly `opened, synchronize, reopened, edited`, or a `paths`, `paths-ignore`, `tags` or `tags-ignore` filter; has an action not pinned to a 40-hex commit; lacks top-level `permissions: contents: read` exactly, or has job-level `permissions`; has another concurrency block than R-18's; repeats a job name; has a job-level `if` or `continue-on-error` other than `branch-guard`'s; lacks one of the six required jobs; has a checkout without `persist-credentials: false`; interpolates event data inside `run`; has a `docker run` or `image:` without a digest; or downloads a tool without a `sha256sum --check` in the same step |
| `dockerfiles` | a `FROM` has no `@sha256:` digest; an `ARG` is not `APP_VERSION`, `APP_BUILD` or `SSPC_CATALOG`; the site Dockerfile copies `.` or `*`; a runtime stage lacks `USER 65532:65532`; a Caddy stage lacks `setcap -r` |
| `agent-settings` | `.mcp.json` key header is not exactly `${STITCH_API_KEY}`; `.claude/settings.json` is not exactly the state of R-21 (six read tools allowed, three write tools on `ask`, seven denied), or any other `mcp__stitch__` rule is present |
| `caddyfile` | the adapted JSON of either Caddyfile has an access log, lacks the `request delete` filter, or lacks any header of the contract |
| `image-metadata` | a committed `.jpg`, `.jpeg`, `.png` or `.webp` under `site/assets/img/` or `public/images/` carries EXIF, XMP, textual or GPS metadata (a chunk and marker scan, no dependency) |
| `validation-record` | `specs/001-installable-pwa-shell/validation.md` contains an IPv4 or IPv6 address, a `.local`, `.lan` or `.home` hostname, a colon-separated or 64-hex fingerprint, a JSON log line, or lacks the cleanup row |
| `exceptions`, `npm-audit` | see R-30 |

### R-32 Browser behaviour for SEC-001, SEC-002, SEC-003 and SEC-012

- **Secure context (SEC-001)**: the guard is `window.isSecureContext`, which is true for HTTPS and for `localhost`, so "browser-trusted loopback" needs no special case. When false: no service worker is registered, `AppUpdate` stays `idle`, the banner slot shows the required message (tone `error`, no action), and the app has no install control of its own (the browser's own affordances follow the secure-context rule). `navigator.storage` is also absent there, so About shows `unsupported`/"Não protegido". The sibling's edge publishes plain HTTP only on the host's loopback (`127.0.0.1:8080`), so the message cannot be reached from the iPhone through the stack; it is verified on the computer (quickstart B) and by unit test.
- **No third-party requests (SEC-002)**: besides the CSP, the build job asserts that `index.html`, every `*.css`, `manifest.webmanifest` and `ngsw.json` contain no absolute `http(s)://` URL, and that `ngsw-config.json` has no `dataGroups` key. The service worker therefore caches only the hashed public files listed in `ngsw.json`.
- **Update source and recovery (SEC-003)**: the Angular worker fetches `ngsw.json` from its own origin and verifies every file against the hashes in it; nothing in this feature changes that. A rollback is just a different `ngsw.json`, so the worker offers it as an update; quickstart D4 step 11 rehearses it. The manual reinstall path (remove the Home Screen app and site data) is the last resort and is already in the spec.
- **Storage prompt (SEC-012)**: `localStorage` flag `sspc.storage.requested` is written **before** `navigator.storage.persist()` is called, so a dismissed browser prompt counts as the one request; refusal, dismissal and a missing API all leave the app fully usable with the "Não protegido" row.

### R-33 Design phase for the missing Stitch screens (G1, G2, G10)

**Decision**: Phase 2 of `tasks.md` creates the three missing screens (confirmation dialog, placeholder home "Início", insecure-connection notice), each in light and dark, in the existing Stitch project through the Stitch MCP, and iterates until they match `DESIGN.md`. It runs before any component or page is built from them.

**Constitution**: Principle VI v2.1.0 (amended on 2026-11-01 for this purpose, task T017) lets the agent generate or edit Stitch screens when the owner says so, when a screen is too far from `DESIGN.md` to be fixed locally in code, or when a screen is missing, always after asking the owner, who approves every write. Its writes are limited to screens it created and existing screens the owner names or approves; it never deletes projects or screens and never creates or changes design systems without explicit approval. This phase is the "screen is missing" case and is narrower than the rule: new screens only.

**Permission model**: one state, written by T013 and kept by the `agent-settings` check: allow the six read tools; `ask` for `generate_screen_from_text`, `edit_screens` and `apply_design_system` (Claude Code prompts the owner before each call; this is a second gate, because the principle requires the agent to ask first, in the conversation, naming the screen and quoting the prompt, and to wait for a clear yes, and a permission prompt may not appear in every permission mode); deny the other seven (`create_project`, `delete_project`, `generate_variants`, `create_design_system`, `create_design_system_from_design_md`, `update_design_system`, `upload_design_md`). `generate_variants` stays denied because each prompt should yield one screen to review; the owner can move it to `ask` by editing the file and the check. The same state serves the other two cases of the principle (the owner asks for a change, or a screen is too far from the design to fix in code): the agent asks, the owner approves the call.

**Tools** (parameters read from the tool schemas on 2026-11-01): `generate_screen_from_text(projectId, prompt, designSystem?, deviceType, modelId?)` can take minutes and must not be retried on a timeout (poll `get_screen` every 30 s, at most 10 times); `edit_screens(projectId, selectedScreenIds, prompt)`; `apply_design_system(projectId, assetId, selectedScreenInstances[{ id, sourceScreen }])`, where instance ids come from `get_project`. `deviceType` is `MOBILE`.

**Light and dark**: the project keeps the two themes as separate screens and separate design systems (the existing boards are "… (Dark Theme)"), so each screen is generated twice, once with each design system; the review checks that layout and copy are identical and only the theme tokens differ.

**Loop**: each round reads every new screen (`get_screen`, `download_file`), compares it with `DESIGN.md` and the existing components (color roles, type scale, spacing, radius, elevation, 48 px targets, 4.5:1 contrast, icons, exact copy, light/dark parity), tabulates the deviations in R-14, and corrects them with `edit_screens` or `apply_design_system` on the new screens only. It ends on a round with no deviation; the limit is 5 rounds per screen, after which the owner accepts the deviation (name and date in R-14) or corrects it in Stitch. `DESIGN.md` wins on any disagreement.

**Scope check**: T018 records the ids of all existing screens and design systems; T022 reads them again and only the six new screens may differ.

**Alternatives rejected**: build the three from tokens and flag them (breaks Principle VI and leaves no design to review); keep the agent read-only and have the owner draw (slower, no read-back loop; still possible if the owner prefers); allow writes without `ask` (the principle needs the owner's approval of every write); allow `generate_variants` (multiplies the screens to review); a time-boxed permission window (more steps, and the approval is needed on every write, not only in this phase).

**Risks**: generation is slow and its output varies, so the 5-round limit and the owner's accept-or-fix decision bound the work; generated HTML and CSS are read for measurements and copy only, never copied (Principle VI).

## 3. Behaviour summary of the amended spec

Backgrounding and returning never changes the version; the notice stays until the user taps "Atualizar" or fully restarts the app (restart opens the newest version). Tapping "Atualizar" with unsaved text opens the dialog. Online/offline is the device's report. About shows version, build reference, connection and storage protection. On a non-secure origin the app shows the insecure-connection message, registers no service worker and offers no installation (SEC-001). Neither image writes an access log; the offline evidence is a count read from a local test-only proxy (SEC-008).

## 4. Open items for the owner

1. Confirm `C:\Users\augus\Downloads\DESIGN.md` is the intended `sspc-design/DESIGN.md`, and supply the missing inputs (R: section 1) if they exist elsewhere.
2. The dialog (G1), the placeholder home (G2) and the insecure-connection notice (G10) are created by the agent in Stitch in the design phase (Phase 2, R-33), with you approving each Stitch write call, then reviewed in a loop until they match `DESIGN.md` (T019 to T021). Principle VI was amended for this (constitution v2.1.0, T017): commit it first. Rename the Stitch screens to the numbered convention if you want them to match the spec's names.
3. Provide the About and links photos as self-hosted files (G7) and the three link destinations.
4. Accept or reject: `@lucide/angular` instead of `lucide-angular` (R-07); seven `ui` components instead of two (R-12); no `paths-ignore` (R-18); `.claude/settings.json` `ask` and `deny` lists for Stitch writes (R-21, R-33) and the `.gitignore` change; `APP_BUILD` (R-05); the amended notice rule (R-01).
5. Owner decisions already implied by the input and applied: relaunch semantics, storage row.
6. The insecure-connection notice is part of item 2; its copy is fixed verbatim by the spec.
7. Before public launch (SEC-009, SEC-011): confirm permission to publish each name and photo, accept that the partnerships email is exposed to scrapers, and review LGPD applicability with qualified advice if unsure. The plan cannot do these.
8. Supply `security/exceptions.yaml` entries only when a real finding needs one; the file ships empty. Each entry needs your name as approver and a date at most 30 days ahead.
9. The counter proxy needs the sibling's compose file and its `.env.local` at the paths used in the quickstart; that repository is still changing, so the commands are marked **(check)**.
