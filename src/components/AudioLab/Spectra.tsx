"use client";

import { useMemo } from "react";

import { Axes, Chart, toPath } from "../blog_components/shared/viz";
import { decibels, magnitudes } from "./audio";
import { SUM, value } from "./Tones";
import { AXIS, useSentence } from "./WaveformPlayer";

// Spectra relative to each sound's strongest frequency (linear or dB), on a shared 0–4,000 Hz axis. The tone
// uses one second (sharp spikes); the vowel uses the 43 ms where its pitch holds at 170 Hz.
const [LEFT, RIGHT, TOP, BOTTOM] = [44, 352, 8, 128];
const MAX_HZ = 4000;
const FLOOR = -60;
const x = (hz: number) => LEFT + (hz / MAX_HZ) * (RIGHT - LEFT);

function Plot({ title, mags, binHz, db }: { title: string; mags: Float64Array | null; binHz: number; db: boolean }) {
  const y = (v: number) => (db ? TOP + (Math.min(-FLOOR, -v) / -FLOOR) * (BOTTOM - TOP) : BOTTOM - v * (BOTTOM - TOP));
  let path = "";
  if (mags) {
    const peak = mags.reduce((m, v) => Math.max(m, v), 0);
    path = toPath(
      Array.from(mags, (v, i) => (i * binHz > MAX_HZ ? null : [x(i * binHz), y(db ? decibels(v, peak) : v / peak)]))
    );
  }
  const ticks = db ? [0, -20, -40, -60] : [1, 0.5, 0];
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
        {[0, 1000, 2000, 3000, 4000].map((hz) => (
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
    () => (sound ? magnitudes(sound.samples, 4096, Math.round(2.805 * sound.sampleRate), 1024) : null),
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
