#!/usr/bin/env node
// Checks that every image, font and icon emitted into a build directory is in the prefetched
// `app` group of its ngsw.json (contracts/pwa-and-update.md §ngsw-config, FR-005). A file only
// in the lazy `assets` group is not cached by one online load, so it fails the check.
// Usage: node scripts/check-ngsw-assets.mjs DIR   (exit 0 when all are listed, 1 otherwise)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// The service worker files are .js and fall outside these types, so they are never checked.
const CHECKED = /\.(png|webp|jpe?g|svg|woff2|ico)$/i;

function listFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, base);
    return [path.relative(base, full).split(path.sep).join('/')];
  });
}

function main(dir) {
  const ngswPath = path.join(dir, 'ngsw.json');
  if (!existsSync(ngswPath)) {
    console.error(`No ngsw.json in ${dir}. Build the app first.`);
    return 1;
  }
  const ngsw = JSON.parse(readFileSync(ngswPath, 'utf8'));
  const app = (ngsw.assetGroups ?? []).find((group) => group.name === 'app');
  const appUrls = new Set(app?.urls ?? []);

  const checked = listFiles(dir).filter((file) => CHECKED.test(file));
  const missing = checked.filter((file) => !appUrls.has(`/${file}`));

  for (const file of missing) {
    console.error(`Missing from the app group (not cached by one online load): ${file}`);
  }
  if (missing.length > 0) return 1;
  console.log(`All ${checked.length} image, font and icon files are in the app group.`);
  return 0;
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/check-ngsw-assets.mjs DIR');
  process.exitCode = 2;
} else {
  process.exitCode = main(target);
}
