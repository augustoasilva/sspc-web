import { Component, input, output } from '@angular/core';
import { LucideArrowLeft } from '@lucide/angular';

// SspcAppBar (contracts/ui-components.md): the top bar. A tonal surface with no blur
// and no shadow; the top safe area is padded with the env() custom property.
@Component({
  selector: 'sspc-app-bar',
  imports: [LucideArrowLeft],
  templateUrl: './app-bar.html',
  styleUrl: './app-bar.scss',
  host: {
    role: 'banner',
    '[class.sspc-app-bar--overline]': '!!overline()',
  },
})
export class SspcAppBar {
  readonly heading = input.required<string>();
  readonly overline = input<string | undefined>(undefined);
  readonly showBack = input(false);
  readonly backLabel = input.required<string>();
  readonly back = output<void>();
}
