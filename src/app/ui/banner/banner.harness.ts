import { ComponentHarness } from '@angular/cdk/testing';
import { ButtonHarness } from '../button/button.harness';

// CDK harness for SspcBanner.
export class BannerHarness extends ComponentHarness {
  static hostSelector = 'sspc-banner';

  readonly actionButton = this.locatorForOptional(ButtonHarness);

  async message(): Promise<string> {
    return (await this.locatorFor('.sspc-banner__message')()).text();
  }

  async tone(): Promise<string | null> {
    return (await (await this.host()).getAttribute('data-tone')) ?? null;
  }

  async hasAction(): Promise<boolean> {
    return (await this.actionButton()) !== null;
  }

  async clickAction(): Promise<void> {
    const button = await this.actionButton();
    if (!button) throw new Error('banner has no action');
    await button.click();
  }

  async actionIsBusy(): Promise<boolean> {
    const button = await this.actionButton();
    return button ? button.isLoading() : false;
  }

  async actionIsDisabled(): Promise<boolean> {
    const button = await this.actionButton();
    return button ? button.isDisabled() : false;
  }

  async isMessageTruncated(): Promise<boolean> {
    return (await this.locatorForOptional('.sspc-banner__message--truncate')()) !== null;
  }
}
