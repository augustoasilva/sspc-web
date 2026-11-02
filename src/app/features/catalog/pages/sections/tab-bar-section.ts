import { Component } from '@angular/core';
import { SspcTabBar, TabItem } from '@sspc/ui/tab-bar/tab-bar';

// Catalogue section for SspcTabBar (T083): the bar with each of its two items selected. The
// selection is shown only; the shell does the navigation, so the tap is not followed here.
@Component({
  selector: 'sspc-tab-bar-section',
  imports: [SspcTabBar],
  templateUrl: './tab-bar-section.html',
  styleUrls: ['./section.scss'],
})
export class TabBarSection {
  protected readonly items: TabItem[] = [
    { id: 'home', label: 'Início', path: '/', icon: 'house' },
    { id: 'about', label: 'Perfil', path: '/sobre', icon: 'user' },
  ];
}
