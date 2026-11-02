# SspcBanner

Selector: `sspc-banner`.

**Purpose**: a message shown in the page flow under the app bar, with at most one action.

**Tones**: `info` (default; secondary container), `error` (error container).
**Inputs**: `tone`, `actionLabel` (optional; no action when absent), `busy` (false; shows the action's loading state and disables it; ignored without an action).
**Slots**: `[icon]`, default (message).
**Outputs**: `action`, emitted only when an action is rendered.

**Layout**: radius 20, padding 16. With an action the message truncates on one line and the action stays on the right. With no action the message wraps (the insecure-connection notice is read in full).

**Accessibility**: `role="status"`, polite. No close control.

**Copy**: none; every message and label is supplied by the caller.

## Test cases

| Given | When | Then |
|-------|------|------|
| an action label | the action is clicked | the action output emits once |
| no action label | rendered | no button; no action output |
| busy with an action | rendered | the action is loading and disabled |
| a long message with an action | rendered | the message is marked to truncate |
| no action | rendered | the message wraps |
| tone error / info | rendered | the tone is reported |
| no action | axe | no violations |
