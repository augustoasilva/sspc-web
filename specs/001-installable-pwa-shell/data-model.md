# Data Model: Installable PWA Shell

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

The shell stores public app assets in the service worker cache and the `sspc.storage.requested` localStorage flag; it stores no user text. Everything below is either **runtime state** held in signals by `core` services (never persisted, except where stated) or **content/records** that live in the repository. Field names are descriptive, not final identifiers.

## 1. Runtime state

### AppVersion (`core/app-version.ts`)

| Field | Type | Rule |
|-------|------|------|
| `version` | string | SemVer 2.0.0 with optional build metadata. Source: build-time constant `APP_VERSION`, read through the injection token `APP_BUILD_INFO` (tests provide other values, because the constant is a literal in the unit-test build); falls back to `0.0.0+dev` when the token carries no version (tooling). Release candidates carry `X.Y.Z+rc.N`; promoted images carry `X.Y.Z` |
| `build` | string | Short commit id from `APP_BUILD`; `local` when not provided |
| `kind` | `release` \| `prerelease` \| `dev` | `dev` when `version` ends with `+dev` (FR-018); `prerelease` when it carries a `-…` or `+rc.…` part; otherwise `release` |
| `display` | string | `"<version> (<build>)"`, as the About design shows (`1.0.0 (a1b2c3d)`) |

Invariants: immutable for the life of the page; a `dev` build never renders a release-looking number; the value shown on About equals the value baked into the build (SC-005).

### ConnectionState (`core/connectivity.ts`)

| Field | Type | Rule |
|-------|------|------|
| `online` | boolean signal | Initial value read synchronously from `navigator.onLine`; updated by the window `online` and `offline` events; no server contact (A-012) |
| `label` (header chip) | derived | `online` → "Conectado"; offline → "Sem conexão" |
| `valueLabel` (About row) | derived | `online` → "Online"; offline → "Offline" (offline wording inferred, research G5) |

Invariants: never `undefined`; change visible within 2 s (FR-008).

### SecureContext (`core/secure-context.ts`)

| Field | Type | Rule |
|-------|------|------|
| `secure` | boolean (constant for the page) | `globalThis.isSecureContext === true`: true on HTTPS and on loopback (`localhost`), false on any other plain-HTTP origin and wherever the property is absent (jsdom) |
| `message` | string | when not secure: “Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.” (fixed by SEC-001) |

Effects when `secure` is false (SEC-001): the service worker is **not** registered, `AppUpdate` stays `idle`, the shell's banner slot shows `message` (tone `error`, no action, no close control), and no install control is offered. Everything else keeps working online. Effects when true: none.

### UpdateState (`core/app-update.ts`)

| Value | Meaning | UI |
|-------|---------|----|
| `idle` | running the newest version, or the service worker is disabled (development, or a non-secure origin) | no notice |
| `ready` | a newer version is downloaded and ready (`VERSION_READY`) | "Nova versão disponível" banner, "Atualizar" |
| `confirming` | the user tapped "Atualizar" while `UnsavedWork.hasUnsaved()` | dialog open |
| `applying` | `activateUpdate()` in progress, then `document.location.reload()` | action shows loading, disabled |
| `failed` | `activateUpdate()` rejected, or `SwUpdate.unrecoverable` fired | banner text of research G3 with retry; app stays on the current version |

Transitions:

```text
idle      --VERSION_READY--------------------------> ready
ready     --tap Atualizar, no unsaved work---------> applying
ready     --tap Atualizar, unsaved work------------> confirming
confirming--"Atualizar agora"----------------------> applying
confirming--"Agora não" / dialog dismissed---------> ready        (text, cursor, focus untouched)
applying  --activateUpdate() + reload--------------> (new page) idle
applying  --rejected / unrecoverable---------------> failed
failed    --tap retry--------------------------------> applying (or ready if the check must repeat)
any       --full restart of the app----------------> idle        (service worker serves the newest version, research R-01)
```

