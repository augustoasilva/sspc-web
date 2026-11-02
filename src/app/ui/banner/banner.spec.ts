// Table-driven spec for SspcBanner (contracts/ui-components.md, T036).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations } from '@sspc/testing/a11y';
import { SspcBanner } from './banner';
import { BannerHarness } from './banner.harness';

@Component({
  imports: [SspcBanner],
  template: `
    <sspc-banner [tone]="tone()" [actionLabel]="actionLabel()" [busy]="busy()" (action)="actions = actions + 1">
      {{ message() }}
    </sspc-banner>
  `,
})
class BannerHost {
  readonly tone = signal<'info' | 'error'>('info');
  readonly actionLabel = signal<string | undefined>('Atualizar agora');
  readonly busy = signal(false);
  readonly message = signal('Nova versão disponível. Toque para atualizar.');
  actions = 0;
}

async function setup(init: { tone?: 'info' | 'error'; actionLabel?: string | undefined; busy?: boolean; message?: string } = {}) {
  TestBed.configureTestingModule({ imports: [BannerHost] });
  const fixture = TestBed.createComponent(BannerHost);
  const host = fixture.componentInstance;
  if (init.tone) host.tone.set(init.tone);
  if ('actionLabel' in init) host.actionLabel.set(init.actionLabel);
  if (init.busy !== undefined) host.busy.set(init.busy);
  if (init.message) host.message.set(init.message);
  fixture.detectChanges();
  const banner = await TestbedHarnessEnvironment.loader(fixture).getHarness(BannerHarness);
  return { fixture, host, banner };
}

describe('SspcBanner', () => {
  it.each([
    {
      name: 'given an action label, when the action is clicked, then the action output emits once',
      input: { actionLabel: 'Atualizar agora' },
      output: { hasAction: true, emits: 1 },
    },
    {
      name: 'given no action label, when rendered, then no button is rendered and no action can emit',
      input: { actionLabel: undefined },
      output: { hasAction: false, emits: 0 },
    },
  ])('$name', async ({ input, output }) => {
    // given
    const { host, banner } = await setup({ actionLabel: input.actionLabel });
    // when
    if (output.hasAction) await banner.clickAction();
    // then
    expect(await banner.hasAction()).toBe(output.hasAction);
    expect(host.actions).toBe(output.emits);
  });

  it('given busy with an action, then the action shows the loading state and is disabled', async () => {
    // given
    const { fixture, banner } = await setup({ busy: true });
    // when
    fixture.detectChanges();
    // then
    expect(await banner.actionIsBusy()).toBe(true);
    expect(await banner.actionIsDisabled()).toBe(true);
  });

  it('given a long message with an action, then the message is marked to truncate on one line', async () => {
    // given
    const { banner } = await setup({ message: 'Uma mensagem bem longa que precisa ficar em uma linha e deixar a ação visível.' });
    // when / then
    expect(await banner.isMessageTruncated()).toBe(true);
  });

  it('given no action, then the message wraps instead of truncating', async () => {
    // given
    const { banner } = await setup({ actionLabel: undefined, message: 'Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.' });
    // when / then
    expect(await banner.isMessageTruncated()).toBe(false);
  });

  it.each([
    { name: 'given tone error, then the banner reports the error tone', tone: 'error' as const },
    { name: 'given tone info, then the banner reports the info tone', tone: 'info' as const },
  ])('$name', async ({ tone }) => {
    // given / when
    const { banner } = await setup({ tone, actionLabel: undefined });
    // then
    expect(await banner.tone()).toBe(tone);
  });

  it('given no action, then axe reports no violations', async () => {
    // given
    const { fixture } = await setup({ actionLabel: undefined });
    // when / then
    await expectNoA11yViolations(fixture.nativeElement.querySelector('sspc-banner') as HTMLElement);
  });
});
