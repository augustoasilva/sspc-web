import { ComponentHarness, TestKey } from '@angular/cdk/testing';

// CDK harness for SspcDialog.
export class DialogHarness extends ComponentHarness {
  static hostSelector = 'sspc-dialog';

  private readonly panel = this.locatorForOptional('[role="alertdialog"]');
  private readonly scrim = this.locatorForOptional('.sspc-dialog__scrim');
  private readonly primary = this.locatorForOptional('[data-action="primary"]');
  private readonly secondary = this.locatorForOptional('[data-action="secondary"]');

  async isOpen(): Promise<boolean> {
    return (await this.panel()) !== null;
  }

  async heading(): Promise<string> {
    return (await this.locatorFor('.sspc-dialog__heading')()).text();
  }

  async pressEscape(): Promise<void> {
    const panel = await this.panel();
    if (!panel) throw new Error('dialog is not open');
    await panel.sendKeys(TestKey.ESCAPE);
  }

  async clickScrim(): Promise<void> {
    const scrim = await this.scrim();
    if (!scrim) throw new Error('dialog is not open');
    await scrim.click();
  }

  async clickPrimary(): Promise<void> {
    const primary = await this.primary();
    if (!primary) throw new Error('dialog is not open');
    await primary.click();
  }

  async clickSecondary(): Promise<void> {
    const secondary = await this.secondary();
    if (!secondary) throw new Error('dialog is not open');
    await secondary.click();
  }
}