Invariants: the version never changes without a user action or a full restart (FR-011); `ready` persists across route changes and returns from the background (FR-010); a newer deploy while `ready` keeps `ready` (the activation always lands on the latest); while `ready` the current version keeps working offline (FR-015). Activation needs no network: `VERSION_READY` means the new version is fully downloaded, and `activateUpdate()` only switches the client to it (`updateClient` in `ngsw-worker.js`), so tapping "Atualizar" while offline applies the update; `failed` is reserved for a rejected activation or `SwUpdate.unrecoverable`. Update checks (`checkForUpdate`) run once at start, on `visibilitychange` to visible and on `online`, at most once per 30 s (FR-009).

### UnsavedWork (`core/unsaved-work.ts`)

| Field | Type | Rule |
|-------|------|------|
| `sources` | set of registrations | A field-like component registers a `dirty` signal when it has text the shell did not save; it unregisters on destroy |
| `hasUnsaved()` | computed boolean | true when any registered source is dirty |

In this feature the only registrant is the input in the development catalogue (A-004). Later features register their editors; with local saving within 500 ms (Principle I) their sources are dirty only for an instant.

### StorageProtection (`core/storage-persistence.ts`)

| Value | Meaning | About row ("Armazenamento") |
|-------|---------|-----------------------------|
| `pending` | answer not read yet (one frame) | value hidden |
| `granted` | `persisted()` or `persist()` returned true | `shield-check` + "Protegido no aparelho" |
| `denied` | `persist()` returned false | `shield` + "Não protegido" (copy inferred, research G6) |
| `unsupported` | `navigator.storage?.persist` missing (including non-secure origins) | same as `denied` |

Rules (SEC-012): read `persisted()` first; call `persist()` only when false and no previous request is recorded in `localStorage` (key `sspc.storage.requested`, the only persisted item of this feature). The key is written **before** `persist()` is called, so a browser prompt that is dismissed still counts as the one request per browser profile and is never repeated. A native browser prompt is shown by the browser, not by the app; refusal or dismissal resolves to `denied`. The last answer is kept in the signal for About. Never blocks start-up; the app is fully usable in every state.

### Theme (derived, not stored)

`light` or `dark` from `matchMedia('(prefers-color-scheme: dark)')`; CSS handles it with the media query, so no signal is needed for styling. Changes apply live (FR-021). No in-app override (A-005).

### Navigation (router state)

| Route | Feature | Notes |
|-------|---------|-------|
| `/` | `home` | placeholder (research G2) |
| `/sobre` | `about` | tab label "Perfil" (A-014) |
| `/_ds` | `catalog` | registered only when `SSPC_CATALOG` is true |
| `**` | none | redirects to `/` |

## 2. Content and records (in the repository)

### DesignToken (generated)

| Field | Rule |
|-------|------|
| `name`, `role` | from `DESIGN.md` front matter (`colors`, `typography` including its non-W3C `fontVariation` field, `rounded`, `spacing`, plus the dimension properties of `components` and the derived stroke, focus-offset and elevation tokens of research R-09) |
| `light`, `dark` | `dark-*` entries of `colors` pair with the same role; other groups have one value |
| `$type`, `$value` | W3C Design Tokens in `tokens.json`; CSS variables `--sspc-<group>-<name>` in `tokens.css` |

Invariant: running `npm run tokens:build` on a clean checkout produces no diff (CI gate).

### SitePage and SiteLink (static content, FR-033/FR-034)

| Entity | Fields | Rule |
|--------|--------|------|
| `SitePage` | `path` (`/`, `/links/`), `title`, `requiredItems[]` | the content check fails if any required item is missing |
| `SiteLink` | `label`, `detail`, `kind` (`web` \| `mailto`), `destination`, `icon` | exactly three links on the links page; `web` destinations are `https://` URLs and carry `target="_blank"` with `rel="noopener noreferrer"` (SEC-009); `mailto` ones a valid address; no network contact |

