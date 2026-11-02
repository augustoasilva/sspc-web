import { Component } from '@angular/core';
import { SspcListRow } from '@sspc/ui/list-row/list-row';

// Catalogue section for SspcListRow (T083): a label with a value, and a label alone.
@Component({
  selector: 'sspc-list-row-section',
  imports: [SspcListRow],
  templateUrl: './list-row-section.html',
  styleUrls: ['./section.scss'],
})
export class ListRowSection {}
