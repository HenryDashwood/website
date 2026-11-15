import assert from "node:assert/strict";
import { test } from "node:test";

import { decibels, magnitudes, signalLevel, synthesize, vowelSegment, waveformLimit } from "./audio";

test("input meter distinguishes silence, quiet input, and normal audio", () => {
  assert.deepEqual(signalLevel(new Float32Array(128)), { peak: 0, db: -90 });
  assert.deepEqual(signalLevel(new Float32Array()), { peak: 0, db: -90 });
  const quiet = signalLevel(Float32Array.from([0.0001, -0.0001]));
  assert.ok(Math.abs(quiet.db + 80) < 0.01);
  assert.ok(quiet.peak > 0);
  const normal = signalLevel(Float32Array.from([0.5, -0.5]));
  assert.equal(normal.peak, 0.5);
  assert.ok(Math.abs(normal.db + 6.0206) < 0.001);
});

test("quiet waveforms use the available chart height without changing the recording", () => {
  const samples = Float32Array.from([0, 0.005, -0.003, 0.001]);
  const original = samples.slice();
  const limit = waveformLimit([samples]);
  assert.ok(limit < 0.006);
  assert.ok(samples[1] / limit > 0.9);
  assert.deepEqual(samples, original);
});

test("vowel comparisons share a scale based on the strongest signal", () => {
  const quiet = Float32Array.from([0.001, -0.002]);
  const loud = Float32Array.from([0.1, -0.2]);
  const limit = waveformLimit([quiet, loud]);
  assert.equal(limit, waveformLimit([loud]));
  assert.ok(Math.abs(loud[1] / limit) < 1);
  assert.ok(Math.abs(quiet[1] / limit) < 0.01);
});

test("silent and empty waveforms have a finite nonzero scale", () => {
  assert.equal(waveformLimit([new Float32Array(128)]), 1);
  assert.equal(waveformLimit([]), 1);
});

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

test("synthetic sounds last one second, are normalized, and have distinct formants", () => {
  const sounds = ["buzz", "ah", "ee"].map((vowel) => synthesize(vowel as "buzz" | "ah" | "ee", 100));
  for (const sound of sounds) {
    assert.equal(sound.samples.length, sound.sampleRate);
    const peak = sound.samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    assert.ok(Math.abs(peak - 0.9) < 1e-6);
    assert.ok(sound.samples.every(Number.isFinite));
  }
  const ah = magnitudes(sounds[1].samples, 16384);
  const ee = magnitudes(sounds[2].samples, 16384);
  const bin = (frequency: number) => Math.round((frequency * 16384) / sounds[0].sampleRate);
  assert.ok(ah[bin(700)] > ee[bin(700)]);
  assert.ok(ee[bin(2300)] > ah[bin(2300)]);
});

test("manually stopped vowels use the middle of longer recordings and preserve short captures", () => {
  const samples = Float32Array.from({ length: 6000 }, (_, i) => i);
  const segment = vowelSegment({ samples, sampleRate: 1000 });
  assert.equal(segment.samples.length, 200);
  assert.equal(segment.samples[0], 3000);
  const short = Float32Array.from([0.1, 0.2, 0.3]);
  assert.deepEqual(vowelSegment({ samples: short, sampleRate: 1000 }).samples, short);
});

test("vowels take 200 ms from one second into a two-second recording", () => {
  const samples = Float32Array.from({ length: 88200 }, (_, i) => i);
  const segment = vowelSegment({ samples, sampleRate: 44100 });
  assert.equal(segment.sampleRate, 44100);
  assert.equal(segment.samples.length, 8820);
  assert.equal(segment.samples[0], samples[44100]);
});
