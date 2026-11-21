"use client";

import { useState } from "react";

import { Axes, Chart, Controls, Figure, Slider, TextButton, toPath } from "@/components/viz";

const MS = 15;
const FREQ_1 = 170;
const FREQ_2 = 340;
const AXIS = { fontSize: 8.5 };

// Complex plane geometry (left panel)
const [CX, CY, R] = [105, 92, 66];
// Wave geometry (right panel)
const [W_LEFT, W_RIGHT, W_TOP, W_BOTTOM] = [28, 396, 14, 152];
const W_MID = (W_TOP + W_BOTTOM) / 2;
const W_AMP = (W_BOTTOM - W_TOP) / 2 - 6;

type View = "single" | "pair";

let audioCtx: AudioContext | null = null;
let activeSrc: AudioBufferSourceNode | null = null;

async function playWave(mode: View, magnitude: number, phaseRad: number) {
  audioCtx ??= new AudioContext();
  await audioCtx.resume();
  activeSrc?.stop();
  const rate = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, rate, rate);
  const out = buffer.getChannelData(0);
  for (let i = 0; i < rate; i++) {
    const t = i / rate;
    const fade = Math.min(1, i / (0.02 * rate), (rate - i) / (0.02 * rate));
    const sample =
      mode === "single"
        ? magnitude * Math.cos(2 * Math.PI * FREQ_1 * t + phaseRad)
        : Math.cos(2 * Math.PI * FREQ_1 * t) + 0.5 * Math.cos(2 * Math.PI * FREQ_2 * t + phaseRad);
    out[i] = 0.18 * fade * sample;
  }
  activeSrc = audioCtx.createBufferSource();
  activeSrc.buffer = buffer;
  activeSrc.connect(audioCtx.destination);
  activeSrc.start();
}

