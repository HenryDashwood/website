"use client";

import { useState } from "react";

import { Axes, Chart, Controls, Figure, Point, Slider, Sym, toPath } from "../shared/viz";

// Chart geometry: rent P runs from £5k to £50k, wages W from £0 to £100k
const WIDTH = 680;
const HEIGHT = 320;
const LEFT = 48;
const TOP = 24;
const INNER_W = 500;
const INNER_H = 260;
const BOTTOM = TOP + INNER_H;
const P_MIN = 5;
const P_MAX = 50;

const BASE_V_BAR = 10; // Reservation utility level
const K = 80; // Base productivity constant
const THETA = 1.2; // Land cost coefficient
const BASE_BETA = 0.33;

const xScale = (p: number) => LEFT + ((p - P_MIN) / (P_MAX - P_MIN)) * INNER_W;
const yScale = (w: number) => BOTTOM - (w / 100) * INNER_H;

// Iso-utility (worker indifference): W = V_bar * P^beta / Z
const isoUtility = (Z: number, beta: number) => (P: number) => (BASE_V_BAR * Math.pow(P, beta)) / Z;

// Iso-profit (firm zero-profit): higher rents mean higher costs, so wages must be lower
const isoProfit = (A: number) => (P: number) => A * K - THETA * P;

function curvePath(fn: (P: number) => number) {
  return toPath(
    Array.from({ length: 181 }, (_, i) => {
      const P = P_MIN + ((P_MAX - P_MIN) * i) / 180;
      const W = fn(P);
      return W >= 0 && W <= 100 ? [xScale(P), yScale(W)] : null;
    })
  );
}

// Bisection on supply minus demand, which rises with P
function findEquilibrium(utility: (P: number) => number, profit: (P: number) => number) {
  const gap = (P: number) => utility(P) - profit(P);
  let low = P_MIN;
  let high = P_MAX;
  if (gap(low) * gap(high) >= 0) return null;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (gap(mid) < 0) low = mid;
    else high = mid;
  }
  const P = (low + high) / 2;
  const W = profit(P);
  return W > 0 && W < 100 ? { P, W } : null;
}

// Keeps a curve's end label inside the plot
const clampLabel = (y: number) => Math.max(TOP + 4, Math.min(BOTTOM - 14, y));

