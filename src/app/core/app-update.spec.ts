// Table-driven spec for AppUpdate (data-model §UpdateState, contracts/pwa-and-update.md §Update
// contract, SC-003 to SC-005). SwUpdate is replaced by FakeSwUpdate, the reload by a spy, and time
// by vi.useFakeTimers so the 30 s check throttle is exercised.
import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { FakeSwUpdate } from '@sspc/testing/fakes';
import { UnsavedWork } from './unsaved-work';
import { AppUpdate, RELOAD_PAGE, UpdateState } from './app-update';

type Action = 'tap' | 'confirm' | 'dismiss' | 'versionReady' | 'installFailed' | 'unrecoverable';

interface Setup {
  swUpdate: FakeSwUpdate;
  reload: ReturnType<typeof vi.fn>;
  update: AppUpdate;
  dirty: WritableSignal<boolean>;
}

function setup(options: { unsaved?: boolean; enabled?: boolean; activateResult?: 'resolve' | 'reject' } = {}): Setup {
  const swUpdate = new FakeSwUpdate();
  if (options.enabled === false) (swUpdate as { isEnabled: boolean }).isEnabled = false;
  if (options.activateResult) swUpdate.activateResult = options.activateResult;
  const reload = vi.fn();
  const dirty = signal(options.unsaved ?? false);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: SwUpdate, useValue: swUpdate },
      { provide: RELOAD_PAGE, useValue: reload },
    ],
  });
  // A dirty source is registered as the input of the editor would be (A-004).
  TestBed.runInInjectionContext(() => TestBed.inject(UnsavedWork).track(dirty));
  const update = TestBed.inject(AppUpdate);
  return { swUpdate, reload, update, dirty };
}

function act(s: Setup, action: Action): void {
  switch (action) {
    case 'tap':
      s.update.tap();
      break;
    case 'confirm':
      s.update.confirm();
      break;
    case 'dismiss':
      s.update.dismiss();
      break;
    case 'versionReady':
      s.swUpdate.emitVersionReady();
      break;
    case 'installFailed':
      s.swUpdate.versionUpdates.next({ type: 'VERSION_INSTALLATION_FAILED' } as never);
      break;
    case 'unrecoverable':
      s.swUpdate.emitUnrecoverable();
      break;
  }
}

