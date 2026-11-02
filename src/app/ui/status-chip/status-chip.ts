import { Component, input } from '@angular/core';

export type StatusChipTone = 'positive' | 'neutral' | 'attention';

// SspcStatusChip (contracts/ui-components.md): a pill with an optional 8 px status dot,
// used for the header connection state and for About's state chips. It is a live
// status region, so the state is announced when it changes.
@Component({
  selector: 'sspc-status-chip',
  templateUrl: './status-chip.html',
  styleUrl: './status-chip.scss',
  host: {
    role: 'status',
    '[attr.data-tone]': 'tone()',
    '[class]': '"sspc-status-chip sspc-status-chip--" + tone()',
  },
})
export class SspcStatusChip {
  readonly tone = input<StatusChipTone>('neutral');
  readonly dot = input(false);
}
