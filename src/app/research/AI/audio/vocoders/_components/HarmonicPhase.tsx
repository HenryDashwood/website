"use client";

import { useMemo, useState } from "react";

import { Axes, Chart, Controls, Figure, Slider, toPath } from "@/components/viz";

const MS = 15;
const BASE_HZ = 170;
const COUNT = 8;
const AXIS = { fontSize: 8.5 };
const [W_LEFT, W_RIGHT, W_TOP, W_BOTTOM] = [34, 624, 12, 152];
const W_MID = (W_TOP + W_BOTTOM) / 2;
const W_AMP = (W_BOTTOM - W_TOP) / 2 - 8;

// Fixed deterministic target angles in [-pi, pi] so dragging the slider smoothly rotates each harmonic
const TARGET_ANGLES: number[] = (() => {
  let state = (3 * 2654435761) >>> 0;
  return Array.from({ length: COUNT }, () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1) * Math.PI;
  });
})();

// Fixed harmonic strengths (1 / k^0.75, similar roll-off to a voiced vowel)
const STRENGTHS = Array.from({ length: COUNT }, (_, i) => 1 / (i + 1) ** 0.75);
const MAX_SUM = STRENGTHS.reduce((a, b) => a + b, 0);

export default function HarmonicPhase() {
  const [scramble, setScramble] = useState(0);

  const phases = useMemo(() => TARGET_ANGLES.map((angle) => angle * scramble), [scramble]);

  const { sumPath, firstThreePaths, peak } = useMemo(() => {
    const pts: [number, number][] = [];
    let maxVal = 0;
    const samples = 420;
    const values = new Float64Array(samples);
    for (let i = 0; i < samples; i++) {
      const t = (i / (samples - 1)) * (MS / 1000);
      let y = 0;
      for (let k = 0; k < COUNT; k++) {
        y += STRENGTHS[k] * Math.cos(2 * Math.PI * BASE_HZ * (k + 1) * t + phases[k]);
      }
      values[i] = y;
      maxVal = Math.max(maxVal, Math.abs(y));
    }
    for (let i = 0; i < samples; i++) {
      pts.push([W_LEFT + (i / (samples - 1)) * (W_RIGHT - W_LEFT), W_MID - (values[i] / MAX_SUM) * W_AMP]);
    }

    const individual = [0, 1, 2].map((k) =>
      toPath(
        Array.from({ length: 240 }, (_, i) => {
          const t = (i / 239) * (MS / 1000);
          const y = STRENGTHS[k] * Math.cos(2 * Math.PI * BASE_HZ * (k + 1) * t + phases[k]);
          return [W_LEFT + (i / 239) * (W_RIGHT - W_LEFT), W_MID - (y / MAX_SUM) * W_AMP];
        })
      )
    );

    return { sumPath: toPath(pts), firstThreePaths: individual, peak: maxVal };
  }, [phases]);

  const dialR = 22;
  const dialSpacing = (W_RIGHT - W_LEFT) / COUNT;

  return (
    <Figure
      caption={
        scramble === 0
          ? "All 8 harmonics start at 0°: every wave hits its peak at the exact same instant (every 5.9 ms), stacking up into sharp vocal-fold pulses."
          : `Same 8 harmonics, same magnitudes — only their phase angles are rotated (${Math.round(scramble * 100)}% scrambled). Because the peaks no longer arrive together, the tall pulses melt into a flatter, smeared ripple (peak drops from ${MAX_SUM.toFixed(1)} to ${peak.toFixed(1)}).`
      }
    >
      <p className="mb-1 font-mallory-book text-[13px] text-chart-ink">
        1. The 8 harmonic bins — arrow lengths (magnitudes) stay fixed, only angles (phases) turn
      </p>
      <Chart
        width={640}
        height={78}
        label="Eight complex-number arrows for the first eight harmonics of 170 Hz, showing fixed magnitudes and changing phase angles"
      >
        {STRENGTHS.map((amp, k) => {
          const cx = W_LEFT + (k + 0.5) * dialSpacing;
          const cy = 32;
          const len = amp * dialR;
          const angle = phases[k];
          const tx = cx + len * Math.cos(angle);
          const ty = cy - len * Math.sin(angle);
          return (
            <g key={k}>
              <circle cx={cx} cy={cy} r={dialR} fill="none" className="stroke-chart-hairline" strokeDasharray="2 2" />
              <line
                x1={cx - dialR}
                y1={cy}
                x2={cx + dialR}
                y2={cy}
                className="stroke-chart-hairline"
                strokeOpacity={0.5}
                strokeWidth={0.6}
              />
              <line
                x1={cx}
                y1={cy}
                x2={tx}
                y2={ty}
                className={scramble === 0 ? "stroke-chart-series-1" : "stroke-chart-series-2"}
                strokeWidth={1.8}
              />
              <circle
                cx={tx}
                cy={ty}
                r={2.5}
                className={scramble === 0 ? "fill-chart-series-1" : "fill-chart-series-2"}
              />
              <text x={cx} y={70} textAnchor="middle" className="viz-axis tabular-nums" style={AXIS}>
                {BASE_HZ * (k + 1)} Hz
              </text>
            </g>
          );
        })}
      </Chart>

      <p className="mt-3 mb-1 font-mallory-book text-[13px] text-chart-ink">
        2. The resulting waveform (sum of all 8 harmonics)
      </p>
      <Chart
        width={640}
        height={180}
        label="Waveform produced by adding the eight harmonics with the phase angles shown above"
      >
        <Axes left={W_LEFT} right={W_RIGHT} top={W_TOP} bottom={W_BOTTOM} />
        <line x1={W_LEFT} y1={W_MID} x2={W_RIGHT} y2={W_MID} className="stroke-chart-hairline" strokeWidth={0.75} />
        {firstThreePaths.map((d, idx) => (
          <path
            key={idx}
            d={d}
            fill="none"
            className="stroke-chart-muted"
            strokeDasharray="3 3"
            strokeOpacity={0.35}
            strokeWidth={0.9}
          />
        ))}
        <path
          d={sumPath}
          fill="none"
          className={scramble === 0 ? "stroke-chart-series-1" : "stroke-chart-series-2"}
          strokeWidth={1.75}
        />
        {[0, 5, 10, 15].map((ms) => (
          <text
            key={ms}
            x={W_LEFT + (ms / MS) * (W_RIGHT - W_LEFT)}
            y={W_BOTTOM + 14}
            textAnchor="middle"
            className="viz-axis"
            style={AXIS}
          >
            {ms}
          </text>
        ))}
        <text x={(W_LEFT + W_RIGHT) / 2} y={176} textAnchor="middle" className="viz-axis" style={AXIS}>
          Time (milliseconds)
        </text>
      </Chart>

      <Controls>
        <Slider
          label="Phase scramble"
          value={scramble}
          min={0}
          max={1}
          step={0.02}
          tone="series-2"
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={setScramble}
        />
      </Controls>
    </Figure>
  );
}
