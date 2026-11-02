// Test doubles for the shell (research R-24). jsdom implements none of
// isSecureContext, navigator.storage and navigator.serviceWorker, so each is faked here.
import { signal, computed, WritableSignal, Signal } from '@angular/core';
import { Subject } from 'rxjs';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { provideRouter } from '@angular/router';
import { Connectivity } from '@sspc/core/connectivity';

// Controllable stand-in for Angular's SwUpdate.
export class FakeSwUpdate {
  readonly isEnabled = true;
  readonly versionUpdates = new Subject<VersionEvent>();
  readonly unrecoverable = new Subject<UnrecoverableStateEvent>();
  checkCount = 0;
  activateCount = 0;
  activateResult: 'resolve' | 'reject' = 'resolve';

  checkForUpdate(): Promise<boolean> {
    this.checkCount += 1;
    return Promise.resolve(true);
  }

  activateUpdate(): Promise<boolean> {
    this.activateCount += 1;
    return this.activateResult === 'resolve' ? Promise.resolve(true) : Promise.reject(new Error('activate failed'));
  }

  emitVersionReady(): void {
    this.versionUpdates.next({ type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'b' } } as VersionEvent);
  }

  emitUnrecoverable(): void {
    this.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'test' } as UnrecoverableStateEvent);
  }
}

// Controllable connectivity, with the same public shape as the real service (T031).
export class FakeConnectivity {
  readonly online: WritableSignal<boolean>;
  readonly label: Signal<string>;
  readonly valueLabel: Signal<string>;

  constructor(initial = true) {
    this.online = signal(initial);
    this.label = computed(() => (this.online() ? 'Conectado' : 'Sem conexão'));
    this.valueLabel = computed(() => (this.online() ? 'Online' : 'Offline'));
  }

  setOnline(value: boolean): void {
    this.online.set(value);
  }
}

// Fake secure context: secure by default; set `secure = false` to test the notice.
export class FakeSecureContext {
  secure = true;
  readonly message = 'Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.';
}

// Fake navigator.storage for StoragePersistence.
export class FakeStorage {
  persistedValue = false;
  persistResult = true;
  persistCalls = 0;

  persisted(): Promise<boolean> {
    return Promise.resolve(this.persistedValue);
  }

  persist(): Promise<boolean> {
    this.persistCalls += 1;
    return Promise.resolve(this.persistResult);
  }
}

// Installs a fake navigator.storage for one test; returns the fake to inspect.
export function installFakeStorage(): FakeStorage {
  const fake = new FakeStorage();
  Object.defineProperty(navigator, 'storage', { value: fake, configurable: true });
  return fake;
}

// Providers for a shell test. Pass overrides to change the defaults.
export function provideShellFakes(overrides: { swUpdate?: FakeSwUpdate; connectivity?: FakeConnectivity } = {}) {
  return [
    provideRouter([]),
    { provide: SwUpdate, useValue: overrides.swUpdate ?? new FakeSwUpdate() },
    { provide: Connectivity, useValue: overrides.connectivity ?? new FakeConnectivity() },
  ];
}
