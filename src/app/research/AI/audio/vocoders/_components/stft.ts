// STFT, per-frame inverse FFT, overlap-add iSTFT, random-phase scrambling, and WAV encoding.
// Uses the same 1,024-sample window and 256-sample hop as Representing Audio Data.

export const FFT_SIZE = 1024;
export const HOP = 256;
export const BINS = FFT_SIZE / 2 + 1;

export interface ComplexFrames {
  real: Float32Array[];
  imag: Float32Array[];
  length: number;
}

export interface StftMagnitudes {
  magnitudes: Float32Array[];
  length: number;
}

export const hannWindow = Float64Array.from(
  { length: FFT_SIZE },
  (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FFT_SIZE)
);

const bitRev = new Uint16Array(FFT_SIZE);
{
  const bits = Math.log2(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    let rev = 0;
    for (let b = 0; b < bits; b++) rev = (rev << 1) | ((i >> b) & 1);
    bitRev[i] = rev;
  }
}

const cosTable = new Float64Array(FFT_SIZE / 2);
const sinTable = new Float64Array(FFT_SIZE / 2);
for (let i = 0; i < FFT_SIZE / 2; i++) {
  const angle = (-2 * Math.PI * i) / FFT_SIZE;
  cosTable[i] = Math.cos(angle);
  sinTable[i] = Math.sin(angle);
}

export function fftInPlace(real: Float64Array, imag: Float64Array, inverse = false) {
  const n = real.length;
  for (let i = 0; i < n; i++) {
    const j = bitRev[i];
    if (i < j) {
      const tr = real[i];
      real[i] = real[j];
      real[j] = tr;
      const ti = imag[i];
      imag[i] = imag[j];
      imag[j] = ti;
    }
  }

  const sign = inverse ? -1 : 1;
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let start = 0; start < n; start += size) {
      for (let j = 0; j < half; j++) {
        const k = j * step;
        const wr = cosTable[k];
        const wi = sign * sinTable[k];
        const a = start + j;
        const b = a + half;
        const re = real[b] * wr - imag[b] * wi;
        const im = real[b] * wi + imag[b] * wr;
        real[b] = real[a] - re;
        imag[b] = imag[a] - im;
        real[a] += re;
        imag[a] += im;
      }
    }
  }

  if (inverse) {
    const invN = 1 / n;
    for (let i = 0; i < n; i++) {
      real[i] *= invN;
      imag[i] *= invN;
    }
  }
}

export function stft(samples: Float32Array): ComplexFrames {
  const frameCount = Math.floor(samples.length / HOP) + 1;
  const realFrames: Float32Array[] = [];
  const imagFrames: Float32Array[] = [];
  const bufRe = new Float64Array(FFT_SIZE);
  const bufIm = new Float64Array(FFT_SIZE);

  for (let f = 0; f < frameCount; f++) {
    const offset = f * HOP - FFT_SIZE / 2;
    bufIm.fill(0);
    for (let i = 0; i < FFT_SIZE; i++) {
      const idx = offset + i;
      const sample = idx >= 0 && idx < samples.length ? samples[idx] : 0;
      bufRe[i] = sample * hannWindow[i];
    }
    fftInPlace(bufRe, bufIm, false);
    const r = new Float32Array(BINS);
    const im = new Float32Array(BINS);
    for (let b = 0; b < BINS; b++) {
      r[b] = bufRe[b];
      im[b] = bufIm[b];
    }
    realFrames.push(r);
    imagFrames.push(im);
  }

  return { real: realFrames, imag: imagFrames, length: samples.length };
}

// Inverse FFT of a single STFT frame, multiplied by the synthesis Hann window.
export function ifftFrame(r: Float32Array, im: Float32Array): Float32Array {
  const bufRe = new Float64Array(FFT_SIZE);
  const bufIm = new Float64Array(FFT_SIZE);
  bufRe[0] = r[0];
  bufRe[FFT_SIZE / 2] = r[FFT_SIZE / 2];
  for (let b = 1; b < FFT_SIZE / 2; b++) {
    bufRe[b] = r[b];
    bufIm[b] = im[b];
    bufRe[FFT_SIZE - b] = r[b];
    bufIm[FFT_SIZE - b] = -im[b];
  }
  fftInPlace(bufRe, bufIm, true);
  const out = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) out[i] = bufRe[i] * hannWindow[i];
  return out;
}

