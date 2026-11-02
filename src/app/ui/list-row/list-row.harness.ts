import { ComponentHarness } from '@angular/cdk/testing';

// CDK harness for SspcListRow.
export class ListRowHarness extends ComponentHarness {
  static hostSelector = 'li[sspc-list-row]';

  async label(): Promise<string> {
    return (await this.locatorFor('.sspc-list-row__label')()).text();
  }

  async value(): Promise<string> {
    return (await this.locatorFor('.sspc-list-row__value')()).text();
  }
}
