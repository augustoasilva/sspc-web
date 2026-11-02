// Table-driven spec for SspcButton (contracts/ui-components.md, T032).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations } from '@sspc/testing/a11y';
import { SspcButton } from './button';
import { ButtonHarness } from './button.harness';

@Component({
  imports: [SspcButton],
  template: `
    <button sspc-button [variant]="variant()" [shape]="shape()" [loading]="loading()" [(pressed)]="pressed" (click)="clicks = clicks + 1">
      Atualizar
    </button>
  `,
})
class ButtonHost {
  readonly variant = signal<'primary' | 'secondary' | 'ghost' | 'destructive'>('primary');
  readonly shape = signal<'pill' | 'fab' | 'fab-extended'>('pill');
  readonly loading = signal(false);
  pressed: boolean | undefined = undefined;
  clicks = 0;
}

async function setup(init: { loading?: boolean; pressed?: boolean | undefined; variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' } = {}) {
  TestBed.configureTestingModule({ imports: [ButtonHost] });
  const fixture = TestBed.createComponent(ButtonHost);
  fixture.componentInstance.loading.set(init.loading ?? false);
  fixture.componentInstance.pressed = init.pressed;
  fixture.componentInstance.variant.set(init.variant ?? 'primary');
  fixture.detectChanges();
  const loader = TestbedHarnessEnvironment.loader(fixture);
  return { fixture, host: fixture.componentInstance, button: await loader.getHarness(ButtonHarness) };
}

describe('SspcButton', () => {
  it.each([
    {
      name: 'given loading, when clicked, then no click reaches the consumer and aria-busy is true',
      input: { loading: true, pressed: undefined as boolean | undefined, clicks: 1 },
      output: { busy: true, clicks: 0 },
    },
    {
      name: 'given not loading, when clicked, then the consumer receives the click',
      input: { loading: false, pressed: undefined, clicks: 1 },
      output: { busy: false, clicks: 1 },
    },
    {
      name: 'given pressed is false, when activated, then pressed flips to true and aria-pressed follows',
      input: { loading: false, pressed: false, clicks: 0 },
      output: { busy: false, clicks: 1, pressedAfter: true },
    },
  ])('$name', async ({ input, output }) => {
    // given
    const { fixture, host, button } = await setup({ loading: input.loading, pressed: input.pressed });
    // when
    await button.click();
    fixture.detectChanges();
    // then
    expect(await button.isLoading()).toBe(output.busy);
    expect(host.clicks).toBe(output.clicks);
    if (output.pressedAfter !== undefined) {
      expect(await button.isPressed()).toBe(output.pressedAfter);
    }
  });

  it.each([
    { name: 'given variant primary, then axe reports no violations (the 48 px target is checked on the device, T085)', variant: 'primary' as const },
    { name: 'given variant secondary, then axe reports no violations (the 48 px target is checked on the device, T085)', variant: 'secondary' as const },
    { name: 'given variant ghost, then axe reports no violations (the 48 px target is checked on the device, T085)', variant: 'ghost' as const },
    { name: 'given variant destructive, then axe reports no violations (the 48 px target is checked on the device, T085)', variant: 'destructive' as const },
  ])('$name', async ({ variant }) => {
    // given
    const { fixture } = await setup({ variant });
    // when
    const element = fixture.nativeElement.querySelector('button') as HTMLElement;
    // then
    await expectNoA11yViolations(element);
  });
});
