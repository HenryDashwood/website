"use client";

import { useMemo, useState } from "react";

import { Axes, Chart, Controls, Figure, Slider, toPath } from "@/components/viz";

// Two overlapping Hann-tapered slices of a slow, easy-to-read sine wave (3 full cycles per window).
// Hop is 50% of the window length so two Hann windows sum to exactly 1.0 in the overlap zone.
const CYCLES_PER_WINDOW = 3;
const TOTAL_W = 1.5; // Window 1 spans [0, 1], Window 2 spans [0.5, 1.5]
const OVERLAP_START = 0.5;
const OVERLAP_END = 1.0;

const [LEFT, RIGHT, TOP, BOTTOM] = [34, 624, 18, 174];
const MID = (TOP + BOTTOM) / 2;
const AMP = (BOTTOM - TOP) / 2 - 12;
const AXIS = { fontSize: 8.5 };

const hann = (u: number) => (u >= 0 && u <= 1 ? 0.5 - 0.5 * Math.cos(2 * Math.PI * u) : 0);
const toX = (t: number) => LEFT + (t / TOTAL_W) * (RIGHT - LEFT);

export default function OverlapCancel() {
  const [phaseErrDeg, setPhaseErrDeg] = useState(0);
  const phaseErrRad = (phaseErrDeg * Math.PI) / 180;

  const { w1Path, w2Path, sumPath } = useMemo(() => {
    const steps = 360;
    const w1Pts: [number, number][] = [];
    const w2Pts: [number, number][] = [];
    const sumPts: [number, number][] = [];

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * TOTAL_W;
      const x = toX(t);
      const base = Math.sin(2 * Math.PI * CYCLES_PER_WINDOW * t);
      const shifted = Math.sin(2 * Math.PI * CYCLES_PER_WINDOW * t + phaseErrRad);

      const y1 = hann(t) * base;
      const y2 = hann(t - 0.5) * shifted;

      if (t <= 1) w1Pts.push([x, MID - y1 * AMP]);
      if (t >= 0.5) w2Pts.push([x, MID - y2 * AMP]);
      sumPts.push([x, MID - (y1 + y2) * AMP]);
    }

    return {
      w1Path: toPath(w1Pts),
      w2Path: toPath(w2Pts),
      sumPath: toPath(sumPts),
    };
  }, [phaseErrRad]);

  const overlapX = toX(OVERLAP_START);
  const overlapW = toX(OVERLAP_END) - overlapX;

  return (
    <Figure
      caption={
        phaseErrDeg === 0
          ? "Window 1 (dashed blue) and Window 2 (dashed orange) share the same phase: inside the shaded overlap, peaks sit on peaks and their sum (solid dark line) forms a clean, full-height wave."
          : phaseErrDeg === 180
            ? "Window 2 is 180° out of phase: peaks in Window 1 land directly on troughs in Window 2. Added together, the solid sum collapses to flat zero in the middle of the overlap."
            : `Window 2's phase is off by ${phaseErrDeg}°: where the two windows overlap, the waves clash and pinch the solid sum out of shape.`
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-end gap-3 font-mallory-book text-[11px] text-chart-muted">
        <span className="flex items-center gap-1 text-chart-series-1">
          <svg viewBox="0 0 14 4" className="h-1 w-3.5" aria-hidden="true">
            <line
              x1={0}
              y1={2}
              x2={14}
              y2={2}
              className="stroke-chart-series-1"
              strokeDasharray="3 2"
              strokeOpacity={0.7}
              strokeWidth={1.4}
            />
          </svg>
          Window 1
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
              strokeOpacity={0.7}
              strokeWidth={1.4}
            />
          </svg>
          Window 2
        </span>
        <span className="flex items-center gap-1 font-bold text-chart-ink">
          <svg viewBox="0 0 14 4" className="h-1 w-3.5" aria-hidden="true">
            <line x1={0} y1={2} x2={14} y2={2} className="stroke-chart-ink" strokeWidth={2.25} />
          </svg>
          Sum
        </span>
      </div>

      <Chart
        width={640}
        height={190}
        label="Two overlapping Hann-windowed sine waves (dashed) and their combined sum (solid bold line)"
      >
        <rect
          x={overlapX}
          y={TOP}
          width={overlapW}
          height={BOTTOM - TOP}
          className="fill-chart-series-1"
          fillOpacity={0.07}
        />
        <text x={overlapX + overlapW / 2} y={TOP - 5} textAnchor="middle" className="viz-axis" style={AXIS}>
          overlap zone
        </text>
        <Axes left={LEFT} right={RIGHT} top={TOP} bottom={BOTTOM} />
        <line x1={LEFT} y1={MID} x2={RIGHT} y2={MID} className="stroke-chart-hairline" strokeWidth={0.75} />

        {/* Secondary layer: individual Hann-tapered windows (thin dashed) */}
        <path
          d={w1Path}
          fill="none"
          className="stroke-chart-series-1"
          strokeDasharray="4 3"
          strokeOpacity={0.55}
          strokeWidth={1.2}
        />
        <path
          d={w2Path}
          fill="none"
          className="stroke-chart-series-2"
          strokeDasharray="4 3"
          strokeOpacity={0.55}
          strokeWidth={1.2}
        />

        {/* Primary layer: combined overlap-add sum (bold solid ink) */}
        <path d={sumPath} fill="none" className="stroke-chart-ink" strokeWidth={2.25} />
      </Chart>

      <Controls>
        <Slider
          label="Window 2 phase error"
          value={phaseErrDeg}
          min={0}
          max={180}
          step={1}
          tone="series-2"
          format={(v) => `${v}°`}
          onChange={setPhaseErrDeg}
        />
      </Controls>
    </Figure>
  );
}
