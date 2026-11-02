import { Component } from '@angular/core';
import { LucidePlus } from '@lucide/angular';
import { SspcButton } from '@sspc/ui/button/button';

// Catalogue section for SspcButton (T080, research R-14 §1.1): every variant in its default,
// pressed, loading and disabled states, and the pill, FAB and extended FAB shapes.
@Component({
  selector: 'sspc-button-section',
  imports: [SspcButton, LucidePlus],
  templateUrl: './button-section.html',
  styleUrls: ['./section.scss'],
})
export class ButtonSection {
  protected readonly variants = ['primary', 'secondary', 'ghost', 'destructive'] as const;
  protected readonly states = ['default', 'pressed', 'loading', 'disabled'] as const;
}
