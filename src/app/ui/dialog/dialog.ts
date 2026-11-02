import { Component, ElementRef, computed, effect, input, model, output, viewChild } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { SspcButton } from '../button/button';

let nextDialogId = 0;

// SspcDialog (contracts/ui-components.md, aligned with the Stitch design in Phase 2):
// a modal alertdialog for the update confirmation. Initial focus is on the safe
// (secondary) action; Escape and a scrim click act as secondary; focus returns to the
// opener on close.
@Component({
  selector: 'sspc-dialog',
  imports: [A11yModule, SspcButton],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class SspcDialog {
  readonly open = model(false);
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly primaryLabel = input.required<string>();
  readonly secondaryLabel = input.required<string>();
  readonly primary = output<void>();
  readonly secondary = output<void>();

  protected readonly uid = `sspc-dialog-${nextDialogId++}`;
  protected readonly headingId = computed(() => `${this.uid}-heading`);
  protected readonly descriptionId = computed(() => `${this.uid}-description`);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      } else if (this.opener) {
        this.opener.focus();
        this.opener = null;
      }
    });
  }

  protected confirm(): void {
    this.open.set(false);
    this.primary.emit();
  }

  protected dismiss(): void {
    this.open.set(false);
    this.secondary.emit();
  }
}
