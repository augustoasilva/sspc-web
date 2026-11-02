# Validation record: installable PWA shell

**Feature**: [spec.md](spec.md) | **Procedure**: [quickstart.md](quickstart.md) section D | **Data**: [data-model.md](data-model.md) §VerificationRecord

Fill this record only with results. Do not write addresses, hostnames, device identifiers, certificate fingerprints, client addresses or raw log lines (SEC-010; `npm run policy` fails on them). Use "pass", "fail" or "not run", with short notes. "Owner reported" means the owner ran the check and reported a pass; the numbers behind it are still pending where marked.

| Field | Value |
|-------|-------|
| Date | 2026-11-02 |
| iPhone model and iOS version | pending (owner) |
| App version and build tested | installed: `0.0.0+dev` (build `first`); test server later switched to `0.0.1+dev` (build `second`) |
| Storage protection observed (R-04) | pending (owner, from About; D2 step 3) |
| Total time of one complete D1–D4 run (SC-009: 30 minutes or fewer, phone trust already done) | pending |

## D1. Web option off and the counter

| Check | Result |
|-------|--------|
| Health answers 200 with the web option off | pass (measured on the computer, 2026-11-02: 200) |
| App address does not serve the app with the web option off (record the code) | pass (measured on the computer: 502) |
| Counter reads one more after one known request (difference 1) | pass (measured on the computer: before 0, after 1) |
| Insecure origin (T072), iPhone and desktop | pass (owner reported: the secure-connection warning is shown on both; the desktop browser first timed out on the Windows side, which is not an app result) |

## D2. Install and first launch (Stories 1, 4, 5)

| Step | Result | Notes |
|------|--------|-------|
| 1. Installed to the Home Screen; was 10 seconds after the first screen enough? | pass (owner reported, case 2) | 10 seconds enough: owner to confirm |
| 2. Five online launches: frame count of each (60 or fewer passes, FR-003) | pass (owner reported, case 3) | measured in seconds instead of frames (owner's choice, option 1): each launch opened in under 0.5 s, at 60 fps that is at most 30 frames, within the 60-frame limit. Start point: the owner's zoom-in on the tap, to confirm |
| 3. Connection chip "Conectado"; About shows name, description, version, "Online", storage | partial | chip "Conectado" and "Sem conexão" checked by owner; About content and storage value pending |
| 4. Light and dark switch live, Portuguese text, larger text sizes do not clip | pass (owner reported, catalogue at `/_ds`, test build) | live switch, typed text kept, larger text without clipping, reduced motion stops the chip dot, dialog closes and returns focus; every catalogue section compared with its Stitch board in light and dark: no difference reported. During the check the app bar and tab bar were squeezed on the long catalogue page; fixed (bars keep their height) and re-checked |
| 5. About first, offline (photo present or not yet supplied) | not run | |
| 6. Resume after switching apps; behaviour after a long absence | not run | |

## D3. Offline start (Story 2, FR-037)

| Check | Result |
|-------|--------|
| Condition 1, airplane mode: 5 launches opened (timing recorded) | pass (owner reported, case 4): 5 of 5 opened; each launch under 0.5 s, at 60 fps at most 30 frames, within the 60-frame limit (measured in seconds, option 1) |
| Condition 1: counter difference per launch (0 expected) | pass: 5 of 5 runs with difference 0. Counter read on the computer (before, after): run 1 26, 26; run 2 29, 29; run 3 32, 32; run 4 35, 35; run 5 38, 38. The counter never went down, so no trial is void |
| Condition 2, Wi-Fi on and the stack stopped: 5 launches opened, no error page | pass (owner reported, case 5): 5 of 5 opened; each screen fully loaded in under 1 s (video timestamps); no error page. Perfil showed "Online" with the stack down: expected, because the device still reports a network (spec A-012); the record does not claim the server answered |
| Interrupted first load completes and then works offline | pass (owner reported, case 6) |

## D4. Update flow (Story 6, SC-003 to SC-005)

| Step | Result | Notes |
|------|--------|-------|
| 3. Banner within 5 s, no close control (seconds) | not run | |
| 5. "Agora não" leaves the typed text, cursor, focus and banner | not run | |
| 6. "Atualizar agora" switches the version; typed text gone | not run | |
| 7. No unsaved text: the switch is immediate, no dialog | not run | |
| 8. Force-quit, relaunch: new version, banner gone | not run | |
| 9. Offline tap applies the downloaded update | not run | |
| 10. Several versions: the newest is offered, the skipped one never | not run | |
| 11. Rollback is offered as an update | not run | |
| 12. SC-003 trials (passes out of 20; all 20 required) | not run | |

## Cleanup (SEC-010)

| Item | Done |
|------|------|
| Test-only configuration removed, stack stopped, test images removed | not done |
| LAN exposure stopped | not done |
| Trust profile and trust removed from the phone | not done |
| Site data and installed app storage cleared | not done |

## Design deviations accepted by the owner (research G1–G11)

| Deviation | Accepted by and date |
|-----------|----------------------|
| Pressed colours of the secondary, destructive and ghost buttons: DESIGN.md defines the pressed colour of the primary button only; the others darken by a brightness filter (ghost takes the high surface container) | owner, 2026-11-02 (reported on the device, with the catalogue) |