export default function LaborMarketDiagram() {
  const [productivity, setProductivity] = useState(100); // A: productivity index (100 = baseline)
  const [amenities, setAmenities] = useState(100); // Z: amenities index (100 = baseline)
  const [beta, setBeta] = useState(BASE_BETA); // Housing expenditure share

  const utility = isoUtility(amenities / 100, beta);
  const profit = isoProfit(productivity / 100);
  const equilibrium = findEquilibrium(utility, profit);
  const shifted = productivity !== 100 || amenities !== 100;
  const dirty = shifted || beta !== BASE_BETA;

  // Name each curve at its right-hand end, nudged apart if they would collide
  let utilityLabelY = clampLabel(yScale(utility(P_MAX)));
  let profitLabelY = clampLabel(yScale(profit(P_MAX)));
  const minGap = 30;
  if (Math.abs(utilityLabelY - profitLabelY) < minGap) {
    const mid = (utilityLabelY + profitLabelY) / 2;
    const [upper, lower] = [mid - minGap / 2, mid + minGap / 2];
    if (utilityLabelY < profitLabelY) [utilityLabelY, profitLabelY] = [upper, lower];
    else [profitLabelY, utilityLabelY] = [upper, lower];
  }

  const reset = () => {
    setProductivity(100);
    setAmenities(100);
    setBeta(BASE_BETA);
  };

  return (
    <Figure
      caption={
        <>
          The Roback diagram. Workers are indifferent along the iso-utility curve and firms break even along the
          iso-profit curve. Raising productivity lifts the firm curve and better amenities lower the worker curve. The
          dashed lines show the baseline.
        </>
      }
    >
      <Chart
        width={WIDTH}
        height={HEIGHT}
        label="Roback diagram: iso-utility and iso-profit curves crossing at the equilibrium wage and rent"
      >
        <text x={LEFT} y={10} className="viz-axis">
          Wage <tspan className="font-martina-plantijn italic">W</tspan>, £k / yr
        </text>
        <Axes left={LEFT} top={TOP} right={LEFT + INNER_W} bottom={BOTTOM} />
        {[0, 25, 50, 75, 100].map((w) => (
          <text key={w} x={LEFT - 8} y={yScale(w) + 4} textAnchor="end" className="viz-axis">
            {w}
          </text>
        ))}
        {[10, 20, 30, 40, 50].map((p) => (
          <text key={p} x={xScale(p)} y={BOTTOM + 18} textAnchor="middle" className="viz-axis">
            {p}
          </text>
        ))}
        <text x={LEFT + INNER_W} y={HEIGHT} textAnchor="end" className="viz-axis">
          Rent <tspan className="font-martina-plantijn italic">P</tspan>, £k / yr
        </text>

        {/* Baseline curves, shown once a slider has shifted one */}
        {shifted && (
          <g fill="none" strokeWidth={1} strokeDasharray="3 3" opacity={0.5}>
            <path d={curvePath(isoUtility(1, beta))} className="stroke-chart-series-1" />
            <path d={curvePath(isoProfit(1))} className="stroke-chart-series-2" />
          </g>
        )}

        {equilibrium && (
          <g className="stroke-chart-ink" strokeWidth={1} strokeDasharray="1 3">
            <line x1={xScale(equilibrium.P)} y1={yScale(equilibrium.W)} x2={xScale(equilibrium.P)} y2={BOTTOM} />
            <line x1={LEFT} y1={yScale(equilibrium.W)} x2={xScale(equilibrium.P)} y2={yScale(equilibrium.W)} />
          </g>
        )}

        <path
          d={curvePath(utility)}
          fill="none"
          className="stroke-chart-series-1"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d={curvePath(profit)}
          fill="none"
          className="stroke-chart-series-2"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {equilibrium && (
          <>
            <Point x={xScale(equilibrium.P)} y={yScale(equilibrium.W)} />
            <text
              x={xScale(equilibrium.P) + 10}
              y={yScale(equilibrium.W) - 10}
              className="viz-axis"
              style={{ fill: "var(--color-chart-ink)" }}
            >
              £{Math.round(equilibrium.W)}k wage, £{Math.round(equilibrium.P)}k rent
            </text>
          </>
        )}

        <text x={LEFT + INNER_W + 10} y={utilityLabelY + 4} className="viz-label fill-chart-series-1">
          Iso-utility
        </text>
        <text x={LEFT + INNER_W + 10} y={utilityLabelY + 18} className="viz-axis">
          workers
        </text>
        <text x={LEFT + INNER_W + 10} y={profitLabelY + 4} className="viz-label fill-chart-series-2">
          Iso-profit
        </text>
        <text x={LEFT + INNER_W + 10} y={profitLabelY + 18} className="viz-axis">
          firms
        </text>
      </Chart>

      <Controls>
        <Slider
          label={
            <>
              Productivity <Sym>A</Sym>
            </>
          }
          value={productivity}
          min={50}
          max={150}
          step={5}
          format={(v) => `${v}%`}
          tone="series-2"
          onChange={setProductivity}
        />
        <Slider
          label={
            <>
              Amenities <Sym>Z</Sym>
            </>
          }
          value={amenities}
          min={50}
          max={150}
          step={5}
          format={(v) => `${v}%`}
          tone="series-1"
          onChange={setAmenities}
        />
        <Slider
          label={
            <>
              Housing share <Sym>β</Sym>
            </>
          }
          value={beta}
          min={0.1}
          max={0.5}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          tone="series-1"
          onChange={setBeta}
        />
        <div className="flex w-10 justify-end">
          {dirty && (
            <button
              type="button"
              onClick={reset}
              className="min-h-7 cursor-pointer underline underline-offset-3 hover:text-chart-ink"
            >
              Reset
            </button>
          )}
        </div>
      </Controls>
    </Figure>
  );
}
