# SspcButton

Framework-neutral specification. Selector: `button[sspc-button]`, `a[sspc-button]`.

**Purpose**: the one button of the app, for every action and toggle.

**Variants**: `primary` (default), `secondary`, `ghost`, `destructive`.
**Shapes**: `pill` (default, 48 px tall), `fab` (60×60, radius 28, floating shadow), `fab-extended` (60 px tall with a label).

**Inputs**: `variant`, `shape`, `loading` (false), `disabled` (false), `pressed` (undefined; two-way with `[(pressed)]`).
**Slots**: default (label), `[icon]` (leading icon).
**Outputs**: none; the native `click` is used.

**States**: default, pressed (active), loading, disabled (opacity 0.4), focus-visible (2 px ring in the tertiary color, 2 px offset).

**Behaviour**: `loading` keeps the label, sets `aria-busy`, and swallows clicks. A defined `pressed` makes the button a toggle, with `aria-pressed` following the state.

**Accessibility**: native button or link, a name from the label, a focus ring that is not text-based (3:1 is checked on the tokens, T076). The 48 px target is verified on the device (T085). Motion (the spinner) stops under reduced motion.

**Copy**: none; every label is supplied by the caller.

## Test cases

| Given | When | Then |
|-------|------|------|
| loading | clicked | no click reaches the consumer; aria-busy is true |
| not loading | clicked | the consumer receives the click |
| pressed is false | activated | pressed becomes true; aria-pressed follows |
| each variant | axe | no violations |
