import { Component, input, output } from '@angular/core';
import { LucideCalendar, LucideHouse, LucideUser } from '@lucide/angular';

export interface TabItem {
  id: string;
  label: string;
  path: string;
  icon: 'house' | 'user' | 'calendar';
}

// SspcTabBar (contracts/ui-components.md): the bottom navigation. Items are anchors, so
// they keep their href; the component prevents the default navigation and emits, and
// the shell navigates through the router.
@Component({
  selector: 'sspc-tab-bar',
  imports: [LucideCalendar, LucideHouse, LucideUser],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
  host: {
    '[attr.aria-label]': 'ariaLabel()',
    role: 'navigation',
  },
})
export class SspcTabBar {
  readonly items = input.required<TabItem[]>();
  readonly activeId = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly itemSelect = output<string>();

  protected onClick(event: MouseEvent, id: string): void {
    event.preventDefault();
    this.itemSelect.emit(id);
  }
}
