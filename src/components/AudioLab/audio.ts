export interface Sound {
  samples: Float32Array;
  sampleRate: number;
}

export const FFT_SIZE = 2048;
export const HOP = 512;

export function signalLevel(samples: Float32Array) {
  let peak = 0;
  let squares = 0;
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
    squares += sample * sample;
  }
  const rms = samples.length ? Math.sqrt(squares / samples.length) : 0;
  return { peak, db: Math.max(-90, 20 * Math.log10(rms || 1e-12)) };
}

export function waveformLimit(signals: readonly Float32Array[]) {
  let peak = 0;
  for (const samples of signals) {
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  }
  return peak > 0 ? peak * 1.05 : 1;
}

// Radix-2 FFT with a symmetric Hann window, shared by the spectrum and STFT.
export function magnitudes(samples: Float32Array, size: number, offset = 0) {
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (samples[offset + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
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

export function synthesize(vowel: "buzz" | "ah" | "ee", pitch: number): Sound {
  const sampleRate = 44100;
  const samples = new Float32Array(sampleRate);
  const peaks = vowel === "ah" ? [700, 1200] : vowel === "ee" ? [300, 2300] : [];
  for (let harmonic = 1; harmonic <= 40; harmonic++) {
    const frequency = harmonic * pitch;
    const gain =
      (1 + peaks.reduce((sum, peak) => sum + 20 * Math.exp(-(((frequency - peak) / 100) ** 2)), 0)) / harmonic;
    for (let i = 0; i < samples.length; i++) samples[i] += gain * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  for (let i = 0; i < samples.length; i++) samples[i] *= 0.9 / (peak || 1);
  return { samples, sampleRate };
}

export function vowelSegment(sound: Sound): Sound {
  const length = Math.round(sound.sampleRate * 0.2);
  const start = Math.max(0, Math.min(Math.floor(sound.samples.length / 2), sound.samples.length - length));
  return {
    samples: sound.samples.slice(start, start + length),
    sampleRate: sound.sampleRate,
  };
}
