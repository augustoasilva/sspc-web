# SspcDialog

Selector: `sspc-dialog`.

**Purpose**: a modal confirmation. Used for the update: "Nova versão disponível".

**Model**: `open` (two-way; renders the scrim and panel only when true).
**Inputs**: `heading`, `description`, `primaryLabel` ("Atualizar agora"), `secondaryLabel` ("Agora não"), all supplied by the caller.
**Outputs**: `primary`, `secondary`.

**Layout** (aligned with the Stitch design, Phase 2): panel radius 28, `surface-container`, padding 20; heading 28 px (`headline-md`); body `body-md`; the primary action above the secondary, both full width at 48 px.

**Behaviour**: `role="alertdialog"`, modal, focus trapped (CDK). Initial focus goes to the secondary action (the safe choice). Escape and a scrim click act as secondary. Focus returns to the opener on close. The field behind keeps its text and cursor.

**Accessibility**: labelled by the heading and described by the body.

**Copy**: none; the caller supplies every string.

## Test cases

| Given | When | Then |
|-------|------|------|
| open | Escape | secondary emits; closes; focus returns to the opener |
| open | scrim click | secondary emits; closes |
| open | primary clicked | primary emits |
| open | secondary clicked | secondary emits |
| closed | rendered | no dialog |
| open | rendered | the field behind keeps its text |
| open | axe | alertdialog, modal, no violations |
