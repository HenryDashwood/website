"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { InlineMath } from "react-katex";

// Helper function to get CSS variable value with fallback
function getCSSVar(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

interface Architecture {
  A: number;
  alpha: number;
}

// Compute is plotted from 10^18 to 10^26 FLOPs. A is the reducible loss at 10^18 FLOPs.
const LOG_C_MIN = 18;
const LOG_C_MAX = 26;
const BUDGETS = [20, 25];

function reducibleLoss({ A, alpha }: Architecture, logC: number) {
  return A * Math.pow(10, -(logC - LOG_C_MIN) * alpha);
}

// Percentage of the remaining reducible loss removed by each doubling of compute
function doublingCut({ alpha }: Architecture) {
  return Math.round((1 - Math.pow(2, -alpha)) * 100);
}

function toggleClass(active: boolean) {
  return `rounded border px-3 py-1 text-sm ${active ? "border-gray-700 bg-gray-700 text-white" : "border-gray-300 bg-white"}`;
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

function Slider({
  label,
  value,
  min,
  max,
  step,
  decimals,
  valueClassName,
  onChange,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  valueClassName: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center justify-between text-sm font-semibold">
        <span>{label}</span>
        <span className={`font-mono ${valueClassName}`}>{value.toFixed(decimals)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export default function ScalingLawViz() {
  const colors = useState(() => ({
    grayLight: getCSSVar("--color-chart-gray-light", "#e5e7eb"),
    grayMedium: getCSSVar("--color-chart-gray-medium", "#9ca3af"),
    grayDark: getCSSVar("--color-chart-gray-dark", "#6b7280"),
    grayDarker: getCSSVar("--color-chart-gray-darker", "#374151"),
    blue: getCSSVar("--color-chart-blue", "#3b82f6"),
    purple: getCSSVar("--color-chart-purple", "#a855f7"),
  }))[0];

  const [E, setE] = useState(1.7);
  const [x, setX] = useState<Architecture>({ A: 2.5, alpha: 0.15 });
  const [y, setY] = useState<Architecture>({ A: 2, alpha: 0.15 });
  const [logScale, setLogScale] = useState(false);

  // SVG dimensions
  const width = 700;
  const height = 380;
  const margin = { top: 20, right: 20, bottom: 55, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

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
    const step = [0.25, 0.5, 1, 2].find((s) => max / s <= 8) ?? 2;
    const top = Math.ceil((max * 1.05) / step) * step;
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
    return { min: 0, max: top, ticks };
  }, [x, y, E, logScale]);

  // Scales
  const xScale = (logC: number) => ((logC - LOG_C_MIN) / (LOG_C_MAX - LOG_C_MIN)) * chartWidth;
  const yScale = (value: number) => {
    if (logScale) {
      const lo = Math.log10(yAxis.min);
      const hi = Math.log10(yAxis.max);
      return chartHeight - ((Math.log10(value) - lo) / (hi - lo)) * chartHeight;
    }
    return chartHeight - ((value - yAxis.min) / (yAxis.max - yAxis.min)) * chartHeight;
  };

  const path = (arch: Architecture) =>
    logCs.map((logC, i) => `${i === 0 ? "M" : "L"} ${xScale(logC)} ${yScale(plotted(arch, logC))}`).join(" ");

  // For each budget, the horizontal gap between Y's point and the point where X reaches the same loss
  const gaps = BUDGETS.map((logC) => {
    const logCX = matchingLogCompute(x, y, logC);
    return { logC, logCX, value: plotted(y, logC), logMultiple: logCX - logC };
  });

  return (
    <div className="not-prose my-6 max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={toggleClass(!logScale)} onClick={() => setLogScale(false)}>
          Loss
        </button>
        <button type="button" className={toggleClass(logScale)} onClick={() => setLogScale(true)}>
          Reducible loss, log scale
        </button>
      </div>

      <div className="mb-6">
        <svg width={width} height={height} className="mx-auto h-auto max-w-full" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <clipPath id="scaling-law-chart-area">
              <rect x={0} y={0} width={chartWidth} height={chartHeight} />
            </clipPath>
          </defs>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid lines */}
            {yAxis.ticks.map((value) => {
              const yPos = yScale(value);
              return (
                <g key={value}>
                  <line x1={0} x2={chartWidth} y1={yPos} y2={yPos} stroke={colors.grayLight} strokeDasharray="2,2" />
                  <text
                    x={-10}
                    y={yPos}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    fontSize="11"
                    fill={colors.grayDark}
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            <g clipPath="url(#scaling-law-chart-area)">
              {/* Irreducible loss E */}
              {!logScale && (
                <>
                  <line
                    x1={0}
                    x2={chartWidth}
                    y1={yScale(E)}
                    y2={yScale(E)}
                    stroke={colors.grayMedium}
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                  />
                  <text x={6} y={yScale(E) - 6} fontSize="12" fill={colors.grayDark}>
                    E
                  </text>
                </>
              )}

              {/* Budget reference lines */}
              {BUDGETS.map((logC) => (
                <line
                  key={logC}
                  x1={xScale(logC)}
                  x2={xScale(logC)}
                  y1={0}
                  y2={chartHeight}
                  stroke={colors.grayLight}
                  strokeWidth="1"
                />
              ))}

              <path d={path(y)} fill="none" stroke={colors.blue} strokeWidth="3" />
              <path d={path(x)} fill="none" stroke={colors.purple} strokeWidth="3" strokeDasharray="8,5" />

              {/* Compute gaps */}
              {gaps.map(({ logC, logCX, value }) => {
                const yPos = yScale(value);
                const x1 = xScale(logC);
                const x2 = Math.max(-10, Math.min(chartWidth + 10, xScale(logCX)));
                return (
                  <g key={logC}>
                    <line x1={x1} x2={x2} y1={yPos} y2={yPos} stroke={colors.grayDarker} strokeWidth="1.5" />
                    <circle cx={x1} cy={yPos} r={5} fill={colors.blue} stroke="white" strokeWidth="2" />
                    <circle cx={x2} cy={yPos} r={5} fill={colors.purple} stroke="white" strokeWidth="2" />
                  </g>
                );
              })}
            </g>

            {/* Axes */}
            <line
              x1={0}
              x2={chartWidth}
              y1={chartHeight}
              y2={chartHeight}
              stroke={colors.grayDarker}
              strokeWidth="2"
            />
            <line x1={0} x2={0} y1={0} y2={chartHeight} stroke={colors.grayDarker} strokeWidth="2" />

            {/* X-axis ticks */}
            {[18, 20, 22, 24, 26].map((logC) => {
              const xPos = xScale(logC);
              return (
                <g key={logC}>
                  <line
                    x1={xPos}
                    x2={xPos}
                    y1={chartHeight}
                    y2={chartHeight + 5}
                    stroke={colors.grayDarker}
                    strokeWidth="2"
                  />
                  <text x={xPos} y={chartHeight + 22} textAnchor="middle" fontSize="12" fill={colors.grayDarker}>
                    10
                    <tspan dy="-6" fontSize="9">
                      {logC}
                    </tspan>
                  </text>
                </g>
              );
            })}

            {/* X-axis label */}
            <text x={chartWidth / 2} y={chartHeight + 45} textAnchor="middle" fontSize="14" fontWeight="bold">
              Training compute, FLOPs (<tspan fontStyle="italic">C</tspan>)
            </text>

            {/* Y-axis label */}
            <text
              x={-chartHeight / 2}
              y={-45}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              transform="rotate(-90)"
            >
              {logScale ? "Reducible loss (L − E)" : "Loss (L)"}
            </text>

            {/* Legend */}
            <g transform={`translate(${chartWidth - 130}, 10)`}>
              <rect x={-8} y={-8} width={136} height={44} fill="white" opacity={0.85} />
              <line x1={0} x2={24} y1={5} y2={5} stroke={colors.blue} strokeWidth="3" />
              <text x={30} y={5} fontSize="12" alignmentBaseline="middle">
                Architecture Y
              </text>
              <line x1={0} x2={24} y1={25} y2={25} stroke={colors.purple} strokeWidth="3" strokeDasharray="8,5" />
              <text x={30} y={25} fontSize="12" alignmentBaseline="middle">
                Architecture X
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Compute multiples */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {gaps.map(({ logC, logMultiple }) => (
          <div key={logC} className="rounded bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              To match Y at 10<sup>{logC}</sup> FLOPs, X needs
            </p>
            <p className="text-xl font-semibold">{formatMultiple(logMultiple)} the compute</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-purple-600">
            Architecture X: each doubling removes {doublingCut(x)}%
          </p>
          <Slider
            label={<InlineMath math="A" />}
            value={x.A}
            min={0.5}
            max={4}
            step={0.1}
            decimals={1}
            valueClassName="text-purple-600"
            onChange={(A) => setX({ ...x, A })}
          />
          <Slider
            label={<InlineMath math="\alpha" />}
            value={x.alpha}
            min={0.05}
            max={0.3}
            step={0.01}
            decimals={2}
            valueClassName="text-purple-600"
            onChange={(alpha) => setX({ ...x, alpha })}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-blue-600">
            Architecture Y: each doubling removes {doublingCut(y)}%
          </p>
          <Slider
            label={<InlineMath math="A" />}
            value={y.A}
            min={0.5}
            max={4}
            step={0.1}
            decimals={1}
            valueClassName="text-blue-600"
            onChange={(A) => setY({ ...y, A })}
          />
          <Slider
            label={<InlineMath math="\alpha" />}
            value={y.alpha}
            min={0.05}
            max={0.3}
            step={0.01}
            decimals={2}
            valueClassName="text-blue-600"
            onChange={(alpha) => setY({ ...y, alpha })}
          />
        </div>

        <div className="sm:col-span-2">
          <Slider
            label={
              <>
                Irreducible loss <InlineMath math="E" /> (shared)
              </>
            }
            value={E}
            min={0}
            max={3}
            step={0.1}
            decimals={1}
            valueClassName="text-gray-700"
            onChange={setE}
          />
        </div>
      </div>
    </div>
  );
}
