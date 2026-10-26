"use client";

import { useState } from "react";

import { Axes, Chart, Controls, Figure, Point, Slider, Sym, toPath } from "../shared/viz";

// Chart geometry: population share s from 0 to 1, wages from £0 to £120k
const WIDTH = 680;
const HEIGHT = 280;
const LEFT = 48;
const TOP = 24;
const INNER_W = 520;
const INNER_H = 220;
const BOTTOM = TOP + INNER_H;
const W_MAX = 120;

const xScale = (s: number) => LEFT + s * INNER_W;
const yScale = (w: number) => BOTTOM - (w / W_MAX) * INNER_H;

export default function PowerLawViz() {
  const [W0, setW0] = useState(70);
  const [eta, setEta] = useState(0.05);

  // W = W0 (s / 0.5)^(-eta)
  const wage = (s: number) => W0 * Math.pow(s / 0.5, -eta);
  const wagePath = toPath(
    Array.from({ length: 161 }, (_, i) => {
      const s = 0.01 + (i / 160) * 0.98;
      const W = wage(s);
      return W <= W_MAX ? [xScale(s), yScale(W)] : null;
    })
  );

  // Share of wages lost when City A's population doubles
  const doublingCut = (1 - Math.pow(2, -eta)) * 100;

  return (
    <Figure
      caption={
        <>
          <Sym>W</Sym> = <Sym>W</Sym>
          <sub>0</sub> (<Sym>s</Sym> / 0.5)
          <sup>
            −<Sym>η</Sym>
          </sup>
          . At these settings, doubling City A&apos;s population cuts wages by{" "}
          <span className="text-chart-ink not-italic tabular-nums">{doublingCut.toFixed(1)}%</span>.
        </>
      }
    >
      <Chart width={WIDTH} height={HEIGHT} label="City A's wage falling gently as its population share rises">
        <text x={LEFT} y={10} className="viz-axis">
          Wage <tspan className="font-martina-plantijn italic">W</tspan>, £k
        </text>
        <Axes left={LEFT} top={TOP} right={LEFT + INNER_W} bottom={BOTTOM} />
        {[0, 40, 80, 120].map((w) => (
          <text key={w} x={LEFT - 8} y={yScale(w) + 4} textAnchor="end" className="viz-axis">
            {w}
          </text>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((s) => (
          <text key={s} x={xScale(s)} y={BOTTOM + 18} textAnchor="middle" className="viz-axis">
            {s}
          </text>
        ))}
        <text x={LEFT + INNER_W} y={HEIGHT} textAnchor="end" className="viz-axis">
          Population share <tspan className="font-martina-plantijn italic">s</tspan>
        </text>

        {/* Reference size s = 0.5 */}
        <line
          x1={xScale(0.5)}
          y1={TOP}
          x2={xScale(0.5)}
          y2={BOTTOM}
          className="stroke-chart-ink"
          strokeWidth={1}
          strokeDasharray="1 3"
        />
        <path d={wagePath} fill="none" className="stroke-chart-series-1" strokeWidth={2} strokeLinecap="round" />
        <Point x={xScale(0.5)} y={yScale(W0)} />
        <text x={xScale(0.5) + 8} y={yScale(W0) - 10} className="viz-axis" style={{ fill: "var(--color-chart-ink)" }}>
          <tspan className="font-martina-plantijn italic">W</tspan>₀ = £{W0}k
        </text>
        <text x={LEFT + INNER_W + 10} y={yScale(wage(0.99)) + 4} className="viz-label fill-chart-series-1">
          Wage
        </text>
      </Chart>

      <Controls>
        <Slider
          label={
            <>
              Base wage <Sym>W</Sym>
              <sub>0</sub>
            </>
          }
          value={W0}
          min={40}
          max={100}
          step={5}
          format={(v) => `£${v}k`}
          tone="series-1"
          onChange={setW0}
        />
        <Slider
          label={
            <>
              Wage sensitivity <Sym>η</Sym>
            </>
          }
          value={eta}
          min={0}
          max={0.2}
          step={0.01}
          format={(v) => v.toFixed(2)}
          tone="series-1"
          onChange={setEta}
        />
      </Controls>
    </Figure>
  );
}
