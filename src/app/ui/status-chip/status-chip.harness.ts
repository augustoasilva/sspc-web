import { ComponentHarness } from '@angular/cdk/testing';

// CDK harness for SspcStatusChip.
export class StatusChipHarness extends ComponentHarness {
  static hostSelector = 'sspc-status-chip';

  async text(): Promise<string> {
    return (await this.host()).text();
  }

  async tone(): Promise<string | null> {
    const host = await this.host();
    return (await host.getAttribute('data-tone')) ?? null;
  }

  async hasDot(): Promise<boolean> {
    return (await this.locatorForOptional('.sspc-status-chip__dot')()) !== null;
  }

  async role(): Promise<string | null> {
    return (await (await this.host()).getAttribute('role')) ?? null;
  }
}
