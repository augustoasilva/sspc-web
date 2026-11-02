import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
}
