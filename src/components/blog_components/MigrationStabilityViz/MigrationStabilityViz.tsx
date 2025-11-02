"use client";

import { useMemo, useState } from "react";
import { InlineMath } from "react-katex";

interface Params {
  WA0: number; // Base wage City A
  WB0: number; // Base wage City B
  PA0: number; // Base rent City A
  PB0: number; // Base rent City B
  s0: number; // Reference population split
  etaA: number; // Wage sensitivity City A
  etaB: number; // Wage sensitivity City B
  epsA: number; // Housing elasticity City A
  epsB: number; // Housing elasticity City B
  gammaA: number; // Crowding penalty City A
  gammaB: number; // Crowding penalty City B
}

function wages(
  s: number,
  WA0: number,
  WB0: number,
  s0: number,
  etaA: number,
  etaB: number
): { WA: number; WB: number } {
  const nA = Math.max(1e-6, s / s0);
  const nB = Math.max(1e-6, (1 - s) / (1 - s0));
  return {
    WA: WA0 * Math.pow(nA, -etaA),
    WB: WB0 * Math.pow(nB, -etaB),
  };
}

function rents(
  s: number,
  PA0: number,
  PB0: number,
  s0: number,
  epsA: number,
  epsB: number
): { PA: number; PB: number } {
  const nA = Math.max(1e-6, s / s0);
  const nB = Math.max(1e-6, (1 - s) / (1 - s0));
  return {
    PA: PA0 * Math.pow(nA, 1 / epsA),
    PB: PB0 * Math.pow(nB, 1 / epsB),
  };
}

function utility(C: number): number {
  return Math.log(Math.max(1e-6, C));
}

function Udiff(s: number, params: Params): number {
  const { WA, WB } = wages(s, params.WA0, params.WB0, params.s0, params.etaA, params.etaB);
  const { PA, PB } = rents(s, params.PA0, params.PB0, params.s0, params.epsA, params.epsB);
  const CA = WA - PA - params.gammaA * (s / params.s0 - 1);
  const CB = WB - PB - params.gammaB * ((1 - s) / (1 - params.s0) - 1);

  if (CA <= 0 || CB <= 0) {
    return NaN;
  }

  return utility(CA) - utility(CB);
}

