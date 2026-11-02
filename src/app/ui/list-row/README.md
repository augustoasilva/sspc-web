# SspcListRow

Selector: `li[sspc-list-row]`, inside a list.

**Purpose**: one labelled value in a list, such as the version on About.
**Inputs**: `label`.
**Slots**: `[icon]` (20 px), default (the value, right-aligned).

**Layout**: minimum height 40; the hairline divider is part of the row and is removed from the last row; label 16/400 in `on-surface-variant`.

**Copy**: none; the caller supplies the label and value.

## Test cases

| Given | When | Then |
|-------|------|------|
| a label and a value | rendered | both are shown |
| an empty value | rendered | the value is empty |
| a list of rows | axe | no violations |
