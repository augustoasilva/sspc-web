# Feature Specification: Installable PWA Shell

**Feature Branch**: `feature/001-installable-pwa-shell`

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "Provide the installable shell of SSPC Studio, following its Stitch designs (screens "0 Quadro do design system", "1.1 Botões", "1.5 Banner e diálogo", "2.8 Nova versão disponível" and "2.9 Sobre"). On iPhone it can be added to the home screen and then opens instantly as a standalone app; after the first load it opens with no connectivity. The UI is in Brazilian Portuguese with light and dark themes. When a new version is deployed, the user sees a non-blocking notice and chooses when to update; nothing they are typing is interrupted. A placeholder home screen and an "about" screen show the app version and whether the device is online. Every pull request is linted, tested, built and scanned. The repository also holds the static profile site (sosaiopracomer.com and its links page), built as its own image. Before any cloud infrastructure exists, the installed app is tested on an iPhone over the home network, through the sspc-api local stack."

## Context

SSPC Studio is a private app for two users, used mainly on iPhones with the app added to the Home Screen, and secondarily in desktop browsers. Every later feature (sign-in, visits, notes, synchronization) builds on a base that does not exist yet. This feature delivers that base, the **shell**: the part of the app that makes it installable, fast, usable offline, themed, safe to update, and verifiable. It deliberately contains no user text or business function; browser storage is described in A-001.

The same repository also holds the static profile site of the brand "Só Saio Pra Comer" (sosaiopracomer.com and its links page). The site is a separate deliverable with its own image, so it is specified here but does not depend on the app.

No cloud environment exists yet. All verification of the real, installed app therefore happens on the developer's own iPhone, over the home network, against the local stack of the companion API repository (whose own specification, "Development Flow and iPhone Testing", provides the trusted HTTPS address the phone needs).

The shell is complete when a person can install it on an iPhone, open it with no connectivity, see the version and connection state, be told politely when a newer version exists and update when they choose, and when every change to the repository is automatically checked.

## Clarifications

### Session 2026-11-01

- Q: When the user taps "Atualizar" while a field holds text that has not been saved anywhere, what should happen to that text? → A: Ask first. A dialog appears only when a field has unsaved text, warning that the update restarts the app, with "Atualizar agora" and "Agora não"; with no unsaved text, the update happens at once.
- Q: When the About screen and the header chip say the device is "online" or "offline", should that mean the iPhone reports a network connection, or that the app can actually reach SSPC's server? → A: Device connection. "Online" when the iPhone reports a network connection (Wi-Fi or cellular), "Offline" when it reports none (for example, airplane mode); the server is not contacted.
- Q: Which offline situations must the iPhone test procedure run, with the installed app force-quit first, to prove that the app really opens with no connectivity? → A: Two: airplane mode, and Wi-Fi on with the local stack stopped, each followed by a force-quit and a Home Screen launch; the record adds that the stack received no request for the app during those launches.
- Q: If the user ignores the "Nova versão disponível" notice, should it stay on screen until they update, or should they be able to close it? → A: It stays until the user updates. It has no close control, as in the Stitch banner, and remains on every screen while a newer version exists. *(Superseded by FR-010 and the Plan amendments below: the notice also ends when the app is fully restarted.)*
- Q: How should the pull-request checks verify the static site: only that its pages and links are correctly built, or also that the outside destinations actually answer? → A: Content and structure only. The check starts the built site image, requests both pages, confirms every required item is present, the "Ver nossos links" button reaches the links page and each link's destination is well formed; no outside site is contacted. The required content is taken from the site's Stitch designs (see FR-033 and FR-034).

### Plan amendments 2026-11-01

Made while planning, so that the spec and the plan agree. Each follows from an explicit instruction in the plan input or from a verified behaviour of the chosen platform pieces (see research.md R-01 and R-02).

- The About screen also shows the storage-protection state ("Armazenamento"), as the plan input asks (FR-017, Story 4, A-001). The "Última sincronização" row and "Sair da conta" stay out of scope.
- The update notice stays until the user updates **or fully restarts the app**: the platform's service worker serves any fresh page load, including a relaunch from the Home Screen, from the newest downloaded version, and cannot pin it to the old one. A restart already ends anything being typed, and the notice would be moot because the app is then current. This narrows the earlier clarification "It stays until the user updates" (FR-010, FR-011, Story 6 scenario 4, edge case "ignores the notice for days").
- Tapping "Atualizar" while offline applies the update instead of being refused: the notice appears only once the new version is fully downloaded, and activating it needs no network (verified in the worker source, research R-01). The earlier edge case that refused the tap is replaced, and the failure example of Story 6 scenario 8 no longer names a dropped connection. Backgrounding and returning, and moving between screens, still never change the version.

### Session 2026-11-02

- Q: When the iPhone asks for reduced motion, should the pulsing status dot on the connection chip stop? (FR-023) → A: Yes. The dot pulse stops when reduced motion is on and stays otherwise, as the spec's reduced-motion edge case requires.
- Q: Should the 4.5:1 contrast and the 48 px tap-target checks run automatically in the test suite, or only when someone checks the app on an iPhone? (FR-023) → A: Both, split by what can be measured. Contrast and target size are computed from the design tokens by an automated test on every change; the real layout is confirmed on the iPhone in the quickstart.
- Q: Should the tab bar's test check real router navigation, or only that the tap is intercepted and the selection is emitted? (FR-019) → A: Only the interception and the emitted selection. Real navigation is checked by the shell test, because the component boundary forbids importing the router.

## Design Reference (Stitch)

Source of truth for the visuals is the Stitch project "Só Saio Pra Comer Design System" and, where they disagree, the design source file of the repository (which wins; see FR-025). Every screen below has a light and a dark design, except the site screens, which exist in a single (light) design.

