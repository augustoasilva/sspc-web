import { Component } from '@angular/core';
import { SspcBanner } from '@sspc/ui/banner/banner';

// Catalogue section for SspcBanner (T081): info and error tones, with and without an action,
// and the busy state of the action.
@Component({
  selector: 'sspc-banner-section',
  imports: [SspcBanner],
  templateUrl: './banner-section.html',
  styleUrls: ['./section.scss'],
})
export class BannerSection {}