export function istft({ real, imag, length }: ComplexFrames): Float32Array {
  const out = new Float64Array(length);
  const norm = new Float64Array(length);
  const bufRe = new Float64Array(FFT_SIZE);
  const bufIm = new Float64Array(FFT_SIZE);

  for (let f = 0; f < real.length; f++) {
    const r = real[f];
    const im = imag[f];
    bufRe[0] = r[0];
    bufIm[0] = 0;
    bufRe[FFT_SIZE / 2] = r[FFT_SIZE / 2];
    bufIm[FFT_SIZE / 2] = 0;
    for (let b = 1; b < FFT_SIZE / 2; b++) {
      bufRe[b] = r[b];
      bufIm[b] = im[b];
      bufRe[FFT_SIZE - b] = r[b];
      bufIm[FFT_SIZE - b] = -im[b];
    }

    fftInPlace(bufRe, bufIm, true);

    const offset = f * HOP - FFT_SIZE / 2;
    for (let i = 0; i < FFT_SIZE; i++) {
      const idx = offset + i;
      if (idx >= 0 && idx < length) {
        const w = hannWindow[i];
        out[idx] += bufRe[i] * w;
        norm[idx] += w * w;
      }
    }
  }

  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = norm[i] > 1e-12 ? out[i] / norm[i] : 0;
  }
  return result;
}

export function stftMagnitudes(complex: ComplexFrames): StftMagnitudes {
  return {
    length: complex.length,
    magnitudes: complex.real.map((r, f) => {
      const im = complex.imag[f];
      const mag = new Float32Array(BINS);
      for (let b = 0; b < BINS; b++) mag[b] = Math.hypot(r[b], im[b]);
      return mag;
    }),
  };
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function withRandomPhase({ magnitudes, length }: StftMagnitudes, seed = 42): ComplexFrames {
  const rand = mulberry32(seed);
  const real: Float32Array[] = [];
  const imag: Float32Array[] = [];
  for (let f = 0; f < magnitudes.length; f++) {
    const mag = magnitudes[f];
    const r = new Float32Array(BINS);
    const im = new Float32Array(BINS);
    r[0] = mag[0];
    r[BINS - 1] = mag[BINS - 1];
    for (let b = 1; b < BINS - 1; b++) {
      const angle = 2 * Math.PI * rand();
      r[b] = mag[b] * Math.cos(angle);
      im[b] = mag[b] * Math.sin(angle);
    }
    real.push(r);
    imag.push(im);
  }
  return { real, imag, length };
}

// Relative Frobenius spectral mismatch: || |STFT(x)| - target || / || target ||
export function spectralError(target: Float32Array[], actual: ComplexFrames): number {
  let diffSq = 0;
  let refSq = 0;
  for (let f = 0; f < target.length; f++) {
    const t = target[f];
    const r = actual.real[f];
    const im = actual.imag[f];
    for (let b = 0; b < BINS; b++) {
      const mag = Math.hypot(r[b], im[b]);
      const d = mag - t[b];
      diffSq += d * d;
      refSq += t[b] * t[b];
    }
  }
  return refSq > 0 ? Math.sqrt(diffSq / refSq) : 0;
}

export interface GriffinLimResult {
  samples: Float32Array[];
  errors: number[];
}

// Classic Griffin-Lim loop: keeps target magnitudes, iteratively updates phase via iSTFT -> STFT.
// Returns the reconstructed waveform and spectral mismatch (against `reference`, defaulting to `target`) at 0..maxIter.
export function griffinLim(
  target: StftMagnitudes,
  maxIter = 32,
  seed = 42,
  reference: Float32Array[] = target.magnitudes
): GriffinLimResult {
  const samples: Float32Array[] = [];
  const errors: number[] = [];

  let current = withRandomPhase(target, seed);
  let wave = istft(current);
  samples.push(wave);

  let analysed = stft(wave);
  errors.push(spectralError(reference, analysed));

  for (let iter = 1; iter <= maxIter; iter++) {
    const nextReal: Float32Array[] = [];
    const nextImag: Float32Array[] = [];
    for (let f = 0; f < target.magnitudes.length; f++) {
      const tMag = target.magnitudes[f];
      const aRe = analysed.real[f];
      const aIm = analysed.imag[f];
      const r = new Float32Array(BINS);
      const im = new Float32Array(BINS);
      for (let b = 0; b < BINS; b++) {
        const mag = Math.hypot(aRe[b], aIm[b]);
        if (mag > 1e-10) {
          const scale = tMag[b] / mag;
          r[b] = aRe[b] * scale;
          im[b] = aIm[b] * scale;
        } else {
          r[b] = tMag[b];
          im[b] = 0;
        }
      }
      nextReal.push(r);
      nextImag.push(im);
    }

    current = { real: nextReal, imag: nextImag, length: target.length };
    wave = istft(current);
    samples.push(wave);
    analysed = stft(wave);
    errors.push(spectralError(reference, analysed));
  }

  return { samples, errors };
}

const hzToMel = (hz: number) => 2595 * Math.log10(1 + hz / 700);
const melToHz = (mel: number) => 700 * (10 ** (mel / 2595) - 1);

export function melFilterbank(sampleRate: number, bands = 80, maxHz = sampleRate / 2): Float64Array[] {
  const binHz = sampleRate / FFT_SIZE;
  const minMel = hzToMel(0);
  const maxMel = hzToMel(maxHz);
  const edges = Float64Array.from({ length: bands + 2 }, (_, i) =>
    melToHz(minMel + ((maxMel - minMel) * i) / (bands + 1))
  );

  return Array.from({ length: bands }, (_, band) => {
    const row = new Float64Array(BINS);
    const lo = edges[band];
    const mid = edges[band + 1];
    const hi = edges[band + 2];
    for (let b = 0; b < BINS; b++) {
      const hz = b * binHz;
      if (hz > lo && hz <= mid) row[b] = (hz - lo) / (mid - lo);
      else if (hz > mid && hz < hi) row[b] = (hi - hz) / (hi - mid);
    }
    return row;
  });
}

// Minimum-norm pseudo-inverse M^+ = M^T (M M^T + ridge*I)^-1 via Gauss-Jordan on the (bands x bands) Gram matrix.
export function melPseudoInverse(fb: Float64Array[], ridge = 1e-6): Float64Array[] {
  const m = fb.length;
  const n = fb[0].length;
  const aug = Array.from({ length: m }, (_, i) => {
    const row = new Float64Array(2 * m);
    for (let j = 0; j < m; j++) {
      let dot = 0;
      for (let k = 0; k < n; k++) dot += fb[i][k] * fb[j][k];
      row[j] = dot + (i === j ? ridge : 0);
    }
    row[m + i] = 1;
    return row;
  });

  for (let col = 0; col < m; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < m; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivotRow][col])) pivotRow = r;
    }
    if (pivotRow !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = tmp;
    }
    const pivot = aug[col][col];
    for (let c = col; c < 2 * m; c++) aug[col][c] /= pivot;
    for (let r = 0; r < m; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (factor === 0) continue;
      for (let c = col; c < 2 * m; c++) aug[r][c] -= factor * aug[col][c];
    }
  }

  return Array.from({ length: n }, (_, bin) => {
    const row = new Float64Array(m);
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let i = 0; i < m; i++) sum += fb[i][bin] * aug[i][m + j];
      row[j] = sum;
    }
    return row;
  });
}

