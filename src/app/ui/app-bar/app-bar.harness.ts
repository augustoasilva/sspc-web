import { ComponentHarness } from '@angular/cdk/testing';

// CDK harness for SspcAppBar.
export class AppBarHarness extends ComponentHarness {
  static hostSelector = 'sspc-app-bar';

  private readonly back = this.locatorForOptional('.sspc-app-bar__back');

  async heading(): Promise<string> {
    return (await this.locatorFor('.sspc-app-bar__heading')()).text();
  }

  async overline(): Promise<string | null> {
    const element = await this.locatorForOptional('.sspc-app-bar__overline')();
    return element ? element.text() : null;
  }

  async hasBack(): Promise<boolean> {
    return (await this.back()) !== null;
  }

  async backName(): Promise<string | null> {
    const element = await this.back();
    return element ? element.getAttribute('aria-label') : null;
  }

  async clickBack(): Promise<void> {
    const element = await this.back();
    if (!element) throw new Error('app bar has no back control');
    await element.click();
  }
}
