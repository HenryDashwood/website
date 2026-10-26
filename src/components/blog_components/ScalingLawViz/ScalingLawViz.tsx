"use client";

import { useId, useMemo, useState } from "react";

import { Axes, Chart, Figure, GroupHeading, Slider, Sym, TextButton, toPath } from "../shared/viz";

interface Architecture {
  A: number;
  alpha: number;
}

// Compute is plotted from 10^18 to 10^26 FLOPs. A is the reducible loss at 10^18 FLOPs.
const LOG_C_MIN = 18;
const LOG_C_MAX = 26;
const BUDGETS = [20, 25];

// Chart geometry
const WIDTH = 680;
const HEIGHT = 300;
const LEFT = 48;
const TOP = 24;
const INNER_W = 520;
const INNER_H = 236;
const BOTTOM = TOP + INNER_H;

function reducibleLoss({ A, alpha }: Architecture, logC: number) {
  return A * Math.pow(10, -(logC - LOG_C_MIN) * alpha);
}

// Percentage of the remaining reducible loss removed by each doubling of compute
function doublingCut({ alpha }: Architecture) {
  return Math.round((1 - Math.pow(2, -alpha)) * 100);
}

// log10 of the compute X needs to reach the loss Y reaches with 10^logC FLOPs
function matchingLogCompute(x: Architecture, y: Architecture, logC: number) {
  return LOG_C_MIN + Math.log10(x.A / reducibleLoss(y, logC)) / x.alpha;
}

function formatMultiple(logMultiple: number) {
  const m = Math.pow(10, logMultiple);
  if (logMultiple >= 4) {
    const exponent = Math.floor(logMultiple);
    return (
      <>
        {(m / Math.pow(10, exponent)).toFixed(1)} × 10<sup>{exponent}</sup>×
      </>
    );
  }
  if (m >= 10) return `${Math.round(m).toLocaleString()}×`;
  if (m >= 1) return `${m.toFixed(1)}×`;
  return `${m.toFixed(2)}×`;
}

const xScale = (logC: number) => LEFT + ((logC - LOG_C_MIN) / (LOG_C_MAX - LOG_C_MIN)) * INNER_W;

