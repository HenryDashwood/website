export interface Sound {
  samples: Float32Array;
  sampleRate: number;
}

export const FFT_SIZE = 2048;
export const HOP = 512;

// Radix-2 FFT with a symmetric Hann window, shared by the spectrum and STFT.
// A window shorter than size is zero-padded, which samples the same spectrum more finely.
export function magnitudes(samples: Float32Array, size: number, offset = 0, windowLength = size) {
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < windowLength; i++) {
    real[i] = (samples[offset + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (windowLength - 1)));
  }
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [real[i], real[j]] = [real[j], real[i]];
  }
  for (let length = 2; length <= size; length *= 2) {
    for (let start = 0; start < size; start += length) {
      for (let j = 0; j < length / 2; j++) {
        const angle = (-2 * Math.PI * j) / length;
        const a = start + j;
        const b = a + length / 2;
        const re = real[b] * Math.cos(angle) - imag[b] * Math.sin(angle);
        const im = real[b] * Math.sin(angle) + imag[b] * Math.cos(angle);
        real[b] = real[a] - re;
        imag[b] = imag[a] - im;
        real[a] += re;
        imag[a] += im;
      }
    }
  }
  return Float64Array.from(real.subarray(0, size / 2 + 1), (r, i) => Math.hypot(r, imag[i]));
}

export function decibels(value: number, reference: number) {
  return 20 * Math.log10(Math.max(value / (reference || 1), 1e-6));
}
