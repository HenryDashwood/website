"use client";

import type { PointerEvent } from "react";
import { useMemo, useState } from "react";

import { Axes, Chart, Controls, Figure, GroupHeading, Point, Slider, Sym, TextButton, toPath } from "../shared/viz";

interface Params {
  WA0: number; // Base wage City A (£k)
  WB0: number; // Base wage City B (£k)
  PA0: number; // Base rent City A (£k)
  PB0: number; // Base rent City B (£k)
  etaA: number; // Wage sensitivity City A
  etaB: number; // Wage sensitivity City B
  epsA: number; // Housing elasticity City A
  epsB: number; // Housing elasticity City B
  gammaA: number; // Crowding penalty City A (£k)
  gammaB: number; // Crowding penalty City B (£k)
}

// Reference population split
const S0 = 0.5;

type Preset = "default" | "balanced" | "restrictive" | "productivity-shock";

const PRESETS: Record<Preset, { name: string; params: Params }> = {
  default: {
    name: "Default",
    params: { WA0: 70, PA0: 22, epsA: 0.8, etaA: 0.05, gammaA: 0, WB0: 50, PB0: 12, epsB: 1.0, etaB: 0.05, gammaB: 0 },
  },
  balanced: {
    name: "Balanced",
    params: { WA0: 60, PA0: 20, epsA: 1.0, etaA: 0.05, gammaA: 0, WB0: 50, PB0: 10, epsB: 1.0, etaB: 0.05, gammaB: 0 },
  },
  restrictive: {
    name: "Restrictive housing in A",
    params: {
      WA0: 80,
      PA0: 24,
      epsA: 0.3,
      etaA: 0.05,
      gammaA: 0,
      WB0: 45,
      PB0: 8.4,
      epsB: 1.2,
      etaB: 0.05,
      gammaB: 0,
    },
  },
  "productivity-shock": {
    name: "Productivity shock in A",
    params: { WA0: 90, PA0: 20, epsA: 0.7, etaA: 0.05, gammaA: 0, WB0: 45, PB0: 10, epsB: 0.9, etaB: 0.05, gammaB: 0 },
  },
};

// Wages, rents and log utility of consumption in each city when City A holds share s of the population
function cities(s: number, p: Params) {
  const nA = Math.max(1e-6, s / S0);
  const nB = Math.max(1e-6, (1 - s) / (1 - S0));
  const WA = p.WA0 * Math.pow(nA, -p.etaA);
  const WB = p.WB0 * Math.pow(nB, -p.etaB);
  const PA = p.PA0 * Math.pow(nA, 1 / p.epsA);
  const PB = p.PB0 * Math.pow(nB, 1 / p.epsB);
  const CA = WA - PA - p.gammaA * (nA - 1);
  const CB = WB - PB - p.gammaB * (nB - 1);
  return { WA, WB, PA, PB, UA: CA > 0 ? Math.log(CA) : NaN, UB: CB > 0 ? Math.log(CB) : NaN };
}

