# Quickstart: validating the installable shell

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Contracts**: [contracts/](contracts/)

This is the run guide that proves the feature end to end. Sections A to C run on the computer and in CI; section D is the iPhone procedure the constitution requires before the feature is done (Principle II). Commands that depend on the sibling repository are marked **(check)**: confirm them against `sspc-api/deploy/RUNBOOK.md` before running, because that repository is still changing.

## Prerequisites

- Node 24 and npm 11, Docker, `git`, `gh` (optional), the `sspc-api` repository checked out next to this one (`../sspc-api`).
- `STITCH_API_KEY` exported only if you want the agent to read Stitch; nothing here needs it.
- An iPhone on the same home network with the existing local certificate trusted and its existing HTTPS address working. For future trust setup or revalidation, follow the sibling [trust procedure](../../../sspc-api/specs/002-dev-flow-lan-pwa/quickstart.md) at revision `f7ee75015a59beb15b6ccab6b64630917e94d56d` (fingerprint check included). Revalidate that revision and commands against the implemented sibling stack before testing. This guide does not repeat that procedure (FR-038).
- Use synthetic data only; the stack is reachable from the LAN while it is up (sibling security model; SEC-010).
- If Safari shows a certificate warning for the stack's address, stop: do not bypass it. Use the trusted HTTPS address, or redo the trust procedure above (SEC-001).

## A. Local gates (computer)

| Step | Command | Expected |
|------|---------|----------|
| A1 | `npm ci` | no peer-dependency errors (this is where `lucide-angular@1.0.0` would have failed); the lockfile has been refreshed so A12 starts green (research R-30) |
| A2 | `npm run design:lint` | exit 0, `errors: 0` (the 17 `orphaned-tokens` warnings are expected) |
| A3 | `npm run tokens:check` | no diff under `src/app/ui/tokens` |
| A4 | `npm run lint` | ESLint and stylelint clean |
| A5 | `npm test -- --no-watch` | all green; every `ui` component has its axe test |
| A6 | `npm run build` | no budget error; initial JS below 400 kB raw (warning threshold) |
| A7 | `grep -rl "sspc-catalog" dist/sspc-web/browser` (the catalogue page's selector, the marker of its chunk) | nothing found (FR-024) |
| A7b | `node scripts/check-ngsw-assets.mjs dist/sspc-web/browser` (the `build` job runs the same command) | every `*.png`, `*.webp`, `*.jpg`, `*.svg`, `*.woff2` and `*.ico` in `dist/sspc-web/browser` is listed in the `app` asset group, so one online load caches every image and font (FR-005) |
| A8 | `grep -c "onload=" dist/sspc-web/browser/index.html`; `find dist/sspc-web/browser -name '*.map'`; `grep -rl sourceMappingURL dist/sspc-web/browser` | `0`, nothing, nothing (SEC-004) |
| A9 | `npm start` and open `http://localhost:4200/_ds` | catalogue lists every component, every state, light and dark; service worker is off in development |
| A10 | `npm run policy` | workflow, Dockerfile, agent-settings, Caddyfile, image-metadata, validation-record and exceptions checks all pass |
| A11 | `npm run test:tools` | policy scripts, lint-rule proofs (each boundary and token rule still fails its bad case), the `design.md lint` gate (a broken token reference still fails), counter proxy and (with `SITE_URL`) the site content check, all green |
| A12 | `npm run audit` | no high or critical advisory in the whole tree, development dependencies included, other than an unexpired exception (SEC-006); needs the registry |
| A13 | `npm start`, then open `http://localhost:4200/` in a desktop browser tab | the app works fully in the tab (home, About, connection chip, theme follows the system setting) and asks for no installation (FR-004, Story 1 scenario 5) |
| A14 | read `.claude/settings.json` | the six Stitch read tools allowed, `generate_screen_from_text`, `edit_screens` and `apply_design_system` on `ask`, the other seven write tools denied (Principle VI v2.1.0) |
| A15 | read `research.md` R-14, "Design phase record" and "Review of the new designs" | the last review round of each of the six Stitch screens (dialog, Início, insecure-connection notice; light and dark) has no deviation, or the owner accepted the remainder by name and date; the closing date and the number of rounds are set; the scope check shows only the six new screens differ from the baseline (SC-012, FR-039) |

## B. Container (app image), the way the stack runs it

```sh
docker build -t sspc-web:local --build-arg APP_VERSION=0.0.0+dev --build-arg APP_BUILD=local .
docker run -d --name sspc-web-smoke --user 65532:65532 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges:true -p 18080:8080 sspc-web:local
scripts/smoke-app.sh sspc-web:local        # runs the assertions of contracts/http-serving.md
docker logs sspc-web-smoke | grep -c '"level":"error"'     # expected 0
docker rm -f sspc-web-smoke
```

Expected: `200` on `/` and `/sobre`, both `no-cache`; `no-cache` on `index.html`, `ngsw.json`, `ngsw-worker.js`, `manifest.webmanifest`; `immutable` on existing hashed assets only, and `404` (no fallback page, no `immutable`) on an absent hashed name and on `/icons/absent.png`; the exact CSP; zero error lines and no log line that mentions a request; only allowlisted files under `/srv`; the injected version string present in `main-*.js`.

**Insecure origin (SEC-001)**: `localhost` counts as secure, so use another address of this computer. Run the container with `-p 0.0.0.0:18080:8080`, find the computer's LAN address, and open `http://<that address>:18080` from a second device (or from this computer's browser using that address instead of `localhost`). Expected: the shell loads and shows “Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.”; in the browser console `navigator.serviceWorker` is `undefined` (or `getRegistrations()` is empty) and the app shows no install control of its own (the browser's Add to Home Screen is outside the app's control and gives no offline app). Stop the container afterwards; this exposes the public shell on the LAN while it runs.

