// Update flow (data-model §UpdateState, contracts/pwa-and-update.md §Update contract, FR-009 to
// FR-013, SC-003 to SC-005). A newer version is downloaded in the background; the user applies it
// with a tap. A dialog appears only when a text field holds unsaved text. Activation needs no
// network: it switches to the version already in the cache.
import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { fromEvent, filter } from 'rxjs';
import { UnsavedWork } from './unsaved-work';

export type UpdateState = 'idle' | 'ready' | 'confirming' | 'applying' | 'failed';

// The page reload after activation. The default reloads the document; tests replace it.
export const RELOAD_PAGE = new InjectionToken<() => void>('RELOAD_PAGE', {
  providedIn: 'root',
  factory: () => () => document.location.reload(),
});

// Minimum time between two checks for a new version. It is the SC-004 budget: a trigger that falls
// inside the window is not dropped, it runs a check at the end of the window, so the check starts at
// most 5 s after the trigger (contract: notice visible within 5 s of the trigger).
export const CHECK_INTERVAL_MS = 5_000;

@Injectable({ providedIn: 'root' })
export class AppUpdate {
  readonly state = signal<UpdateState>('idle');

  private readonly swUpdate = inject(SwUpdate);
  private readonly unsaved = inject(UnsavedWork);
  private readonly reload = inject(RELOAD_PAGE);
  private readonly destroyRef = inject(DestroyRef);
  private lastCheck: number | undefined;
  private pendingCheck: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.pendingCheck));

  // In development, and on a non-secure origin, the worker is disabled and the state stays idle.
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event.type === 'VERSION_READY' && this.state() === 'idle') this.state.set('ready');
    });
    this.swUpdate.unrecoverable.pipe(takeUntilDestroyed()).subscribe(() => this.state.set('failed'));

    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.check());
    fromEvent(window, 'online').pipe(takeUntilDestroyed()).subscribe(() => this.check());

    this.check();
  }

  // "Atualizar" in the banner, or "Tentar de novo" after a failure.
  tap(): void {
    const current = this.state();
    if (current !== 'ready' && current !== 'failed') return;
    if (this.unsaved.hasUnsaved()) {
      this.state.set('confirming');
    } else {
      this.apply();
    }
  }

  // "Atualizar agora" in the dialog.
  confirm(): void {
    if (this.state() === 'confirming') this.apply();
  }

  // "Agora não" in the dialog, or a dismissal: the text, cursor and focus are left alone.
  dismiss(): void {
    if (this.state() === 'confirming') this.state.set('ready');
  }

  private apply(): void {
    this.state.set('applying');
    this.swUpdate.activateUpdate().then(
      () => this.reload(),
      () => this.state.set('failed'),
    );
  }

  // A trigger inside the window is deferred to the end of the window; further triggers inside the
  // same window share that one pending check.
  private check(): void {
    if (this.pendingCheck !== undefined) return;
    const now = Date.now();
    const wait = this.lastCheck === undefined ? 0 : this.lastCheck + CHECK_INTERVAL_MS - now;
    if (wait <= 0) {
      this.runCheck();
      return;
    }
    this.pendingCheck = setTimeout(() => {
      this.pendingCheck = undefined;
      this.runCheck();
    }, wait);
  }

  private runCheck(): void {
    this.lastCheck = Date.now();
    this.swUpdate.checkForUpdate().catch(() => undefined);
  }
}
