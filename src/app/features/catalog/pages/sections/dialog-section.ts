import { Component, signal } from '@angular/core';
import { SspcButton } from '@sspc/ui/button/button';
import { SspcDialog } from '@sspc/ui/dialog/dialog';

// Catalogue section for SspcDialog (T082): the update confirmation (FR-012) opened by a
// trigger. Closing it, by either action, returns focus to the trigger.
@Component({
  selector: 'sspc-dialog-section',
  imports: [SspcButton, SspcDialog],
  templateUrl: './dialog-section.html',
  styleUrls: ['./section.scss'],
})
export class DialogSection {
  protected readonly open = signal(false);
}
