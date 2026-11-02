# Contract: `ui` components

**Feature**: [spec.md](../spec.md) | **Design source**: research.md R-14 | **Rules**: Principle V

Summary contracts for the seven components. Each component's own `README.md` (framework-neutral: purpose, variants, states, inputs, events, accessibility, test-case table) is written during implementation from this contract and must stay portable to Flutter. All styles use tokens only. Components import only Angular, the CDK, Lucide and tokens; they never inject services, call HTTP, or touch the router.

Common rules: `OnPush` change detection (the Angular 22 default: a component omits `changeDetection`, an explicit `OnPush` is tolerated, and `Default` or `Eager` is a lint error), `input()`/`output()`/`model()`, selector prefix `sspc`, minimum interactive target 48×48 px, focus ring `--sspc-stroke-focus` (2 px) in the `tertiary` color (Old Gold, as DESIGN.md names it; `dark-tertiary` in dark) with `--sspc-focus-offset` (2 px), a non-text indicator tested at 3:1, animations removed under `prefers-reduced-motion`, text contrast ≥ 4.5:1 in both themes, every user-visible string supplied by the caller (components hold no copy of their own).

## SspcButton (`button[sspc-button]`, `a[sspc-button]`)

| Input | Type | Default | Notes |
|-------|------|---------|-------|
| `variant` | `primary` \| `secondary` \| `ghost` \| `destructive` | `primary` | colors in research R-14 "1.1" |
| `shape` | `pill` \| `fab` \| `fab-extended` | `pill` | pill 48 px; fab 60×60 (`--sspc-component-fab-size`) radius 28 with the floating shadow `--sspc-elevation-floating`; extended is 60 px tall with a label |
| `loading` | boolean | false | shows the spinner, sets `aria-busy`, ignores clicks, keeps the label |
| `pressed` | boolean \| undefined | undefined | when defined the button is a toggle and sets `aria-pressed` |

Slots: default (label), `[icon]` leading icon. Output: none (native `click`). Disabled uses the native `disabled` attribute (opacity .4). States rendered: default, pressed (active), loading, disabled, focus-visible; light and dark.

Seed test cases: given `loading`, when clicked, then no `click` reaches the host handler and `aria-busy` is true; given `pressed=false`, when activated, then the owner flips it and `aria-pressed` follows; given each variant, then axe reports no violations (structure and names; contrast is asserted by T076 on the tokens, because axe cannot compute it under jsdom) and the target is ≥ 48 px.

## SspcBanner (`sspc-banner`)

| Input | Type | Default | Notes |
|-------|------|---------|-------|
| `tone` | `info` \| `error` | `info` | `info` = secondary container; `error` = error container |
| `actionLabel` | string \| undefined | undefined | label of the single action; **when absent no action is rendered** (the insecure-connection notice, SEC-001, has none) |
| `busy` | boolean | false | action shows loading while the update applies; ignored without an action |

Slots: `[icon]`, default (message). Output: `action` (emitted only when an action is rendered). No close control (spec clarification). `role="status"` with polite live region; the action, when present, is an `SspcButton` primary. Layout: radius 20, padding 16, row with message truncating on one line and the action on the right; in the page flow, never overlaying content. DESIGN.md lists the update banner among the elements that carry the soft shadow, so it uses `--sspc-elevation-floating`.

Seed cases: given a long message, when rendered at 320 px, then the message truncates and the action stays reachable; given `busy`, then the action is disabled with the loading state; given `tone=error`, then its text and container tokens reach ≥ 4.5:1 in both themes (T076); given no `actionLabel`, then no button is rendered and axe reports no violations. A message that must be read in full (the insecure-connection notice is two sentences) wraps instead of truncating when no action competes for the row.

## SspcDialog (`sspc-dialog`) — aligned with the Stitch design (Phase 2, T021; R-14)

| Input/Model | Type | Notes |
|-------------|------|-------|
| `open` (model) | boolean | renders the scrim and panel only when true |
| `heading`, `description` | string | linked by `aria-labelledby`/`aria-describedby` |
| `primaryLabel`, `secondaryLabel` | string | primary = "Atualizar agora", secondary = "Agora não" in the update use |

Outputs: `primary`, `secondary`. `role="alertdialog"`, modal, focus trapped (CDK `A11yModule`), initial focus on the **secondary** (safe) action, Escape and scrim click act as secondary, focus returns to the previous element on close. Panel: radius 20, `surface-container-low`, padding 20, actions stacked (primary over ghost); panel shadow `--sspc-elevation-floating`; scrim at 50 %.

Seed cases: given open, when Escape, then `secondary` emits and focus is restored; given open, then focus cannot leave the panel with Tab; given open, then typed text and the cursor of a field behind it are unchanged.

## SspcStatusChip (`sspc-status-chip`)

| Input | Type | Default | Notes |
|-------|------|---------|-------|
| `tone` | `positive` \| `neutral` \| `attention` | `neutral` | positive = sage container, neutral = surface-container-high, attention = gold container |
| `dot` | boolean | false | 8 px status dot (pulses; still under reduced motion) |

Slots: `[icon]`, default (label). Used as the header connection chip ("Conectado" positive with dot and `wifi`; "Sem conexão" neutral with `wifi-off`) and the About chips ("Online"/"Offline", storage state). `role="status"` when used for live state. Label 12/600, padding 8×4 (research G11), pill.

## SspcListRow (`li[sspc-list-row]`)

Input `label` (string); slots `[icon]` (20 px) and default (value, right-aligned). Min height 40, hairline divider between rows from the parent's `ul[sspc-list]`-style styling (the parent card is the About page's `section`; the divider is part of the row). Label 16/400 in `on-surface-variant`.

## SspcAppBar (`sspc-app-bar`)

| Input | Type | Notes |
|-------|------|-------|
| `heading` | string | 22/650 on back-navigation screens, 18/600 with an overline |
| `overline` | string \| undefined | e.g. "SSPC STUDIO" (12/600, uppercase, tracked) |
| `showBack` | boolean | back button 48×48 with an accessible name from `backLabel` |
| `backLabel` | string | caller-supplied ("Voltar") |

Slot `[end]` (the connection chip). Output `back`. Fixed, 64 px high plus the top safe area, tonal `surface` background with no blur and no shadow (DESIGN.md: depth comes from tonal layers; research R-14 records none on the Stitch header); `role="banner"`.

## SspcTabBar (`sspc-tab-bar`)

| Input | Type | Notes |
|-------|------|-------|
| `items` | `{ id, label, path, icon }[]` | in this feature: "Início" (`/`), "Perfil" (`/sobre`) |
| `activeId` | string | active item is bold in the primary color with a filled icon |
| `ariaLabel` | string | name of the `nav` landmark ("Principal") |

Output `itemSelect(id)` (renamed from `select`: a `select` output clashes with the native DOM event, rejected by `@angular-eslint/no-output-native`); items render as anchors with `href` and the component calls `preventDefault()` then emits, so the shell navigates through the router. `aria-current="page"` on the active item. Height 64 plus the bottom safe area; items ≥ 48×48; label 12/600.

## Catalogue (`/_ds`, development only)

One section per component listing every variant and state in light and dark (the theme follows the device; a section also forces the opposite theme through a scoped `color-scheme` wrapper for review). Contains one text input registered with `UnsavedWork` so the update dialog and "typing is not interrupted" can be verified (A-004). Not present in production builds (research R-15).
