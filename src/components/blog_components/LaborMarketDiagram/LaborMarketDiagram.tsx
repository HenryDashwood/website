"use client";

import { useState } from "react";
import { InlineMath } from "react-katex";

// Helper function to get CSS variable value with fallback
function getCSSVar(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

interface EquilibriumPoint {
  W: number;
  P: number;
}

export default function LaborMarketDiagram() {
  // Use lazy initializer to compute colors once on mount
  const colors = useState(() => ({
    grayLight: getCSSVar("--color-chart-gray-light", "#e5e7eb"),
    grayMedium: getCSSVar("--color-chart-gray-medium", "#9ca3af"),
    grayDark: getCSSVar("--color-chart-gray-dark", "#6b7280"),
    grayDarker: getCSSVar("--color-chart-gray-darker", "#374151"),
    blue: getCSSVar("--color-chart-blue", "#3b82f6"),
    red: getCSSVar("--color-chart-red", "#ef4444"),
    green: getCSSVar("--color-chart-green", "#059669"),
    purple: getCSSVar("--color-chart-purple", "#a855f7"),
  }))[0];

  // Parameters
  const [productivity, setProductivity] = useState(100); // A: productivity index (100 = baseline)
  const [amenities, setAmenities] = useState(100); // Z: amenities index (100 = baseline)
  const [beta, setBeta] = useState(0.33); // Housing expenditure share

  // Base parameters for curves
  const baseVBar = 10; // Reservation utility level
  const baseAlpha = 0.7; // Labour share in production

  // Generate iso-utility curve points (worker indifference)
  // W = V_bar * P^beta / Z
  // Workers need higher wages to compensate for higher rents
  const isoUtilityData = (() => {
    const Z = amenities / 100;
    const points: Array<{ P: number; W: number }> = [];

    for (let i = 0; i <= 100; i++) {
      const P = 5 + (i / 100) * 45; // Rent from 5 to 50 (£k/year)
      const W = (baseVBar * Math.pow(P, beta)) / Z;
      if (W > 0 && W < 150) {
        points.push({ P, W });
      }
    }
    return points;
  })();

  // Generate original iso-utility curve (for comparison when shifted)
  const originalIsoUtilityData = (() => {
    const Z = 1; // baseline
    const points: Array<{ P: number; W: number }> = [];

    for (let i = 0; i <= 100; i++) {
      const P = 5 + (i / 100) * 45;
      const W = (baseVBar * Math.pow(P, beta)) / Z;
      if (W > 0 && W < 150) {
        points.push({ P, W });
      }
    }
    return points;
  })();

  // Generate iso-profit curve points (firm zero-profit condition)
  // For firms using land: higher rents mean higher costs, so wages must be lower
  // W = A * k - theta * P, where k is a constant and theta reflects land intensity
  const isoProfitData = (() => {
    const A = productivity / 100;
    const k = 80; // Base productivity constant
    const theta = 1.2; // Land cost coefficient
    const points: Array<{ P: number; W: number }> = [];

    for (let i = 0; i <= 100; i++) {
      const P = 5 + (i / 100) * 45;
      const W = A * k - theta * P;
      if (W > 0 && W < 150) {
        points.push({ P, W });
      }
    }
    return points;
  })();

  // Generate original iso-profit curve (for comparison)
  const originalIsoProfitData = (() => {
    const A = 1; // baseline
    const k = 80;
    const theta = 1.2;
    const points: Array<{ P: number; W: number }> = [];

    for (let i = 0; i <= 100; i++) {
      const P = 5 + (i / 100) * 45;
      const W = A * k - theta * P;
      if (W > 0 && W < 150) {
        points.push({ P, W });
      }
    }
    return points;
  })();

  // Find equilibrium (intersection of curves)
  const equilibrium = ((): EquilibriumPoint | null => {
    const A = productivity / 100;
    const Z = amenities / 100;
    const k = 80;
    const theta = 1.2;

    // Solve: V_bar * P^beta / Z = A * k - theta * P
    // This is transcendental, so we use numerical search
    for (let i = 0; i <= 1000; i++) {
      const P = 5 + (i / 1000) * 45;
      const W_supply = (baseVBar * Math.pow(P, beta)) / Z;
      const W_demand = A * k - theta * P;

      if (Math.abs(W_supply - W_demand) < 0.5 && W_demand > 0) {
        return { P, W: (W_supply + W_demand) / 2 };
      }
    }
    return null;
  })();

  // Original equilibrium for comparison
  const originalEquilibrium = ((): EquilibriumPoint | null => {
    const A = 1;
    const Z = 1;
    const k = 80;
    const theta = 1.2;

    for (let i = 0; i <= 1000; i++) {
      const P = 5 + (i / 1000) * 45;
      const W_supply = (baseVBar * Math.pow(P, beta)) / Z;
      const W_demand = A * k - theta * P;

      if (Math.abs(W_supply - W_demand) < 0.5 && W_demand > 0) {
        return { P, W: (W_supply + W_demand) / 2 };
      }
    }
    return null;
  })();

  // Check if parameters have changed
  const hasChanged = productivity !== 100 || amenities !== 100;

  // SVG dimensions
  const width = 600;
  const height = 450;
  const margin = { top: 30, right: 30, bottom: 60, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Scales
  const xMin = 5;
  const xMax = 50;
  const yMin = 0;
  const yMax = 100;

  const xScale = (p: number) => ((p - xMin) / (xMax - xMin)) * chartWidth;
  const yScale = (w: number) => chartHeight - ((w - yMin) / (yMax - yMin)) * chartHeight;

  // Create path from points
  const createPath = (data: Array<{ P: number; W: number }>) => {
    if (data.length === 0) return "";
    return data
      .map((d, i) => {
        const x = xScale(d.P);
        const y = yScale(d.W);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Determine what changed for explanation
  const getExplanation = () => {
    if (productivity > 100 && amenities === 100) {
      return "Higher productivity shifts the iso-profit curve up. Firms can pay higher wages at any rent level. The new equilibrium has higher wages and higher rents.";
    }
    if (productivity < 100 && amenities === 100) {
      return "Lower productivity shifts the iso-profit curve down. Firms must pay lower wages. The new equilibrium has lower wages and lower rents.";
    }
    if (amenities > 100 && productivity === 100) {
      return "Better amenities shift the iso-utility curve down. Workers accept lower wages for the same rent because amenities compensate them. The new equilibrium has lower wages but higher rents.";
    }
    if (amenities < 100 && productivity === 100) {
      return "Worse amenities shift the iso-utility curve up. Workers demand higher wages to compensate for poor living conditions. The new equilibrium has higher wages but lower rents.";
    }
    if (productivity > 100 && amenities > 100) {
      return "Both higher productivity and better amenities: productivity raises wages while amenities lower them. Rents rise due to both effects. The net wage change depends on which effect dominates.";
    }
    if (productivity < 100 && amenities < 100) {
      return "Both lower productivity and worse amenities: a declining city. Rents fall, but wages depend on which effect dominates.";
    }
    if (productivity !== 100 || amenities !== 100) {
      return "The curves have shifted. The new equilibrium reflects the combined effects of changes in productivity and amenities.";
    }
    return "";
  };

  return (
    <div className="not-prose labor-market-diagram my-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
      <h3 className="mb-4 text-center text-xl font-bold">The Roback Diagram: Wages vs Rents</h3>

      {/* Chart */}
      <div className="mb-6 overflow-x-auto">
        <svg width={width} height={height} className="mx-auto" viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid lines */}
            {Array.from({ length: 6 }, (_, i) => {
              const value = yMin + (i / 5) * (yMax - yMin);
              const y = yScale(value);
              return (
                <g key={`y-${i}`}>
                  <line x1={0} x2={chartWidth} y1={y} y2={y} stroke={colors.grayLight} strokeDasharray="2,2" />
                  <text x={-10} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="11" fill={colors.grayDark}>
                    £{value.toFixed(0)}k
                  </text>
                </g>
              );
            })}

            {Array.from({ length: 6 }, (_, i) => {
              const value = xMin + (i / 5) * (xMax - xMin);
              const x = xScale(value);
              return (
                <g key={`x-${i}`}>
                  <line x1={x} x2={x} y1={0} y2={chartHeight} stroke={colors.grayLight} strokeDasharray="2,2" />
                </g>
              );
            })}

            {/* Original curves (faded, for comparison when changed) */}
            {hasChanged && (
              <>
                <path
                  d={createPath(originalIsoUtilityData)}
                  fill="none"
                  stroke={colors.blue}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity="0.3"
                />
                <path
                  d={createPath(originalIsoProfitData)}
                  fill="none"
                  stroke={colors.red}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  opacity="0.3"
                />
                {originalEquilibrium && (
                  <circle
                    cx={xScale(originalEquilibrium.P)}
                    cy={yScale(originalEquilibrium.W)}
                    r={6}
                    fill="white"
                    stroke={colors.grayMedium}
                    strokeWidth="2"
                    opacity="0.5"
                  />
                )}
              </>
            )}

            {/* Current iso-utility curve (workers) */}
            <path d={createPath(isoUtilityData)} fill="none" stroke={colors.blue} strokeWidth="3" />

            {/* Current iso-profit curve (firms) */}
            <path d={createPath(isoProfitData)} fill="none" stroke={colors.red} strokeWidth="3" />

            {/* Equilibrium point */}
            {equilibrium && (
              <>
                {/* Dotted lines to axes */}
                <line
                  x1={xScale(equilibrium.P)}
                  x2={xScale(equilibrium.P)}
                  y1={yScale(equilibrium.W)}
                  y2={chartHeight}
                  stroke={colors.green}
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <line
                  x1={0}
                  x2={xScale(equilibrium.P)}
                  y1={yScale(equilibrium.W)}
                  y2={yScale(equilibrium.W)}
                  stroke={colors.green}
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                {/* Equilibrium point */}
                <circle
                  cx={xScale(equilibrium.P)}
                  cy={yScale(equilibrium.W)}
                  r={8}
                  fill={colors.green}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Label */}
                <text
                  x={xScale(equilibrium.P) + 12}
                  y={yScale(equilibrium.W) - 12}
                  fontSize="12"
                  fontWeight="bold"
                  fill={colors.green}
                >
                  Equilibrium
                </text>
              </>
            )}

            {/* Arrow showing shift direction for iso-utility */}
            {amenities !== 100 && originalEquilibrium && equilibrium && (
              <g>
                <defs>
                  <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={colors.blue} />
                  </marker>
                </defs>
                <line
                  x1={xScale(25)}
                  y1={yScale((baseVBar * Math.pow(25, beta)) / 1)}
                  x2={xScale(25)}
                  y2={yScale((baseVBar * Math.pow(25, beta)) / (amenities / 100)) - (amenities > 100 ? 10 : -10)}
                  stroke={colors.blue}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-blue)"
                />
              </g>
            )}

            {/* Arrow showing shift direction for iso-profit */}
            {productivity !== 100 && (
              <g>
                <defs>
                  <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={colors.red} />
                  </marker>
                </defs>
                <line
                  x1={xScale(20)}
                  y1={yScale(1 * 80 - 1.2 * 20)}
                  x2={xScale(20)}
                  y2={yScale((productivity / 100) * 80 - 1.2 * 20) + (productivity > 100 ? 10 : -10)}
                  stroke={colors.red}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-red)"
                />
              </g>
            )}

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

            {/* X-axis label */}
            <text x={chartWidth / 2} y={chartHeight + 45} textAnchor="middle" fontSize="14" fontWeight="bold">
              Rent (<tspan fontStyle="italic">P</tspan>) - £k/year
            </text>

            {/* X-axis ticks */}
            {[10, 20, 30, 40, 50].map((p) => {
              const x = xScale(p);
              return (
                <g key={p}>
                  <line
                    x1={x}
                    x2={x}
                    y1={chartHeight}
                    y2={chartHeight + 5}
                    stroke={colors.grayDarker}
                    strokeWidth="2"
                  />
                  <text x={x} y={chartHeight + 20} textAnchor="middle" fontSize="11" fill={colors.grayDarker}>
                    £{p}k
                  </text>
                </g>
              );
            })}

            {/* Y-axis label */}
            <text
              x={-50}
              y={chartHeight / 2}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              transform={`rotate(-90, -50, ${chartHeight / 2})`}
            >
              Wages (<tspan fontStyle="italic">W</tspan>) - £k/year
            </text>

            {/* Legend */}
            <g transform={`translate(${chartWidth - 180}, 10)`}>
              <rect
                x={0}
                y={0}
                width={180}
                height={hasChanged ? 90 : 70}
                fill="white"
                stroke={colors.grayLight}
                rx="4"
              />
              <g transform="translate(10, 15)">
                <line x1={0} x2={25} y1={0} y2={0} stroke={colors.blue} strokeWidth="3" />
                <text x={30} y={4} fontSize="11">
                  Iso-utility (workers)
                </text>

                <line x1={0} x2={25} y1={20} y2={20} stroke={colors.red} strokeWidth="3" />
                <text x={30} y={24} fontSize="11">
                  Iso-profit (firms)
                </text>

                <circle cx={12} cy={40} r={5} fill={colors.green} />
                <text x={30} y={44} fontSize="11">
                  Equilibrium
                </text>

                {hasChanged && (
                  <>
                    <line
                      x1={0}
                      x2={25}
                      y1={60}
                      y2={60}
                      stroke={colors.grayMedium}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                    <text x={30} y={64} fontSize="11" fill={colors.grayDark}>
                      Original curves
                    </text>
                  </>
                )}
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Controls */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <h4 className="mb-3 flex items-center gap-2 font-bold text-red-700">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500"></span>
            Productivity (<InlineMath math="A" />)
          </h4>
          <p className="mb-3 text-sm text-gray-600">
            Higher productivity means firms can pay higher wages at any rent level. This shifts the iso-profit curve
            up.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={productivity}
              onChange={(e) => setProductivity(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-16 text-right font-mono font-bold text-red-700">{productivity}%</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Low</span>
            <span>Baseline</span>
            <span>High</span>
          </div>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-3 flex items-center gap-2 font-bold text-blue-700">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500"></span>
            Amenities (<InlineMath math="Z" />)
          </h4>
          <p className="mb-3 text-sm text-gray-600">
            Better amenities mean workers accept lower wages for the same rent. This shifts the iso-utility curve down.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={amenities}
              onChange={(e) => setAmenities(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-16 text-right font-mono font-bold text-blue-700">{amenities}%</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Poor</span>
            <span>Baseline</span>
            <span>Nice</span>
          </div>
        </div>

        <div className="rounded border border-purple-200 bg-purple-50 p-4">
          <h4 className="mb-3 flex items-center gap-2 font-bold text-purple-700">
            <span className="inline-block h-3 w-3 rounded-full bg-purple-500"></span>
            Housing Share (<InlineMath math="\beta" />)
          </h4>
          <p className="mb-3 text-sm text-gray-600">
            The share of income spent on housing. Higher values make the iso-utility curve steeper.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={beta}
              onChange={(e) => setBeta(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-16 text-right font-mono font-bold text-purple-700">{(beta * 100).toFixed(0)}%</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>10%</span>
            <span>30%</span>
            <span>50%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