## C. Static site (own image)

```sh
docker build -t sspc-site:local site
docker run -d --name sspc-site-smoke --user 65532:65532 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges:true -p 18081:8080 sspc-site:local
SITE_URL=http://localhost:18081 npx vitest run --config vitest.tools.config.ts site/tests
scripts/smoke-site.sh sspc-site:local
docker rm -f sspc-site-smoke
```

Expected: the content check passes (every required item of FR-033/FR-034, the button reaches `/links/`, three well-formed link destinations, `rel="noopener noreferrer"` and a new context on the two web links, no outside site contacted); `/nope`, `/Dockerfile` and `/Caddyfile` are `404`; no log line mentions a request. Open `http://localhost:18081` on a phone-sized and a desktop-sized window and compare with the Stitch screens.

## D. iPhone over the home network (the offline start included)

### D1. Start the stack with the app **(sibling commands verified at revision `f7ee750` on 2026-11-01; re-check if it moved)**

**Web option off first (Story 3, scenario 6; edge case "web option off")**: before enabling the web profile, start the stack as the runbook does (`LAN_ENABLE=1 make stack`) and check from the computer. `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/api/v1/healthz` answers `200` (the API's own health path, from the sibling README), and `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/` does not serve the app (the edge has no `web` upstream; record the code, an error such as 502 is expected). Nothing else in the stack changes. Then continue:

In `../sspc-api`, following the runbook (set `LAN_HOST` and `LAN_INTERFACE` in `deploy/.env.local`, use the existing trusted phone certificate and address; if trust must be set up again, follow the sibling fingerprint procedure), start the stack with the optional web profile so Compose builds this repository's `Dockerfile` (default build arguments `0.0.0+dev` / `local`):

```sh
COMPOSE_PROFILES=web LAN_ENABLE=1 make stack      # verified: target `stack`, per-start LAN_ENABLE, profile `web`
```

Open the announced HTTPS address on the iPhone in Safari. Expected: the shell loads, no certificate warning (Story 3, scenario 1).

The default build is a production build: it has no catalogue. Section D4 needs the catalogue's input to test "typing is not interrupted", and section D3 needs the request counter, so before D2 switch the stack to the **test-only configuration** of this repository (never used by release builds; the default smoke assertion keeps proving the default image has no catalogue). From the root of this repository, with the sibling beside it:

```sh
COMPOSE="docker compose --project-directory ../sspc-api/deploy \
  -f ../sspc-api/deploy/compose.local.yaml -f tools/offline-proof/compose.override.yaml \
  --env-file ../sspc-api/deploy/.env.local --profile web"          # paths verified at f7ee750
APP_VERSION=0.0.0+dev APP_BUILD=first APP_TAG=first $COMPOSE up -d --build --no-deps web web-app
curl -s -o /dev/null http://localhost:8080/manifest.webmanifest      # one known request
$COMPOSE exec -T web node /app/count.mjs                            # prints the count
```

`web` is now the counter proxy and `web-app` the catalogue-enabled app; the edge is unchanged. The counter read after your one `curl` must have risen by exactly 1 compared with the read before it (take a read first); if it did not, the proxy is not in the path and D3 is not valid (SEC-008).

Before D4, pre-build the other test builds once, so that every later "deployment" is a tag swap that takes seconds (the override names the image `sspc-web-app:${APP_TAG}`; the dependency layer of the image is cached, so each build costs about one `npm run build`; `swap` returns only when the new container answers, so the phone never meets the restart gap, and its wait raises the counter, which is harmless once D3 is done):

```sh
build_tag() { APP_VERSION=$2 APP_BUILD=$1 APP_TAG=$1 $COMPOSE build web-app; }
build_tag second 0.0.1+dev; build_tag third 0.0.2+dev; build_tag fourth 0.0.3+dev
build_tag fifth 0.0.4+dev;  build_tag sixth 0.0.5+dev; build_tag seventh 0.0.6+dev
swap() {   # a "deployment" in D4, for example: swap second
  APP_TAG=$1 $COMPOSE up -d --no-build --no-deps web-app
  until [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/manifest.webmanifest)" = 200 ]; do sleep 1; done
}
```

### D2. Install and first launch (Stories 1, 4, 5)

1. In Safari choose Share → "Add to Home Screen" (name "SSPC Studio", brand icon). Note the moment the first screen appears and wait 10 seconds before leaving the app: from then on the offline start is guaranteed (FR-005). Record in the verification record whether 10 seconds were enough; if a trial fails inside that window, tune the registration strategy (`registerImmediately`) rather than lengthening the wait.
2. Close Safari. Tap the icon: the app opens full screen, no address bar, content clear of the notch and home indicator. Time to the first usable screen within 1 s on a warm launch (SC-001: 10 launches). Time it as FR-003 defines: record the screen (Control Center, 60 fps, with the touch indicator on), then count frames from the one where the tap registers to the first frame with the app bar and content visible; 60 frames or fewer passes. Do this for 5 launches while online and enter the frame count of each in the record; the other 5 launches of SC-001 are the airplane-mode launches of D3 condition 1.
3. Home placeholder appears; connection chip reads "Conectado". Open "Perfil" → About: name, description, version with build reference (`0.0.0+dev (local)`), "Online", "Armazenamento". **Write down the observed storage value** (`Protegido no aparelho` or `Não protegido`): that answers research R-04.
4. Switch the iPhone between light and dark (Settings or Control Center) with the app open: it follows at once, nothing reloads. Check all text is Portuguese and larger text sizes do not clip.
5. **About first, offline** (FR-005, Story 2 scenario 7; run when the About screen and, if the owner supplied it, its photo exist): remove the Home Screen app and its site data, install again, wait 10 seconds after the first screen appears, turn airplane mode on, force-quit the app, launch it and open Perfil (About) **before** visiting any other screen. Expected: the whole screen works, the photo (when supplied) and every font are there, no placeholder where an image should be.

6. **Resume** (Story 1 scenario 4, assumption A-015): online again, open Perfil (About), switch to another app for about 10 seconds and return: the app is still on About and did not reload. After a much longer absence iOS may discard the page and the app then starts at its first screen; note what you observe, it is not a failure of the shell.

### D3. Offline start (Story 2, FR-037)

The counter proxy of D1 is the evidence (SEC-008; there is no access log to read). Before each launch read the count (`$COMPOSE exec -T web node /app/count.mjs`), after the launch and after visiting Início and Perfil read it again, and record the difference. A read that fails or a count that went down means the proxy restarted: the trial is void and is repeated. With the stack stopped there is nothing to read; record that the stack was stopped instead.

**Condition 1, airplane mode** (repeat 5 times): open the app online once and wait 10 seconds; turn airplane mode on; force-quit the app; launch it from the Home Screen; visit Início and Perfil. Time each of these 5 launches as in D2 step 2 and record the frame count. Expected: opens at once, About shows "Offline" and the header chip "Sem conexão", count difference **0**.

**Condition 2, Wi-Fi on, stack stopped**: with the phone still on Wi-Fi, stop the stack once with `$COMPOSE down` (not `make stack-down`: the sibling's target runs a plain `docker compose … down`, which with Docker Compose 5.6.1 leaves the profile-gated `web` and `web-app` containers running and reports the network in use; verified); confirm Safari cannot load the origin in a normal tab; then repeat 5 times: force-quit the installed app, launch it from the Home Screen and visit Início and Perfil. Expected: opens at once and every screen works; About shows "Online" (the phone still reports Wi-Fi, spec A-012), no error page. After the 5 launches start the stack again with `COMPOSE_PROFILES=web LAN_ENABLE=1 make stack` (`LAN_ENABLE` is per start and never persisted, runbook), then re-apply the D1 override (`APP_TAG=first $COMPOSE up -d --no-build --no-deps web web-app`; the images survive `down`, and the counter image has its own name, so `make stack` does not overwrite it) and take a fresh baseline count: `make stack` alone brings back the default `web` (no counter, no catalogue), which D4 cannot use.

Also check the interrupted first load (Story 2, scenario 5): remove the Home Screen app and clear its data, load the address, turn airplane mode on after a second, then restore connectivity and reopen: the load completes and the app then works offline.

### D4. Update flow (Story 6, SC-003 to SC-005)

State before you start: the D1 override is running (re-applied after D3 condition 2), the seven test builds are pre-built (D1), and the installed app is open and online on `first` (About shows `0.0.0+dev (first)`). A "deployment" below is `swap <tag>` from D1: the proxy and its count keep running. Use only `$COMPOSE` from here: the sibling's `make stack` would replace the counter with the default `web`.

1. `swap second`.
2. Open the catalogue in the installed app (`/_ds`) and type into its input; this is the text the update must not interrupt.
3. Bring the app to the foreground (switch away and back) or toggle airplane mode off. Expected within 5 s: the banner "Nova versão disponível" with "Atualizar" appears, nothing is covered, it has no close control (SC-004: time it).
4. Keep using the app, navigate to About and back, switch apps and return: the version does not change, the banner stays.
5. With the text of step 2 still typed (the banner appeared while you typed: text, cursor and keyboard untouched), tap "Atualizar": the dialog appears; "Agora não" leaves the text, cursor, focus and the banner as they were.
6. Tap "Atualizar" again and choose "Atualizar agora": the app switches to the new version and About shows `0.0.1+dev (second)`; the typed text is gone, as the dialog warned (SC-005).
7. No unsaved text: `swap third`, wait for the banner and tap "Atualizar": the app switches at once, with no dialog; About shows `0.0.2+dev (third)`.
8. Force-quit instead of tapping (amended spec): `swap fourth`, wait for the banner, force-quit the app and launch it: it opens `0.0.3+dev (fourth)` and the banner is gone.
9. Offline tap: `swap fifth`, wait for the banner, turn airplane mode on and tap "Atualizar": the update was downloaded before the banner appeared, so it applies; About shows `0.0.4+dev (fifth)` and the chip reads "Sem conexão". Turn airplane mode off. The failure banner ("Não foi possível atualizar. Tente de novo.") cannot be provoked on the device, because activating a downloaded version needs no network: it is covered by the shell test (T099) and shown in the catalogue's banner section.
10. Several versions (Story 6 scenario 9): `swap sixth` and wait for the banner; then, without tapping, `swap seventh`. Bring the app to the foreground and tap "Atualizar": About shows `0.0.6+dev (seventh)`; the sixth build was never offered.
11. Rollback is an update (SEC-003): `swap first`, bring the app to the foreground: the "Nova versão disponível" banner appears and "Atualizar" returns the app to `0.0.0+dev (first)`.
12. SC-003 trials (a trial is one banner appearance while typing). Repeat 20 times: force-quit and relaunch so that the app is on the current build with no banner; open `/_ds` and type a sentence; `swap` to the other of `first` and `second` (alternate them); while you keep typing, the banner appears within 5 s with the text, cursor, focus and open keyboard unchanged and no reload. Record the passes out of 20 (all 20 are required). These trials dominate the time of D4.

### D5. Cleanup and record

At the end of the testing period (SEC-010):

1. Disable the test-only configuration: `$COMPOSE rm -sf web web-app` (the counter disappears with the proxy), then stop the stack with `$COMPOSE down`, or start it again without the override (`LAN_ENABLE=1 make stack`); `make stack-down` alone would leave any profile-gated container running. Remove the pre-built test images (`docker image rm sspc-web-app:first sspc-web-app:second sspc-web-app:third sspc-web-app:fourth sspc-web-app:fifth sspc-web-app:sixth sspc-web-app:seventh sspc-offline-proof:local`).
2. Follow the sibling's end-of-period steps: stop LAN exposure, remove the local authority trust and any profile from the phone, clear Safari and Home Screen app storage for the origin, remove the installed app.
3. Mark each of those in the record's cleanup row.

The record excludes LAN addresses, hostnames, device identifiers, certificate fingerprints, client addresses and raw log lines; `npm run policy` (the `validation-record` check) fails if it contains any.

Fill the record (commit it under `specs/001-installable-pwa-shell/validation.md`):

| Field | Value |
|-------|-------|
| Date, iPhone model, iOS version | |
| App version and build tested | |
| Total time of one complete D1–D4 run (SC-009: 30 minutes or fewer, phone trust already done) | |
| Storage protection observed | |
| D1 web option off (health code, app address code) | |
| D2 steps 1–4 (10-second wait enough? frame count of each of the 5 online launches of step 2) | pass / fail, notes |
| D2 step 5 (About first, offline; photo present or not supplied yet) | pass / fail, notes |
| D2 step 6 (resume after switching apps; behaviour after a long absence) | pass / fail, notes |
| D3 condition 1: 5 launches (opened? counter difference, frame count) | |
| D3 condition 2: 5 launches (opened? error page?) | |
| D3 interrupted first load | |
| D4 steps 3–12 (time to banner in seconds; step 12: passes out of 20 trials) | |
| Cleanup (SEC-010): LAN stopped, trust and profile removed, site data and app cleared | done / not done, each |
| Open design deviations accepted by the owner (research G1–G11) | |

## Pass criteria

All of A to C pass in CI on the pull request, and the D record has every step passing with a counter difference of 0 in condition 1 and the cleanup row complete, which together cover SC-001 to SC-012 and the Definition of Done in the constitution.
