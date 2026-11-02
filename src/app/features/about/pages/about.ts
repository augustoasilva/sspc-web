import { Component, inject } from '@angular/core';
import { LucideBookOpen, LucideMapPin, LucideShield, LucideShieldCheck, LucideSparkles, LucideStar, LucideUtensils } from '@lucide/angular';
import { AppVersion } from '@sspc/core/app-version';
import { Connectivity } from '@sspc/core/connectivity';
import { StoragePersistence } from '@sspc/core/storage-persistence';
import { SspcListRow } from '@sspc/ui/list-row/list-row';
import { SspcStatusChip } from '@sspc/ui/status-chip/status-chip';

// About (US4, research R-14 §2.9). The back control is the shell's app bar on /sobre. The photo is
// a gradient block until the owner supplies the self-hosted image (G7, OI-3).
@Component({
  selector: 'sspc-about-page',
  imports: [
    LucideBookOpen,
    LucideMapPin,
    LucideShield,
    LucideShieldCheck,
    LucideSparkles,
    LucideStar,
    LucideUtensils,
    SspcListRow,
    SspcStatusChip,
  ],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutPage {
  protected readonly connectivity = inject(Connectivity);
  protected readonly storage = inject(StoragePersistence);
  protected readonly version = inject(AppVersion);
}
