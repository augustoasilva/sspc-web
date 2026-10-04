<!--
Sync Impact Report
==================
Version change: (unratified template) → 1.0.0
Bump rationale: initial ratification; every placeholder replaced with project-specific content.

Principles (template slot → new title):
- [PRINCIPLE_1_NAME] → I. Offline-First
- [PRINCIPLE_2_NAME] → II. iOS Safari Is the Primary Target
- [PRINCIPLE_3_NAME] → III. Modern Angular
- [PRINCIPLE_4_NAME] → IV. Structure and Boundaries
- [PRINCIPLE_5_NAME] → V. Design System Built with the Screens
- Added: VI. Test Discipline with Flutter Parity
- Added: VII. Dependencies
- Added: VIII. Quality Gates
- Added: IX. API Contract
- Added: X. User Experience
- Added: XI. Language and Naming

Sections:
- [SECTION_2_NAME] → Product Context and Platform Constraints
- [SECTION_3_NAME] → Development Workflow and Definition of Done
- Governance: filled

Removed sections: none

Dependent artifacts (read the constitution at runtime; not modified by this command):
- .specify/templates/plan-template.md — "Constitution Check" gate must cover Principles I–XI
- .specify/templates/spec-template.md — UI text in pt-BR, offline behaviour per screen
- .specify/templates/tasks-template.md — ui component tasks (README spec, harness, tests,
  catalog entry) and iPhone verification task per feature

Deferred TODOs: none
-->

# sspc-web Constitution

## Core Principles

### I. Offline-First

- IndexedDB, accessed through Dexie, is the client's source of truth. Screens read from local
  storage, never directly from the network.
- User-entered text MUST be persisted locally within 500 ms of the last keystroke.
- Locally stored user changes MUST NOT be discarded, overwritten or evicted until the server has
  confirmed them.
- Every screen MUST work without connectivity after the first successful sign-in.

**Rationale**: the app is used on phones with unreliable connectivity; losing a user's writing is
the worst failure this product can have.

### II. iOS Safari Is the Primary Target

- Features MUST NOT depend on Background Sync, Periodic Background Sync, or any other web API that
  iOS Safari does not support. Synchronization happens while the app is open (start-up, foreground,
  connectivity regained, user action).
- A feature is not done until it has been verified on an iPhone with the PWA installed to the home
  screen.

**Rationale**: the primary users run the app as an installed PWA on iPhone; desktop browsers are
secondary.

### III. Modern Angular

Code follows the current official Angular style guide:

- Standalone components only; no NgModules. Zoneless change detection; zone.js is not installed.
- Every component uses `ChangeDetectionStrategy.OnPush`.
- State lives in `signal()` and `computed()`; `effect()` is used only to synchronize with the
  outside world (DOM, storage, logging), never to derive or propagate state.
- Components use `input()`, `output()`, `model()`; dependencies use `inject()`.
- Templates use `@if`, `@for` (always with `track`), `@switch`, and `@defer` for heavy parts.
- Routes are lazy-loaded. Guards and interceptors are functional.
- RxJS is used only at the edges (HTTP, browser events) and converted with `toSignal`.
- Forms are typed reactive forms.
- File and class names follow what the current Angular CLI generates (no `.component` or
  `.service` suffixes). The selector prefix is `sspc`.
- angular-eslint MUST report `prefer-standalone`, `prefer-on-push-component-change-detection` and
  `template/prefer-control-flow` as errors.

**Rationale**: one consistent, current idiom keeps the codebase small, fast and easy to review.

### IV. Structure and Boundaries

- `src/app/core` holds singletons: auth, interceptors, the Dexie database, the sync engine and app
  updates.
- `src/app/features/<feature>` holds that feature's pages, data (repositories and signal stores)
  and routes.
- `src/app/ui` is the design system. `src/testing` holds shared test helpers.
- `ui` MAY import only Angular, the Angular CDK, Lucide and the design tokens. It MUST NOT import
  `core`, `features`, the router, `HttpClient` or Dexie.
- A feature MAY import `ui` and `core`; it MUST NOT import another feature.
- `core` MUST NOT import `features`.
- These rules MUST be enforced by ESLint `no-restricted-imports`.

**Rationale**: enforced boundaries keep features independent and keep `ui` extractable.

### V. Design System Built with the Screens

- Pages compose components and own the logic. `ui` components only take inputs, emit outputs and
  project content; they MUST NOT use services, HTTP, the router or stores.
- Every new screen starts from the catalog (dev-only route `/_ds`). Anything missing becomes a
  generic `ui` component (e.g. Button, Card, ListItem, StatusChip, SyncStatus, RichTextEditor)
  before the page uses it.
- Every `ui` component is delivered with: a framework-neutral `README.md` specification (purpose,
  variants, states, inputs, events, accessibility, and the table of test cases), a CDK component
  harness, table-driven tests, and a catalog entry.
- Styles under `ui` use only design tokens: CSS variables generated by Style Dictionary from
  `ui/tokens/tokens.json` in the W3C Design Tokens format. stylelint MUST reject literal colors,
  sizes and font families under `ui`.
