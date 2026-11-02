import { ComponentHarness } from '@angular/cdk/testing';

// CDK harness for SspcButton: the single way specs drive the component.
export class ButtonHarness extends ComponentHarness {
  static hostSelector = 'button[sspc-button], a[sspc-button]';

  async click(): Promise<void> {
    await (await this.host()).click();
  }

  async text(): Promise<string> {
    return (await this.host()).text();
  }

  async isLoading(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-busy')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getProperty<boolean>('disabled')) === true;
  }

  async isPressed(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-pressed')) === 'true';
  }

  async hasPressedState(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-pressed')) !== null;
  }
}
