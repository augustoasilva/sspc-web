// Table-driven shell spec (T047): connection chip, title and back control per route,
// and tab navigation through the router.
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { RELOAD_PAGE } from './core/app-update';
import { UnsavedWork } from './core/unsaved-work';
import { FakeSwUpdate } from '@sspc/testing/fakes';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { App } from './app';
import { routes } from './app.routes';
import { AppBarHarness } from './ui/app-bar/app-bar.harness';
import { TabBarHarness } from './ui/tab-bar/tab-bar.harness';

function setOnLine(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
}

function setIsSecureContext(value: boolean): void {
  Object.defineProperty(globalThis, 'isSecureContext', { configurable: true, value });
}

const INSECURE_MESSAGE = 'Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.';

async function setup(url: string, online: boolean, secure = true) {
  setOnLine(online);
  setIsSecureContext(secure);
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter(routes),
      provideLocationMocks(),
      { provide: SwUpdate, useValue: new FakeSwUpdate() },
      { provide: RELOAD_PAGE, useValue: vi.fn() },
    ],
  });
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  await fixture.whenStable();
  const loader = TestbedHarnessEnvironment.loader(fixture);
  return {
    fixture,
    router,
    appBar: await loader.getHarness(AppBarHarness),
    tabs: await loader.getHarness(TabBarHarness),
    chipText: () => (fixture.nativeElement.querySelector('sspc-status-chip') as HTMLElement).textContent?.trim(),
  };
}

describe('App shell', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'onLine');
    Reflect.deleteProperty(globalThis, 'isSecureContext');
    vi.unstubAllGlobals();
  });

  it.each([
    {
      name: 'given an insecure origin, when the shell renders, then the banner slot shows the HTTPS notice with tone error, no action and no close control',
      secure: false,
      banner: { text: INSECURE_MESSAGE, tone: 'error', hasButton: false },
    },
    {
      name: 'given a secure origin, when the shell renders, then no banner is shown',
      secure: true,
      banner: null,
    },
  ])('$name', async ({ secure, banner }) => {
    // given / when
    const { fixture } = await setup('/', true, secure);
    // then
    const element = fixture.nativeElement as HTMLElement;
    const shown = element.querySelector('[data-slot="banner"] sspc-banner');
    if (banner === null) {
      expect(shown).toBeNull();
      return;
    }
    expect(shown?.textContent?.trim()).toBe(banner.text);
    expect(shown?.getAttribute('data-tone')).toBe(banner.tone);
    expect(shown?.querySelector('button') !== null).toBe(banner.hasButton);
  });

  it('given the shell starts, when it renders, then it makes no network request (offline start, FR-005)', async () => {
    // given
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    // when
    await setup('/', true, true);
    // then
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'given the device is online, then the connection chip reads Conectado', url: '/', online: true, chip: 'Conectado' },
    { name: 'given the device is offline, then the connection chip reads Sem conexão', url: '/', online: false, chip: 'Sem conexão' },
  ])('$name', async ({ url, online, chip }) => {
    // given / when
    const { chipText } = await setup(url, online);
    // then
    expect(chipText()).toContain(chip);
  });

  it.each([
    { name: 'given the home route, then the connection chip is visible (US4 scenario 7)', url: '/' },
    { name: 'given the about route, then the connection chip is visible (US4 scenario 7)', url: '/sobre' },
  ])('$name', async ({ url }) => {
    // given / when
    const { fixture } = await setup(url, true);
    // then
    const chip = fixture.nativeElement.querySelector('sspc-status-chip') as HTMLElement | null;
    expect(chip).not.toBeNull();
    expect(chip?.textContent?.trim()).toContain('Conectado');
  });

  it.each([
    { name: 'given the home route, then the title is Início and there is no back control', url: '/', title: 'Início', back: false },
    { name: 'given the about route, then the title is Sobre and the back control is shown', url: '/sobre', title: 'Sobre', back: true },
  ])('$name', async ({ url, title, back }) => {
    // given / when
    const { appBar } = await setup(url, true);
    // then
    expect(await appBar.heading()).toBe(title);
    expect(await appBar.hasBack()).toBe(back);
  });

  it('given the home route, when the Perfil tab is selected, then the router goes to /sobre', async () => {
    // given
    const { fixture, router, tabs } = await setup('/', true);
    // when
    await tabs.clickItem('Perfil');
    await fixture.whenStable();
    fixture.detectChanges();
    // then
    expect(router.url).toBe('/sobre');
    expect(await tabs.currentLabel()).toBe('Perfil');
  });

  it('given the about route, when the back control is pressed, then the router goes to home', async () => {
    // given
    const { fixture, router, appBar } = await setup('/sobre', true);
    // when
    await appBar.clickBack();
    await fixture.whenStable();
    // then
    expect(router.url).toBe('/');
  });
});

