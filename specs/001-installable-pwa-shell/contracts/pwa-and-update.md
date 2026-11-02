# Contract: installability, offline and update

**Feature**: [spec.md](../spec.md) | **Research**: R-01, R-02, R-04, R-05

## Web app manifest (`public/manifest.webmanifest`)

| Field | Value |
|-------|-------|
| `name` / `short_name` | "SSPC Studio" |
| `description` | pt-BR one-liner (the About description) |
| `lang` | `pt-BR` |
| `start_url` / `scope` / `id` | `/` (the app is served from the origin root) |
| `display` | `standalone` |
| `background_color` | `#FEF7F0`, the colour of the icon artwork (its splash matches the icon; the DESIGN.md surface `#FFF9F3` is used for `theme_color`) |
| `theme_color` | `#FFF9F3`; the dark value comes from the two `theme-color` meta tags in `index.html` |
| `icons` | separate entries, never `"maskable any"` combined: 192 and 512 with `purpose: any`; 192 and 512 with `purpose: maskable` (art inside the 80 % safe zone). Built from one owner-supplied 1024 px master; the scaffold's icons are placeholders |

## `src/index.html`

- `<html lang="pt-BR">`, `<title>SSPC Studio</title>`, `<base href="/">`.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Stitch's `maximum-scale=1, user-scalable=no` is **not** copied (blocks zoom; FR-023).
- `<link rel="manifest" href="manifest.webmanifest">`, `<link rel="apple-touch-icon" href="icons/apple-touch-icon-180.png">` (180×180, opaque), `<link rel="icon">`.
- `<meta name="mobile-web-app-capable" content="yes">` and `<meta name="apple-mobile-web-app-capable" content="yes">`, `apple-mobile-web-app-title` "SSPC Studio", `apple-mobile-web-app-status-bar-style` `default`.
- Two `theme-color` metas: `(prefers-color-scheme: light)` `#FFF9F3`, `(prefers-color-scheme: dark)` `#1C211A`.
- No inline script, no inline event handler, no remote font or stylesheet (CSP).
- `<noscript>` in Portuguese.

## `ngsw-config.json`

| Group | Mode | Resources |
|-------|------|-----------|
| `app` | prefetch | `/index.html`, `/manifest.webmanifest`, `/favicon.ico`, `/*.css`, `/*.js`, `/media/*.woff2`, `/icons/*.png`, `/images/*.webp` (the About photo, served from `public/images/`) |
| `assets` | lazy, update prefetch | `/**/*.(svg\|jpg\|jpeg\|png\|webp\|avif\|gif\|woff2)` not already in `app` |

**Rule (FR-005)**: a `lazy` group is cached only when a file is first requested, so one online load does not cache it. Every image or font that a screen of the shell uses MUST therefore be listed in the prefetched `app` group; the `assets` group is only a net for files no screen of this feature uses. The `build` job asserts it: every `*.png`, `*.webp`, `*.jpg`, `*.jpeg`, `*.svg`, `*.woff2` and `*.ico` emitted into `dist/sspc-web/browser` (the Angular service-worker files excepted) is listed in the `app` group of the generated `ngsw.json`.

No `dataGroups`, now or when later features add API calls (SEC-002): the worker caches only the public hashed files listed in `ngsw.json`, never an API response or user-specific data. A build assertion fails if `ngsw-config.json` contains a `dataGroups` key; a later feature that needs one must amend this contract and the spec first. `index` is `/index.html`; `navigationRequestStrategy` stays `performance`. Registration is `registerWhenStable:5000` (the worker registers when the app is stable, at the latest 5 s after start, so the prefetch can finish within the 10 s of FR-005 on the home network) with the service worker enabled only outside development mode **and only in a secure context** (next section).

## Secure context (SEC-001)

