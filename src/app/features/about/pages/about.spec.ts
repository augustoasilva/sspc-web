// Spec for the About page (US4, T088, research R-14 §2.9): name, description, version, connection
// and storage protection, online or offline, with no loading state. The back control belongs to the
// shell's app bar on /sobre (route data back: true).
import { TestBed } from '@angular/core/testing';
import { APP_BUILD_INFO } from '@sspc/core/app-version';
import { StoragePersistence, StorageState } from '@sspc/core/storage-persistence';
import { FakeConnectivity } from '@sspc/testing/fakes';
import { Connectivity } from '@sspc/core/connectivity';
import { AboutPage } from './about';

const DESCRIPTION = 'Curadoria independente, relatos sinceros de mesa e documentação gastronômica artesanal.';

function render(options: { online: boolean; storage: StorageState }) {
  const connectivity = new FakeConnectivity(options.online);
  const storage = { state: () => options.storage };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [AboutPage],
    providers: [
      { provide: Connectivity, useValue: connectivity },
      { provide: StoragePersistence, useValue: storage },
      { provide: APP_BUILD_INFO, useValue: { version: '0.0.0+dev', build: 'local' } },
    ],
  });
  const fixture = TestBed.createComponent(AboutPage);
  fixture.detectChanges();
  return { fixture, connectivity, text: () => (fixture.nativeElement as HTMLElement).textContent ?? '' };
}

describe('AboutPage', () => {
  it.each([
    { name: 'given the page, then it shows the name and the description', check: (t: string) => t.includes('SSPC Studio') && t.includes(DESCRIPTION) },
    { name: 'given the page, then it shows the version with its build reference', check: (t: string) => t.includes('Versão') && t.includes('0.0.0+dev (local)') },
  ])('$name', ({ check }) => {
    // given / when
    const { text } = render({ online: true, storage: 'granted' });
    // then
    expect(check(text())).toBe(true);
  });

  it.each([
    { name: 'given the device is online, then the connection reads Online', online: true, value: 'Online' },
    { name: 'given the device is offline, then the connection reads Offline', online: false, value: 'Offline' },
  ])('$name', ({ online, value }) => {
    // given / when
    const { text } = render({ online, storage: 'granted' });
    // then
    expect(text()).toContain('Conexão');
    expect(text()).toContain(value);
  });

  it.each([
    { name: 'given storage is granted, then it reads Protegido no aparelho', storage: 'granted' as StorageState, value: 'Protegido no aparelho' },
    { name: 'given storage is denied, then it reads Não protegido', storage: 'denied' as StorageState, value: 'Não protegido' },
    { name: 'given storage is unsupported, then it reads Não protegido', storage: 'unsupported' as StorageState, value: 'Não protegido' },
  ])('$name', ({ storage, value }) => {
    // given / when
    const { text } = render({ online: true, storage });
    // then
    expect(text()).toContain('Armazenamento');
    expect(text()).toContain(value);
  });

  it('given the device goes offline, when the page is checked again, then the connection changes to Offline within the same render', () => {
    // given
    const { fixture, connectivity, text } = render({ online: true, storage: 'granted' });
    // when
    connectivity.setOnline(false);
    fixture.detectChanges();
    // then
    expect(text()).toContain('Offline');
    expect(text()).not.toContain('Online');
  });

  it('given the storage is still pending, then no storage value is drawn and no loading text is shown', () => {
    // given / when
    const { text } = render({ online: true, storage: 'pending' });
    // then
    expect(text()).not.toContain('Protegido no aparelho');
    expect(text()).not.toContain('Não protegido');
    expect(text().toLowerCase()).not.toContain('carregando');
  });
});
