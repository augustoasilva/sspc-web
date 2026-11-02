# Validation record: installable PWA shell

**Feature**: [spec.md](spec.md) | **Procedure**: [quickstart.md](quickstart.md) section D | **Data**: [data-model.md](data-model.md) §VerificationRecord

Fill this record only with results. Do not write addresses, hostnames, device identifiers, certificate fingerprints, client addresses or raw log lines (SEC-010; `npm run policy` fails on them). Use "pass", "fail" or "not run", with short notes.

| Field | Value |
|-------|-------|
| Date | |
| iPhone model and iOS version | |
| App version and build tested | |
| Storage protection observed (R-04) | |
| Total time of one complete D1–D4 run (SC-009: 30 minutes or fewer, phone trust already done) | |

## D1. Web option off and the counter

| Check | Result |
|-------|--------|
| Health answers 200 with the web option off | |
| App address does not serve the app with the web option off (record the code) | |
| Counter reads one more after one known request (difference 1) | |

## D2. Install and first launch (Stories 1, 4, 5)

| Step | Result | Notes |
|------|--------|-------|
| 1. Installed to the Home Screen; was 10 seconds after the first screen enough? | | |
| 2. Five online launches: frame count of each (60 or fewer passes, FR-003) | | |
| 3. Connection chip "Conectado"; About shows name, description, version, "Online", storage | | |
| 4. Light and dark switch live, Portuguese text, larger text sizes do not clip | | |
| 5. About first, offline (photo present or not yet supplied) | | |
| 6. Resume after switching apps; behaviour after a long absence | | |

## D3. Offline start (Story 2, FR-037)

| Check | Result |
|-------|--------|
| Condition 1, airplane mode: 5 launches opened (each frame count recorded) | |
| Condition 1: counter difference per launch (0 expected) | |
| Condition 2, Wi-Fi on and the stack stopped: 5 launches opened, no error page | |
| Interrupted first load completes and then works offline | |

## D4. Update flow (Story 6, SC-003 to SC-005)

| Step | Result | Notes |
|------|--------|-------|
| 3. Banner within 5 s, no close control (seconds) | | |
| 5. "Agora não" leaves the typed text, cursor, focus and banner | | |
| 6. "Atualizar agora" switches the version; typed text gone | | |
| 7. No unsaved text: the switch is immediate, no dialog | | |
| 8. Force-quit, relaunch: new version, banner gone | | |
| 9. Offline tap applies the downloaded update | | |
| 10. Several versions: the newest is offered, the skipped one never | | |
| 11. Rollback is offered as an update | | |
| 12. SC-003 trials (passes out of 20; all 20 required) | | |

## Cleanup (SEC-010)

| Item | Done |
|------|------|
| Test-only configuration removed, stack stopped, test images removed | |
| LAN exposure stopped | |
| Trust profile and trust removed from the phone | |
| Site data and installed app storage cleared | |

## Design deviations accepted by the owner (research G1–G11)

| Deviation | Accepted by and date |
|-----------|----------------------|
| | |
