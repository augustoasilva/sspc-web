// Table-driven spec for AppVersion (data-model §AppVersion, FR-017, FR-018, SC-005). The unit-test
// build replaces the build constants with literals, so each case supplies its own values through
// the APP_BUILD_INFO token (research R-05).
import { TestBed } from '@angular/core/testing';
import { APP_BUILD_INFO, AppVersion, BuildInfo } from './app-version';

function create(info: BuildInfo): AppVersion {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: APP_BUILD_INFO, useValue: info }] });
  return TestBed.inject(AppVersion);
}

describe('AppVersion', () => {
  it.each([
    {
      name: 'given the dev version and build local, then display is 0.0.0+dev (local) and kind is dev',
      input: { version: '0.0.0+dev', build: 'local' },
      output: { version: '0.0.0+dev', build: 'local', kind: 'dev', display: '0.0.0+dev (local)' },
    },
    {
      name: 'given a release version and a build reference, then kind is release',
      input: { version: '1.2.3', build: 'a1b2c3d' },
      output: { version: '1.2.3', build: 'a1b2c3d', kind: 'release', display: '1.2.3 (a1b2c3d)' },
    },
    {
      name: 'given a pre-release version with a dash, then kind is prerelease',
      input: { version: '1.2.3-test.4', build: 'x' },
      output: { version: '1.2.3-test.4', build: 'x', kind: 'prerelease', display: '1.2.3-test.4 (x)' },
    },
    {
      name: 'given a release candidate version, then kind is prerelease',
      input: { version: '1.2.3+rc.1', build: 'x' },
      output: { version: '1.2.3+rc.1', build: 'x', kind: 'prerelease', display: '1.2.3+rc.1 (x)' },
    },
    {
      name: 'given a token with no version and no build, then the fallbacks are 0.0.0+dev and local',
      input: {},
      output: { version: '0.0.0+dev', build: 'local', kind: 'dev', display: '0.0.0+dev (local)' },
    },
  ])('$name', ({ input, output }) => {
    // given / when
    const version = create(input);
    // then
    expect({ version: version.version, build: version.build, kind: version.kind, display: version.display }).toEqual(output);
  });
});
