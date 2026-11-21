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