// Project linear magnitudes -> 80 mel bands -> approximate 513 linear magnitudes via pseudo-inverse.
export function melRoundTrip(linear: StftMagnitudes, sampleRate: number, bands = 80): StftMagnitudes {
  const fb = melFilterbank(sampleRate, bands, sampleRate / 2);
  const pinv = melPseudoInverse(fb);
  const melBuf = new Float64Array(bands);

  const approx = linear.magnitudes.map((frame) => {
    for (let i = 0; i < bands; i++) {
      let sum = 0;
      const row = fb[i];
      for (let b = 0; b < BINS; b++) sum += row[b] * frame[b];
      melBuf[i] = sum;
    }
    const out = new Float32Array(BINS);
    for (let b = 0; b < BINS; b++) {
      let sum = 0;
      const row = pinv[b];
      for (let i = 0; i < bands; i++) sum += row[i] * melBuf[i];
      out[b] = sum > 0 ? sum : 0;
    }
    return out;
  });

  return { magnitudes: approx, length: linear.length };
}

export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }
  return buffer;
}

// Decode a mono 16-bit PCM WAV directly from bytes (avoids OfflineAudioContext quirks across browsers).
export function decodeWav(buffer: ArrayBuffer): { samples: Float32Array; sampleRate: number } {
  const view = new DataView(buffer);
  const sampleRate = view.getUint32(24, true);
  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const id = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const size = view.getUint32(offset + 4, true);
    if (id === "data") {
      const count = Math.floor(size / 2);
      const samples = new Float32Array(count);
      for (let i = 0; i < count; i++) samples[i] = view.getInt16(offset + 8 + i * 2, true) / 32768;
      return { samples, sampleRate };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAV file missing data chunk");
}