// Update flow in the shell (US6, T099): banner, dialog only with unsaved text, failure banner.
async function setupUpdate(options: { unsaved?: boolean } = {}) {
  setOnLine(true);
  setIsSecureContext(true);
  const swUpdate = new FakeSwUpdate();
  const reload = vi.fn();
  const dirty = signal(options.unsaved ?? false);
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter(routes),
      provideLocationMocks(),
      { provide: SwUpdate, useValue: swUpdate },
      { provide: RELOAD_PAGE, useValue: reload },
    ],
  });
  TestBed.runInInjectionContext(() => TestBed.inject(UnsavedWork).track(dirty));
  const fixture = TestBed.createComponent(App);
  const router = TestBed.inject(Router);
  const root = fixture.nativeElement as HTMLElement;
  const flush = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  await flush();
  return { fixture, router, root, swUpdate, reload, dirty, flush };
}

function buttonWithText(root: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
}

describe('App update flow', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'onLine');
    Reflect.deleteProperty(globalThis, 'isSecureContext');
    vi.unstubAllGlobals();
  });

  it('given a new version is ready, then the info banner shows Nova versão disponível with one action Atualizar and no close control', async () => {
    // given
    const { root, swUpdate, flush } = await setupUpdate();
    // when
    swUpdate.emitVersionReady();
    await flush();
    // then
    const banner = root.querySelector('[data-slot="banner"] sspc-banner[data-tone="info"]') as HTMLElement | null;
    expect(banner?.textContent).toContain('Nova versão disponível');
    const buttons = banner?.querySelectorAll('button') ?? [];
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent?.trim()).toBe('Atualizar');
  });

  it('given the banner is shown, when the route changes, then it stays on screen', async () => {
    // given
    const { root, router, swUpdate, flush } = await setupUpdate();
    swUpdate.emitVersionReady();
    await flush();
    // when
    await router.navigateByUrl('/sobre');
    await flush();
    // then
    expect(root.querySelector('[data-slot="banner"] sspc-banner[data-tone="info"]')).not.toBeNull();
  });

  it.each([
    {
      name: 'given no unsaved text, when Atualizar is tapped, then no dialog opens and the page reloads',
      unsaved: false,
      dialog: false,
      reloads: true,
    },
    {
      name: 'given unsaved text, when Atualizar is tapped, then the dialog opens with Atualizar agora and Agora não',
      unsaved: true,
      dialog: true,
      reloads: false,
    },
  ])('$name', async ({ unsaved, dialog, reloads }) => {
    // given
    const { root, swUpdate, reload, flush } = await setupUpdate({ unsaved });
    swUpdate.emitVersionReady();
    await flush();
    // when
    buttonWithText(root, 'Atualizar')?.click();
    await flush();
    // then
    expect(root.querySelector('[role="alertdialog"]') !== null).toBe(dialog);
    expect(reload.mock.calls.length > 0).toBe(reloads);
  });

  it('given the dialog is open, when Agora não is chosen, then the dialog closes, the banner stays and the text is kept', async () => {
    // given
    const { root, swUpdate, dirty, flush } = await setupUpdate({ unsaved: true });
    swUpdate.emitVersionReady();
    await flush();
    buttonWithText(root, 'Atualizar')?.click();
    await flush();
    // when
    buttonWithText(root, 'Agora não')?.click();
    await flush();
    // then
    expect(root.querySelector('[role="alertdialog"]')).toBeNull();
    expect(root.querySelector('[data-slot="banner"] sspc-banner[data-tone="info"]')).not.toBeNull();
    expect(dirty()).toBe(true);
  });

  it('given the update fails, then the error banner shows the failure copy with Tentar de novo', async () => {
    // given
    const { root, swUpdate, flush } = await setupUpdate();
    swUpdate.activateResult = 'reject';
    swUpdate.emitVersionReady();
    await flush();
    // when
    buttonWithText(root, 'Atualizar')?.click();
    await flush();
    await flush();
    // then
    const banner = root.querySelector('[data-slot="banner"] sspc-banner[data-tone="error"]') as HTMLElement | null;
    expect(banner?.textContent).toContain('Não foi possível atualizar. Tente de novo.');
    expect(buttonWithText(root, 'Tentar de novo')).toBeDefined();
  });
});