| Origin | Service worker | Install | Shell |
|--------|----------------|---------|-------|
| HTTPS, or loopback (`localhost`): `window.isSecureContext` is true | registered as above | the browser's own affordances; the app adds no install control | normal |
| any other plain-HTTP origin: `isSecureContext` is false | **not registered**, `AppUpdate` stays `idle` | the app adds no install control; the browser's own Add to Home Screen is outside its control and gives no offline app | the banner slot shows “Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.” (tone `error`, no action, no close control); offline use and installation are unsupported |
| HTTPS origin whose certificate the browser rejects | the browser's own warning appears before the app loads | none | the procedure tells the user not to bypass it and to use the trusted address (quickstart D1) |

`provideServiceWorker` receives `enabled: !isDevMode() && isSecureOrigin()`, where `isSecureOrigin()` is `globalThis.isSecureContext === true`, so an environment that lacks the property (jsdom) counts as insecure. HTTP-to-HTTPS redirection and HSTS are not done here (the edge and the future hosting feature own them). The notice's design is made in Stitch and aligned before it is built (tasks T019 to T021, research G10).

## Update contract (`AppUpdate`)

| Trigger | Action | Result |
|---------|--------|--------|
| application start (after the service worker is ready) | `checkForUpdate()` | may emit `VERSION_DETECTED` then `VERSION_READY` |
| `visibilitychange` → visible | `checkForUpdate()`; if the last check was < 5 s ago, at the end of that 5 s window (one deferred check shared by all triggers in the window) | same |
| window `online` | `checkForUpdate()`, under the same 5 s rule as above | same |
| `VERSION_READY` | state → `ready` | banner shown |
| `VERSION_INSTALLATION_FAILED` | log only; no notice (nothing to apply) | stays `idle` |
| tap "Atualizar", no unsaved work | `activateUpdate()` then `document.location.reload()` | new version |
| tap "Atualizar", unsaved work | state → `confirming` | dialog |
| tap "Atualizar" while offline | as online: `activateUpdate()` needs no network (it switches to the version already downloaded), then the reload is served from the cache | new version, offline |
| `activateUpdate()` rejects, or `SwUpdate.unrecoverable` | state → `failed` | error banner with retry |

Timing target: notice visible ≤ 5 s after the trigger on the home network (SC-004). The check throttle uses injected time so it is testable with `vi.useFakeTimers`. When `SwUpdate.isEnabled` is false (development) the service stays `idle`.

Platform behaviour relied on (verified in `ngsw-worker.js`): a navigation from an older version is served the newest; therefore a full restart or a reload applies the update, while backgrounding does not.

Update source and recovery (SEC-003): the worker fetches `ngsw.json` from the app's own origin and verifies every file against the hashes in it, so a mixed or altered set of files is rejected; this does not defend against a compromised origin or build pipeline (residual risk in the spec). A security fix reaches a running app only when the user taps "Atualizar" or fully restarts it; forced updates belong to the future API integration. **A rollback is an update**: serving an older build changes `ngsw.json`, so the worker detects it and offers it through the same notice (quickstart D4 step 11 rehearses it). If a bad version cannot be replaced, the last resort is to remove the Home Screen app and its site data and reinstall from the trusted HTTPS address.

## Connection and storage contracts

- `Connectivity.online`: a signal that is true when `navigator.onLine` is true; initial value synchronous; updated by `online`/`offline` events; no network request.
- `StoragePersistence.state`: `pending | granted | denied | unsupported` per data-model.md; `persist()` called at most once per browser profile, the flag `sspc.storage.requested` being written **before** the call so a dismissed browser prompt counts too (SEC-012); refusal or dismissal leaves the app usable with "Não protegido"; the observed value on the iPhone is recorded in the verification record.
- No analytics, error reporting, remote font, remote image or other third-party request is made (SEC-002); the build asserts that `index.html`, every `*.css`, `manifest.webmanifest` and `ngsw.json` contain no absolute `http(s)://` URL.

## Version contract

`APP_VERSION` and `APP_BUILD` are global string constants replaced at build time (`ng build --define`), declared in `src/app/core/app-version.ts`. `angular.json` holds `'0.0.0+dev'` and `'local'`; the Dockerfile overrides them from build arguments. The code never reads `package.json`'s version.
