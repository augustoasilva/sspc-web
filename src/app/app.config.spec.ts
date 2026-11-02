// The app boots zoneless (research R-06, T048): no zone.js provider in the app config.
import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('given the app config, then it has no zone change-detection provider', () => {
    // given / when
    const names = appConfig.providers.map((provider) => (typeof provider === 'function' ? provider.name : ''));
    // then
    expect(names.filter((name) => /zone/i.test(name))).toEqual([]);
  });

  it('given the test module, then NgZone resolves to the no-op zone', () => {
    // given / when
    const zone = TestBed.configureTestingModule({}).inject(NgZone);
    // then
    expect(zone.constructor.name).toBe('NoopNgZone');
  });
});