| Screen cited in the request | What it defines for this feature | Stitch screens that exist today (light / dark) |
|-----------------------------|----------------------------------|-------------------------------------------------|
| 0 Quadro do design system | Overall board of colors, typography, spacing, shapes and components | "Design system" / "Design system (Dark Theme)" |
| 1.1 Botões | Button variants and their states | Section of "Componentes do Design System" / "(Dark Theme)" |
| 1.5 Banner e diálogo | Banner and dialog components, including the update banner | Section of "Componentes do Design System" / "(Dark Theme)" |
| 2.8 Nova versão disponível | The "Nova versão disponível" banner with an "Atualizar" action above a screen's content, and the connection chip in the header | "Visitas (Com Atualização) - SSPC Studio" / "Visitas (Com Atualização - Dark Theme)" |
| 2.9 Sobre | About screen: app identity, version, connection state | "Sobre - SSPC Studio" / "Sobre (Dark Theme) - SSPC Studio" |
| Static site (not in the request's list; added because the site is part of this feature) | Temporary profile page and links page | "Página Temporária (Mobile)", "Página Temporária (Desktop)", "Links - Só Saio Pra Comer" |
| Design phase (screens the project does not have; created by this feature) | The confirmation dialog, the placeholder home screen "Início" and the insecure-connection notice (SEC-001) | "Confirmação de Atualização (Mobile) - SSPC Studio" / "Confirmação de Atualização (Mobile - Dark Theme) - SSPC Studio"; "Início (Mobile) - SSPC Studio" / "Início (Mobile - Dark Theme) - SSPC Studio"; "Início (Aviso de Conexão - Mobile) - SSPC Studio" / "Início (Aviso de Conexão - Mobile - Dark Theme) - SSPC Studio" (ids in research.md R-14) |

The Stitch screens are not yet named with the numbered convention used above (for example, "2.9 Sobre" is currently titled "Sobre - SSPC Studio"), and "1.1 Botões" and "1.5 Banner e diálogo" are not separate screens today. See Assumptions (A-002).

**Accepted deviations (FR-022, SC-007)**: on 2026-11-02 the owner (Augusto Silva) accepted the deviations between the design-phase screens (confirmation dialog, placeholder home, insecure-connection notice; light and dark) and their Stitch layout that are listed in research.md R-14, "Owner decision". The code follows `DESIGN.md` where it differs from those Stitch screens (FR-025).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add the app to the iPhone Home Screen and open it as a standalone app (Priority: P1)

A user opens the app's address in Safari on an iPhone, adds it to the Home Screen, and from then on taps the SSPC Studio icon to open it. It opens at once, full screen, like any other app: no Safari address bar, no tabs, no browser buttons.

**Why this priority**: Everything else in the product assumes the app lives on the Home Screen. Without this, the product does not exist for its primary users.

**Independent Test**: On an iPhone, open the app in Safari, add it to the Home Screen, close Safari, tap the new icon, and check name, icon, full-screen display and time to first screen.

**Acceptance Scenarios**:

1. **Given** the app opened in Safari on an iPhone, **When** the user chooses "Add to Home Screen", **Then** an icon named "SSPC Studio" with the brand icon is added.
2. **Given** the app is on the Home Screen, **When** the user taps its icon, **Then** it opens without any browser address bar or tabs, with its content respecting the iPhone's screen edges (notch, status bar and home indicator).
3. **Given** the app is on the Home Screen and was used before, **When** the user taps its icon, **Then** the first usable screen appears within 1 second (what counts as "usable" and how it is timed are defined in FR-003).
4. **Given** the app is open, **When** the user switches to another app and back, **Then** the app resumes where they left it.
5. **Given** a desktop browser, **When** the user opens the app, **Then** it works fully in the browser tab; installing it is possible but never required.

---

### User Story 2 - Open the app with no connectivity after the first load (Priority: P1)

After the app has been opened once with a connection, the user can open it from the Home Screen in airplane mode, in a lift, or in a restaurant with no signal, and every screen of the shell still works.

**Why this priority**: The product is used on the move, often with no signal. A shell that needs the network to open is not usable by its target users.

**Independent Test**: Open the installed app once online, turn on airplane mode, force-quit the app, open it again, and visit every screen.

**Acceptance Scenarios**:

1. **Given** the app was opened once with connectivity, **When** the user opens it from the Home Screen with no connectivity, **Then** the home screen appears and the connection chip shows the device is offline.
2. **Given** the app is open offline, **When** the user navigates to About, **Then** it opens and shows the version and that the device is offline.
3. **Given** the app is open offline, **When** the connection returns, **Then** the connection chip and the About screen change to online without reopening the app.
4. **Given** the app has never been opened with connectivity, **When** the user opens its address with no connectivity, **Then** the browser's own offline message appears; this is the only case in which the app is not available offline.
5. **Given** the first load is interrupted halfway by loss of connectivity, **When** the user opens the app again with connectivity, **Then** the load completes and the app works offline afterwards; it is never left half-installed.
6. **Given** the app was opened once with connectivity and the iPhone is on Wi-Fi but the server behind it is stopped or unreachable, **When** the user force-quits the app and opens it from the Home Screen, **Then** the app opens at once and every screen works, with no waiting for the server and no error page.
7. **Given** the app finished its first load with connectivity 10 seconds ago and the user has not visited every screen, **When** the device goes offline and the user force-quits and reopens the app and opens any screen, including About with its photo, **Then** that screen works completely, with no missing image or font (verified once the About screen and its photo exist: quickstart D2 step 5).

---

### User Story 3 - Verify the installed app on an iPhone over the home network (Priority: P1)

The developer, with no cloud environment yet, starts the companion API's local stack with its web option, opens the announced HTTPS address on their iPhone, installs the app to the Home Screen, and walks through a written verification procedure that covers installation, offline opening, themes, and the update flow.

**Why this priority**: The project rule is that nothing is done until verified in the installed app on an iPhone. With no cloud yet, this is the only way to meet that rule, so the other stories depend on it for acceptance.

**Independent Test**: From a clean checkout, follow the written procedure end to end on the iPhone and record every scenario as pass or fail.

**Acceptance Scenarios**:

1. **Given** the local stack running with its web option and an iPhone that already trusts the stack's certificate authority, **When** the developer opens the announced HTTPS address on the iPhone, **Then** the shell loads with no certificate warning.
2. **Given** the shell is open in Safari on the iPhone, **When** the developer follows the procedure to add it to the Home Screen, **Then** Stories 1 and 2 can be verified on the installed app.
3. **Given** the installed app was opened once, **When** the developer builds and serves a second version through the stack, **Then** Story 6 can be verified on the installed app without any cloud infrastructure.
4. **Given** the installed app was opened once with connectivity, **When** the developer force-quits it and launches it from the Home Screen first in airplane mode, and then with Wi-Fi on and the local stack stopped, **Then** in both situations the app opens and every screen works, and the stack's records show that it received no request for the app during either launch.
5. **Given** the developer has completed the procedure, **When** they record the results, **Then** the record states the iPhone model, the iOS version, the version of the app tested, the pass/fail result of every verification step, and, for each offline launch, that the stack received no request for the app.
6. **Given** the web option is not enabled in the stack, **When** the developer requests the app's address, **Then** the app is simply unavailable and the API's own health endpoint keeps answering; nothing else in the stack is affected.

---

### User Story 4 - Home screen and About screen show the version and connection state (Priority: P2)

On opening, the user sees a placeholder home screen that identifies the app and tells them that features are coming. From it they can reach an "About" screen that shows what the app is, which version is running, and whether the device is online.

**Why this priority**: These are the only visible screens of the shell. They prove the navigation, the design system and the version and connectivity plumbing that all later features need, and they give the developer and the owners something to check when asking "which version am I on?"

**Independent Test**: Open the app, go to About, compare the shown version with the version that was built, and toggle airplane mode to see the state change.

**Acceptance Scenarios**:

1. **Given** the app opens, **When** the first screen appears, **Then** it is the placeholder home screen, showing the app's name and a short message that more is coming, with a way to reach About.
2. **Given** the user is on the home screen, **When** they choose About, **Then** the About screen opens with a back control that returns to the home screen.
3. **Given** the About screen, **When** it is shown, online or offline, **Then** it shows the app's name and description, the version with its short build reference, the connection state as reported by the device ("Online" or "Offline"), and the storage-protection state ("Armazenamento"); none of these depend on connectivity.
4. **Given** the app is opened for the very first time with connectivity, **When** the user goes to About, **Then** it shows the same items as at any later time, with the connection state "Online" from the first moment, never a loading or unknown state.
5. **Given** the About screen is open, **When** the device goes offline or comes back online, **Then** the connection state updates by itself within 2 seconds.
6. **Given** a locally built, non-release version, **When** About is opened, **Then** it shows a version that identifies it as a development build, never a release number.
7. **Given** any screen of the shell, **When** it is shown, **Then** the header's connection chip ("Conectado" or its offline equivalent) is visible.

---

### User Story 5 - Portuguese interface in light and dark themes (Priority: P2)

Everything the user reads is in Brazilian Portuguese. The app follows the iPhone's appearance setting, light or dark, and looks like the Stitch designs in both.

**Why this priority**: The interface language and the two themes are product-wide commitments, and every future screen inherits them from this shell.

**Independent Test**: Switch the iPhone between light and dark while the app is open, and compare each screen of the shell and each component in the developer-only catalog with its Stitch design in both themes.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user reads any screen, label, message or control description, **Then** all of it is in Brazilian Portuguese.
2. **Given** the iPhone is set to light appearance, **When** the app opens, **Then** it uses the light theme; **given** dark appearance, **then** the dark theme.
3. **Given** the app is open, **When** the user changes the iPhone's appearance, **Then** the app switches theme at once, without reloading and without losing its place.
4. **Given** the developer-only catalog, **When** the developer opens it, **Then** it shows the buttons (all variants and states), the banner and the dialog, in both themes, matching the Stitch designs.
5. **Given** the app in production, **When** a user looks for the catalog, **Then** it is not reachable.
6. **Given** any text in the app, in either theme, **When** its contrast against its background is measured, **Then** it reaches at least 4.5:1 (3:1 for large text).

---

### User Story 6 - Be told about a new version, and update when I choose (Priority: P2)

When a new version has been deployed, the user sees a notice, "Nova versão disponível", with an "Atualizar" action. The notice does not cover or block anything. The user taps "Atualizar" when they are ready: not mid-sentence, not mid-flow. Nothing they are typing is lost or interrupted by the arrival of the notice, and the app never reloads by itself.

**Why this priority**: Without a safe update path, an installed app is stuck on its first version, or is replaced under the user's fingers and loses their writing. It must exist before any feature that holds user text.

**Independent Test**: With the installed app open, deploy a second version, bring the app to the foreground, type into an input, wait for the notice, keep typing, and then tap "Atualizar".

**Acceptance Scenarios**:

1. **Given** the installed app is open and a newer version has been deployed, **When** the app is opened, returns to the foreground or regains connectivity, **Then** the "Nova versão disponível" notice appears with an "Atualizar" action.
2. **Given** the notice is showing, **When** the user keeps using the app, **Then** every screen and control remains usable and nothing is hidden by the notice.
3. **Given** the user is typing in an input when the notice appears, **When** it appears, **Then** the typed text, the cursor and the focus are unchanged and the keyboard stays open.
4. **Given** the notice is showing, **When** the user ignores it, moves between screens, or sends the app to the background and returns, **Then** the app does not reload or switch version by itself, the current version keeps working, including offline, and the notice stays visible on every screen until the user updates; fully closing the app and opening it again starts the newest version, so the notice is gone.
5. **Given** the notice is showing and no field holds unsaved text, **When** the user taps "Atualizar", **Then** the app switches to the new version at once and the About screen then shows the new version.
6. **Given** the notice is showing and a field holds text that has not been saved, **When** the user taps "Atualizar", **Then** a dialog warns, in Portuguese, that the update restarts the app and that the text will be lost, and offers "Atualizar agora" and "Agora não".
7. **Given** that dialog is showing, **When** the user chooses "Agora não", **Then** the dialog closes, the app stays on the current version, and the text, cursor and focus are unchanged and the notice remains; **when** they choose "Atualizar agora", **then** the app switches to the new version.
8. **Given** the user taps "Atualizar" (or "Atualizar agora") but the update cannot complete (for example, the platform's service worker reports an unrecoverable state), **When** the failure is detected, **Then** the app stays on the current version, tells the user in Portuguese that the update did not complete, and offers to try again.
9. **Given** several versions were deployed since the user last opened the app, **When** they update, **Then** they go directly to the latest one; the notice never offers an intermediate version.
10. **Given** a newer version was deployed while the device was offline, **When** connectivity returns, **Then** the notice appears.

---

### User Story 7 - Every pull request is linted, tested, built and scanned (Priority: P3)

When the developer opens or updates a pull request, the repository automatically lints the code and the design source, runs the tests, builds the app and the site, and scans for vulnerable dependencies, committed secrets and vulnerable images. The result is shown on the pull request, naming any failing check.

**Why this priority**: Automated checks protect every later change. They matter from the first commit, but the product can be demonstrated without them, so they rank below the user-facing stories.

**Independent Test**: Open a pull request that is clean, then open one that breaks each check in turn (a lint error, a failing test, a build over its size budget, a vulnerable dependency, an exposed secret) and verify each is reported.

**Acceptance Scenarios**:

1. **Given** a pull request into `develop` or `main`, **When** it is opened or updated, **Then** lint, tests, build and scans all run on its latest commit and each result appears on the pull request.
2. **Given** a pull request where one check fails, **When** it is viewed, **Then** the failing check is named and visible, and the other checks still report.
3. **Given** a pull request that breaks an architectural boundary rule or a design-token rule, **When** checks run, **Then** lint fails.
4. **Given** a pull request that changes the design source without regenerating the values derived from it, **When** checks run, **Then** a check fails.
5. **Given** a production build larger than the size budget, **When** checks run, **Then** the build check warns at the warning threshold and fails at the error threshold.
6. **Given** a pull request that introduces a known-vulnerable dependency, an exposed secret, or an image with a high or critical vulnerability, **When** scans run, **Then** the corresponding scan fails.
7. **Given** a merge into `develop` or `main`, **When** it completes, **Then** the same checks run on the resulting state of the target branch.
8. **Given** any run of the checks, **When** it executes, **Then** it publishes and deploys nothing and holds no deployment secrets.

---

### User Story 8 - The static profile site, built as its own image (Priority: P3)

A visitor to sosaiopracomer.com sees the brand's temporary profile page and can reach its links page, which lists the brand's public links. The site is static, in Brazilian Portuguese, and is produced as its own image, separate from the app.

**Why this priority**: The site is independent of the app and has no installation or offline requirement. It lives in this repository and shares the versioning and checks, so it is part of this feature, but nobody is blocked by it.

**Independent Test**: Build the site image, run it, open its two pages on a phone and a desktop, check each required item and each link's destination against FR-033 and FR-034, and confirm the app image and the site image are separate artifacts.

**Acceptance Scenarios**:

1. **Given** the site's image is running, **When** a visitor opens its home page, **Then** they see the brand's temporary profile page in Brazilian Portuguese with all the content listed in FR-033, including a "Ver nossos links" button.
2. **Given** the home page, **When** the visitor taps "Ver nossos links", **Then** the links page opens, showing all the content listed in FR-034, and each of its three links opens its destination.
3. **Given** the links page, **When** it is opened directly by its address, **Then** it loads without going through the home page.
4. **Given** a phone screen and a desktop screen, **When** the visitor opens the home page, **Then** each shows the layout designed for it.
5. **Given** the repository, **When** the images are built, **Then** the app and the site are two separate images, neither containing the other, and each can be built and run without the other.
6. **Given** a pull request, **When** checks run, **Then** the site is built and its image scanned exactly as the app's, and a content check starts the built image, requests both pages and confirms the content of FR-033 and FR-034, that "Ver nossos links" reaches the links page and that each link's destination is well formed, without contacting any outside site.
7. **Given** a pull request that removes a required item from either page, breaks the button to the links page, or malforms a link's destination, **When** checks run, **Then** the content check fails and names what is missing.
8. **Given** an outside destination (for example Instagram) that is down or blocks automated visitors, **When** checks run, **Then** the result is unaffected, because no outside site is contacted.

---

### Edge Cases

- **First load with no connectivity**: the browser's own offline message appears; the app cannot do anything before it has been loaded once. After the first successful load it never happens again.
- **iOS clears the app's stored files** (for example, after long disuse or a storage clean-up): the next open behaves like a first load and needs connectivity; the app never shows a half-working state.
- **A new version is deployed while the user is offline**: nothing happens until connectivity returns; no error is shown for something that cannot be known.
- **The user ignores the notice for days**: the old version keeps working fully, including offline; the notice stays visible on every screen, and each time the app returns from the background, until the user updates or fully restarts the app (a restart opens the newest version).
- **The user taps "Atualizar" while offline**: the new version is already on the phone (the notice appears only after it was downloaded) and switching versions needs no connection, so the update applies as usual and the app then runs the new version offline.
- **The user taps "Atualizar" with unsaved text in a field**: the dialog of FR-012 appears first; the text is lost only if the user chooses "Atualizar agora".
- **Connectivity flaps** (online, offline, online within seconds): the connection chip settles on the real state without flicker or false "Offline" after the connection is back.
- **Wi-Fi connected but the server unreachable** (for example, the local stack is stopped, or the router has no internet): the chip and About show "Online", because the iPhone reports a connection; the app still opens and works from its stored files.
- **A deploy happens mid-update**: the user ends on one coherent version, never on a mix of files from two versions.
- **Appearance changes while the notice or a dialog is open**: they switch theme with the rest of the screen, without closing.
- **Large text and small phones**: with the iPhone's larger text sizes and on the narrowest supported screen (320 CSS pixels wide, A-006), no text is cut off and all controls remain reachable.
- **Reduced motion**: when the iPhone asks for reduced motion, the app avoids non-essential animation.
- **The local stack's web option is off or the app's image fails to start**: only the app's address is unavailable; the stack's API health answer is unaffected.
- **The phone does not yet trust the local certificate authority**: the app cannot be installed; this is handled by the companion API's own procedure, and the verification procedure points to it instead of repeating it.
- **A link on the links page is unavailable**: the page still loads and the other links work; the site never fails because of a destination.

## Requirements *(mandatory)*

### Functional Requirements

**Installation and launch**

- **FR-001**: The app MUST be installable to the iPhone Home Screen from Safari, with the name "SSPC Studio", the brand icon and background and theme colors matching the design.
- **FR-002**: Launched from the Home Screen, the app MUST open as a standalone app, with no browser address bar or tabs, and keep its content clear of the screen's notch, status bar and home indicator.
- **FR-003**: On an iPhone, when the app has been opened before, its first usable screen MUST appear within 1 second of tapping its icon, with or without connectivity. The first usable screen is the first frame in which the app bar and the screen's content are visible and the screen responds to touch; it is timed on a screen recording of the iPhone (60 frames per second), counting from the frame where the tap on the icon registers to that frame.
- **FR-004**: The app MUST work in a desktop browser without installation; installation is optional there.

**Offline**

- **FR-005**: After one successful load with connectivity, every screen of the shell MUST open and work with no connectivity, including a cold launch from the Home Screen, from 10 seconds after that load completes on the home network. The load is complete when its first screen has appeared. This includes every image and font the screens use: none of them may need a second online visit to be available offline.
- **FR-006**: A first load interrupted by loss of connectivity MUST NOT leave the app half-installed; the next load with connectivity MUST complete it.
- **FR-007**: The app MUST NOT show a browser or network error page for any of its own screens once it has loaded successfully once.
- **FR-008**: The app MUST show whether the device is online in a connection chip visible in the header of every screen, and on the About screen, and MUST update both within 2 seconds of a change, without a reload. "Online" means the iPhone reports a network connection (Wi-Fi or cellular) and "Offline" means it reports none (for example, airplane mode); the app MUST NOT contact a server to decide. The state MUST be shown from the first screen the user sees, with no loading or unknown state.

**Updates**

- **FR-009**: The app MUST check for a newer deployed version when it is opened, returns to the foreground, and when connectivity returns. It MUST NOT depend on any background process, which iOS does not provide for web apps.
- **FR-010**: When a newer version exists, the app MUST show a non-blocking notice, "Nova versão disponível", with an "Atualizar" action. The notice MUST NOT hide content or prevent any interaction. It has no close control: it MUST stay visible on every screen, across screen changes and returns from the background, until the user updates or fully restarts the app.
- **FR-011**: The app MUST NOT reload, change version, or move focus until the user chooses "Atualizar" or fully restarts the app, which opens the newest version. Text being typed, the cursor and the open keyboard MUST be unaffected when the notice appears.
- **FR-012**: Choosing "Atualizar" MUST switch the app to the newest deployed version; About MUST then show that version. If a field holds text that has not been saved, the app MUST first show a dialog warning that the update restarts the app and that the text will be lost, offering "Atualizar agora" and "Agora não"; "Agora não" MUST leave the app, the text, the cursor and the focus unchanged, and the notice showing. With no unsaved text, the update MUST happen at once, with no dialog.
- **FR-013**: If an update does not complete, the app MUST remain on the current, working version, tell the user in Portuguese that the update did not complete, and offer to try again.
- **FR-014**: The app MUST at all times run exactly one coherent version, never a mix of files from two versions.
- **FR-015**: While the notice is unanswered, the current version MUST keep working fully, including offline.

**Screens and navigation**

- **FR-016**: The first screen MUST be a placeholder home screen that shows the app's name and a short message that features are coming, and a way to reach About.
- **FR-017**: The About screen MUST show the app's name and short description, the version with its short build reference as in the design, the connection state ("Online" or "Offline"), and the state of the device's protection of the app's stored data under "Armazenamento" ("Protegido no aparelho" when the device agreed to keep it, otherwise "Não protegido"), and MUST have a back control to the previous screen. On its first run the app MUST ask the device to keep its stored data and MUST keep the answer for About.
- **FR-018**: The version shown MUST be the version identifier assigned to that build, 100% of the time; pre-release builds MUST show their pre-release identifier, and local development builds MUST show an identifier that is plainly a development build and never a release number.
- **FR-019**: Navigation MUST offer only destinations that exist in this feature (home and About); entries for later features, from the Stitch designs, MUST NOT appear.

**Language, themes, accessibility**

- **FR-020**: All text the user reads or hears through assistive technology (screens, labels, messages, control descriptions) MUST be in Brazilian Portuguese, with the page's declared language set to it, and dates, times and numbers in that locale's format.
- **FR-021**: The app MUST provide light and dark themes, MUST start in the one matching the iPhone's appearance setting, and MUST switch live, without reload, when that setting changes. There is no in-app theme switch in this feature.
- **FR-022**: Every screen and component of this feature MUST match its Stitch design, light and dark, in color, type, spacing, shape and copy; deviations MUST be documented and accepted by the owner.
- **FR-023**: Controls MUST have large touch targets suited to one-handed use, labelled controls, a logical focus order, text contrast of at least 4.5:1 (3:1 for large text) in both themes, and MUST respect the iPhone's larger text sizes and reduced-motion setting.
- **FR-024**: Buttons (all variants and states from "1.1 Botões"), the banner and the dialog ("1.5 Banner e diálogo") MUST exist as reusable components, and MUST be reviewable, in both themes, in a catalog that is available during development and unreachable in production.
- **FR-025**: The visual rules (colors, typography, spacing, shapes, in both themes) MUST live in one design source file in the repository; the values the app uses MUST be generated from it, never edited by hand, and a mismatch between them MUST fail an automated check. Where a Stitch screen and the design source disagree, the design source wins.

**Quality gates**

- **FR-026**: Every push to a pull request into `develop` or `main` while it is open (its opening included), and every push to `develop` or `main` after a merge, MUST run automatically: linting (including architectural boundary rules and design-token rules), the design source checks, all automated tests, the production builds of the app and the site, a content check of the running site (see Story 8), and scans for vulnerable dependencies, exposed secrets and vulnerable images. Each result MUST appear on the pull request, and a failing check MUST be named.
- **FR-027**: The production build of the app MUST stay within a size budget: warning at 400 kB and error at 600 kB for the initial download.
- **FR-028**: The same checks MUST run after every merge into `develop` or `main`.
- **FR-029**: The checks MUST NOT publish, deploy, or hold deployment secrets.

**Images**

- **FR-030**: The app MUST be produced as a deployable image that serves the app on the port the sspc-api local stack expects. Both the app and site images MUST run as an unprivileged user, with a read-only root filesystem, all Linux capabilities dropped and no privilege escalation.
- **FR-031**: The static site MUST be produced as its own image, separate from the app's; neither image MUST contain the other's content, and each MUST build and run without the other.
- **FR-032**: Both images MUST be scanned for vulnerabilities as part of FR-026.

**Static profile site**

- **FR-033**: The site MUST have a home page, the brand's temporary profile page, in Brazilian Portuguese, and MUST follow the Stitch designs for the mobile and the desktop layouts. It MUST contain: the "Edição digital • Em obras" tag; the name "Só Saio Pra Comer" with the "Guia gastronômico" line; the headline "Reviews sinceros de restaurantes em Teresina."; the message that the site is coming soon; a "Ver nossos links" button that opens the links page; and the closing quote with "Teresina, Piauí".
- **FR-034**: The site MUST have a links page, reachable both from the home page and directly by its address. It MUST contain: the brand's photo, name and tagline; exactly three links, Instagram, TikTok and "Parcerias com marcas" (a partnerships email contact), each opening its destination; and the note that reviews are not open to paid placement and that brand projects are always identified as advertising.
- **FR-035**: The site MUST be fully static, requiring no sign-in, using no cookies or browser storage, making no third-party requests, and working without the app. The site image MUST NOT produce access logs; future hosting infrastructure may process network data and requires its own privacy review.

**Verification on a real iPhone**

- **FR-036**: The repository MUST contain a written procedure with which the developer, using the sspc-api local stack's web option, opens the app on an iPhone over the home network, installs it to the Home Screen, and verifies Stories 1, 2, 4, 5 and 6, including the update check (serving a second version) and two offline checks. Each offline check MUST force-quit the installed app and then launch it from the Home Screen: once in airplane mode, and once with Wi-Fi on and the local stack stopped.
- **FR-037**: The procedure MUST produce a record that states the iPhone model, the iOS version, the app version tested, and pass or fail for each verification step. For each offline launch, the record MUST also state that the local stack received no request for the app during that launch, as evidence that it opened from the phone's own stored files.
- **FR-038**: The procedure MUST point to the companion API's procedure for trusting its local certificate authority instead of duplicating it.

**Design gap**

- **FR-039**: The confirmation dialog (FR-012), the placeholder home screen (FR-016) and the insecure-connection notice (SEC-001) have no Stitch design, so they MUST be created in the Stitch project, in light and dark, and aligned with the design source through a recorded review loop, before the components and pages that use them are built. The phase creates and edits only those new screens, changes no existing screen, design system or project, and has the owner approve every change made in Stitch.

### Key Entities

- **App version**: the identifier assigned to a build (release, pre-release or development) with its short build reference; shown on About and used to decide whether a newer version exists.
- **Connection state**: whether the iPhone reports a network connection ("Online") or none ("Offline"), shown in the header chip and on About. It says nothing about whether any server can be reached.
- **Storage protection**: whether the device agreed to keep the app's stored data ("Protegido no aparelho") or not ("Não protegido"); asked once on the first run and shown on About.
- **Update state**: for the running app, one of: no update, update available (notice showing), update applying, update failed (with retry).
- **Theme**: light or dark, derived from the device's appearance setting.
- **Design source**: the single repository file holding the visual rules, from which the values used by the app are generated.
- **Quality-gate result**: the pass or fail outcome of each automated check on a pull request, named and visible on it.
- **Image**: a deployable build artifact; there are two, the app and the static site.
- **Site link**: one entry on the links page, with a label and a destination.
- **Verification record**: the dated outcome of the iPhone procedure (device, iOS version, app version, per-step results, and for each offline launch the evidence that the stack received no request for the app).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the developer's iPhone, in 10 consecutive launches from the Home Screen (5 online, 5 offline), the first usable screen (defined in FR-003) appears within 1 second every time, measured on a screen recording.
- **SC-002**: In 10 consecutive cold launches after one online load, taken at least 10 seconds after that load completed (5 in airplane mode, 5 with Wi-Fi on and the local stack stopped), every launch shows the app, the browser's offline error page never appears, and the stack records no request for the app during any of them.
- **SC-003**: In 20 trials of typing into an input while a new version is announced, 100% preserve the typed text and focus, and the app never reloads before the user chooses "Atualizar".
- **SC-004**: From the moment the app is opened, returns to the foreground or regains connectivity with a newer version deployed, the notice appears within 5 seconds in 100% of 10 trials.
- **SC-005**: After updating, the version shown on About equals the deployed version in 100% of trials, and no trial leaves the app on a mix of two versions.
- **SC-006**: 100% of the text the user reads in the shell, in both themes, is in Brazilian Portuguese, and 100% of text meets a contrast of 4.5:1 (3:1 for large text). The contrast is checked from the design tokens by an automated test; the layout is confirmed on the iPhone (clarified 2026-11-02).
- **SC-007**: A side-by-side comparison of every screen and component listed in the Design Reference, in both themes, on the iPhone finds no deviation that the owner has not accepted.
- **SC-008**: 100% of pull requests into `develop` or `main` show a result for every check within 10 minutes of the push, and a deliberately broken change for each check (lint, test, build size, dependency, secret, image, site content) is caught by that check in 100% of trials.
- **SC-009**: A developer starting from a clean checkout, with the phone's certificate trust already done, can have the app installed on their iPhone and complete the written procedure within 30 minutes.
- **SC-010**: A visitor can go from the site's home page to any link on the links page in no more than 2 taps, and the site's pages are fully visible within 2 seconds on a typical mobile connection.
- **SC-011**: The app image and the site image are two separate artifacts in 100% of builds; building or changing one never changes the other.
- **SC-012**: For each of the three screens in each theme, the last round of the recorded review finds no deviation from the design source, in at most 5 rounds per screen (or the owner has accepted the remaining deviation by name and date), and the existing Stitch screens and design systems are the same before and after the phase.

## Assumptions

- **A-001 (Scope: a shell only)**: This feature has no sign-in, no stored user text, no synchronization and no calls to the API. It stores app files in the service worker cache and the `sspc.storage.requested` flag in localStorage; it stores no other user data. The Stitch designs contain elements that belong to later features, and they are out of scope here: the "Última sincronização" row and the "Sair da conta" action on About, the "Visitas" and "Perfil" entries of the navigation bar, and the sync status indicator. The forced update the API can request (an "upgrade required" answer) is also deferred, because the shell makes no API requests. The project rule that every screen works offline "after first sign-in" is read here as "after the first load", since no sign-in exists yet.
- **A-002 (Stitch naming)**: The five screen names cited in the request ("0 Quadro do design system", "1.1 Botões", "1.5 Banner e diálogo", "2.8 Nova versão disponível", "2.9 Sobre") do not exist in the Stitch project as of 2026-11-01. The nearest screens are in the Design Reference table; "1.1 Botões" and "1.5 Banner e diálogo" are assumed to be sections of "Componentes do Design System" rather than separate screens. Per the project's design-source rules, the owner renames the screens (or confirms the mapping) in Stitch before planning; the plan then reads them through the Stitch tools and records layout, states and copy in its research notes. This specification neither creates nor edits any Stitch screen. The constitution (Principle VI) also calls the Stitch project "SSPC Studio" while it is titled "Só Saio Pra Comer Design System" today; the owner renames the project in Stitch or amends the constitution, and this feature follows whichever name is then current.
- **A-003 (Site designs)**: The request did not list the static site's screens. They exist in Stitch ("Página Temporária" for mobile and desktop, and "Links"), have no dark variant, and are therefore used as the site's only design; if the owner wants them left out of this feature's design scope, the Design Reference rows and FR-033 change accordingly. The site's required content is the one in FR-033 and FR-034, taken from those designs; the exact link destinations are supplied by the owner. Stitch has no desktop design for the links page, so on wide screens it keeps its mobile layout, centered.
- **A-004 (Verifying "typing is not interrupted")**: The shell has no writing feature yet, so SC-003 and Story 6 are verified with an input in the developer-only catalog, whose text counts as unsaved because the shell saves nothing. Features that later add real writing re-verify the same guarantee with real input; once they save text locally as it is typed, the dialog of FR-012 appears only when something is genuinely unsaved.
- **A-005 (Theme control)**: The theme follows the iPhone's appearance setting; there is no in-app switch because none appears in the Stitch designs.
- **A-006 (Platform)**: "iPhone" means the developer's own phone on an iOS release that Apple currently supports, with the installed app tested in Safari-installed mode. Behaviour on other devices and browsers is best effort. The narrowest screen supported is 320 CSS pixels wide, the width the component tests use.
- **A-007 (Local stack dependency)**: The sspc-api local stack already provides, or will provide, the trusted HTTPS address on the home network (its "Development Flow and iPhone Testing" feature), and its web option builds this repository's app image. This feature depends on both and does not change the API repository.
- **A-008 (Out of scope: release and hosting)**: Publishing versions and promoting them to production, container registry, deployment, domain names and DNS for sosaiopracomer.com are out of scope. This feature only produces the two images and checks them. The scripts that publish and promote versions are a later feature.
- **A-009 (Gate timing)**: The 10-minute result target in SC-008 and the 400 kB / 600 kB size thresholds in FR-027 come from the project's constitution and reasonable defaults for a small app; they can be revised in planning if measured values differ.
- **A-010 (Site data)**: The site's data rules are those of FR-035 (no cookies or browser storage, no third-party requests, no access logs) and SEC-008. Network operators may still process connection data; their controls belong to the hosting feature.
- **A-011 (Existing starting point)**: The repository already holds a scaffolded, installable web app with placeholder names and icons; this feature replaces those with SSPC Studio's own.
- **A-012 (Meaning of "online")**: "Online" is the iPhone's own report of a network connection, which can be wrong in both directions on a poor network (a connected Wi-Fi with no internet shows "Online"). Whether SSPC's server can actually be reached is not shown in this feature; the later synchronization feature owns that indicator.
- **A-013 (Stitch gaps found while planning; resolved by Phase 2, 2026-11-02, see the Design Reference)**: The Stitch project has no design for the placeholder home screen (only an "Início" navigation entry) and no dialog component (the boards show the update banner, an offline strip and an empty state, but no dialog). The insecure-connection notice of SEC-001 has none either. The plan records the three missing pieces in research.md (R-14) and adds a design phase before any component or page is built: the agent creates the six screens (three screens, light and dark) in the Stitch project through the Stitch tools, the owner approves every change made in Stitch, and a review loop corrects them until they match the design source (FR-039, SC-012). Principle VI of the constitution (v2.1.0) allows this: the agent may create a missing screen in Stitch after asking the owner, who approves every write. Once designed, the three screens are added to the Design Reference table.
- **A-014 (Navigation labels)**: Following the About design, which highlights the "Perfil" entry, the second navigation entry is labelled "Perfil" and opens the About screen (route `/sobre`); the owner can rename it.
- **A-015 (Resuming)**: "Resumes where they left it" (Story 1, scenario 4) means that the app does not reload or change screen by itself when the user switches to another app and comes back while the page is still alive. The shell stores no screen state, so if iOS discards the page after a long absence the app starts again at its first screen; that is platform behaviour, observed and noted in the verification record (quickstart D2 step 6), not a failure of this feature.


## Security and privacy requirements (pre-tasks review)

- **SEC-001**: Both images MUST serve the response headers and CSP in the HTTP serving contract. Production is reachable only via an HTTPS origin; the existing local stack edge provides TLS for the trusted LAN address. Its current configuration disables automatic redirects; local HTTP must not be treated as secure. The future hosting feature owns HTTPS redirection and HSTS and must define and verify them before public deployment. On plain HTTP, except browser-trusted loopback development origins, the app MUST show “Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.” and MUST NOT register a service worker or add any install control. Offline operation and installation are unsupported there; the browser's own Add to Home Screen stays outside the app's control and does not give an offline app. If the browser blocks an untrusted certificate before loading the app, its own warning is shown; the procedure MUST instruct the user not to bypass it and to use the trusted HTTPS address.
- **SEC-002**: The app MUST make no third-party requests, including analytics, error reporting, fonts and images. The service worker MUST cache only public app assets and MUST NOT cache API responses or user-specific data, including when later features add APIs.
- **SEC-003**: Updates MUST originate from the app's own HTTPS origin; the worker verifies asset hashes in the update manifest before serving a coherent version. This detects inconsistent assets but does not protect against compromise of the origin or build pipeline. A security fix may be delayed until the user updates or restarts; forced HTTP 426 updates belong to the future API integration feature. Recovery requires deploying a corrected version or rollback as a new update; if that fails, remove the installed app and its site data and reinstall from a trusted origin.
- **SEC-004**: Production builds MUST omit source maps and development-only code. Build arguments MUST contain no secrets. The catalogue-enabled build is for local testing only and MUST NOT be published; the future release feature MUST inspect the exact candidate image digest for catalogue routes, assets and chunks before promotion; a finding or inability to inspect blocks promotion. After publication it MUST pull the published digest and repeat the check as specified in the HTTP contract.
- **SEC-005**: Both images MUST include only their runtime server, configuration and the explicitly allowlisted built public assets, excluding source, tests, specifications, build files and design sources from the served tree. Base images MUST be pinned by digest and updated through reviewed changes.
- **SEC-006**: Dependency and image scans MUST fail on high or critical findings whether or not a fix exists, including development dependencies used during builds. An owner may approve a specific finding as an exception in a version-controlled record with rationale, compensating controls, approver and expiry no later than 30 days; expired exceptions fail the gate. Remediate within 30 days or renew only after a fresh owner review.
- **SEC-007**: CI uses a read-only repository token, does not persist checkout credentials, pins third-party actions to full commit hashes and verifies downloaded tools. Untrusted pull requests receive no secrets or write token; their code runs only in isolated CI. Checks are advisory where branch protection is unavailable: the owner checks every result before merging, accepting the residual risk of bypass.
- **SEC-008**: The site emits no access log. The app emits no production access log in this feature. For local offline verification only, an opt-in test proxy between the local edge and app counts forwarded requests in memory without recording client addresses, headers, paths, query strings, timestamps or identifiers. The counter is read only through a local container command, is never exposed as an HTTP endpoint, and is reset when the proxy stops. The normal stack has no counter or access log. Production logging and retention are owned by the future hosting feature and require a privacy review.
- **SEC-009**: Before publishing owner-supplied images, remove location, device and other embedded metadata. The owner must confirm permission to publish each person's name and photo and explicitly accept public exposure of the partnerships email to scrapers before release. External web links open in a new context with no opener access and no referrer; the email link uses mailto.
- **SEC-010**: LAN tests use synthetic data only. At the end of the test period, stop LAN exposure, remove the local CA trust and any installed profile from the phone, and clear site data and the installed app. Record completion. Committed verification records MUST exclude LAN addresses, hostnames, device identifiers, certificate fingerprints, client addresses and raw log excerpts.
- **SEC-011**: The app and site are intentionally reachable without sign-in by anyone who can reach their addresses. Version and build reference are public diagnostic identifiers and MUST contain no secret or personal information. Sign-in, API authentication and protection of locally stored user text belong to the later authentication and offline-data features. LGPD applicability and legal obligations for both the two-user app and public site are outside this shell feature; before public launch the owner reviews them and seeks qualified legal advice if uncertain. The owner also confirms permission for each published name and photo.
- **SEC-012**: If a browser prompts for persistent storage, the browser's native prompt is shown; dismissal or refusal leaves the app usable with storage shown as unprotected. Request at most once per browser profile, including dismissal; a user can change browser settings independently.


## Threat model and ownership

Assets are the public app and site assets, update integrity, build inputs and images, local CA trust, and the privacy of the two users and site visitors. Actors include visitors, the two owners/developers, untrusted pull-request contributors, network observers and attackers controlling a dependency, origin or build input. Trust boundaries are browser to HTTPS edge, edge to image, phone to home LAN and trusted CA, contributor to CI, and CI inputs to generated images. SEC-001 through SEC-012 address browser/network, update, data, build and testing threats respectively; origin or CI compromise remains a residual risk requiring incident response and a trusted rebuild.

The future authentication feature owns sign-in and API authentication; the future offline-data feature owns protection of locally stored user text; API integration owns forced updates; the release feature owns published-image checks; and the hosting feature owns production TLS and logging. These are ownership labels, not claims that those feature specifications already exist.

### Threat-to-requirement trace

- Network interception, hostile origins and browser injection: SEC-001, SEC-002 and the serving header contract.
- Tampered or stale updates, and cached private responses: SEC-002 and SEC-003.
- Leaked source, build secrets, test catalogue or image contents: SEC-004 and SEC-005.
- Vulnerable dependencies, compromised build inputs, secret exposure and bypassed checks: SEC-006 and SEC-007.
- Exposure of visitor or test data through logs, public content or retained phone trust: SEC-008, SEC-009 and SEC-010.
- Mistaken assumptions about public reachability, privacy obligations or persistent storage: SEC-011 and SEC-012.


### Published-image validation handoff

The future sibling-repository release workflow builds the web image and publishes a candidate to a local registry for the current manual phase; an agreed push or pull-request event may trigger it when automated hosting is configured. Capture the immutable registry digest, pull that digest into the SSPC validation environment and run it with the local API stack. Check shell and static assets, use an explicit same-origin API health request to establish routing to the expected backend (the shell itself makes no API calls in this feature), and inspect browser console and network responses for errors. Inspect the exact image for catalogue content and check `/_ds` does not load the catalogue. Record digest, source revision, environment, date and pass/fail evidence in phase validation notes. A failed or missing check blocks promotion; a published candidate failing verification must not be promoted. This is a future release workflow, not a change to the current no-publication CI contract.
