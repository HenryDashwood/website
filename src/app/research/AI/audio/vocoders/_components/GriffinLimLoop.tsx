"use client";

import { useState } from "react";

import { Chart, Controls, Figure, Point, Slider, toPath } from "@/components/viz";

// Geometric picture of Griffin-Lim as alternating projections between two constraint sets:
//   Set A (blue circle): all STFTs that have our exact target magnitudes.
//   Set B (terracotta line): all "consistent" STFTs that actually come from a real waveform.
// Starting at a random phase on Set A, each iteration projects orthogonally onto Set B
// (iSTFT -> STFT: consistent phase, drifted magnitudes), then back onto Set A (keep phase,
// restore target magnitudes), zigzagging into an intersection where both constraints hold.

const [CX, CY, R] = [148, 124, 92]; // Blue circle: target magnitudes
const LINE_Y = 74; // Terracotta line: consistent STFTs (cuts circle at two intersections)
const INTERSECT_DX = Math.sqrt(R * R - (CY - LINE_Y) ** 2);
const IX_RIGHT = CX + INTERSECT_DX;
const IX_LEFT = CX - INTERSECT_DX;

const TOTAL_STEPS = 10; // 5 full iterations (each iteration = 2 half-steps)
const AXIS = { fontSize: 9 };

interface StepPoint {
  x: number;
  y: number;
  kind: "start" | "consistent" | "magnitudes";
  iter: number;
}

// Precompute the exact alternating-projection path starting from a random point on the circle
const PATH: StepPoint[] = (() => {
  const startAngle = -0.35; // lower-right on the circle (arbitrary random phase)
  const pts: StepPoint[] = [
    { x: CX + R * Math.cos(startAngle), y: CY - R * Math.sin(startAngle), kind: "start", iter: 0 },
  ];
  for (let iter = 1; iter <= TOTAL_STEPS / 2; iter++) {
    const prev = pts[pts.length - 1];
    // Half-step A: project vertically onto the consistent-STFT line (iSTFT -> STFT)
    const onLine = { x: prev.x, y: LINE_Y, kind: "consistent" as const, iter };
    pts.push(onLine);
    // Half-step B: project radially back onto the target-magnitude circle (restore magnitudes)
    const dx = onLine.x - CX;
    const dy = onLine.y - CY;
    const dist = Math.hypot(dx, dy);
    pts.push({
      x: CX + (dx / dist) * R,
      y: CY + (dy / dist) * R,
      kind: "magnitudes",
      iter,
    });
  }
  return pts;
})();

const STEP_LABELS: Record<StepPoint["kind"], { title: string; detail: string }> = {
  start: {
    title: "Start: target magnitudes + random phase",
    detail:
      "We begin on the blue curve (exact target magnitudes), far from the terracotta line (consistent real waveforms).",
  },
  consistent: {
    title: "iSTFT → STFT (find nearest consistent phase)",
    detail:
      "Overlap-add forces a real waveform, then STFT analyses it back. We land on the terracotta line: phases now agree across windows, but magnitudes have drifted.",
  },
  magnitudes: {
    title: "Restore target magnitudes (keep the new phase)",
    detail:
      "Throw away the drifted magnitudes and plug our target spectrogram back in, jumping back to the blue curve — closer to the intersection than before.",
  },
};

