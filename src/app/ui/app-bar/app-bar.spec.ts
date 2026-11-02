// Table-driven spec for SspcAppBar (contracts/ui-components.md, T040).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations } from '@sspc/testing/a11y';
import { SspcAppBar } from './app-bar';
import { AppBarHarness } from './app-bar.harness';

@Component({
  imports: [SspcAppBar],
  template: `
    <sspc-app-bar [heading]="heading()" [overline]="overline()" [showBack]="showBack()" backLabel="Voltar" (back)="backs = backs + 1">
      <span end>Conectado</span>
    </sspc-app-bar>
  `,
})
class AppBarHost {
  readonly heading = signal('Início');
  readonly overline = signal<string | undefined>(undefined);
  readonly showBack = signal(false);
  backs = 0;
}

async function setup(init: { heading?: string; overline?: string; showBack?: boolean } = {}) {
  TestBed.configureTestingModule({ imports: [AppBarHost] });
  const fixture = TestBed.createComponent(AppBarHost);
  const host = fixture.componentInstance;
  if (init.heading) host.heading.set(init.heading);
  host.overline.set(init.overline);
  host.showBack.set(init.showBack ?? false);
  fixture.detectChanges();
  const bar = await TestbedHarnessEnvironment.loader(fixture).getHarness(AppBarHarness);
  return { fixture, host, bar };
}

describe('SspcAppBar', () => {
  it.each([
    { name: 'given a heading and no overline, then the heading is shown and no overline', init: { heading: 'Início' }, heading: 'Início', overline: null },
    { name: 'given an overline, then the overline is shown above the heading', init: { heading: 'Início', overline: 'SSPC STUDIO' }, heading: 'Início', overline: 'SSPC STUDIO' },
  ])('$name', async ({ init, heading, overline }) => {
    // given / when
    const { bar } = await setup(init);
    // then
    expect(await bar.heading()).toBe(heading);
    expect(await bar.overline()).toBe(overline);
  });

  it('given showBack, when the back control is clicked, then back emits and the control has the caller label', async () => {
    // given
    const { host, bar } = await setup({ heading: 'Sobre', showBack: true });
    // when
    await bar.clickBack();
    // then
    expect(host.backs).toBe(1);
    expect(await bar.backName()).toBe('Voltar');
  });

  it('given no showBack, then no back control is rendered', async () => {
    // given / when
    const { bar } = await setup({ showBack: false });
    // then
    expect(await bar.hasBack()).toBe(false);
  });

  it('given a heading and a back control, then axe reports no violations', async () => {
    // given
    const { fixture } = await setup({ heading: 'Sobre', showBack: true });
    // when / then
    await expectNoA11yViolations(fixture.nativeElement.querySelector('sspc-app-bar') as HTMLElement);
  });
});
