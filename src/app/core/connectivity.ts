// Device connection state (data-model §ConnectionState, FR-008, A-012). It reads the
// device's navigator.onLine and listens to window online/offline events. It makes no
// server request, so "online" means the device reports a network, not that the API answers.
import { DestroyRef, Injectable, WritableSignal, computed, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Connectivity {
  readonly online: WritableSignal<boolean> = signal(navigator.onLine);
  readonly label = computed(() => (this.online() ? 'Conectado' : 'Sem conexão'));
  readonly valueLabel = computed(() => (this.online() ? 'Online' : 'Offline'));

  constructor() {
    const setOnline = () => this.online.set(true);
    const setOffline = () => this.online.set(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    });
  }
}
