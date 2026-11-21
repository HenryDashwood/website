"use client";

import { useMemo } from "react";

import { Axes, Chart, toPath } from "@/components/viz";

import { decibels, FFT_SIZE, magnitudes } from "./audio";
import { SUM, value } from "./Tones";
import { AXIS, useSentence } from "./WaveformPlayer";

// Spectra relative to each sound's strongest frequency (linear or dB), by default on a 0–4,000 Hz axis. The tone
// uses one second (sharp spikes); the vowel uses the 43 ms where its pitch holds at 170 Hz.
const [LEFT, RIGHT, TOP, BOTTOM] = [44, 352, 8, 128];

export function Plot({
  title,
  mags,
  binHz,
  db,
  maxHz = 4000,
  floor = -60,
}: {
  title: string;
  mags: Float64Array | null;
  binHz: number;
  db: boolean;
  maxHz?: number;
  floor?: number;
}) {
  const x = (hz: number) => LEFT + (hz / maxHz) * (RIGHT - LEFT);
  const y = (v: number) => (db ? TOP + (Math.min(-floor, -v) / -floor) * (BOTTOM - TOP) : BOTTOM - v * (BOTTOM - TOP));
  let path = "";
  if (mags) {
    const peak = mags.reduce((m, v) => Math.max(m, v), 0);
    // Keep the strongest value in each half-unit column so very long spectra stay drawable
    const columns = new Map<number, number>();
    for (let i = 0; i * binHz <= maxHz && i < mags.length; i++) {
      const column = Math.round(x(i * binHz) * 2) / 2;
      const level = y(db ? decibels(mags[i], peak) : mags[i] / peak);
      columns.set(column, Math.min(columns.get(column) ?? Infinity, level));
    }
    path = toPath([...columns]);
  }
  const ticks = db ? Array.from({ length: -floor / 20 + 1 }, (_, i) => -20 * i) : [1, 0.5, 0];
  const hzTicks = Array.from({ length: 5 }, (_, i) => (i * maxHz) / 4);
  return (
    <figure className="m-0">
      <figcaption className="mb-1 text-[13px] text-chart-ink">{title}</figcaption>
      <Chart width={360} height={160} label={title}>
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        {ticks.map((v) => (
          <text key={v} x={LEFT - 6} y={y(v) + 3} textAnchor="end" className="viz-axis" style={AXIS}>
            {v < 0 ? `−${-v}` : v}
          </text>
        ))}
        <text
          x={10}
          y={(TOP + BOTTOM) / 2}
          transform={`rotate(-90 10 ${(TOP + BOTTOM) / 2})`}
          textAnchor="middle"
          className="viz-axis"
          style={AXIS}
        >
          {db ? "Strength (dB)" : "Strength"}
        </text>
        {hzTicks.map((hz) => (
          <text key={hz} x={x(hz)} y={BOTTOM + 12} textAnchor="middle" className="viz-axis" style={AXIS}>
            {hz.toLocaleString("en-GB")}
          </text>
        ))}
        <text x={(LEFT + RIGHT) / 2} y={156} textAnchor="middle" className="viz-axis" style={AXIS}>
          Frequency (Hz)
        </text>
        <path d={path} fill="none" className="stroke-chart-series-1" strokeWidth={1} />
      </Chart>
    </figure>
  );
}

function useSpectra() {
  const sound = useSentence();
  // At 16,384 samples a second each bin is exactly 1 Hz, so the tone's peaks land on bins
  const tone = useMemo(
    () =>
      magnitudes(
        Float32Array.from({ length: 16384 }, (_, i) => value(i / 16384, SUM)),
        16384
      ),
    []
  );
  const vowel = useMemo(
    () => (sound ? magnitudes(sound.samples, 4096, Math.round(2.805 * sound.sampleRate), FFT_SIZE) : null),
    [sound]
  );
  return { tone, vowel, vowelBin: (sound?.sampleRate ?? 24000) / 4096 };
}

// The tone and the vowel side by side, on one scale
function Row({ db }: { db: boolean }) {
  const { tone, vowel, vowelBin } = useSpectra();
  const suffix = db ? ", in decibels" : "";
  return (
    <div className="not-prose my-10 grid grid-cols-1 gap-6 font-mallory-book sm:grid-cols-2 sm:gap-4">
      <Plot title={`The two sine waves added together${suffix}`} mags={tone} binHz={1} db={db} />
      <Plot title={`The “i” in “times”${suffix}`} mags={vowel} binHz={vowelBin} db={db} />
    </div>
  );
}

export const LinearSpectra = () => <Row db={false} />;
export const DecibelSpectra = () => <Row db />;

// The same vowel from both voices, each from a 43 ms stretch where its pitch holds steady
// (af_heart 170 Hz, af_river 167 Hz): the spikes line up, but their heights differ.
const RIVER = "/media/research/AI/audio/representing-audio-data/kokoro-sentence-river.wav";
const vowelSpectrum = (sound: ReturnType<typeof useSentence>, start: number) =>
  sound ? magnitudes(sound.samples, 4096, Math.round(start * sound.sampleRate), FFT_SIZE) : null;
export function VoiceSpectra() {
  const heart = useSentence();
  const river = useSentence(RIVER);
  const heartMags = useMemo(() => vowelSpectrum(heart, 2.805), [heart]);
  const riverMags = useMemo(() => vowelSpectrum(river, 2.405), [river]);
  return (
    <div className="not-prose my-10 grid grid-cols-1 gap-6 font-mallory-book sm:grid-cols-2 sm:gap-4">
      <Plot
        title="The “i” in “times”, voice af_heart"
        mags={heartMags}
        binHz={(heart?.sampleRate ?? 24000) / 4096}
        db
      />
      <Plot
        title="The “i” in “times”, voice af_river"
        mags={riverMags}
        binHz={(river?.sampleRate ?? 24000) / 4096}
        db
      />
    </div>
  );
}
