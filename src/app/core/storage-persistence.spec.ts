// Table-driven spec for StoragePersistence (data-model §StorageProtection, SEC-012). The browser
// prompt is requested at most once per profile: the request is recorded before persist() runs.
import { TestBed } from '@angular/core/testing';
import { FakeStorage } from '@sspc/testing/fakes';
import { STORAGE_REQUEST_KEY, StoragePersistence, StorageState } from './storage-persistence';

function setSecure(value: boolean): void {
  Object.defineProperty(globalThis, 'isSecureContext', { configurable: true, value });
}

async function run(fake: FakeStorage | null, options: { secure: boolean; requested?: boolean }) {
  setSecure(options.secure);
  if (fake) Object.defineProperty(navigator, 'storage', { value: fake, configurable: true });
  if (options.requested) localStorage.setItem(STORAGE_REQUEST_KEY, '1');
  TestBed.resetTestingModule();
  const service = TestBed.inject(StoragePersistence);
  await service.request();
  return service;
}

describe('StoragePersistence', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'storage');
    Reflect.deleteProperty(globalThis, 'isSecureContext');
    localStorage.clear();
  });

  it.each([
    {
      name: 'given the storage is already persisted, then granted and persist is not called',
      input: { persisted: true, persistResult: true, secure: true, requested: false, fake: true },
      output: { state: 'granted' as StorageState, persistCalls: 0, recorded: false },
    },
    {
      name: 'given the browser grants the request, then granted and the request is recorded',
      input: { persisted: false, persistResult: true, secure: true, requested: false, fake: true },
      output: { state: 'granted' as StorageState, persistCalls: 1, recorded: true },
    },
    {
      name: 'given the browser refuses the request, then denied and the request is recorded',
      input: { persisted: false, persistResult: false, secure: true, requested: false, fake: true },
      output: { state: 'denied' as StorageState, persistCalls: 1, recorded: true },
    },
    {
      name: 'given a previous request was dismissed and the app restarts, then denied with no second call',
      input: { persisted: false, persistResult: true, secure: true, requested: true, fake: true },
      output: { state: 'denied' as StorageState, persistCalls: 0, recorded: true },
    },
    {
      name: 'given the storage API is missing, then unsupported',
      input: { persisted: false, persistResult: true, secure: true, requested: false, fake: false },
      output: { state: 'unsupported' as StorageState, persistCalls: 0, recorded: false },
    },
    {
      name: 'given a non-secure origin, then unsupported and nothing is requested',
      input: { persisted: false, persistResult: true, secure: false, requested: false, fake: true },
      output: { state: 'unsupported' as StorageState, persistCalls: 0, recorded: false },
    },
  ])('$name', async ({ input, output }) => {
    // given
    const fake = input.fake ? new FakeStorage() : null;
    if (fake) {
      fake.persistedValue = input.persisted;
      fake.persistResult = input.persistResult;
    }
    // when
    const service = await run(fake, { secure: input.secure, requested: input.requested });
    // then
    expect(service.state()).toBe(output.state);
    expect(fake?.persistCalls ?? 0).toBe(output.persistCalls);
    expect(localStorage.getItem(STORAGE_REQUEST_KEY) !== null).toBe(output.recorded);
  });
});