function findEquilibrium(params: Params): number | null {
  // Bisection search for s* where Udiff(s) = 0
  let low = 0.01;
  let high = 0.99;
  const tolerance = 0.001;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const diff = Udiff(mid, params);

    if (isNaN(diff)) {
      // Try to narrow down to feasible region
      const diffLow = Udiff(low, params);
      const diffHigh = Udiff(high, params);
      if (isNaN(diffLow) && isNaN(diffHigh)) {
        return null;
      }
      if (isNaN(diffLow)) {
        low = mid;
      } else {
        high = mid;
      }
      continue;
    }

    if (Math.abs(diff) < tolerance) {
      return mid;
    }

    // If UA > UB (diff > 0), more people should move to A (increase s)
    // As s increases, UA falls and UB rises, so diff decreases
    // Therefore: if diff > 0, we want higher s, so set low = mid
    if (diff > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Check if we converged
  const finalDiff = Udiff((low + high) / 2, params);
  if (!isNaN(finalDiff) && Math.abs(finalDiff) < 0.01) {
    return (low + high) / 2;
  }

  return null;
}

type Preset = "balanced" | "restrictive" | "productivity-shock";

export default function MigrationStabilityViz() {
  const [WA0, setWA0] = useState("70");
  const [PA0, setPA0] = useState("22");
  const [epsA, setEpsA] = useState("0.8");
  const [etaA, setEtaA] = useState("0.05");
  const [gammaA, setGammaA] = useState("0");

  const [WB0, setWB0] = useState("50");
  const [PB0, setPB0] = useState("12");
  const [epsB, setEpsB] = useState("1.0");
  const [etaB, setEtaB] = useState("0.05");
  const [gammaB, setGammaB] = useState("0");

  // Selected point state (click-based instead of hover)
  const [selectedPoint, setSelectedPoint] = useState<{
    s: number;
    UA: number;
    UB: number;
    WA: number;
    WB: number;
    PA: number;
    PB: number;
  } | null>(null);

  // Reference population split
  const s0 = 0.5;

  // Convert to numbers
  const params: Params = useMemo(
    () => ({
      WA0: (parseFloat(WA0) || 70) * 1000,
      WB0: (parseFloat(WB0) || 50) * 1000,
      PA0: (parseFloat(PA0) || 22) * 1000,
      PB0: (parseFloat(PB0) || 12) * 1000,
      s0: s0,
      etaA: parseFloat(etaA) || 0.05,
      etaB: parseFloat(etaB) || 0.05,
      epsA: parseFloat(epsA) || 0.8,
      epsB: parseFloat(epsB) || 1.0,
      gammaA: (parseFloat(gammaA) || 0) * 1000,
      gammaB: (parseFloat(gammaB) || 0) * 1000,
    }),
    [WA0, WB0, PA0, PB0, epsA, epsB, etaA, etaB, gammaA, gammaB]
  );

  // Preset scenarios
  const loadPreset = (preset: Preset) => {
    // Clear any selected point when loading a preset
    setSelectedPoint(null);

    if (preset === "balanced") {
      setWA0("60");
      setPA0("20");
      setEpsA("1.0");
      setEtaA("0.05");
      setGammaA("0");
      setWB0("50");
      setPB0("10");
      setEpsB("1.0");
      setEtaB("0.05");
      setGammaB("0");
    } else if (preset === "restrictive") {
      setWA0("80");
      setPA0("24");
      setEpsA("0.3"); // Very inelastic housing
      setEtaA("0.05");
      setGammaA("0");
      setWB0("45");
      setPB0("8.4");
      setEpsB("1.2"); // Very elastic housing
      setEtaB("0.05");
      setGammaB("0");
    } else if (preset === "productivity-shock") {
      setWA0("90"); // Higher productivity in A
      setPA0("20");
      setEpsA("0.7");
      setEtaA("0.05");
      setGammaA("0");
      setWB0("45");
      setPB0("10");
      setEpsB("0.9");
      setEtaB("0.05");
      setGammaB("0");
    }
  };

  // Generate data points for s from 0.05 to 0.95
  const data = useMemo(() => {
    const points: Array<{
      s: number;
      UA: number;
      UB: number;
      WA: number;
      WB: number;
      PA: number;
      PB: number;
      feasible: boolean;
    }> = [];

    for (let i = 0; i <= 100; i++) {
      const s = 0.01 + (i / 100) * 0.98; // s from 0.01 to 0.99
      const { WA, WB } = wages(s, params.WA0, params.WB0, params.s0, params.etaA, params.etaB);
      const { PA, PB } = rents(s, params.PA0, params.PB0, params.s0, params.epsA, params.epsB);
      const CA = WA - PA - params.gammaA * (s / params.s0 - 1);
      const CB = WB - PB - params.gammaB * ((1 - s) / (1 - s0) - 1);

      const feasible = CA > 0 && CB > 0;
      const UA = feasible ? utility(CA) : NaN;
      const UB = feasible ? utility(CB) : NaN;

      points.push({ s, UA, UB, WA, WB, PA, PB, feasible });
    }

    return points;
  }, [params]);

  // Find equilibrium
  const sStar = useMemo(() => findEquilibrium(params), [params]);

  // Calculate equilibrium data
  const equilibriumData = useMemo(() => {
    if (sStar === null) return null;
    const { WA, WB } = wages(sStar, params.WA0, params.WB0, params.s0, params.etaA, params.etaB);
    const { PA, PB } = rents(sStar, params.PA0, params.PB0, params.s0, params.epsA, params.epsB);
    const CA = WA - PA - params.gammaA * (sStar / params.s0 - 1);
    const CB = WB - PB - params.gammaB * ((1 - sStar) / (1 - params.s0) - 1);
    return {
      WA,
      WB,
      PA,
      PB,
      CA,
      CB,
      UA: utility(CA),
      UB: utility(CB),
    };
  }, [sStar, params]);

  // Calculate y-axis ranges for utilities
  const validUtils = data.filter((d) => d.feasible).flatMap((d) => [d.UA, d.UB]);
  const utilMin = validUtils.length > 0 ? Math.min(...validUtils) : 0;
  const utilMax = validUtils.length > 0 ? Math.max(...validUtils) : 1;
  const utilRange = utilMax - utilMin;
  const utilPadding = utilRange * 0.1;

  // SVG dimensions
  const width = 600;
  const height = 400;
  const margin = { top: 30, right: 100, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = (s: number) => s * chartWidth;
  const yScale = (u: number) =>
    chartHeight - ((u - (utilMin - utilPadding)) / (utilRange + 2 * utilPadding)) * chartHeight;

  // Create path for utilities
  const createPath = (getData: (d: (typeof data)[0]) => number) => {
    let pathStr = "";
    let started = false;

    data.forEach((d) => {
      if (!d.feasible) return;
      const value = getData(d);
      if (!isFinite(value)) return;

      const x = xScale(d.s);
      const y = yScale(value);

      if (!started) {
        pathStr += `M ${x} ${y}`;
        started = true;
      } else {
        pathStr += ` L ${x} ${y}`;
      }
    });

    return pathStr;
  };

  const arrows: Array<{ s: number; direction: "left" | "right"; yPos: number }> = [];
  for (let i = 0; i < data.length; i += 10) {
    const d = data[i];
    if (!d.feasible) continue;
    const diff = d.UA - d.UB;
    if (Math.abs(diff) < 0.01) continue; // Skip near equilibrium

    // Position arrow at average of the two utilities
    const avgUtility = (d.UA + d.UB) / 2;
    const yPos = yScale(avgUtility);

    arrows.push({
      s: d.s,
      direction: diff > 0 ? "right" : "left",
      yPos,
    });
  }

  return (
    <div className="not-prose migration-stability-viz mt-4 rounded-lg border border-gray-200 bg-gray-50 px-8 py-8">
      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: Information and Inputs */}
        <div className="space-y-6">
          {/* Explanatory Text */}
          <div className="rounded border border-blue-200 bg-blue-50 p-4 text-sm">
            <strong>What you&apos;re seeing:</strong>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <span className="font-semibold text-red-600">
                  Red line (<InlineMath math="U_A" />)
                </span>
                : Utility of living in City A, which <em>falls</em> as more people move there (higher{" "}
                <InlineMath math="s" />) because rents rise and wages fall
              </li>
              <li>
                <span className="font-semibold text-blue-600">
                  Blue line (<InlineMath math="U_B" />)
                </span>
                : Utility of living in City B, which <em>rises</em> as people leave (higher <InlineMath math="s" />)
                because rents fall and wages rise
              </li>
              <li>
                <span className="font-semibold text-green-600">
                  Equilibrium (<InlineMath math="s^*" />)
                </span>
                : Where the lines cross (shown as a green dashed line). This is{" "}
                <strong>calculated automatically</strong>. No one wants to move because utilities are equal.
              </li>
              <li>
                <strong>Arrows</strong>: Show migration direction. People move towards the city with higher utility
              </li>
              <li>
                <strong>Click on the chart</strong> to see detailed values at any population split
              </li>
            </ul>
          </div>

          {/* Preset Scenarios */}
          <div>
            <div className="mb-2 text-sm font-semibold">Try these scenarios:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => loadPreset("balanced")}
                className="rounded bg-green-100 px-4 py-2 text-sm font-medium text-green-800 transition-colors hover:bg-green-200"
              >
                Balanced Equilibrium
              </button>
              <button
                onClick={() => loadPreset("restrictive")}
                className="rounded bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800 transition-colors hover:bg-orange-200"
              >
                Restrictive Housing in A
              </button>
              <button
                onClick={() => loadPreset("productivity-shock")}
                className="rounded bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800 transition-colors hover:bg-purple-200"
              >
                Productivity Shock in A
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded border border-gray-300 bg-white p-6">
            <h4 className="mb-4 text-center text-lg font-bold">Parameters</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* City A Parameters */}
              <div>
                <h4 className="mb-3 text-lg font-bold text-red-700">City A</h4>
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Base Wage (£k)</label>
                    <input
                      type="number"
                      min="40"
                      max="120"
                      step="1"
                      value={WA0}
                      onChange={(e) => setWA0(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Base Rent (£k/yr)</label>
                    <input
                      type="number"
                      min="10"
                      max="40"
                      step="0.5"
                      value={PA0}
                      onChange={(e) => setPA0(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Housing Elasticity (<InlineMath math="\varepsilon" />)
                      <span className="ml-1 font-normal text-gray-500">(higher = more elastic)</span>
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={epsA}
                      onChange={(e) => setEpsA(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Wage Sensitivity (<InlineMath math="\eta" />)
                      <span className="ml-1 font-normal text-gray-500">(effect of labour supply)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="0.3"
                      step="0.01"
                      value={etaA}
                      onChange={(e) => setEtaA(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Crowding Penalty (£k/yr)
                      <span className="ml-1 font-normal text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={gammaA}
                      onChange={(e) => setGammaA(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* City B Parameters */}
              <div>
                <h4 className="mb-3 text-lg font-bold text-blue-700">City B</h4>
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Base Wage (£k)</label>
                    <input
                      type="number"
                      min="30"
                      max="90"
                      step="1"
                      value={WB0}
                      onChange={(e) => setWB0(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Base Rent (£k/yr)</label>
                    <input
                      type="number"
                      min="5"
                      max="20"
                      step="0.5"
                      value={PB0}
                      onChange={(e) => setPB0(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Housing Elasticity (<InlineMath math="\varepsilon" />)
                      <span className="ml-1 font-normal text-gray-500">(higher = more elastic)</span>
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={epsB}
                      onChange={(e) => setEpsB(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Wage Sensitivity (<InlineMath math="\eta" />)
                      <span className="ml-1 font-normal text-gray-500">(effect of labour supply)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="0.3"
                      step="0.01"
                      value={etaB}
                      onChange={(e) => setEtaB(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Crowding Penalty (£k/yr)
                      <span className="ml-1 font-normal text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={gammaB}
                      onChange={(e) => setGammaB(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Chart and Outputs */}
        <div className="space-y-6">
          {/* Main Chart */}
          <div className="rounded border border-gray-300 bg-white p-6">
            <h4 className="mb-2 text-center text-lg font-bold">Utility vs Population Share in City A</h4>
            <p className="mb-4 text-center text-sm text-gray-600">
              The crossing point <InlineMath math="s^*" /> shows the equilibrium. Arrows indicate migration direction
              (towards the city with higher utility). Click on the chart to see details.
            </p>
            <div className="overflow-x-auto">
              <svg width={width} height={height} className="mx-auto">
                <g transform={`translate(${margin.left},${margin.top})`}>
                  {/* Grid lines */}
                  {Array.from({ length: 6 }, (_, i) => {
                    const value = utilMin - utilPadding + (i / 5) * (utilRange + 2 * utilPadding);
                    const y = yScale(value);
                    if (!isFinite(y)) return null;
                    return (
                      <g key={i}>
                        <line x1={0} x2={chartWidth} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="2,2" />
                        <text x={-10} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#6b7280">
                          {value.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Equilibrium vertical line */}
                  {sStar !== null && (
                    <line
                      x1={xScale(sStar)}
                      x2={xScale(sStar)}
                      y1={0}
                      y2={chartHeight}
                      stroke="#059669"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}

                  {/* Utility curves */}
                  <path
                    d={createPath((d) => d.UA)}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    suppressHydrationWarning
                  />
                  <path
                    d={createPath((d) => d.UB)}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    suppressHydrationWarning
                  />

                  {arrows.map((arrow, idx) => {
                    const x = xScale(arrow.s);
                    const arrowY = arrow.yPos;
                    const arrowSize = 8;
                    if (arrow.direction === "right") {
                      return (
                        <g key={idx}>
                          <line x1={x - 15} x2={x + 15} y1={arrowY} y2={arrowY} stroke="#374151" strokeWidth="2" />
                          <polygon
                            points={`${x + 15},${arrowY} ${x + 15 - arrowSize},${arrowY - arrowSize / 2} ${x + 15 - arrowSize},${arrowY + arrowSize / 2}`}
                            fill="#374151"
                          />
                        </g>
                      );
                    } else {
                      return (
                        <g key={idx}>
                          <line x1={x - 15} x2={x + 15} y1={arrowY} y2={arrowY} stroke="#374151" strokeWidth="2" />
                          <polygon
                            points={`${x - 15},${arrowY} ${x - 15 + arrowSize},${arrowY - arrowSize / 2} ${x - 15 + arrowSize},${arrowY + arrowSize / 2}`}
                            fill="#374151"
                          />
                        </g>
                      );
                    }
                  })}

                  {/* Click regions for selecting points */}
                  {data.map((d, idx) => {
                    if (!d.feasible) return null;
                    return (
                      <rect
                        key={idx}
                        x={xScale(d.s) - chartWidth / 200}
                        y={0}
                        width={chartWidth / 100}
                        height={chartHeight}
                        fill="transparent"
                        onClick={() => setSelectedPoint(d)}
                        style={{ cursor: "pointer" }}
                      />
                    );
                  })}

                  {/* Selected point indicator */}
                  {selectedPoint && (
                    <>
                      <line
                        x1={xScale(selectedPoint.s)}
                        x2={xScale(selectedPoint.s)}
                        y1={0}
                        y2={chartHeight}
                        stroke="#9ca3af"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                      <circle cx={xScale(selectedPoint.s)} cy={yScale(selectedPoint.UA)} r={4} fill="#ef4444" />
                      <circle cx={xScale(selectedPoint.s)} cy={yScale(selectedPoint.UB)} r={4} fill="#3b82f6" />
                    </>
                  )}

                  {/* Axes */}
                  <line x1={0} x2={chartWidth} y1={chartHeight} y2={chartHeight} stroke="#374151" strokeWidth="2" />
                  <line x1={0} x2={0} y1={0} y2={chartHeight} stroke="#374151" strokeWidth="2" />

                  {/* X-axis label */}
                  <text x={chartWidth / 2} y={chartHeight + 50} textAnchor="middle" fontSize="14" fontWeight="bold">
                    Share living in City A (<tspan fontStyle="italic">s</tspan>)
                  </text>

                  {/* X-axis ticks */}
                  {[0, 0.25, 0.5, 0.75, 1].map((s) => {
                    const x = xScale(s);
                    return (
                      <g key={s}>
                        <line x1={x} x2={x} y1={chartHeight} y2={chartHeight + 5} stroke="#374151" strokeWidth="2" />
                        <text x={x} y={chartHeight + 20} textAnchor="middle" fontSize="12" fill="#374151">
                          {s.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Y-axis label */}
                  <text
                    x={-40}
                    y={chartHeight / 2}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    transform={`rotate(-90, -40, ${chartHeight / 2})`}
                  >
                    Utility
                  </text>

                  {/* Legend */}
                  <g transform={`translate(${chartWidth + 10}, 20)`}>
                    <rect x={0} y={0} width={20} height={3} fill="#ef4444" />
                    <text x={25} y={5} fontSize="12" alignmentBaseline="middle">
                      <tspan fontStyle="italic">U</tspan>
                      <tspan fontSize="9" dy="2">
                        A
                      </tspan>
                      <tspan dy="-2">
                        (<tspan fontStyle="italic">s</tspan>)
                      </tspan>
                    </text>

                    <rect x={0} y={20} width={20} height={3} fill="#3b82f6" />
                    <text x={25} y={25} fontSize="12" alignmentBaseline="middle">
                      <tspan fontStyle="italic">U</tspan>
                      <tspan fontSize="9" dy="2">
                        B
                      </tspan>
                      <tspan dy="-2">
                        (<tspan fontStyle="italic">s</tspan>)
                      </tspan>
                    </text>

                    {sStar !== null && (
                      <>
                        <line x1={0} x2={20} y1={45} y2={45} stroke="#059669" strokeWidth="2" strokeDasharray="5,5" />
                        <text x={25} y={48} fontSize="12" alignmentBaseline="middle">
                          <tspan fontStyle="italic">s</tspan>* = {sStar.toFixed(3)}
                        </text>
                      </>
                    )}
                  </g>
                </g>
              </svg>
            </div>
          </div>

          {/* Selected point details panel - only show if not at equilibrium */}
          {selectedPoint && sStar !== null && Math.abs(selectedPoint.s - sStar) > 0.01 && (
            <div className="mb-6 rounded border border-gray-400 bg-gray-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="flex-1 text-center text-lg font-bold">
                  At <InlineMath math="s" /> = {(selectedPoint.s * 100).toFixed(1)}%
                </h4>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="px-2 text-xl font-bold text-gray-500 hover:text-gray-700"
                  title="Clear selection"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded border border-red-200 bg-red-50 p-3">
                  <h5 className="mb-2 font-bold text-red-700">City A</h5>
                  <div className="space-y-1 text-sm">
                    <div>Wage: £{(selectedPoint.WA / 1000).toFixed(1)}k</div>
                    <div>Rent: £{(selectedPoint.PA / 1000).toFixed(1)}k</div>
                    <div>Consumption: £{((selectedPoint.WA - selectedPoint.PA) / 1000).toFixed(1)}k</div>
                    <div className="font-semibold">Utility: {selectedPoint.UA.toFixed(3)}</div>
                  </div>
                </div>
                <div className="rounded border border-blue-200 bg-blue-50 p-3">
                  <h5 className="mb-2 font-bold text-blue-700">City B</h5>
                  <div className="space-y-1 text-sm">
                    <div>Wage: £{(selectedPoint.WB / 1000).toFixed(1)}k</div>
                    <div>Rent: £{(selectedPoint.PB / 1000).toFixed(1)}k</div>
                    <div>Consumption: £{((selectedPoint.WB - selectedPoint.PB) / 1000).toFixed(1)}k</div>
                    <div className="font-semibold">Utility: {selectedPoint.UB.toFixed(3)}</div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center text-sm text-gray-600">
                {selectedPoint.UA > selectedPoint.UB
                  ? "→ People would move to City A (red has higher utility)"
                  : selectedPoint.UB > selectedPoint.UA
                    ? "← People would move to City B (blue has higher utility)"
                    : "⚖ Cities in equilibrium (utilities equal)"}
              </div>
            </div>
          )}

          {/* Equilibrium Status and Details */}
          <div
            className={`rounded border p-4 ${
              sStar !== null ? "border-green-300 bg-green-50" : "border-orange-300 bg-orange-50"
            }`}
          >
            <div className="mb-2 text-center text-lg font-bold">
              {sStar !== null ? (
                <>
                  ✓ Equilibrium at <InlineMath math="s^*" /> = {(sStar * 100).toFixed(1)}%
                </>
              ) : (
                <span className="text-orange-800">⚠ No interior equilibrium (corner solution)</span>
              )}
            </div>

            {sStar !== null && equilibriumData ? (
              <>
                <div className="mb-3 text-center text-sm text-gray-700">
                  {(sStar * 100).toFixed(1)}% live in City A, {((1 - sStar) * 100).toFixed(1)}% in City B. Utilities
                  are equal, so no one wants to move.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded border border-red-200 bg-white p-3">
                    <h5 className="mb-2 font-bold text-red-700">City A</h5>
                    <div className="space-y-1 text-sm">
                      <div>Wage: £{(equilibriumData.WA / 1000).toFixed(1)}k</div>
                      <div>Rent: £{(equilibriumData.PA / 1000).toFixed(1)}k</div>
                      <div>Consumption: £{(equilibriumData.CA / 1000).toFixed(1)}k</div>
                      <div className="font-semibold text-green-700">Utility: {equilibriumData.UA.toFixed(3)}</div>
                    </div>
                  </div>
                  <div className="rounded border border-blue-200 bg-white p-3">
                    <h5 className="mb-2 font-bold text-blue-700">City B</h5>
                    <div className="space-y-1 text-sm">
                      <div>Wage: £{(equilibriumData.WB / 1000).toFixed(1)}k</div>
                      <div>Rent: £{(equilibriumData.PB / 1000).toFixed(1)}k</div>
                      <div>Consumption: £{(equilibriumData.CB / 1000).toFixed(1)}k</div>
                      <div className="font-semibold text-green-700">Utility: {equilibriumData.UB.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-orange-800">
                All workers prefer one city over the other. Check your parameters or add crowding penalties to create
                an interior equilibrium.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