// Bisection search for s* where UA(s) = UB(s). UA - UB falls as s rises. A city where consumption hits zero
// counts as having utility -Infinity, so the search still works when one end of the range is infeasible.
function findEquilibrium(p: Params): number | null {
  const diff = (s: number) => {
    const { UA, UB } = cities(s, p);
    return (isNaN(UA) ? -Infinity : UA) - (isNaN(UB) ? -Infinity : UB);
  };
  let low = 0.02;
  let high = 0.98;
  const dLow = diff(low);
  const dHigh = diff(high);
  if (isNaN(dLow) || isNaN(dHigh) || dLow * dHigh >= 0) return null;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const d = diff(mid);
    if (isNaN(d)) return null;
    if (d > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// Chart geometry. Utility has no numeric ticks: only the order of the two curves matters.
const WIDTH = 680;
const HEIGHT = 300;
const LEFT = 24;
const TOP = 24;
const INNER_W = 560;
const INNER_H = 240;
const BOTTOM = TOP + INNER_H;
const S_MIN = 0.02;
const S_MAX = 0.98;

const xScale = (s: number) => LEFT + s * INNER_W;

type SliderKey = "WA0" | "PA0" | "epsA" | "etaA" | "gammaA";

const money = (v: number) => `£${Math.round(v * 10) / 10}k`;

export default function MigrationStabilityViz() {
  const [params, setParams] = useState<Params>(PRESETS.default.params);
  const [preset, setPreset] = useState<Preset | null>("default");
  const [hover, setHover] = useState<number | null>(null);
  const [showMore, setShowMore] = useState(false);

  const data = useMemo(
    () =>
      Array.from({ length: 193 }, (_, i) => {
        const s = S_MIN + ((S_MAX - S_MIN) * i) / 192;
        return { s, ...cities(s, params) };
      }),
    [params]
  );

  const sStar = useMemo(() => findEquilibrium(params), [params]);

  const utilities = data.flatMap((d) => [d.UA, d.UB]).filter(isFinite);
  const rawMin = utilities.length > 0 ? Math.min(...utilities) : 0;
  const rawMax = utilities.length > 0 ? Math.max(...utilities) : 1;
  const padding = (rawMax - rawMin) * 0.08 || 0.1;
  const uMin = rawMin - padding;
  const uMax = rawMax + padding;
  const yScale = (u: number) => BOTTOM - ((u - uMin) / (uMax - uMin)) * INNER_H;

  const path = (key: "UA" | "UB") =>
    toPath(data.map((d) => (isFinite(d[key]) ? [xScale(d.s), yScale(d[key])] : null)));

  // Name each curve at its right-hand end, nudged apart if they would collide
  const last = data[data.length - 1];
  let aLabelY = isFinite(last.UA) ? yScale(last.UA) : BOTTOM;
  let bLabelY = isFinite(last.UB) ? yScale(last.UB) : TOP;
  if (Math.abs(aLabelY - bLabelY) < 16) {
    const mid = (aLabelY + bLabelY) / 2;
    [aLabelY, bLabelY] = aLabelY < bLabelY ? [mid - 8, mid + 8] : [mid + 8, mid - 8];
  }

  // Readout follows the pointer, otherwise shows the equilibrium
  const readoutS = hover ?? sStar ?? S0;
  const readout = cities(readoutS, params);
  const star = sStar === null ? null : cities(sStar, params);

  const loadPreset = (key: Preset) => {
    setParams(PRESETS[key].params);
    setPreset(key);
    setHover(null);
  };

  const update = (key: keyof Params) => (value: number) => {
    setParams((p) => ({ ...p, [key]: value }));
    setPreset(null);
  };

  const onPointer = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const s = (e.clientX - box.left) / box.width;
    setHover(Math.max(S_MIN, Math.min(S_MAX, s)));
  };

  // City A and City B share the same slider set; ranges match each city's plausible values
  const sliders = (city: "A" | "B") => {
    const key = (k: SliderKey) => (city === "A" ? k : (k.replace("A", "B") as keyof Params));
    const tone = city === "A" ? "series-2" : "series-1";
    const rows = [
      {
        k: key("WA0"),
        label: (
          <>
            Base wage <Sym>W</Sym>
            <sub>0</sub>
          </>
        ),
        min: city === "A" ? 40 : 30,
        max: city === "A" ? 120 : 90,
        step: 1,
        format: money,
      },
      {
        k: key("PA0"),
        label: (
          <>
            Base rent <Sym>P</Sym>
            <sub>0</sub>
          </>
        ),
        min: city === "A" ? 10 : 5,
        max: city === "A" ? 40 : 20,
        step: 0.1,
        format: money,
      },
      {
        k: key("epsA"),
        label: (
          <>
            Housing elasticity <Sym>ε</Sym>
          </>
        ),
        min: 0.1,
        max: 2,
        step: 0.1,
        format: (v: number) => v.toFixed(1),
      },
    ];
    if (showMore) {
      rows.push(
        {
          k: key("etaA"),
          label: (
            <>
              Wage sensitivity <Sym>η</Sym>
            </>
          ),
          min: 0,
          max: 0.3,
          step: 0.01,
          format: (v: number) => v.toFixed(2),
        },
        {
          k: key("gammaA"),
          label: (
            <>
              Crowding penalty <Sym>γ</Sym>
            </>
          ),
          min: 0,
          max: 10,
          step: 0.5,
          format: money,
        }
      );
    }
    return rows.map((r) => (
      <Slider
        key={r.k}
        label={r.label}
        value={params[r.k]}
        min={r.min}
        max={r.max}
        step={r.step}
        format={r.format}
        tone={tone}
        onChange={update(r.k)}
      />
    ));
  };

  return (
    <Figure
      caption={
        <>
          The utility of living in each city as City A&apos;s share of the population, <Sym>s</Sym>, grows. People move
          towards the city with higher utility (arrows), so the population settles where the curves cross. Hover over
          the chart to read wages and rents at any split.
        </>
      }
    >
      <div className="mb-3.5 flex flex-wrap items-baseline gap-x-4.5 gap-y-1 font-mallory-book text-xs text-chart-muted">
        <span>Scenario</span>
        {(Object.keys(PRESETS) as Preset[]).map((key) => (
          <TextButton key={key} active={preset === key} onClick={() => loadPreset(key)}>
            {PRESETS[key].name}
          </TextButton>
        ))}
      </div>

      <Chart
        width={WIDTH}
        height={HEIGHT}
        label="Utility in City A and City B against City A's population share, crossing at the equilibrium"
      >
        <text x={LEFT} y={12} className="viz-axis">
          Utility
        </text>
        <Axes left={LEFT} top={TOP} right={LEFT + INNER_W} bottom={BOTTOM} />
        {[0, 0.25, 0.5, 0.75, 1].map((s) => (
          <text key={s} x={xScale(s)} y={BOTTOM + 18} textAnchor="middle" className="viz-axis">
            {s}
          </text>
        ))}
        <text x={LEFT + INNER_W} y={HEIGHT} textAnchor="end" className="viz-axis">
          City A&apos;s population share <tspan className="font-martina-plantijn italic">s</tspan>
        </text>

        {sStar !== null && (
          <>
            <line
              x1={xScale(sStar)}
              y1={TOP}
              x2={xScale(sStar)}
              y2={BOTTOM}
              className="stroke-chart-ink"
              strokeWidth={1}
              strokeDasharray="1 3"
            />
            <text
              x={xScale(sStar)}
              y={18}
              textAnchor="middle"
              className="viz-axis"
              style={{ fill: "var(--color-chart-ink)" }}
            >
              <tspan className="font-martina-plantijn italic">s</tspan>* = {sStar.toFixed(2)}
            </text>
            {/* Migration direction: towards s* from either side */}
            <g className="fill-chart-muted">
              <polygon points="0,-4 7,0 0,4" transform={`translate(${xScale(sStar / 2) - 3} ${BOTTOM - 10})`} />
              <polygon points="7,-4 0,0 7,4" transform={`translate(${xScale((sStar + 1) / 2) - 4} ${BOTTOM - 10})`} />
            </g>
          </>
        )}

        <path d={path("UA")} fill="none" className="stroke-chart-series-2" strokeWidth={2} strokeLinecap="round" />
        <path d={path("UB")} fill="none" className="stroke-chart-series-1" strokeWidth={2} strokeLinecap="round" />

        {hover !== null && (
          <g>
            <line
              x1={xScale(hover)}
              y1={TOP}
              x2={xScale(hover)}
              y2={BOTTOM}
              className="stroke-chart-ink"
              strokeOpacity={0.25}
              strokeWidth={1}
            />
            {isFinite(readout.UA) && (
              <circle cx={xScale(hover)} cy={yScale(readout.UA)} r={3.5} className="fill-chart-series-2" />
            )}
            {isFinite(readout.UB) && (
              <circle cx={xScale(hover)} cy={yScale(readout.UB)} r={3.5} className="fill-chart-series-1" />
            )}
          </g>
        )}

        {sStar !== null && star && isFinite(star.UA) && <Point x={xScale(sStar)} y={yScale(star.UA)} />}

        <text x={LEFT + INNER_W + 10} y={aLabelY + 4} className="viz-label fill-chart-series-2">
          City A
        </text>
        <text x={LEFT + INNER_W + 10} y={bLabelY + 4} className="viz-label fill-chart-series-1">
          City B
        </text>

        <rect
          x={LEFT}
          y={TOP}
          width={INNER_W}
          height={INNER_H}
          fill="transparent"
          className="touch-none"
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setHover(null)}
        />
      </Chart>

      <div className="mt-2.5 flex min-h-5 flex-wrap gap-x-3 font-mallory-book text-xs text-chart-muted tabular-nums">
        <span>
          At <Sym>s</Sym> = {readoutS.toFixed(2)}
        </span>
        <span className="text-chart-series-2">
          A: wage £{Math.round(readout.WA)}k · rent £{Math.round(readout.PA)}k
        </span>
        <span className="text-chart-series-1">
          B: wage £{Math.round(readout.WB)}k · rent £{Math.round(readout.PB)}k
        </span>
        {sStar === null && <span>No equilibrium inside the range</span>}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-4 font-mallory-book text-xs text-chart-muted sm:grid-cols-2">
        <div className="flex flex-col">
          <GroupHeading tone="series-2">City A</GroupHeading>
          {sliders("A")}
        </div>
        <div className="flex flex-col">
          <GroupHeading tone="series-1">City B</GroupHeading>
          {sliders("B")}
        </div>
      </div>
      <Controls className="mt-1.5">
        <TextButton onClick={() => setShowMore(!showMore)}>
          {showMore ? "Fewer parameters" : "More parameters (η, γ)"}
        </TextButton>
      </Controls>
    </Figure>
  );
}
