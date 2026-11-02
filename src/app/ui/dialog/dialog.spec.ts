// Table-driven spec for SspcDialog (contracts/ui-components.md, T038). Values follow the
// Stitch design aligned in Phase 2 (T021): 28 px radius, surface-container, 28 px title.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations } from '@sspc/testing/a11y';
import { SspcDialog } from './dialog';
import { DialogHarness } from './dialog.harness';

@Component({
  imports: [SspcDialog],
  template: `
    <input id="behind" value="texto não salvo" />
    <sspc-dialog [(open)]="open" heading="Nova versão disponível" description="Atualizar agora reinicia o app. Texto não salvo será perdido." primaryLabel="Atualizar agora" secondaryLabel="Agora não" (primary)="primaries = primaries + 1" (secondary)="secondaries = secondaries + 1" />
  `,
})
class DialogHost {
  readonly open = signal(false);
  primaries = 0;
  secondaries = 0;
}

async function setup(open: boolean) {
  TestBed.configureTestingModule({ imports: [DialogHost] });
  const fixture = TestBed.createComponent(DialogHost);
  fixture.componentInstance.open.set(open);
  fixture.detectChanges();
  const dialog = await TestbedHarnessEnvironment.loader(fixture).getHarness(DialogHarness);
  return { fixture, host: fixture.componentInstance, dialog };
}

describe('SspcDialog', () => {
  it('given open, when Escape is pressed, then secondary emits, the dialog closes and focus returns to the opener', async () => {
    // given
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { fixture, host, dialog } = await setup(true);
    // when
    await dialog.pressEscape();
    fixture.detectChanges();
    // then
    expect(host.secondaries).toBe(1);
    expect(host.primaries).toBe(0);
    expect(await dialog.isOpen()).toBe(false);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('given open, when the scrim is clicked, then secondary emits and the dialog closes', async () => {
    // given
    const { fixture, host, dialog } = await setup(true);
    // when
    await dialog.clickScrim();
    fixture.detectChanges();
    // then
    expect(host.secondaries).toBe(1);
    expect(await dialog.isOpen()).toBe(false);
  });

  it.each([
    { name: 'given open, when the primary action is clicked, then primary emits', action: 'primary' as const, primaries: 1, secondaries: 0 },
    { name: 'given open, when the secondary action is clicked, then secondary emits', action: 'secondary' as const, primaries: 0, secondaries: 1 },
  ])('$name', async ({ action, primaries, secondaries }) => {
    // given
    const { fixture, host, dialog } = await setup(true);
    // when
    if (action === 'primary') await dialog.clickPrimary();
    else await dialog.clickSecondary();
    fixture.detectChanges();
    // then
    expect(host.primaries).toBe(primaries);
    expect(host.secondaries).toBe(secondaries);
  });

  it('given closed, then no dialog is rendered', async () => {
    // given / when
    const { dialog } = await setup(false);
    // then
    expect(await dialog.isOpen()).toBe(false);
  });

  it('given open, then the field behind it keeps its text unchanged', async () => {
    // given
    const { fixture } = await setup(true);
    const field = fixture.nativeElement.querySelector('#behind') as HTMLInputElement;
    // when
    field.focus();
    fixture.detectChanges();
    // then
    expect(field.value).toBe('texto não salvo');
  });

  it('given open, then the panel is an alertdialog and axe reports no violations', async () => {
    // given
    const { fixture, dialog } = await setup(true);
    // when
    const panel = fixture.nativeElement.querySelector('[role="alertdialog"]') as HTMLElement;
    // then
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(await dialog.isOpen()).toBe(true);
    await expectNoA11yViolations(panel);
  });
});
