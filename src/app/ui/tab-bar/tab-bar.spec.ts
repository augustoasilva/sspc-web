// Table-driven spec for SspcTabBar (contracts/ui-components.md, T042).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations } from '@sspc/testing/a11y';
import { SspcTabBar, TabItem } from './tab-bar';
import { TabBarHarness } from './tab-bar.harness';

const items: TabItem[] = [
  { id: 'home', label: 'Início', path: '/', icon: 'house' },
  { id: 'about', label: 'Perfil', path: '/sobre', icon: 'user' },
];

@Component({
  imports: [SspcTabBar],
  template: `<sspc-tab-bar [items]="items" [activeId]="activeId()" ariaLabel="Principal" (itemSelect)="selected = $event" />`,
})
class TabBarHost {
  readonly items = items;
  readonly activeId = signal('home');
  selected = '';
}

async function setup(activeId = 'home') {
  TestBed.configureTestingModule({ imports: [TabBarHost] });
  const fixture = TestBed.createComponent(TabBarHost);
  fixture.componentInstance.activeId.set(activeId);
  fixture.detectChanges();
  const bar = await TestbedHarnessEnvironment.loader(fixture).getHarness(TabBarHarness);
  return { fixture, host: fixture.componentInstance, bar };
}

describe('SspcTabBar', () => {
  it.each([
    { name: 'given the home item active, then Início is the current page and both labels are shown', active: 'home', current: 'Início' },
    { name: 'given the about item active, then Perfil is the current page', active: 'about', current: 'Perfil' },
  ])('$name', async ({ active, current }) => {
    // given / when
    const { bar } = await setup(active);
    // then
    expect(await bar.labels()).toEqual(['Início', 'Perfil']);
    expect(await bar.currentLabel()).toBe(current);
  });

  it('given a tab item, when clicked, then itemSelect emits its id and the default navigation is prevented', async () => {
    // given
    const { fixture, host } = await setup('home');
    const link = fixture.nativeElement.querySelector('a[href="/sobre"]') as HTMLAnchorElement;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    // when
    link.dispatchEvent(click);
    fixture.detectChanges();
    // then
    expect(host.selected).toBe('about');
    expect(click.defaultPrevented).toBe(true);
  });

  it('given the tab bar, then axe reports no violations', async () => {
    // given
    const { fixture } = await setup('home');
    // when / then
    await expectNoA11yViolations(fixture.nativeElement.querySelector('sspc-tab-bar') as HTMLElement);
  });
});
