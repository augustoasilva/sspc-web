import { ComponentHarness } from '@angular/cdk/testing';

// CDK harness for SspcTabBar.
export class TabBarHarness extends ComponentHarness {
  static hostSelector = 'sspc-tab-bar';

  private readonly items = this.locatorForAll('a[href]');

  async labels(): Promise<string[]> {
    const items = await this.items();
    return Promise.all(items.map((item) => item.text()));
  }

  async currentLabel(): Promise<string | null> {
    const items = await this.items();
    for (const item of items) {
      if ((await item.getAttribute('aria-current')) === 'page') return item.text();
    }
    return null;
  }

  async clickItem(label: string): Promise<void> {
    const items = await this.items();
    for (const item of items) {
      if ((await item.text()) === label) {
        await item.click();
        return;
      }
    }
    throw new Error(`no tab item "${label}"`);
  }
}
