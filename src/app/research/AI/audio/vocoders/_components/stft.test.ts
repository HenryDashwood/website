import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BINS,
  decodeWav,
  encodeWav,
  FFT_SIZE,
  griffinLim,
  hannWindow,
  HOP,
  ifftFrame,
  istft,
  melFilterbank,
  melPseudoInverse,
  melRoundTrip,
  stft,
  stftMagnitudes,
  withRandomPhase,
} from "./stft";

test("STFT followed by iSTFT reconstructs a signal identically when phase is kept", () => {
  const sampleRate = 24000;
  const input = Float32Array.from({ length: 4096 }, (_, i) => {
    const t = i / sampleRate;
    return 0.4 * Math.sin(2 * Math.PI * 170 * t) + 0.2 * Math.sin(2 * Math.PI * 510 * t + 0.7);
  });

  const reconstructed = istft(stft(input));
  assert.equal(reconstructed.length, input.length);

  let maxError = 0;
  for (let i = 0; i < input.length; i++) {
    maxError = Math.max(maxError, Math.abs(input[i] - reconstructed[i]));
  }
  assert.ok(maxError < 1e-6, `Expected near-zero reconstruction error, got ${maxError}`);
});

test("overlap-adding individual ifftFrame slices matches istft", () => {
  const input = Float32Array.from({ length: 2048 }, (_, i) => Math.sin((2 * Math.PI * 170 * i) / 24000));
  const complex = stft(input);
  const direct = istft(complex);

  const sum = new Float64Array(input.length);
  const norm = new Float64Array(input.length);
  for (let f = 0; f < complex.real.length; f++) {
    const slice = ifftFrame(complex.real[f], complex.imag[f]);
    const offset = f * HOP - FFT_SIZE / 2;
    for (let i = 0; i < FFT_SIZE; i++) {
      const idx = offset + i;
      if (idx >= 0 && idx < input.length) {
        sum[idx] += slice[i];
        norm[idx] += hannWindow[i] * hannWindow[i];
      }
    }
  }

  let maxDiff = 0;
  for (let i = 0; i < input.length; i++) {
    maxDiff = Math.max(maxDiff, Math.abs(direct[i] - sum[i] / norm[i]));
  }
  assert.ok(maxDiff < 1e-6, `Expected per-frame overlap-add to match istft, got ${maxDiff}`);
});

test("random phase alters the waveform while preserving magnitudes", () => {
  const input = Float32Array.from({ length: 4096 }, (_, i) => Math.sin((2 * Math.PI * 220 * i) / 24000));
  const mags = stftMagnitudes(stft(input));
  const scrambled = istft(withRandomPhase(mags, 7));

  let maxDiff = 0;
  for (let i = 0; i < input.length; i++) maxDiff = Math.max(maxDiff, Math.abs(input[i] - scrambled[i]));
  assert.ok(maxDiff > 0.2);
});

test("encodeWav and decodeWav round-trip 16-bit PCM samples", () => {
  const samples = Float32Array.from([0, 0.5, -0.5, 0.25]);
  const wav = encodeWav(samples, 24000);
  assert.equal(wav.byteLength, 44 + samples.length * 2);
  const header = new TextDecoder().decode(new Uint8Array(wav, 0, 12));
  assert.equal(header, "RIFF,\x00\x00\x00WAVE");

  const decoded = decodeWav(wav);
  assert.equal(decoded.sampleRate, 24000);
  assert.equal(decoded.samples.length, samples.length);
  for (let i = 0; i < samples.length; i++) {
    assert.ok(Math.abs(decoded.samples[i] - samples[i]) < 1e-4);
  }
});

test("Griffin-Lim reduces spectral mismatch across iterations", () => {
  const input = Float32Array.from({ length: 4096 }, (_, i) => {
    const t = i / 24000;
    return 0.5 * Math.sin(2 * Math.PI * 170 * t) + 0.25 * Math.sin(2 * Math.PI * 340 * t);
  });
  const target = stftMagnitudes(stft(input));
  const { errors, samples } = griffinLim(target, 16, 42);

  assert.equal(errors.length, 17);
  assert.equal(samples.length, 17);
  assert.ok(errors[16] < errors[0] * 0.5, `Expected error to drop sharply: ${errors[0]} -> ${errors[16]}`);
});

test("mel pseudo-inverse inverts the mel filterbank on the mel subspace", () => {
  const fb = melFilterbank(24000, 80, 12000);
  const pinv = melPseudoInverse(fb);
  assert.equal(fb.length, 80);
  assert.equal(pinv.length, BINS);

  let maxErr = 0;
  for (let i = 0; i < 80; i++) {
    for (let j = 0; j < 80; j++) {
      let sum = 0;
      for (let b = 0; b < BINS; b++) sum += fb[i][b] * pinv[b][j];
      maxErr = Math.max(maxErr, Math.abs(sum - (i === j ? 1 : 0)));
    }
  }
  assert.ok(maxErr < 1e-4, `Expected M @ M^+ ≈ I, max error was ${maxErr}`);
});

test("melRoundTrip preserves frame count and non-negative magnitudes", () => {
  const input = Float32Array.from({ length: 2048 }, (_, i) => Math.sin((2 * Math.PI * 300 * i) / 24000));
  const linear = stftMagnitudes(stft(input));
  const approx = melRoundTrip(linear, 24000, 80);
  assert.equal(approx.magnitudes.length, linear.magnitudes.length);
  for (const frame of approx.magnitudes) {
    assert.equal(frame.length, BINS);
    for (const v of frame) assert.ok(v >= 0);
  }
});
