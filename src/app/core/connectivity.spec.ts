// Table-driven spec for Connectivity (data-model §ConnectionState, FR-008, A-012).
import { TestBed } from '@angular/core/testing';
import { Connectivity } from './connectivity';

function setNavigatorOnLine(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
}

describe('Connectivity', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'onLine');
  });

  it.each([
    {
      name: 'given navigator.onLine is true at start, when the service is created, then online is true and the labels are Conectado and Online',
      input: { initialOnLine: true, events: [] as string[] },
      output: { online: true, label: 'Conectado', valueLabel: 'Online' },
    },
    {
      name: 'given navigator.onLine is false at start, when the service is created, then online is false and the labels are Sem conexão and Offline',
      input: { initialOnLine: false, events: [] as string[] },
      output: { online: false, label: 'Sem conexão', valueLabel: 'Offline' },
    },
    {
      name: 'given the device is online, when the offline event fires, then online becomes false',
      input: { initialOnLine: true, events: ['offline'] },
      output: { online: false, label: 'Sem conexão', valueLabel: 'Offline' },
    },
    {
      name: 'given the device is offline, when the online event fires, then online becomes true',
      input: { initialOnLine: false, events: ['online'] },
      output: { online: true, label: 'Conectado', valueLabel: 'Online' },
    },
    {
      name: 'given the device flaps, when offline then online fire within the same second, then the value is true and the labels are the online ones',
      input: { initialOnLine: true, events: ['offline', 'online'] },
      output: { online: true, label: 'Conectado', valueLabel: 'Online' },
    },
  ])('$name', ({ input, output }) => {
    // given
    setNavigatorOnLine(input.initialOnLine);
    const connectivity = TestBed.inject(Connectivity);
    // when
    for (const type of input.events) window.dispatchEvent(new Event(type));
    // then
    expect(connectivity.online()).toBe(output.online);
    expect(connectivity.label()).toBe(output.label);
    expect(connectivity.valueLabel()).toBe(output.valueLabel);
    expect(connectivity.label()).not.toBeUndefined();
  });

  it('given a change of connection, when the event fires, then the new value is visible within 2 s without a server call', () => {
    // given
    vi.useFakeTimers();
    setNavigatorOnLine(true);
    const connectivity = TestBed.inject(Connectivity);
    // when
    window.dispatchEvent(new Event('offline'));
    vi.advanceTimersByTime(2000);
    // then
    expect(connectivity.online()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
