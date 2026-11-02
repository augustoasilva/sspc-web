# SspcStatusChip

Selector: `sspc-status-chip`.

**Purpose**: shows a short state, such as the connection in the app bar or a storage state on About.

**Tones**: `positive` (sage container), `neutral` (default; surface-container-high), `attention` (gold container).
**Inputs**: `tone` (neutral), `dot` (false) for an 8 px status dot.
**Slots**: `[icon]`, default (label).

**Accessibility**: `role="status"`, so a state change is announced. The dot is decorative.

**Motion**: the dot pulses; the pulse stops under `prefers-reduced-motion` (the common motion rule of contracts/ui-components.md).

**Copy**: none; the label is supplied by the caller.

## Test cases

| Given | When | Then |
|-------|------|------|
| each tone | rendered | the tone is reported and the label is kept |
| dot true | rendered | the dot is present |
| each tone | axe | no violations |
