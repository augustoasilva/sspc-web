# SspcTabBar

Selector: `sspc-tab-bar`, a `nav` landmark.

**Purpose**: bottom navigation between the app's top-level destinations ("Início", "Perfil" in this feature).
**Inputs**: `items` (`{ id, label, path, icon }[]`), `activeId`, `ariaLabel` ("Principal").
**Outputs**: `select(id)`.

**Behaviour**: items are anchors with `href`. The component prevents the default navigation and emits; the shell navigates through the router. The active item has `aria-current="page"`, is bold, and uses the primary color.

**Layout**: 64 px plus the bottom safe area; items at least 48×48; labels 12/600.

**Copy**: none; labels come from the caller.

## Test cases

| Given | When | Then |
|-------|------|------|
| an active id | rendered | that item is the current page |
| a tab item | clicked | select emits its id; no default navigation |
| the bar | axe | no violations |
