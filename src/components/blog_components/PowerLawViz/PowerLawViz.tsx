"use client";

import { useMemo, useState } from "react";
import { InlineMath } from "react-katex";

export default function PowerLawViz() {
  const [W0, setW0] = useState("70");
  const [eta, setEta] = useState("0.05");
  const [showRent, setShowRent] = useState(false);
  const [P0, setP0] = useState("22");
  const [epsilon, setEpsilon] = useState("0.8");

  const W0_val = parseFloat(W0) || 70;
  const eta_val = parseFloat(eta) || 0.05;
  const P0_val = parseFloat(P0) || 22;
  const eps_val = parseFloat(epsilon) || 0.8;

  // Generate wage data
  const wageData = useMemo(() => {
    const points: Array<{ s: number; W: number }> = [];
    for (let i = 0; i <= 100; i++) {
      const s = 0.01 + (i / 100) * 0.98;
      const ratio = s / 0.5;
      const W = W0_val * Math.pow(ratio, -eta_val);
      points.push({ s, W });
    }
    return points;
  }, [W0_val, eta_val]);

  // Generate rent data
  const rentData = useMemo(() => {
    const points: Array<{ s: number; P: number }> = [];
    for (let i = 0; i <= 100; i++) {
      const s = 0.01 + (i / 100) * 0.98;
      const ratio = s / 0.5;
      const P = P0_val * Math.pow(ratio, 1 / eps_val);
      points.push({ s, P });
    }
    return points;
  }, [P0_val, eps_val]);

  // SVG dimensions
  const width = 700;
  const height = 400;
  const margin = { top: 20, right: 80, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate y-axis range - always start at 0
  const allValues = showRent ? [...wageData.map((d) => d.W), ...rentData.map((d) => d.P)] : wageData.map((d) => d.W);
  const yMax = Math.max(...allValues);
  const yPadding = yMax * 0.05;

  // Scales
  const xScale = (s: number) => s * chartWidth;
  const yScale = (val: number) => chartHeight - (val / (yMax + yPadding)) * chartHeight;

  // Create path for wage
  const wagePath = wageData
    .map((d, i) => {
      const x = xScale(d.s);
      const y = yScale(d.W);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Create path for rent
  const rentPath = rentData
    .map((d, i) => {
      const x = xScale(d.s);
      const y = yScale(d.P);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="not-prose power-law-viz my-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <svg width={width} height={height} className="mx-auto">
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid lines */}
            {Array.from({ length: 6 }, (_, i) => {
              const value = (i / 5) * (yMax + yPadding);
              const y = yScale(value);
              return (
                <g key={i}>
                  <line x1={0} x2={chartWidth} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="2,2" />
                  <text x={-10} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="11" fill="#6b7280">
                    £{value.toFixed(0)}k
                  </text>
                </g>
              );
            })}

            {/* Reference line at s = 0.5 */}
            <line
              x1={xScale(0.5)}
              x2={xScale(0.5)}
              y1={0}
              y2={chartHeight}
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            {/* Wage curve */}
            <path d={wagePath} fill="none" stroke="#3b82f6" strokeWidth="3" />

            {/* Rent curve */}
            {showRent && <path d={rentPath} fill="none" stroke="#a855f7" strokeWidth="3" />}

            {/* Axes */}
            <line x1={0} x2={chartWidth} y1={chartHeight} y2={chartHeight} stroke="#374151" strokeWidth="2" />
            <line x1={0} x2={0} y1={0} y2={chartHeight} stroke="#374151" strokeWidth="2" />

            {/* X-axis label */}
            <text x={chartWidth / 2} y={chartHeight + 45} textAnchor="middle" fontSize="14" fontWeight="bold">
              Population share (<tspan fontStyle="italic">s</tspan>)
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
              x={-50}
              y={chartHeight / 2.2}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              transform={`rotate(-90, -35, ${chartHeight / 2})`}
            >
              {showRent ? "Value (£k)" : "Wage (£k)"}
            </text>

            {/* Legend */}
            <g transform={`translate(${chartWidth - 70}, 10)`}>
              <rect x={0} y={0} width={20} height={3} fill="#3b82f6" />
              <text x={25} y={5} fontSize="12" alignmentBaseline="middle">
                Wage
              </text>

              {showRent && (
                <>
                  <rect x={0} y={20} width={20} height={3} fill="#a855f7" />
                  <text x={25} y={25} fontSize="12" alignmentBaseline="middle">
                    Rent
                  </text>
                </>
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 flex items-center justify-between text-sm font-semibold">
            <span>
              Base Wage <InlineMath math="W_0" /> (£k)
            </span>
            <span className="font-mono text-blue-600">{W0}</span>
          </label>
          <input
            type="range"
            min="40"
            max="100"
            step="5"
            value={W0}
            onChange={(e) => setW0(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-sm font-semibold">
            <span>
              Wage Sensitivity <InlineMath math="\eta" />
            </span>
            <span className="font-mono text-blue-600">{eta}</span>
          </label>
          <input
            type="range"
            min="0"
            max="0.2"
            step="0.01"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-sm font-semibold">
            <span>
              Base Rent <InlineMath math="P_0" /> (£k)
            </span>
            <span className="font-mono text-purple-600">{P0}</span>
          </label>
          <input
            type="range"
            min="10"
            max="40"
            step="2"
            value={P0}
            onChange={(e) => setP0(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-sm font-semibold">
            <span>
              Housing Elasticity <InlineMath math="\varepsilon" />
            </span>
            <span className="font-mono text-purple-600">{epsilon}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={epsilon}
            onChange={(e) => setEpsilon(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
