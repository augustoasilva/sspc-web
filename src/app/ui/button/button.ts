import { Component, ElementRef, booleanAttribute, computed, inject, input, model } from '@angular/core';
import { LucideLoaderCircle } from '@lucide/angular';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonShape = 'pill' | 'fab' | 'fab-extended';

// SspcButton (contracts/ui-components.md). Native click; no outputs. A `loading`
// button keeps its label, sets aria-busy and swallows clicks. A defined `pressed`
// makes it a toggle with aria-pressed.
@Component({
  selector: 'button[sspc-button], a[sspc-button]',
  imports: [LucideLoaderCircle],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  host: {
    '[class]': '"sspc-button sspc-button--" + variant() + " sspc-button--" + shape()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.aria-pressed]': 'pressedAttr()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(click)': 'onClick()',
    // A touch listener makes iOS Safari apply :active on the button while it is held.
    '(touchstart)': 'onTouchStart()',
  },
})
export class SspcButton {
  constructor() {
    // Capture phase on the host, so a loading button stops the click before the
    // consumer's own click listener runs.
    inject(ElementRef).nativeElement.addEventListener('click', (event: Event) => {
      if (this.loading()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, { capture: true });
  }

  readonly variant = input<ButtonVariant>('primary');
  readonly shape = input<ButtonShape>('pill');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly pressed = model<boolean | undefined>(undefined);
  protected readonly pressedAttr = computed(() => {
    const value = this.pressed();
    return value === undefined ? null : value ? 'true' : 'false';
  });

  protected onTouchStart(): void {
    // Intentionally empty: the listener exists only so that :active applies on iOS.
  }

  protected onClick(): void {
    if (!this.loading() && this.pressed() !== undefined) {
      this.pressed.set(!this.pressed());
    }
  }
}
