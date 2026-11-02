// Build version shown on About (data-model §AppVersion, FR-017, FR-018, SC-005). The values come
// from the build constants through the APP_BUILD_INFO token; tests provide their own values.
import { Injectable, InjectionToken, inject } from '@angular/core';

export interface BuildInfo {
  version?: string;
  build?: string;
}

export type AppVersionKind = 'release' | 'prerelease' | 'dev';

export const APP_BUILD_INFO = new InjectionToken<BuildInfo>('APP_BUILD_INFO', {
  providedIn: 'root',
  factory: (): BuildInfo => ({
    version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : undefined,
    build: typeof APP_BUILD !== 'undefined' ? APP_BUILD : undefined,
  }),
});

@Injectable({ providedIn: 'root' })
export class AppVersion {
  readonly version: string;
  readonly build: string;
  readonly kind: AppVersionKind;
  readonly display: string;

  constructor() {
    const info = inject(APP_BUILD_INFO);
    this.version = info.version || '0.0.0+dev';
    this.build = info.build || 'local';
    this.kind = kindOf(this.version);
    this.display = `${this.version} (${this.build})`;
  }
}

function kindOf(version: string): AppVersionKind {
  if (version.endsWith('+dev')) return 'dev';
  if (/-|\+rc\./.test(version)) return 'prerelease';
  return 'release';
}
