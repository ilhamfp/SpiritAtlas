import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const publicRoot = new URL('../public/', import.meta.url);
const asset = path => new URL(path.split('?')[0].replace(/^\//, ''), publicRoot);
const json = async path => JSON.parse(await readFile(asset(path), 'utf8'));
const manifest = await json('/classic-negroni/cinematic/manifest.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Read actual ISO BMFF track metadata, so an intact but incorrectly encoded
// replacement cannot silently pass a manifest-only duration assertion.
function boxes(buffer, start = 0, end = buffer.length) {
  const result = [];
  for (let offset = start; offset < end;) {
    assert.ok(offset + 8 <= end, 'complete MP4 box header');
    const declared = buffer.readUInt32BE(offset);
    const header = declared === 1 ? 16 : 8;
    const size = declared === 1 ? Number(buffer.readBigUInt64BE(offset + 8)) : declared || end - offset;
    assert.ok(size >= header && offset + size <= end, 'valid MP4 box bounds');
    result.push({ type: buffer.toString('ascii', offset + 4, offset + 8), start: offset + header, end: offset + size });
    offset += size;
  }
  return result;
}

function videoTrack(buffer) {
  const child = (parent, type) => {
    const found = boxes(buffer, parent.start, parent.end).find(box => box.type === type);
    assert.ok(found, `MP4 contains ${type}`);
    return found;
  };
  const movie = child({ start: 0, end: buffer.length }, 'moov');
  const track = boxes(buffer, movie.start, movie.end).filter(box => box.type === 'trak').find(box => {
    const handler = child(child(box, 'mdia'), 'hdlr');
    return buffer.toString('ascii', handler.start + 8, handler.start + 12) === 'vide';
  });
  assert.ok(track, 'MP4 contains a video track');
  const media = child(track, 'mdia');
  const header = child(media, 'mdhd');
  const version = buffer[header.start];
  const timescale = buffer.readUInt32BE(header.start + (version === 1 ? 20 : 12));
  const duration = version === 1 ? Number(buffer.readBigUInt64BE(header.start + 24)) : buffer.readUInt32BE(header.start + 16);
  const samples = child(child(child(media, 'minf'), 'stbl'), 'stsz');
  const frameCount = buffer.readUInt32BE(samples.start + 8);
  const dimensions = child(track, 'tkhd');
  return {
    duration: duration / timescale,
    frameCount,
    fps: frameCount / (duration / timescale),
    width: buffer.readUInt32BE(dimensions.end - 8) / 65536,
    height: buffer.readUInt32BE(dimensions.end - 4) / 65536,
  };
}

for (const variant of ['forward', 'reverse', 'idle']) {
  test(`${variant} keeps the original cinematic bytes and full 60 fps video track`, async () => {
    const bytes = await readFile(asset(manifest[variant]));
    assert.equal(hash(bytes), manifest.sha256[variant]);
    assert.ok(manifest[variant].includes(`?v=${manifest.sha256[variant].slice(0, 12)}`));
    const track = videoTrack(bytes);
    assert.equal(track.frameCount, variant === 'idle' ? manifest.idleFrameCount : manifest.frameCount);
    assert.equal(track.fps, 60);
    assert.equal(track.width, 720);
    assert.equal(track.height, 720);
    const expectedDuration = variant === 'idle' ? manifest.idleDuration : manifest.duration;
    // Main film includes both endpoint frames, so encoded duration is one frame longer.
    assert.ok(Math.abs(track.duration - expectedDuration) <= 1 / manifest.fps + 1e-6);
  });
}

test('live fluid cache covers the same complete timeline and all three equal ingredient groups', async () => {
  const meta = await json('/classic-negroni/simulation/negroni.json');
  const data = await readFile(asset('/classic-negroni/simulation/negroni.bin'));
  assert.equal(meta.encoding, 'int16-le');
  assert.equal(meta.duration, manifest.duration);
  assert.equal((meta.frameCount - 1) / meta.fps, manifest.duration);
  assert.equal(data.length, meta.frameCount * meta.count * 3 * Int16Array.BYTES_PER_ELEMENT);
  assert.equal(meta.count, 4800);
  assert.deepEqual([0, 1, 2].map(id => meta.ids.filter(value => value === id).length), [1600, 1600, 1600]);
  assert.equal(meta.phases.length, meta.frameCount);
  assert.equal(meta.phases[0], 0);
  assert.equal(meta.phases.at(-1), 1);
  assert.ok(meta.phases.every((phase, index) => phase >= 0 && phase <= 1 && (index === 0 || phase >= meta.phases[index - 1])));
  assert.equal(manifest.idleTimeline.sourceStart, meta.motionDuration);
  assert.equal(manifest.idleTimeline.sourceEnd, meta.duration);
  assert.equal(manifest.idleTimeline.duration, manifest.idleDuration);
  const stride = meta.count * 3 * Int16Array.BYTES_PER_ELEMENT;
  assert.notDeepEqual(data.subarray(0, stride), data.subarray(-stride), 'expansion contains actual changed particle positions');
});

test('cinematic and live renderer retain the same original orange textures and valid poster', async () => {
  const material = await json(manifest.citrus.manifest);
  assert.deepEqual(material.assets, manifest.citrus.assets);
  for (const entry of material.assets) {
    const data = await readFile(asset(entry.file));
    assert.equal(data.length, entry.bytes);
    assert.equal(hash(data), entry.sha256);
    assert.equal(data.readUInt32BE(16), entry.width);
    assert.equal(data.readUInt32BE(20), entry.height);
  }
  const poster = await readFile(asset(manifest.poster));
  assert.equal(poster.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(poster.readUInt32BE(16), manifest.resolution);
  assert.equal(poster.readUInt32BE(20), manifest.resolution);
});