export default function PhaseVisual() {
  const [view, setView] = useState<View>("single");
  const [phaseDeg, setPhaseDeg] = useState(45);
  const [magnitude, setMagnitude] = useState(1);

  const phaseRad = (phaseDeg * Math.PI) / 180;
  const activeMag = view === "single" ? magnitude : 0.5;
  const re = activeMag * Math.cos(phaseRad);
  const im = activeMag * Math.sin(phaseRad);

  // Tip of the complex-number arrow on the left panel
  const tipX = CX + re * R;
  const tipY = CY - im * R;

  // Small arc showing the angle phi from the positive Real axis
  const arcR = 22;
  const arcPath =
    phaseDeg > 1
      ? `M ${(CX + arcR).toFixed(1)} ${CY.toFixed(1)} A ${arcR} ${arcR} 0 ${phaseDeg > 180 ? 1 : 0} 0 ${(CX + arcR * Math.cos(phaseRad)).toFixed(1)} ${(CY - arcR * Math.sin(phaseRad)).toFixed(1)}`
      : "";

  const scale = view === "single" ? 1.25 : 1.75;
  const wavePath = toPath(
    Array.from({ length: 320 }, (_, i) => {
      const t = (i / 319) * (MS / 1000);
      const y =
        view === "single"
          ? magnitude * Math.cos(2 * Math.PI * FREQ_1 * t + phaseRad)
          : Math.cos(2 * Math.PI * FREQ_1 * t) + 0.5 * Math.cos(2 * Math.PI * FREQ_2 * t + phaseRad);
      return [W_LEFT + (i / 319) * (W_RIGHT - W_LEFT), W_MID - (y / scale) * W_AMP];
    })
  );

  // In single-wave mode, show the cosine (a) and sine (-b) pieces that add up to the shifted wave.
  // In pair mode, show the two harmonics (170 Hz fixed + 340 Hz shifted).
  const part1Path = toPath(
    Array.from({ length: 240 }, (_, i) => {
      const t = (i / 239) * (MS / 1000);
      const y = view === "single" ? re * Math.cos(2 * Math.PI * FREQ_1 * t) : Math.cos(2 * Math.PI * FREQ_1 * t);
      return [W_LEFT + (i / 239) * (W_RIGHT - W_LEFT), W_MID - (y / scale) * W_AMP];
    })
  );
  const part2Path = toPath(
    Array.from({ length: 240 }, (_, i) => {
      const t = (i / 239) * (MS / 1000);
      const y =
        view === "single"
          ? -im * Math.sin(2 * Math.PI * FREQ_1 * t)
          : 0.5 * Math.cos(2 * Math.PI * FREQ_2 * t + phaseRad);
      return [W_LEFT + (i / 239) * (W_RIGHT - W_LEFT), W_MID - (y / scale) * W_AMP];
    })
  );

  const startY = W_MID - ((view === "single" ? re : 1 + re) / scale) * W_AMP;
  const sign = im >= 0 ? "+" : "−";

  return (
    <Figure
      caption={
        view === "single"
          ? "One Fourier bin is a complex number a + bi, pictured as an arrow: its length is the magnitude (height of the wave) and its angle is the phase (where the wave starts at t = 0). Adding the two fixed reference waves — a·cos (grey) and −b·sin (orange) — reproduces any shift."
          : "Two harmonics (170 Hz + 340 Hz) with fixed magnitudes. Rotating the 340 Hz arrow reshapes the combined waveform completely, even though the frequency spectrum — and what you hear — stays almost unchanged."
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <TextButton active={view === "single"} onClick={() => setView("single")}>
            Single wave (170 Hz)
          </TextButton>
          <TextButton active={view === "pair"} onClick={() => setView("pair")}>
            Two harmonics (170 + 340 Hz)
          </TextButton>
        </div>
        <button
          type="button"
          onClick={() => void playWave(view, magnitude, phaseRad)}
          className="flex cursor-pointer items-center gap-1.5 font-mallory-book text-xs text-chart-ink hover:opacity-80"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-chart-series-1 text-white">
            <svg viewBox="0 0 16 16" className="size-2.5 fill-current" aria-hidden="true">
              <path d="M4 1.5v13L14 8z" />
            </svg>
          </span>
          Play tone
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[210px_1fr] sm:gap-4">
        <div>
          <p className="mb-1 font-mallory-book text-[13px] text-chart-ink">
            {view === "single" ? "170 Hz bin" : "340 Hz bin"}:{" "}
            <span className="font-code text-xs tabular-nums">
              <span className="text-chart-muted">{re.toFixed(2)}</span>{" "}
              <span className="text-chart-series-2">
                {sign} {Math.abs(im).toFixed(2)}i
              </span>
            </span>
          </p>
          <Chart
            width={210}
            height={186}
            label="Complex number plotted as an arrow whose length is magnitude and whose angle is phase"
          >
            {/* Unit circle and axes */}
            <circle cx={CX} cy={CY} r={R} fill="none" className="stroke-chart-hairline" strokeDasharray="3 3" />
            <line
              x1={CX - R - 14}
              y1={CY}
              x2={CX + R + 16}
              y2={CY}
              className="stroke-chart-muted"
              strokeOpacity={0.5}
            />
            <line
              x1={CX}
              y1={CY - R - 14}
              x2={CX}
              y2={CY + R + 14}
              className="stroke-chart-muted"
              strokeOpacity={0.5}
            />
            <text x={CX + R + 18} y={CY + 3} className="viz-axis" style={AXIS}>
              Re (a)
            </text>
            <text x={CX} y={CY - R - 17} textAnchor="middle" className="viz-axis fill-chart-series-2!" style={AXIS}>
              Im (b)
            </text>

            {/* Horizontal (a, grey) and vertical (b, orange) legs matching the dashed waves */}
            <line
              x1={CX}
              y1={CY}
              x2={tipX}
              y2={CY}
              className="stroke-chart-muted"
              strokeDasharray="3 2"
              strokeWidth={1.5}
            />
            <line
              x1={tipX}
              y1={CY}
              x2={tipX}
              y2={tipY}
              className="stroke-chart-series-2"
              strokeDasharray="3 2"
              strokeWidth={1.5}
            />

            {/* Phase angle arc */}
            {arcPath && <path d={arcPath} fill="none" className="stroke-chart-series-2" strokeWidth={1.25} />}

            {/* Arrow from origin to (a, b) */}
            <line x1={CX} y1={CY} x2={tipX} y2={tipY} className="stroke-chart-series-1" strokeWidth={2} />
            <circle cx={tipX} cy={tipY} r={4} className="fill-chart-series-1" />

            <text x={CX} y={180} textAnchor="middle" className="viz-axis tabular-nums" style={AXIS}>
              length = {activeMag.toFixed(2)} · angle = {phaseDeg}°
            </text>
          </Chart>
        </div>

        <div>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 font-mallory-book">
            <p className="text-[13px] text-chart-ink">
              {view === "single" ? "Resulting 170 Hz wave" : "Combined wave (same spectrum, different phase)"}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-chart-muted">
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 14 4" className="h-1 w-3.5" aria-hidden="true">
                  <line x1={0} y1={2} x2={14} y2={2} className="stroke-chart-series-1" strokeWidth={2} />
                </svg>
                sum
              </span>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 14 4" className="h-1 w-3.5" aria-hidden="true">
                  <line
                    x1={0}
                    y1={2}
                    x2={14}
                    y2={2}
                    className="stroke-chart-muted"
                    strokeDasharray="3 2"
                    strokeWidth={1.5}
                  />
                </svg>
                {view === "single" ? "a·cos" : "170 Hz"}
              </span>
              <span className="flex items-center gap-1 text-chart-series-2">
                <svg viewBox="0 0 14 4" className="h-1 w-3.5" aria-hidden="true">
                  <line
                    x1={0}
                    y1={2}
                    x2={14}
                    y2={2}
                    className="stroke-chart-series-2"
                    strokeDasharray="3 2"
                    strokeWidth={1.5}
                  />
                </svg>
                {view === "single" ? "−b·sin" : "340 Hz"}
              </span>
            </div>
          </div>
          <Chart width={410} height={186} label="Waveform corresponding to the complex number arrow on the left">
            <Axes left={W_LEFT} right={W_RIGHT} top={W_TOP} bottom={W_BOTTOM} />
            <line
              x1={W_LEFT}
              y1={W_MID}
              x2={W_RIGHT}
              y2={W_MID}
              className="stroke-chart-hairline"
              strokeWidth={0.75}
            />
            <path
              d={part1Path}
              fill="none"
              className="stroke-chart-muted"
              strokeDasharray="3 3"
              strokeOpacity={0.55}
              strokeWidth={1}
            />
            <path
              d={part2Path}
              fill="none"
              className="stroke-chart-series-2"
              strokeDasharray="3 3"
              strokeOpacity={0.65}
              strokeWidth={1}
            />
            <path d={wavePath} fill="none" className="stroke-chart-series-1" strokeWidth={1.75} />
            {/* Starting value at t = 0 */}
            <circle cx={W_LEFT} cy={startY} r={3.5} className="fill-chart-series-1" />
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
            <text x={(W_LEFT + W_RIGHT) / 2} y={180} textAnchor="middle" className="viz-axis" style={AXIS}>
              Time (milliseconds)
            </text>
          </Chart>
        </div>
      </div>

      <Controls>
        <Slider
          label={view === "single" ? "Phase angle" : "340 Hz phase angle"}
          value={phaseDeg}
          min={0}
          max={360}
          step={1}
          tone="series-2"
          format={(v) => `${v}°`}
          onChange={setPhaseDeg}
        />
        {view === "single" && (
          <Slider
            label="Magnitude (arrow length)"
            value={magnitude}
            min={0.2}
            max={1.2}
            step={0.05}
            tone="series-1"
            format={(v) => v.toFixed(2)}
            onChange={setMagnitude}
          />
        )}
      </Controls>
    </Figure>
  );
}