Required items: home: tag "Edição digital • Em obras", name "Só Saio Pra Comer" with "Guia gastronômico", the headline, the coming-soon message, button "Ver nossos links" to `/links/`, quote with "Teresina, Piauí". Links: photo, name, tagline, Instagram, TikTok, "Parcerias com marcas", the advertising-disclosure note.

### VerificationRecord (document produced by the quickstart)

| Field | Rule |
|-------|------|
| `date`, `iphoneModel`, `iosVersion`, `appVersion` | all required (FR-037) |
| `steps[]` | each with `id`, `result` (pass/fail), `note` |
| `waitSufficient` | whether the 10 seconds of FR-005 were enough on the first install (quickstart D2 step 1) |
| `firstUsableFrames[]` | per timed launch: `condition` (online, or airplane mode) and the frame count of the screen recording from the tap to the first usable screen (FR-003); the 10 launches of SC-001 each need 60 or fewer |
| `aboutFirstOffline` | result of D2 step 5, and whether the About photo was present or not yet supplied |
| `procedureMinutes` | total time of one complete run of D1 to D4 (SC-009: 30 or fewer), measured in T139; T075 records only an early estimate of its own part |
| `offlineLaunches[]` | per launch: `condition` (airplane mode, or Wi-Fi on with stack stopped), `opened` (bool), `webRequests` (the difference between two reads of the local test-only request counter around the launch; must be 0; for the stack-stopped condition the stack was stopped, so the field says "stack stopped") |
| `storageProtection` | the observed value of `persist()` on the phone (R-04) |
| `cleanup` | required row (SEC-010): LAN exposure stopped, local authority trust and profile removed from the phone, site data and installed app cleared; each marked done |

Exclusions (SEC-010, enforced by the `validation-record` check, R-31): no LAN address, hostname, device identifier, certificate fingerprint, client address or raw log line.

### DesignPhaseRecord (research R-14, FR-039, SC-012)

| Field | Rule |
|-------|------|
| `baseline` | project id, light and dark design-system asset ids, ids and titles of all existing screens, read at the start of the phase |
| `screens[]` | six entries (dialog, Início, insecure notice, each light and dark): `id`, real `title`, `theme`, `deviceType` `MOBILE`, the prompt used, date |
| `rounds[]` | per round: `round`, `screen`, `theme`, `item`, `expected`, `found`; a final round with no entry per screen ends the loop; at most 5 rounds per screen |
| `accepted[]` | deviations the owner accepted when the limit was reached: item, owner name, date |
| `closed` | date the phase was closed (T022) and the number of review rounds used |
| `scopeCheck` | the baseline compared with the lists read at the end: only the six new screens differ |

### ExceptionRecord (`security/exceptions.yaml`, SEC-006)

| Field | Rule |
|-------|------|
| `id` | CVE or GHSA identifier; unique within `scope` and `target` |
| `scope`, `target` | `image` or `npm`; optional image name or package name |
| `rationale`, `compensating_controls`, `approver` | non-empty text; `approver` is the owner |
| `approved`, `expires` | dates; `expires` is at most 30 days after `approved` and not in the past, otherwise the gate fails |

The file ships as `exceptions: []`. See research R-30.

### OfflineProofCounter (test-only, `tools/offline-proof/`)

One in-memory integer in the proxy process that fronts the app during the iPhone test: incremented once per incoming request, readable only through the socket inside its own container, reset when the process stops, never written to a file, log or HTTP response (SEC-008). Not part of either production image.

### QualityGateResult (CI)

One result per job name (`lint`, `test`, `build`, `security`, `image`, `branch-guard`) on the pull request; a failing job is named in the pull request checks. See [contracts/build-and-ci.md](contracts/build-and-ci.md).

### Image

Two artefacts, `sspc-web` (app) and `sspc-site` (site); neither contains the other's files; both built by the `image` job and never pushed. See [contracts/http-serving.md](contracts/http-serving.md).
