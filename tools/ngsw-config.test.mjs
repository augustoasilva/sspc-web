// Static checks of ngsw-config.json (contracts/pwa-and-update.md §ngsw-config, FR-005, SEC-002).
// Table-driven; runs in CI with `npm run test:tools`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(root, 'ngsw-config.json'), 'utf8'));
const group = (name) => config.assetGroups.find((entry) => entry.name === name);

describe('ngsw-config.json', () => {
  it.each([
    { name: 'the app group is prefetch', read: () => group('app')?.installMode, expected: 'prefetch' },
    {
      name: 'the app group lists the shell, manifest, favicon, styles, scripts, fonts, icons and the About photo',
      read: () => group('app')?.resources.files,
      expected: [
        '/index.html',
        '/manifest.webmanifest',
        '/favicon.ico',
        '/*.css',
        '/*.js',
        '/media/*.woff2',
        '/icons/*.png',
        '/images/*.webp',
      ],
    },
    { name: 'the assets group is lazy', read: () => group('assets')?.installMode, expected: 'lazy' },
    { name: 'the assets group updates by prefetch', read: () => group('assets')?.updateMode, expected: 'prefetch' },
    {
      name: 'the assets group matches the image and font types',
      read: () => group('assets')?.resources.files,
      expected: ['/**/*.(svg|jpg|jpeg|png|webp|avif|gif|woff2)'],
    },
    { name: 'the index is /index.html', read: () => config.index, expected: '/index.html' },
    {
      name: 'the navigation strategy is the default performance',
      read: () => config.navigationRequestStrategy ?? 'performance',
      expected: 'performance',
    },
    { name: 'there is no dataGroups key (SEC-002)', read: () => 'dataGroups' in config, expected: false },
  ])('$name', ({ read, expected }) => {
    // given the service worker config, when read, then it matches the contract
    expect(read()).toEqual(expected);
  });
});
