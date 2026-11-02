// Table-driven tests for the image metadata policy (T109, SEC-009). Fixtures are built in the test.
import { describe, expect, it } from 'vitest';
import { findMetadata } from './image-metadata.mjs';

const segment = (marker, payload) => {
  const length = payload.length + 2;
  return Buffer.concat([Buffer.from([0xff, marker, length >> 8, length & 0xff]), payload]);
};
const jpeg = (...segments) => Buffer.concat([Buffer.from([0xff, 0xd8]), ...segments, Buffer.from([0xff, 0xd9])]);
const pngChunk = (type, data = Buffer.alloc(0)) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'latin1');
  return Buffer.concat([head, data, Buffer.alloc(4)]);
};
const png = (...chunks) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ...chunks]);
const webpChunk = (type, data) => {
  const head = Buffer.alloc(8);
  head.write(type, 0, 'latin1');
  head.writeUInt32LE(data.length, 4);
  return Buffer.concat([head, data, data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
};
const webp = (...chunks) => {
  const body = Buffer.concat([Buffer.from('WEBP', 'latin1'), ...chunks]);
  const head = Buffer.alloc(8);
  head.write('RIFF', 0, 'latin1');
  head.writeUInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
};

describe('image metadata policy', () => {
  it.each([
    { name: 'given a clean JPEG with only an ICC profile, then no metadata is found', buffer: jpeg(segment(0xe2, Buffer.from('ICC_PROFILE\0'))), expected: [] },
    { name: 'given a JPEG with an EXIF segment, then EXIF is found', buffer: jpeg(segment(0xe1, Buffer.from('Exif\0\0GPS'))), expected: ['EXIF (may hold GPS)'] },
    { name: 'given a JPEG with an XMP segment, then XMP is found', buffer: jpeg(segment(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/\0'))), expected: ['XMP'] },
    { name: 'given a JPEG with a comment, then the comment is found', buffer: jpeg(segment(0xfe, Buffer.from('author'))), expected: ['JPEG comment'] },
    { name: 'given a clean PNG, then no metadata is found', buffer: png(pngChunk('IHDR', Buffer.alloc(13)), pngChunk('IEND')), expected: [] },
    { name: 'given a PNG with a tEXt chunk, then the text is found', buffer: png(pngChunk('IHDR', Buffer.alloc(13)), pngChunk('tEXt', Buffer.from('Author\0me')), pngChunk('IEND')), expected: ['PNG tEXt text'] },
    { name: 'given a PNG with an eXIf chunk, then EXIF is found', buffer: png(pngChunk('IHDR', Buffer.alloc(13)), pngChunk('eXIf', Buffer.from('x')), pngChunk('IEND')), expected: ['PNG eXIf (may hold GPS)'] },
    { name: 'given a clean WebP, then no metadata is found', buffer: webp(webpChunk('VP8L', Buffer.alloc(5))), expected: [] },
    { name: 'given a WebP with an EXIF chunk, then EXIF is found', buffer: webp(webpChunk('VP8L', Buffer.alloc(5)), webpChunk('EXIF', Buffer.from('ab'))), expected: ['WebP EXIF (may hold GPS)'] },
    { name: 'given a WebP with an XMP chunk, then XMP is found', buffer: webp(webpChunk('XMP ', Buffer.from('xmp!'))), expected: ['WebP XMP'] },
    { name: 'given an unknown file, then it is reported and not passed silently', buffer: Buffer.from('GIF89a'), expected: ['unknown image format'] },
  ])('$name', ({ buffer, expected }) => {
    // given / when
    const found = findMetadata(buffer);
    // then
    expect(found).toEqual(expected);
  });
});
