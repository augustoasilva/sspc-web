import { Component, input } from '@angular/core';

// SspcListRow (contracts/ui-components.md): one row of a list, with an optional 20 px
// icon, a label and a right-aligned value. The hairline divider is part of the row.
@Component({
  selector: 'li[sspc-list-row]',
  templateUrl: './list-row.html',
  styleUrl: './list-row.scss',
  host: { class: 'sspc-list-row' },
})
export class SspcListRow {
  readonly label = input.required<string>();
}
