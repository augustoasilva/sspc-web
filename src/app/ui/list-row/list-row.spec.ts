// Table-driven spec for SspcListRow (contracts/ui-components.md, T044).
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations } from '@sspc/testing/a11y';
import { SspcListRow } from './list-row';
import { ListRowHarness } from './list-row.harness';

@Component({
  imports: [SspcListRow],
  template: `<ul><li sspc-list-row label="Versão">{{ value }}</li></ul>`,
})
class ListRowHost {
  value = '0.0.0+dev (local)';
}

describe('SspcListRow', () => {
  it.each([
    { name: 'given a label and a value, then the label and the value are shown', value: '0.0.0+dev (local)', expected: '0.0.0+dev (local)' },
    { name: 'given an empty value, then the value is empty', value: '', expected: '' },
  ])('$name', async ({ value, expected }) => {
    // given
    TestBed.configureTestingModule({ imports: [ListRowHost] });
    const fixture = TestBed.createComponent(ListRowHost);
    fixture.componentInstance.value = value;
    fixture.detectChanges();
    const row = await TestbedHarnessEnvironment.loader(fixture).getHarness(ListRowHarness);
    // when / then
    expect(await row.label()).toBe('Versão');
    expect(await row.value()).toBe(expected);
  });

  it('given a list of rows, then axe reports no violations', async () => {
    // given
    TestBed.configureTestingModule({ imports: [ListRowHost] });
    const fixture = TestBed.createComponent(ListRowHost);
    fixture.detectChanges();
    // when / then
    await expectNoA11yViolations(fixture.nativeElement.querySelector('ul') as HTMLElement);
  });
});
