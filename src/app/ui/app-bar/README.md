# SspcAppBar

Selector: `sspc-app-bar`, role `banner`.

**Purpose**: the top bar of every screen.
**Inputs**: `heading`, `overline` (optional, e.g. "SSPC STUDIO"), `showBack` (false), `backLabel` (caller-supplied, "Voltar").
**Slots**: `[end]` (the connection chip).
**Outputs**: `back`.

**Layout**: 64 px high plus the top safe area; tonal `surface`; no blur and no shadow (depth comes from tonal layers). With an overline the heading is 18/600; on back-navigation screens it is 22/650. The back control is 48×48 with an accessible name.

**Copy**: none; the caller supplies the heading, overline and back label.

## Test cases

| Given | When | Then |
|-------|------|------|
| heading only | rendered | the heading shows; no overline |
| overline | rendered | the overline shows |
| showBack | back clicked | back emits; the control is named by the caller |
| no showBack | rendered | no back control |
| heading and back | axe | no violations |