export default function GriffinLimLoop() {
  const [step, setStep] = useState(TOTAL_STEPS);
  const current = PATH[step];
  const visible = PATH.slice(0, step + 1);

  return (
    <Figure
      caption={
        step === 0
          ? "Starting point: exact target magnitudes, random phase — far from any real, overlapping waveform."
          : step === TOTAL_STEPS
            ? "After five iterations the zigzag settles into an intersection where both constraints hold: consistent phases and target magnitudes. Notice the second intersection on the left — more than one waveform matches the same spectrogram, so Griffin-Lim lands on whichever is nearest its random start."
            : STEP_LABELS[current.kind].detail
      }
    >
      <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[310px_1fr] sm:gap-6">
        <Chart
          width={310}
          height={234}
          label="Alternating projections diagram showing Griffin-Lim zigzagging between target magnitudes and consistent STFTs"
        >
          {/* Set A: target magnitudes (blue circle) */}
          <circle cx={CX} cy={CY} r={R} fill="none" className="stroke-chart-series-1" strokeWidth={1.6} />
          <text x={CX} y={CY + R + 15} textAnchor="middle" className="viz-axis fill-chart-series-1!" style={AXIS}>
            STFTs with target magnitudes
          </text>

          {/* Set B: consistent STFTs (terracotta line) */}
          <line x1={22} y1={LINE_Y} x2={292} y2={LINE_Y} className="stroke-chart-series-2" strokeWidth={1.6} />
          <text x={288} y={LINE_Y - 8} textAnchor="end" className="viz-axis fill-chart-series-2!" style={AXIS}>
            Consistent STFTs (real waveforms)
          </text>

          {/* Second (unreached) intersection — illustrates non-uniqueness of phase */}
          <circle
            cx={IX_LEFT}
            cy={LINE_Y}
            r={4}
            fill="none"
            className="stroke-chart-muted"
            strokeDasharray="2 1.5"
            strokeWidth={1.2}
          />
          <text x={IX_LEFT - 4} y={LINE_Y - 10} textAnchor="middle" className="viz-axis" style={{ fontSize: 8 }}>
            other valid phase
          </text>

          {/* Target intersection reached by this run */}
          <circle cx={IX_RIGHT} cy={LINE_Y} r={4} fill="none" className="stroke-chart-ink" strokeWidth={1.2} />

          {/* Zigzag segments drawn up to the current step */}
          {visible.slice(1).map((pt, i) => {
            const prev = visible[i];
            const isLatest = i === visible.length - 2;
            const segPath = toPath([
              [prev.x, prev.y],
              [pt.x, pt.y],
            ]);
            return (
              <path
                key={i}
                d={segPath}
                fill="none"
                className={pt.kind === "consistent" ? "stroke-chart-series-2" : "stroke-chart-series-1"}
                strokeDasharray={isLatest ? undefined : "3 2"}
                strokeOpacity={isLatest ? 1 : 0.65}
                strokeWidth={isLatest ? 1.8 : 1.15}
              />
            );
          })}

          {/* Earlier visited points */}
          {visible.slice(0, -1).map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={2.5}
              className={pt.kind === "consistent" ? "fill-chart-series-2" : "fill-chart-series-1"}
              fillOpacity={0.7}
            />
          ))}

          {/* Start label */}
          <text x={PATH[0].x + 7} y={PATH[0].y + 12} className="viz-axis" style={{ fontSize: 8.5 }}>
            start
          </text>

          {/* Active point */}
          <Point x={current.x} y={current.y} />
        </Chart>

        {/* Right: compact 4-step cycle synced to the active step */}
        <div className="space-y-2.5 font-mallory-book text-[13px]">
          {[
            {
              num: "1",
              active: current.kind === "start",
              title: "Guess random phase",
              sub: "Pair target spectrogram magnitudes with random starting phases.",
            },
            {
              num: "2",
              active: current.kind === "consistent",
              title: "iSTFT → STFT",
              sub: "Overlap-add forces a real waveform; re-analysing gives consistent phases (but drifted magnitudes).",
            },
            {
              num: "3",
              active: current.kind === "magnitudes",
              title: "Restore target magnitudes",
              sub: "Keep the new consistent phases, swap the original magnitudes back in, and repeat.",
            },
          ].map((item) => (
            <div
              key={item.num}
              className={`border-l-2 py-0.5 pl-3 transition-colors ${
                item.active ? "border-nav-background text-chart-ink" : "border-chart-hairline/50 text-chart-muted"
              }`}
            >
              <p className="m-0 font-bold">
                {item.num}. {item.title}
              </p>
              <p className="m-0 mt-0.5 text-xs leading-snug">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <Controls>
        <Slider
          label="Step through the loop"
          value={step}
          min={0}
          max={TOTAL_STEPS}
          step={1}
          tone={current.kind === "consistent" ? "series-2" : "series-1"}
          format={(v) =>
            v === 0
              ? "Start"
              : v % 2 === 1
                ? `Iter ${Math.ceil(v / 2)} · iSTFT → STFT`
                : `Iter ${v / 2} · restore magnitudes`
          }
          onChange={setStep}
        />
      </Controls>
    </Figure>
  );
}