- Behaviour primitives come from the Angular CDK. Angular Material is not used.
- Icons come from Lucide. Fonts are open source and self-hosted.
- The `ui` folder MUST remain extractable to its own repository and re-implementable in Flutter
  from the tokens and specifications alone.

**Rationale**: the UI layer is the seed of a portable design system; growing it alongside the
screens keeps it real, and framework-neutral specs keep it portable.

### VI. Test Discipline with Flutter Parity

- Tests verify behaviour, not implementation. They interact and assert through component harnesses
  (every `ui` component ships one; pages are tested through the harnesses of the components they
  use), never through internal signals, private methods or CSS classes.
- Every test is table-driven with Vitest `it.each` over cases `{ name, input, output }`. Case names
  follow "given ..., when ..., then ...", and test bodies have `// given`, `// when` and `// then`
  sections.
- `ui` component tests are written from the case table in the component's README.
- Dependencies are replaced by in-memory fakes through TestBed providers. HTTP is tested only
  through `HttpTestingController`; Dexie through `fake-indexeddb`; time through
  `vi.useFakeTimers`.
- Every `ui` component test runs an axe-core accessibility check.
- End-to-end tests (Playwright) are few and cover only critical flows.
- These rules mirror their Flutter equivalents (`testWidgets` with one robot per widget,
  `meetsGuideline`, record-based case tables) so a future Flutter app follows the same standard.

**Rationale**: behaviour-level, table-driven tests survive refactors and port directly to another
framework.

### VII. Dependencies

- Allowed: Angular and the Angular CDK, Dexie, uuid, Lucide, Style Dictionary, axe-core, and the
  MIT-licensed TipTap core packages (plus the tooling named in this constitution).
- Forbidden: TipTap Pro or Platform packages, Angular Material, and any closed-source dependency,
  even if free.
- Any new runtime or development dependency MUST be justified in the feature's `plan.md`.

**Rationale**: a small, open-source dependency set keeps bundles small, licences clean and the
design system portable.

### VIII. Quality Gates

A change is mergeable only when:

- angular-eslint (including the boundary rules) and stylelint report no errors;
- all Vitest suites pass;
- the production build stays within budget (initial bundle: warning at 400 kB, error at 600 kB);
- `npm audit`, gitleaks and Trivy are clean in CI.

**Rationale**: automated gates make the other principles enforceable instead of aspirational.

### IX. API Contract

- API types are generated from `sspc-api/api/openapi.yaml` with openapi-typescript and used as-is
  (camelCase), with no mapping layer.
- Generated types MUST NOT be edited by hand; contract changes start in the OpenAPI file.
- Every request MUST send the `X-App-Version` header.
- The app MUST handle HTTP 426 (Upgrade Required) by forcing an update, without losing unsynced
  local data (Principle I).

**Rationale**: a single generated contract removes drift between client and server; version
signalling lets the server retire incompatible clients safely.

### X. User Experience

- Mobile-first, designed for one-handed use with large tap targets.
- Light and dark themes.
- Accessible: labelled controls, logical focus order and sufficient contrast.
- A sync status indicator is always visible.

**Rationale**: the app is used on a phone, often on the move, and users must always know whether
their work is safe on the server.

### XI. Language and Naming

- Identifiers, code comments, specifications and commit messages are in English.
- All UI text and route paths are in Brazilian Portuguese.

**Rationale**: English keeps the code and design system reusable; Portuguese serves the actual
users.

## Product Context and Platform Constraints

- sspc-web is the Angular 22 PWA of SSPC Studio: a private app for two users, used on iPhones
  (installed to the home screen) and in desktop browsers.
- Its backend is sspc-api; the OpenAPI document in that repository is the only contract between
  them (Principle IX).
- Its `ui` layer is also the seed of a reusable design system intended to be extracted and
  re-implemented in Flutter (Principles V and VI).

## Development Workflow and Definition of Done

- Each feature follows the Spec Kit flow (specify → plan → tasks → implement). The plan's
  Constitution Check MUST address every principle, and any justified exception MUST be recorded in
  the plan's complexity tracking.
- A feature is done when:
  - every new or changed screen works offline after first sign-in (Principle I);
  - it has been verified in the installed PWA on an iPhone (Principle II);
  - every new `ui` component has its README specification, harness, table-driven tests with an
    axe-core check, and catalog entry (Principles V and VI);
  - all quality gates pass (Principle VIII).

## Governance

- This constitution supersedes other practices and conventions in this repository. Where a guide
  conflicts with it, the constitution wins.
- Amendments are made through `/speckit-constitution`, recorded in this file with a version bump,
  and committed in their own commit. Changes that require code migration MUST include the
  migration in a follow-up plan.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle in a
  backward-incompatible way; MINOR for adding a principle or section or materially expanding
  guidance; PATCH for clarifications and wording.
- Every plan and every code review MUST verify compliance with these principles. Deviations MUST be
  justified in writing in the relevant `plan.md`; unjustified deviations block merge.

**Version**: 1.0.0 | **Ratified**: 2026-10-04 | **Last Amended**: 2026-10-04
