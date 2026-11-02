// Table-driven shell spec (T047): connection chip, title and back control per route,
// and tab navigation through the router.
import { TestBed } from '@angular/core/testing';
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
  TestBed.configureTestingModule({ imports: [App], providers: [provideRouter(routes), provideLocationMocks()] });
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