export default function ScalingLawViz() {
  const clipId = `scaling-law-clip-${useId().replace(/[^\w-]/g, "")}`;
  const [E, setE] = useState(1.7);
  const [x, setX] = useState<Architecture>({ A: 2.5, alpha: 0.15 });
  const [y, setY] = useState<Architecture>({ A: 2, alpha: 0.15 });
  const [logScale, setLogScale] = useState(false);

  const logCs = useMemo(
    () => Array.from({ length: 161 }, (_, i) => LOG_C_MIN + (i / 160) * (LOG_C_MAX - LOG_C_MIN)),
    []
  );

  // In linear mode we plot the total loss L. In log mode we plot the reducible loss L − E, which turns each
  // curve into a straight line whose slope is −α.
  const plotted = (arch: Architecture, logC: number) => (logScale ? 0 : E) + reducibleLoss(arch, logC);

  const yAxis = useMemo(() => {
    const values = [x, y].flatMap((arch) => [reducibleLoss(arch, LOG_C_MIN), reducibleLoss(arch, LOG_C_MAX)]);
    if (logScale) {
      const min = Math.floor(Math.log10(Math.min(...values)));
      const max = Math.ceil(Math.log10(Math.max(...values)));
      const ticks = Array.from({ length: max - min + 1 }, (_, i) => Math.pow(10, min + i));
      return { min: Math.pow(10, min), max: Math.pow(10, max), ticks };
    }
    const max = E + Math.max(...values);
    const step = [0.25, 0.5, 1, 2].find((s) => max / s <= 6) ?? 2;
    const top = Math.ceil((max * 1.05) / step) * step;
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
    return { min: 0, max: top, ticks };
  }, [x, y, E, logScale]);

  const yScale = (value: number) => {
    if (logScale) {
      const lo = Math.log10(yAxis.min);
      const hi = Math.log10(yAxis.max);
      return BOTTOM - ((Math.log10(value) - lo) / (hi - lo)) * INNER_H;
    }
    return BOTTOM - ((value - yAxis.min) / (yAxis.max - yAxis.min)) * INNER_H;
  };

  const path = (arch: Architecture) => toPath(logCs.map((logC) => [xScale(logC), yScale(plotted(arch, logC))]));

  // For each budget, the horizontal gap between Y's point and the point where X reaches the same loss
  const gaps = BUDGETS.map((logC) => {
    const logCX = matchingLogCompute(x, y, logC);
    return { logC, logCX, value: plotted(y, logC), logMultiple: logCX - logC };
  });

  // Name each curve at its right-hand end, nudged apart if they would collide
  let xLabelY = Math.max(TOP + 4, Math.min(BOTTOM - 4, yScale(plotted(x, LOG_C_MAX))));
  let yLabelY = Math.max(TOP + 4, Math.min(BOTTOM - 4, yScale(plotted(y, LOG_C_MAX))));
  if (Math.abs(xLabelY - yLabelY) < 16) {
    const mid = (xLabelY + yLabelY) / 2;
    [xLabelY, yLabelY] = xLabelY < yLabelY ? [mid - 8, mid + 8] : [mid + 8, mid - 8];
  }

  return (
    <Figure
      caption={
        <>
          Loss against training compute for two architectures that share the irreducible loss <Sym>E</Sym>. The
          horizontal segments show how much more compute X needs to match Y at two budgets. On the log scale each curve
          is a straight line with slope −<Sym>α</Sym>.
        </>
      }
    >
      <div className="mb-3.5 flex flex-wrap items-baseline gap-x-4.5 gap-y-1 font-mallory-book text-xs text-chart-muted">
        <span>Show</span>
        <TextButton active={!logScale} onClick={() => setLogScale(false)}>
          Loss
        </TextButton>
        <TextButton active={logScale} onClick={() => setLogScale(true)}>
          Reducible loss, log scale
        </TextButton>
      </div>

      <Chart width={WIDTH} height={HEIGHT} label="Loss against training compute for architectures X and Y">
        <defs>
          <clipPath id={clipId}>
            <rect x={LEFT} y={TOP} width={INNER_W} height={INNER_H} />
          </clipPath>
        </defs>
        <text x={LEFT} y={10} className="viz-axis">
          {logScale ? (
            <>
              Reducible loss <tspan className="font-martina-plantijn italic">L</tspan> −{" "}
              <tspan className="font-martina-plantijn italic">E</tspan>
            </>
          ) : (
            <>
              Loss <tspan className="font-martina-plantijn italic">L</tspan>
            </>
          )}
        </text>
        <Axes left={LEFT} top={TOP} right={LEFT + INNER_W} bottom={BOTTOM} />
        {yAxis.ticks.map((value) => (
          <text key={value} x={LEFT - 8} y={yScale(value) + 4} textAnchor="end" className="viz-axis">
            {value}
          </text>
        ))}
        {[18, 20, 22, 24, 26].map((logC) => (
          <text key={logC} x={xScale(logC)} y={BOTTOM + 18} textAnchor="middle" className="viz-axis">
            10
            <tspan dy="-5" fontSize="8">
              {logC}
            </tspan>
          </text>
        ))}
        <text x={LEFT + INNER_W} y={HEIGHT} textAnchor="end" className="viz-axis">
          Training compute <tspan className="font-martina-plantijn italic">C</tspan>, FLOPs
        </text>

        <g clipPath={`url(#${clipId})`}>
          {/* Irreducible loss E */}
          {!logScale && (
            <>
              <line
                x1={LEFT}
                x2={LEFT + INNER_W}
                y1={yScale(E)}
                y2={yScale(E)}
                className="stroke-chart-ink"
                strokeWidth={1}
                strokeDasharray="1 3"
              />
              <text x={LEFT + 6} y={yScale(E) - 6} className="viz-axis">
                <tspan className="font-martina-plantijn italic">E</tspan>
              </text>
            </>
          )}

          {/* Budget reference lines */}
          {BUDGETS.map((logC) => (
            <line
              key={logC}
              x1={xScale(logC)}
              x2={xScale(logC)}
              y1={TOP}
              y2={BOTTOM}
              className="stroke-chart-hairline"
              strokeWidth={1}
            />
          ))}

          <path d={path(y)} fill="none" className="stroke-chart-series-1" strokeWidth={2} strokeLinecap="round" />
          <path d={path(x)} fill="none" className="stroke-chart-series-2" strokeWidth={2} strokeLinecap="round" />

          {/* Compute gaps */}
          {gaps.map(({ logC, logCX, value }) => {
            const yPos = yScale(value);
            const x1 = xScale(logC);
            const x2 = Math.max(LEFT - 10, Math.min(LEFT + INNER_W + 10, xScale(logCX)));
            return (
              <g key={logC}>
                <line x1={x1} x2={x2} y1={yPos} y2={yPos} className="stroke-chart-ink" strokeWidth={1} />
                <circle cx={x1} cy={yPos} r={3.5} className="fill-chart-series-1" />
                <circle cx={x2} cy={yPos} r={3.5} className="fill-chart-series-2" />
              </g>
            );
          })}
        </g>

        <text x={LEFT + INNER_W + 10} y={xLabelY + 4} className="viz-label fill-chart-series-2">
          X
        </text>
        <text x={LEFT + INNER_W + 10} y={yLabelY + 4} className="viz-label fill-chart-series-1">
          Y
        </text>
      </Chart>

      {/* Compute multiples */}
      <div className="mt-4 flex flex-wrap gap-x-10 gap-y-2 font-mallory-book text-xs text-chart-muted">
        {gaps.map(({ logC, logMultiple }) => (
          <div key={logC}>
            To match Y at 10<sup>{logC}</sup> FLOPs, X needs{" "}
            <span className="font-martina-plantijn text-lg text-chart-ink tabular-nums">
              {formatMultiple(logMultiple)}
            </span>{" "}
            the compute
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 font-mallory-book text-xs text-chart-muted sm:grid-cols-3">
        <div className="flex flex-col">
          <GroupHeading tone="series-2">X · doubling removes {doublingCut(x)}%</GroupHeading>
          <Slider
            label={<Sym>A</Sym>}
            value={x.A}
            min={0.5}
            max={4}
            step={0.1}
            format={(v) => v.toFixed(1)}
            tone="series-2"
            onChange={(A) => setX({ ...x, A })}
          />
          <Slider
            label={<Sym>α</Sym>}
            value={x.alpha}
            min={0.05}
            max={0.3}
            step={0.01}
            format={(v) => v.toFixed(2)}
            tone="series-2"
            onChange={(alpha) => setX({ ...x, alpha })}
          />
        </div>
        <div className="flex flex-col">
          <GroupHeading tone="series-1">Y · doubling removes {doublingCut(y)}%</GroupHeading>
          <Slider
            label={<Sym>A</Sym>}
            value={y.A}
            min={0.5}
            max={4}
            step={0.1}
            format={(v) => v.toFixed(1)}
            tone="series-1"
            onChange={(A) => setY({ ...y, A })}
          />
          <Slider
            label={<Sym>α</Sym>}
            value={y.alpha}
            min={0.05}
            max={0.3}
            step={0.01}
            format={(v) => v.toFixed(2)}
            tone="series-1"
            onChange={(alpha) => setY({ ...y, alpha })}
          />
        </div>
        <div className="flex flex-col">
          <GroupHeading tone="ink">Shared</GroupHeading>
          <Slider
            label={
              <>
                Irreducible loss <Sym>E</Sym>
              </>
            }
            value={E}
            min={0}
            max={3}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={setE}
          />
        </div>
      </div>
    </Figure>
  );
}
