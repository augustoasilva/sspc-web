// Image metadata policy (contracts/build-and-ci.md §Policy checks, SEC-009, research R-27). A committed
// JPEG, PNG or WebP under site/assets/img/ or public/images/ must carry no EXIF (with GPS), XMP,
// textual or comment metadata. The check reads the container structure; no dependency is needed.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const IMAGE_DIRS = ['site/assets/img', 'public/images'];

// Returns the metadata kinds found in an image buffer ([] when the file is clean or not an image we read).
export function findMetadata(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return jpegMetadata(buffer);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return pngMetadata(buffer);
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') {
    return webpMetadata(buffer);
  }
  return ['unknown image format'];
}

function jpegMetadata(buffer) {
  const found = [];
  let pos = 2;
  while (pos + 4 <= buffer.length) {
    if (buffer[pos] !== 0xff) break;
    const marker = buffer[pos + 1];
    if (marker === 0xda || marker === 0xd9) break; // start of scan or end of image: no more segments
    const length = buffer.readUInt16BE(pos + 2);
    const data = buffer.subarray(pos + 4, pos + 2 + length);
    if (marker === 0xe1) found.push(data.subarray(0, 4).toString('latin1') === 'Exif' ? 'EXIF (may hold GPS)' : 'XMP');
    if (marker === 0xed) found.push('IPTC/Photoshop');
    if (marker === 0xfe) found.push('JPEG comment');
    pos += 2 + length;
  }
  return found;
}

function pngMetadata(buffer) {
  const found = [];
  let pos = 8;
  while (pos + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.subarray(pos + 4, pos + 8).toString('latin1');
    if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') found.push(`PNG ${type} text`);
    if (type === 'eXIf') found.push('PNG eXIf (may hold GPS)');
    if (type === 'IEND') break;
    pos += 12 + length;
  }
  return found;
}

function webpMetadata(buffer) {
  const found = [];
  let pos = 12;
  while (pos + 8 <= buffer.length) {
    const type = buffer.subarray(pos, pos + 4).toString('latin1');
    const size = buffer.readUInt32LE(pos + 4);
    if (type === 'EXIF') found.push('WebP EXIF (may hold GPS)');
    if (type === 'XMP ') found.push('WebP XMP');
    pos += 8 + size + (size % 2);
  }
  return found;
}

function imageFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? imageFiles(path) : [path];
  });
}

function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const findings = [];
  for (const dir of IMAGE_DIRS) {
    for (const file of imageFiles(`${root}${dir}`)) {
      for (const kind of findMetadata(readFileSync(file))) {
        findings.push(`${file.slice(root.length)}: ${kind}`);
      }
    }
  }
  if (findings.length > 0) {
    for (const finding of findings) console.error(`image-metadata: ${finding}`);
    process.exit(1);
  }
  console.log('image-metadata: no image carries metadata');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
