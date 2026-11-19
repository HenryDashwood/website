import assert from "node:assert/strict";
import { test } from "node:test";

import { decibels, magnitudes } from "./audio";

test("FFT matches a direct Fourier transform with a Hann window", () => {
  const input = Float32Array.from([0.2, -0.3, 0.8, 0.4, -0.5, 0.1, 0.7, -0.2]);
  const actual = magnitudes(input, input.length);
  for (let bin = 0; bin < actual.length; bin++) {
    let real = 0;
    let imaginary = 0;
    for (let i = 0; i < input.length; i++) {
      const value = input[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (input.length - 1)));
      real += value * Math.cos((-2 * Math.PI * bin * i) / input.length);
      imaginary += value * Math.sin((-2 * Math.PI * bin * i) / input.length);
    }
    assert.ok(Math.abs(actual[bin] - Math.hypot(real, imaginary)) < 1e-10);
  }
});

test("STFT windows pad the start and end with silence", () => {
  const samples = Float32Array.from([0.25, 0.5]);
  assert.deepEqual(magnitudes(samples, 8, -3), magnitudes(Float32Array.from([0, 0, 0, 0.25, 0.5, 0, 0, 0]), 8));
  assert.deepEqual(magnitudes(samples, 8, 1), magnitudes(Float32Array.from([0.5, 0, 0, 0, 0, 0, 0, 0]), 8));
});

test("silence produces finite decibels, and the strongest frequency is 0 dB", () => {
  assert.equal(decibels(0, 0), -120);
  assert.equal(decibels(2, 2), 0);
  for (const value of magnitudes(new Float32Array(2048), 2048)) assert.equal(decibels(value, 0), -120);
});

test("zero-padding samples the same windowed spectrum more finely", () => {
  const input = Float32Array.from({ length: 8 }, (_, i) => Math.sin(i));
  const plain = magnitudes(input, 8);
  const padded = magnitudes(input, 32, 0, 8);
  // Every fourth padded bin is one of the unpadded bins
  plain.forEach((value, bin) => assert.ok(Math.abs(padded[bin * 4] - value) < 1e-10));
});
