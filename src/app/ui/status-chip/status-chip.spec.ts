// Table-driven spec for SspcStatusChip (contracts/ui-components.md, T034).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations } from '@sspc/testing/a11y';
import { SspcStatusChip } from './status-chip';
import { StatusChipHarness } from './status-chip.harness';

@Component({
  imports: [SspcStatusChip],
  template: `<sspc-status-chip [tone]="tone()" [dot]="dot()">Conectado</sspc-status-chip>`,
})
class ChipHost {
  readonly tone = signal<'positive' | 'neutral' | 'attention'>('neutral');
  readonly dot = signal(false);
}

async function setup(tone: 'positive' | 'neutral' | 'attention', dot: boolean) {
  TestBed.configureTestingModule({ imports: [ChipHost] });
  const fixture = TestBed.createComponent(ChipHost);
  fixture.componentInstance.tone.set(tone);
  fixture.componentInstance.dot.set(dot);
  fixture.detectChanges();
  const chip = await TestbedHarnessEnvironment.loader(fixture).getHarness(StatusChipHarness);
  return { fixture, chip };
}

describe('SspcStatusChip', () => {
  it.each([
    { name: 'given tone positive, then the chip reports the positive tone', tone: 'positive' as const, dot: false },
    { name: 'given tone neutral, then the chip reports the neutral tone', tone: 'neutral' as const, dot: false },
    { name: 'given tone attention, then the chip reports the attention tone', tone: 'attention' as const, dot: false },
    { name: 'given dot true, then the 8 px status dot is rendered', tone: 'positive' as const, dot: true },
  ])('$name', async ({ tone, dot }) => {
    // given / when
    const { chip } = await setup(tone, dot);
    // then
    expect(await chip.tone()).toBe(tone);
    expect(await chip.hasDot()).toBe(dot);
    expect(await chip.text()).toBe('Conectado');
    expect(await chip.role()).toBe('status');
  });

  it.each([
    { name: 'given each tone, then axe reports no violations', tone: 'positive' as const },
    { name: 'given the attention tone with a dot, then axe reports no violations', tone: 'attention' as const },
  ])('$name', async ({ tone }) => {
    // given
    const { fixture } = await setup(tone, tone === 'attention');
    // when / then
    await expectNoA11yViolations(fixture.nativeElement.querySelector('sspc-status-chip') as HTMLElement);
  });
});
