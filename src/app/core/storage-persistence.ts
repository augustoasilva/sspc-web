// Storage protection (data-model §StorageProtection, SEC-012, research R-04). Asks the browser to
// keep the app's storage. The request is recorded before persist() runs, so a dismissed prompt is
// never repeated in the same browser profile. It never blocks start-up.
import { Injectable, signal } from '@angular/core';
import { isSecureOrigin } from './secure-context';

export type StorageState = 'pending' | 'granted' | 'denied' | 'unsupported';

export const STORAGE_REQUEST_KEY = 'sspc.storage.requested';

@Injectable({ providedIn: 'root' })
export class StoragePersistence {
  readonly state = signal<StorageState>('pending');

  async request(): Promise<void> {
    const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
    if (!isSecureOrigin() || !storage || typeof storage.persist !== 'function') {
      this.state.set('unsupported');
      return;
    }
    try {
      if (await storage.persisted()) {
        this.state.set('granted');
        return;
      }
      if (hasRequested()) {
        this.state.set('denied');
        return;
      }
      markRequested();
      this.state.set((await storage.persist()) ? 'granted' : 'denied');
    } catch {
      this.state.set('denied');
    }
  }
}

// localStorage can throw in private windows or with blocked site data. If it cannot be read, the
// request is treated as not yet made; if it cannot be written, the request still runs once.
function hasRequested(): boolean {
  try {
    return localStorage.getItem(STORAGE_REQUEST_KEY) !== null;
  } catch {
    return false;
  }
}

function markRequested(): void {
  try {
    localStorage.setItem(STORAGE_REQUEST_KEY, '1');
  } catch {
    // Nothing else to do: the app works without the record.
  }
}
