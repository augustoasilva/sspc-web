import { Component, booleanAttribute, computed, input, output } from '@angular/core';
import { SspcButton } from '../button/button';

export type BannerTone = 'info' | 'error';

// SspcBanner (contracts/ui-components.md): a message in the page flow with at most one
// action. No close control. The action is rendered only when a label is given.
@Component({
  selector: 'sspc-banner',
  imports: [SspcButton],
  templateUrl: './banner.html',
  styleUrl: './banner.scss',
  host: {
    role: 'status',
    'aria-live': 'polite',
    '[attr.data-tone]': 'tone()',
    '[class]': '"sspc-banner sspc-banner--" + tone()',
  },
})
export class SspcBanner {
  readonly tone = input<BannerTone>('info');
  readonly actionLabel = input<string | undefined>(undefined);
  readonly busy = input(false, { transform: booleanAttribute });
  readonly action = output<void>();

  protected readonly hasAction = computed(() => !!this.actionLabel());
}
