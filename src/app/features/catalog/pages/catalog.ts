import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UnsavedWork } from '@sspc/core/unsaved-work';
import { map } from 'rxjs';
import { AppBarSection } from './sections/app-bar-section';
import { BannerSection } from './sections/banner-section';
import { ButtonSection } from './sections/button-section';
import { DialogSection } from './sections/dialog-section';
import { ListRowSection } from './sections/list-row-section';
import { StatusChipSection } from './sections/status-chip-section';
import { TabBarSection } from './sections/tab-bar-section';

// The development catalogue (FR-024, Principle V): every shared component with its variants
// and states, each section shown in light and in dark. A text field with a typed reactive
// form control lets the iPhone update test check that typed text survives a theme switch.
@Component({
  selector: 'sspc-catalog',
  imports: [
    ReactiveFormsModule,
    AppBarSection,
    BannerSection,
    ButtonSection,
    DialogSection,
    ListRowSection,
    StatusChipSection,
    TabBarSection,
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class CatalogPage {
  readonly field = new FormControl<string>('', { nonNullable: true });
  protected readonly themes = ['light', 'dark'] as const;

  // The field holds text the shell has not saved while it is not empty, so an update asks first
  // (US6, spec A-004).
  private readonly dirty = toSignal(this.field.valueChanges.pipe(map((value) => value.length > 0)), {
    initialValue: false,
  });

  constructor() {
    inject(UnsavedWork).track(this.dirty);
  }
}
