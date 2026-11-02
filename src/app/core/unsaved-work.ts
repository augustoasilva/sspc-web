// Unsaved text registry (data-model §UnsavedWork, spec A-004). A field-like component registers a
// dirty signal while it holds text the shell has not saved. The update flow asks `hasUnsaved()`
// before it restarts the app, so the user gets a dialog instead of losing text.
import { Injectable, DestroyRef, Signal, computed, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UnsavedWork {
  private readonly sources = signal<ReadonlySet<Signal<boolean>>>(new Set());
  readonly hasUnsaved = computed(() => [...this.sources()].some((dirty) => dirty()));

  // Registers a dirty signal. It is removed when the owner is destroyed, by default the
  // component that calls this in its injection context.
  track(dirty: Signal<boolean>, destroyRef: DestroyRef = inject(DestroyRef)): void {
    this.sources.update((current) => new Set([...current, dirty]));
    destroyRef.onDestroy(() => {
      this.sources.update((current) => {
        const next = new Set(current);
        next.delete(dirty);
        return next;
      });
    });
  }
}
