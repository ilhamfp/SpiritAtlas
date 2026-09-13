const HASH = /^[a-f0-9]{64}$/;
const fail = message => { throw new Error(`Droplet mask: ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };
const timeKey = time => Math.round(time * 1e9);

export async function sha256Bytes(bytes) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

/** Decode a validated table; network loading also verifies its binary hash. */
export function createDropletMask(meta, data, { cache } = {}) {
  assert(meta?.version === 1 && meta.encoding === 'int16-le', 'unsupported encoding');
  assert(Number.isInteger(meta.count) && meta.count > 0 && meta.count <= 100000, 'invalid particle count');
  assert(Number.isInteger(meta.poseCount) && meta.poseCount >= 2 && meta.poseCount <= 10000, 'invalid pose count');
  assert(meta.quantization === 32767 && meta.absentValue === -32767, 'incorrect signed quantization');
  assert(meta.clearanceMargin === .0005 && meta.clearanceMultiplier === .95, 'incorrect clearance policy');
  assert(Array.isArray(meta.revealPhase) && meta.revealPhase.length === 2
    && meta.revealPhase[0] === .008 && meta.revealPhase[1] === .085, 'incorrect reveal policy');
  for (const key of ['binarySha256', 'sourceCacheSha256', 'sourceCacheMetadataSha256'])
    assert(HASH.test(meta[key] ?? ''), `invalid ${key}`);
  assert(cache && meta.count === cache.count && Number.isFinite(cache.duration) && cache.duration > 0,
    'cache particle count or duration mismatch');
  for (const key of ['sourceCacheSha256', 'sourceCacheMetadataSha256'])
    assert(meta[key] === cache[key], `${key} mismatch`);
  assert(data instanceof ArrayBuffer && data.byteLength === meta.count * meta.poseCount * 2, 'binary length mismatch');
  assert(Array.isArray(meta.sourceTimes) && meta.sourceTimes.length === meta.poseCount
    && meta.sourceTimes.every(t => Number.isFinite(t) && t >= 0 && t <= cache.duration), 'invalid source times');
  assert(Array.isArray(meta.sortedSamples) && meta.sortedSamples.length >= 2, 'missing sorted samples');
  assert(Array.isArray(meta.nativeDropParticleIds) && meta.nativeDropParticleIds.length === meta.poseCount,
    'missing particle correspondence');
  for (const ids of meta.nativeDropParticleIds) {
    assert(Array.isArray(ids) && ids.every(id => Number.isInteger(id) && id >= 0 && id < meta.count),
      'invalid particle correspondence');
    assert(new Set(ids).size === ids.length, 'ambiguous particle correspondence');
  }
  const view = new DataView(data), values = new Int16Array(meta.count * meta.poseCount);
  for (let i = 0; i < values.length; i++) {
    values[i] = view.getInt16(i * 2, true);
    assert(values[i] >= meta.absentValue, 'signed value outside the encoding range');
  }
  const byTime = new Map();
  for (let pose = 0; pose < meta.poseCount; pose++) {
    const key = timeKey(meta.sourceTimes[pose]), existing = byTime.get(key);
    if (existing === undefined) byTime.set(key, pose);
    else for (let particle = 0; particle < meta.count; particle++)
      assert(values[existing * meta.count + particle] === values[pose * meta.count + particle],
        'duplicate source times disagree');
  }
  // Native cosine times can differ by one floating-point ulp (6.6 versus
  // 6.6000000000000005). Their rows must agree, but both exact times may appear.
  const exactTimes = new Set(meta.sourceTimes);
  assert(meta.sortedSamples.length === exactTimes.size, 'incomplete unique sample clock');
  const times = new Float64Array(meta.sortedSamples.length), offsets = new Uint32Array(times.length);
  let previous = -Infinity;
  for (let i = 0; i < times.length; i++) {
    const sample = meta.sortedSamples[i];
    assert(Number.isInteger(sample?.poseIndex) && sample.poseIndex >= 0 && sample.poseIndex < meta.poseCount,
      'invalid sorted pose index');
    const time = sample.sourceTime;
    assert(Number.isFinite(time) && time > previous
      && time === meta.sourceTimes[sample.poseIndex], 'invalid sorted sample clock');
    assert(exactTimes.has(time), 'unknown sorted source time');
    times[i] = time; offsets[i] = sample.poseIndex * meta.count; previous = time;
  }
  assert(times[0] === 0 && Math.abs(times.at(-1) - cache.duration) < 1e-9, 'incomplete duration coverage');
  let lower = 0, upper = 0, blend = 0, reveal = 0;
  const mask = {
    count: meta.count, poseCount: meta.poseCount, duration: cache.duration,
    binarySha256: meta.binarySha256, sampleCount: times.length,
    sample(sourceTime, phase) {
      assert(Number.isFinite(sourceTime) && Number.isFinite(phase), 'nonfinite playback sample');
      const time = Math.max(times[0], Math.min(times.at(-1), sourceTime));
      let low = 0, high = times.length - 1;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (times[middle] < time) low = middle + 1; else high = middle;
      }
      const next = low, prior = next > 0 && times[next] !== time ? next - 1 : next;
      lower = offsets[prior]; upper = offsets[next];
      blend = prior === next ? 0 : (time - times[prior]) / (times[next] - times[prior]);
      const t = Math.max(0, Math.min(1, (phase - meta.revealPhase[0]) / (meta.revealPhase[1] - meta.revealPhase[0])));
      reveal = t * t * (3 - 2 * t);
      return mask;
    },
    radiusScale(particleId) {
      // Only the existing candidate loop calls this hot path. Interpolate the
      // signed clearance before clamping: an embedded endpoint cannot birth a
      // sphere merely because the other endpoint's clearance is positive.
      if (!Number.isInteger(particleId) || particleId < 0 || particleId >= meta.count)
        fail('particle index out of bounds');
      const a = values[lower + particleId], b = values[upper + particleId];
      return Math.max(0, Math.min(1, (a + (b - a) * blend) / meta.quantization)) * reveal;
    },
  };
  return mask.sample(0, 0);
}

/** Load before a WebGL context is created; a missing/stale mask fails closed. */
export async function loadDropletMask({ cache, signal,
  url = '/classic-negroni/simulation/droplet-clearance.json', fetchImpl = globalThis.fetch } = {}) {
  signal?.throwIfAborted();
  const metadataUrl = new URL(url, globalThis.location?.href ?? 'http://localhost/');
  const metadataResponse = await fetchImpl(metadataUrl.href, { signal });
  assert(metadataResponse.ok, 'metadata unavailable');
  const metadataBytes = await metadataResponse.arrayBuffer();
  const meta = JSON.parse(new TextDecoder().decode(metadataBytes));
  assert(typeof meta.binaryFile === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.bin$/.test(meta.binaryFile),
    'binary must be a versioned sibling file');
  const binaryResponse = await fetchImpl(new URL(meta.binaryFile, metadataUrl).href, { signal });
  assert(binaryResponse.ok, 'binary unavailable');
  const data = await binaryResponse.arrayBuffer();
  const [binarySha256, metadataSha256] = await Promise.all([sha256Bytes(data), sha256Bytes(metadataBytes)]);
  signal?.throwIfAborted();
  assert(binarySha256 === meta.binarySha256, 'binary hash mismatch');
  const mask = createDropletMask(meta, data, { cache });
  mask.metadataSha256 = metadataSha256;
  return mask;
}
