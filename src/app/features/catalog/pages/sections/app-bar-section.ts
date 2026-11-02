import { Component } from '@angular/core';
import { LucideWifi } from '@lucide/angular';
import { SspcAppBar } from '@sspc/ui/app-bar/app-bar';
import { SspcStatusChip } from '@sspc/ui/status-chip/status-chip';

// Catalogue section for SspcAppBar (T083): the top-level bar with an overline, the top-level
// bar without one, and the back-navigation bar. Each heading uses the size of its level, so
// the top-level and back-navigation headings match (app-bar README).
@Component({
  selector: 'sspc-app-bar-section',
  imports: [SspcAppBar, SspcStatusChip, LucideWifi],
  templateUrl: './app-bar-section.html',
  styleUrls: ['./section.scss'],
})
export class AppBarSection {}