describe('AppUpdate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each([
    {
      name: 'given idle, when a new version is ready, then the state is ready',
      input: { unsaved: false, from: 'idle' as UpdateState, actions: ['versionReady'] as Action[] },
      output: 'ready' as UpdateState,
    },
    {
      name: 'given idle, when the installation of a version fails, then the state stays idle',
      input: { unsaved: false, from: 'idle' as UpdateState, actions: ['installFailed'] as Action[] },
      output: 'idle' as UpdateState,
    },
    {
      name: 'given ready, when a newer version becomes ready, then the state stays ready',
      input: { unsaved: false, from: 'ready' as UpdateState, actions: ['versionReady', 'versionReady'] as Action[] },
      output: 'ready' as UpdateState,
    },
    {
      name: 'given ready and no unsaved text, when Atualizar is tapped, then the state is applying',
      input: { unsaved: false, from: 'ready' as UpdateState, actions: ['versionReady', 'tap'] as Action[] },
      output: 'applying' as UpdateState,
    },
    {
      name: 'given ready and unsaved text, when Atualizar is tapped, then the state is confirming',
      input: { unsaved: true, from: 'ready' as UpdateState, actions: ['versionReady', 'tap'] as Action[] },
      output: 'confirming' as UpdateState,
    },
    {
      name: 'given confirming, when Agora não is chosen, then the state is ready',
      input: { unsaved: true, from: 'ready' as UpdateState, actions: ['versionReady', 'tap', 'dismiss'] as Action[] },
      output: 'ready' as UpdateState,
    },
    {
      name: 'given confirming, when Atualizar agora is chosen, then the state is applying',
      input: { unsaved: true, from: 'ready' as UpdateState, actions: ['versionReady', 'tap', 'confirm'] as Action[] },
      output: 'applying' as UpdateState,
    },
    {
      name: 'given the service worker reports an unrecoverable state, then the state is failed',
      input: { unsaved: false, from: 'idle' as UpdateState, actions: ['unrecoverable'] as Action[] },
      output: 'failed' as UpdateState,
    },
    {
      name: 'given failed, when Tentar de novo is tapped with no unsaved text, then the state is applying',
      input: { unsaved: false, from: 'failed' as UpdateState, actions: ['unrecoverable', 'tap'] as Action[] },
      output: 'applying' as UpdateState,
    },
    {
      name: 'given idle, when Atualizar is tapped, then nothing changes',
      input: { unsaved: false, from: 'idle' as UpdateState, actions: ['tap'] as Action[] },
      output: 'idle' as UpdateState,
    },
  ])('$name', ({ input, output }) => {
    // given
    const s = setup({ unsaved: input.unsaved });
    // when
    input.actions.forEach((action) => act(s, action));
    // then
    expect(s.update.state()).toBe(output);
  });

  it('given ready and unsaved text, when Atualizar is tapped, then activateUpdate is not called until the user confirms', () => {
    // given
    const s = setup({ unsaved: true });
    s.swUpdate.emitVersionReady();
    // when
    s.update.tap();
    // then
    expect(s.swUpdate.activateCount).toBe(0);
  });

  it('given ready with no unsaved text, when Atualizar is tapped, then the page reloads once the update is activated', async () => {
    // given
    const s = setup({ unsaved: false });
    s.swUpdate.emitVersionReady();
    // when
    s.update.tap();
    await vi.runAllTimersAsync();
    // then
    expect(s.swUpdate.activateCount).toBe(1);
    expect(s.reload).toHaveBeenCalledTimes(1);
  });

  it('given applying, when activateUpdate rejects, then the state is failed and the page does not reload', async () => {
    // given
    const s = setup({ unsaved: false, activateResult: 'reject' });
    s.swUpdate.emitVersionReady();
    // when
    s.update.tap();
    await vi.runAllTimersAsync();
    // then
    expect(s.update.state()).toBe('failed');
    expect(s.reload).not.toHaveBeenCalled();
  });

  it('given ready and a newer version arrives, then one activation lands on the latest version', async () => {
    // given
    const s = setup({ unsaved: false });
    s.swUpdate.emitVersionReady();
    s.swUpdate.emitVersionReady();
    // when
    s.update.tap();
    await vi.runAllTimersAsync();
    // then
    expect(s.swUpdate.activateCount).toBe(1);
  });

  it('given tapping while offline, when Atualizar is tapped, then the update applies as it does online', async () => {
    // given
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    const s = setup({ unsaved: false });
    s.swUpdate.emitVersionReady();
    // when
    s.update.tap();
    await vi.runAllTimersAsync();
    // then
    expect(s.reload).toHaveBeenCalledTimes(1);
    Reflect.deleteProperty(navigator, 'onLine');
  });

  it.each([
    {
      name: 'given the service worker is disabled, then no check runs and a version event is ignored',
      enabled: false,
      action: 'versionReady' as Action,
      checks: 0,
      state: 'idle' as UpdateState,
    },
    {
      name: 'given the app starts, then one check runs at start',
      enabled: true,
      action: null,
      checks: 1,
      state: 'idle' as UpdateState,
    },
  ])('$name', ({ enabled, action, checks, state }) => {
    // given / when
    const s = setup({ enabled });
    if (action) act(s, action);
    // then
    expect(s.swUpdate.checkCount).toBe(checks);
    expect(s.update.state()).toBe(state);
  });

  it('given a check ran less than 30 s ago, when the app becomes visible, then no new check runs', () => {
    // given
    const s = setup();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    vi.advanceTimersByTime(10_000);
    // when
    document.dispatchEvent(new Event('visibilitychange'));
    // then
    expect(s.swUpdate.checkCount).toBe(1);
  });

  it('given the last check was 30 s or more ago, when the app becomes visible, then a check runs', () => {
    // given
    const s = setup();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    vi.advanceTimersByTime(30_000);
    // when
    document.dispatchEvent(new Event('visibilitychange'));
    // then
    expect(s.swUpdate.checkCount).toBe(2);
  });

  it('given the last check was 30 s or more ago, when the device comes online, then a check runs', () => {
    // given
    const s = setup();
    vi.advanceTimersByTime(31_000);
    // when
    window.dispatchEvent(new Event('online'));
    // then
    expect(s.swUpdate.checkCount).toBe(2);
  });
});
