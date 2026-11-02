// Static PWA assertions (contracts/pwa-and-update.md, research R-01, R-02, FR-005, SEC-002).
// Reads the manifest and the HTML shell from the repository and compares each
// value with the contract. Runs in CI with `npm run test:tools`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = (file) => readFileSync(path.join(root, file), 'utf8');

const manifest = JSON.parse(readText('public/manifest.webmanifest'));
const html = readText('src/index.html');
const doc = new JSDOM(html).window.document;

const meta = (name) => doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
const iconsAt = (size) => manifest.icons.filter((icon) => icon.sizes === size);

describe('web app manifest (public/manifest.webmanifest)', () => {
  it.each([
    { name: 'name is SSPC Studio', read: () => manifest.name, expected: 'SSPC Studio' },
    { name: 'short_name is SSPC Studio', read: () => manifest.short_name, expected: 'SSPC Studio' },
    { name: 'lang is pt-BR', read: () => manifest.lang, expected: 'pt-BR' },
    { name: 'start_url is the origin root', read: () => manifest.start_url, expected: '/' },
    { name: 'scope is the origin root', read: () => manifest.scope, expected: '/' },
    { name: 'id is the origin root', read: () => manifest.id, expected: '/' },
    { name: 'display is standalone', read: () => manifest.display, expected: 'standalone' },
    { name: 'background_color matches the icon artwork', read: () => manifest.background_color, expected: '#FEF7F0' },
    { name: 'theme_color is the light surface', read: () => manifest.theme_color, expected: '#FFF9F3' },
    { name: 'description is present', read: () => Boolean(manifest.description?.trim()), expected: true },
    {
      name: 'a 192 px any icon and a 192 px maskable icon exist',
      read: () => iconsAt('192x192').map((icon) => icon.purpose).sort(),
      expected: ['any', 'maskable'],
    },
    {
      name: 'a 512 px any icon and a 512 px maskable icon exist',
      read: () => iconsAt('512x512').map((icon) => icon.purpose).sort(),
      expected: ['any', 'maskable'],
    },
    {
      name: 'no icon combines purposes in one entry',
      read: () => manifest.icons.map((icon) => icon.purpose).filter((purpose) => /\s/.test(purpose)),
      expected: [],
    },
  ])('$name', ({ read, expected }) => {
    // given the manifest, when read, then it matches the contract
    expect(read()).toEqual(expected);
  });
});

describe('HTML shell (src/index.html)', () => {
  it.each([
    { name: 'html lang is pt-BR', read: () => doc.documentElement.getAttribute('lang'), expected: 'pt-BR' },
    { name: 'title is SSPC Studio', read: () => doc.title, expected: 'SSPC Studio' },
    { name: 'base href is the origin root', read: () => doc.querySelector('base')?.getAttribute('href'), expected: '/' },
    {
      name: 'viewport uses viewport-fit=cover',
      read: () => meta('viewport')?.includes('viewport-fit=cover'),
      expected: true,
    },
    {
      name: 'viewport does not block zoom (no maximum-scale, no user-scalable=no)',
      read: () => /maximum-scale|user-scalable\s*=\s*no/.test(meta('viewport') ?? ''),
      expected: false,
    },
    {
      name: 'manifest link points at manifest.webmanifest',
      read: () => doc.querySelector('link[rel="manifest"]')?.getAttribute('href'),
      expected: 'manifest.webmanifest',
    },
    {
      name: 'apple-touch-icon is the 180 px icon',
      read: () => doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
      expected: 'icons/apple-touch-icon-180.png',
    },
    {
      name: 'apple-touch-icon declares 180x180',
      read: () => doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('sizes'),
      expected: '180x180',
    },
    { name: 'mobile-web-app-capable is yes', read: () => meta('mobile-web-app-capable'), expected: 'yes' },
    { name: 'apple-mobile-web-app-capable is yes', read: () => meta('apple-mobile-web-app-capable'), expected: 'yes' },
    { name: 'apple-mobile-web-app-title is SSPC Studio', read: () => meta('apple-mobile-web-app-title'), expected: 'SSPC Studio' },
    {
      name: 'status bar style is default',
      read: () => meta('apple-mobile-web-app-status-bar-style'),
      expected: 'default',
    },
    {
      name: 'two theme-color metas, light and dark',
      read: () =>
        [...doc.querySelectorAll('meta[name="theme-color"]')].map((node) => [
          node.getAttribute('media'),
          node.getAttribute('content'),
        ]),
      expected: [
        ['(prefers-color-scheme: light)', '#FFF9F3'],
        ['(prefers-color-scheme: dark)', '#1C211A'],
      ],
    },
    {
      name: 'noscript message is in Portuguese',
      read: () => doc.querySelector('noscript')?.textContent.includes('Ative o JavaScript'),
      expected: true,
    },
    {
      name: 'no inline script (CSP)',
      read: () => [...doc.querySelectorAll('script')].filter((node) => !node.hasAttribute('src')).length,
      expected: 0,
    },
    {
      name: 'no inline event handler attribute (CSP)',
      read: () => [...doc.querySelectorAll('*')].flatMap((node) => [...node.attributes]).filter((attr) => /^on/i.test(attr.name)).length,
      expected: 0,
    },
    {
      name: 'no stylesheet link (no remote stylesheet, SEC-002)',
      read: () => doc.querySelectorAll('link[rel="stylesheet"]').length,
      expected: 0,
    },
    {
      name: 'no absolute http(s) URL (SEC-002)',
      read: () => /https?:\/\//.test(html),
      expected: false,
    },
  ])('$name', ({ read, expected }) => {
    // given the HTML shell, when read, then it matches the contract
    expect(read()).toEqual(expected);
  });
});
