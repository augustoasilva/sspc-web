import { Component } from '@angular/core';
import { LucideWifi, LucideWifiOff } from '@lucide/angular';
import { SspcStatusChip } from '@sspc/ui/status-chip/status-chip';

// Catalogue section for SspcStatusChip (T083): each tone with and without the status dot.
@Component({
  selector: 'sspc-status-chip-section',
  imports: [SspcStatusChip, LucideWifi, LucideWifiOff],
  templateUrl: './status-chip-section.html',
  styleUrls: ['./section.scss'],
})
export class StatusChipSection {}
