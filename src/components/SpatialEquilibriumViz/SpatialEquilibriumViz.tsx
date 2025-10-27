"use client";

import { useState, useMemo } from "react";

interface EquilibriumResult {
  popCityA: number;
  popCityB: number;
  rentCityA: number;
  rentCityB: number;
  consumptionCityA: number;
  consumptionCityB: number;
  utilityCityA: number;
  utilityCityB: number;
}

type ParameterToVary =
  | "wageCityA"
  | "wageCityB"
  | "baseRentCityA"
  | "baseRentCityB"
  | "elasticityCityA"
  | "elasticityCityB";

interface DataPoint {
  paramValue: number;
  popCityA: number;
  rentCityA: number;
  rentCityB: number;
  utilityCityA: number;
  utilityCityB: number;
}

const TOTAL_POPULATION = 10_000_000;

function calculateUtility(consumption: number, amenity: number = 1.0): number {
  return consumption > 0 ? amenity * Math.log(consumption) : -Infinity;
}

function calculateRent(population: number, baseRent: number, elasticity: number, totalPop: number): number {
  const popShare = population / totalPop;
  return baseRent * (1 + (popShare - 0.5) / elasticity);
}

function findEquilibrium(
  wageCityA: number,
  wageCityB: number,
  baseRentCityA: number,
  baseRentCityB: number,
  elasticityCityA: number,
  elasticityCityB: number,
  amenityCityA: number = 1.0,
  amenityCityB: number = 1.0,
  totalPop: number = TOTAL_POPULATION
): EquilibriumResult {
  const utilityDifference = (popCityA: number) => {
    const popCityB = totalPop - popCityA;

    const rentA = calculateRent(popCityA, baseRentCityA, elasticityCityA, totalPop);
    const rentB = calculateRent(popCityB, baseRentCityB, elasticityCityB, totalPop);

    const consumptionA = wageCityA - rentA;
    const consumptionB = wageCityB - rentB;

    if (consumptionA <= 0 || consumptionB <= 0) {
      return Infinity;
    }

    const utilityA = calculateUtility(consumptionA, amenityCityA);
    const utilityB = calculateUtility(consumptionB, amenityCityB);

    return utilityA - utilityB;
  };

  // Bisection search
  let low = 0;
  let high = totalPop;
  const tolerance = 0.001;

  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const diff = utilityDifference(mid);

    if (Math.abs(diff) < tolerance) {
      break;
    }

    if (diff > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const popCityA = (low + high) / 2;
  const popCityB = totalPop - popCityA;

  const rentA = calculateRent(popCityA, baseRentCityA, elasticityCityA, totalPop);
  const rentB = calculateRent(popCityB, baseRentCityB, elasticityCityB, totalPop);

  const consumptionA = wageCityA - rentA;
  const consumptionB = wageCityB - rentB;

  const utilityA = calculateUtility(consumptionA, amenityCityA);
  const utilityB = calculateUtility(consumptionB, amenityCityB);

  return {
    popCityA,
    popCityB,
    rentCityA: rentA,
    rentCityB: rentB,
    consumptionCityA: consumptionA,
    consumptionCityB: consumptionB,
    utilityCityA: utilityA,
    utilityCityB: utilityB,
  };
}

export default function SpatialEquilibriumViz() {
  // City A parameters (stored as strings for proper input handling)
  const [wageCityA, setWageCityA] = useState("80");
  const [baseRentCityA, setBaseRentCityA] = useState("24");
  const [elasticityCityA, setElasticityCityA] = useState("0.5");
  const amenityCityA = 1.0;

  // City B parameters (stored as strings for proper input handling)
  const [wageCityB, setWageCityB] = useState("45");
  const [baseRentCityB, setBaseRentCityB] = useState("8.4");
  const [elasticityCityB, setElasticityCityB] = useState("0.8");
  const amenityCityB = 1.0;

  // Parameter to vary
  const [paramToVary, setParamToVary] = useState<ParameterToVary>("wageCityA");

  // Convert string inputs to numbers for calculations
  const wageCityANum = parseFloat(wageCityA) || 80;
  const baseRentCityANum = parseFloat(baseRentCityA) || 24;
  const elasticityCityANum = parseFloat(elasticityCityA) || 0.5;
  const wageCityBNum = parseFloat(wageCityB) || 45;
  const baseRentCityBNum = parseFloat(baseRentCityB) || 8.4;
  const elasticityCityBNum = parseFloat(elasticityCityB) || 0.8;

  // Current equilibrium
  const equilibrium = useMemo(() => {
    return findEquilibrium(
      wageCityANum * 1000,
      wageCityBNum * 1000,
      baseRentCityANum * 1000,
      baseRentCityBNum * 1000,
      elasticityCityANum,
      elasticityCityBNum,
      amenityCityA,
      amenityCityB
    );
  }, [
    wageCityANum,
    wageCityBNum,
    baseRentCityANum,
    baseRentCityBNum,
    elasticityCityANum,
    elasticityCityBNum,
    amenityCityA,
    amenityCityB,
  ]);

  // Generate data points by varying the selected parameter
  const chartData = useMemo(() => {
    const points: DataPoint[] = [];
    const numPoints = 50;

    const paramRanges: Record<ParameterToVary, { min: number; max: number }> = {
      wageCityA: { min: 0, max: 120 },
      wageCityB: { min: 0, max: 90 },
      baseRentCityA: { min: 0, max: 40 },
      baseRentCityB: { min: 0, max: 20 },
      elasticityCityA: { min: 0.1, max: 2.0 },
      elasticityCityB: { min: 0.1, max: 2.0 },
    };

    const range = paramRanges[paramToVary];
    const step = (range.max - range.min) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const paramValue = range.min + i * step;

      const params = {
        wageCityA: wageCityANum,
        wageCityB: wageCityBNum,
        baseRentCityA: baseRentCityANum,
        baseRentCityB: baseRentCityBNum,
        elasticityCityA: elasticityCityANum,
        elasticityCityB: elasticityCityBNum,
      };

      params[paramToVary] = paramValue;

      const result = findEquilibrium(
        params.wageCityA * 1000,
        params.wageCityB * 1000,
        params.baseRentCityA * 1000,
        params.baseRentCityB * 1000,
        params.elasticityCityA,
        params.elasticityCityB,
        amenityCityA,
        amenityCityB
      );

      points.push({
        paramValue,
        popCityA: result.popCityA,
        rentCityA: result.rentCityA,
        rentCityB: result.rentCityB,
        utilityCityA: result.utilityCityA,
        utilityCityB: result.utilityCityB,
      });
    }

    return points;
  }, [
    paramToVary,
    wageCityANum,
    wageCityBNum,
    baseRentCityANum,
    baseRentCityBNum,
    elasticityCityANum,
    elasticityCityBNum,
    amenityCityA,
    amenityCityB,
  ]);

  const paramMetadata: Record<ParameterToVary, { label: string; unit: string; currentValue: number }> = {
    wageCityA: { label: "City A Wage", unit: "£k", currentValue: wageCityANum },
    wageCityB: { label: "City B Wage", unit: "£k", currentValue: wageCityBNum },
    baseRentCityA: { label: "City A Base Rent", unit: "£k", currentValue: baseRentCityANum },
    baseRentCityB: { label: "City B Base Rent", unit: "£k", currentValue: baseRentCityBNum },
    elasticityCityA: { label: "City A Housing Elasticity", unit: "", currentValue: elasticityCityANum },
    elasticityCityB: { label: "City B Housing Elasticity", unit: "", currentValue: elasticityCityBNum },
  };

  const currentParamMeta = paramMetadata[paramToVary];

  // Calculate scales for the chart
  const xMin = Math.min(...chartData.map((d) => d.paramValue));
  const xMax = Math.max(...chartData.map((d) => d.paramValue));

  // SVG dimensions
  const width = 400;
  const height = 300;
  const margin = { top: 30, right: 80, bottom: 50, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Helper to convert data to SVG coordinates
  const xScale = (value: number) => {
    const range = xMax - xMin;
    if (range === 0) return chartWidth / 2;
    return ((value - xMin) / range) * chartWidth;
  };

  const yScale = (value: number, min: number, max: number) => {
    const range = max - min;
    if (range === 0 || !isFinite(value)) return chartHeight / 2;
    return chartHeight - ((value - min) / range) * chartHeight;
  };

  // Create path data for a metric
  const createPath = (getData: (d: DataPoint) => number, yMin: number, yMax: number) => {
    let pathStr = "";
    let firstPoint = true;

    chartData.forEach((d) => {
      const value = getData(d);
      if (!isFinite(value)) return; // Skip invalid values

      const x = xScale(d.paramValue);
      const y = yScale(value, yMin, yMax);

      if (!isFinite(x) || !isFinite(y)) return; // Skip if coordinates are invalid

      if (firstPoint) {
        pathStr += `M ${x} ${y}`;
        firstPoint = false;
      } else {
        pathStr += ` L ${x} ${y}`;
      }
    });

    return pathStr;
  };

  // Calculate y-axis ranges
  const popMin = 0;
  const popMax = TOTAL_POPULATION;
  const rentMin = 0;
  const rentMax =
    Math.max(
      1000, // Minimum range
      ...chartData
        .filter((d) => isFinite(d.rentCityA) && isFinite(d.rentCityB))
        .map((d) => Math.max(d.rentCityA, d.rentCityB))
    ) * 1.1;

  const validUtils = chartData
    .filter((d) => isFinite(d.utilityCityA) && isFinite(d.utilityCityB))
    .flatMap((d) => [d.utilityCityA, d.utilityCityB]);
  const utilMin = validUtils.length > 0 ? Math.min(...validUtils) * 0.95 : 0;
  const utilMax = validUtils.length > 0 ? Math.max(...validUtils) * 1.05 : 1;

  const utilDiff = Math.abs(equilibrium.utilityCityA - equilibrium.utilityCityB);
  const isInEquilibrium = utilDiff < 0.01;

  // Guard against empty or invalid data
  if (chartData.length === 0 || !isFinite(xMin) || !isFinite(xMax)) {
    return (
      <div className="not-prose spatial-equilibrium-viz w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-2xl font-bold mb-6 text-center">Spatial Equilibrium Between Two Cities</h3>
        <p className="text-center text-red-600">Error: Invalid parameter values. Please adjust your inputs.</p>
      </div>
    );
  }

  return (
    <div className="not-prose spatial-equilibrium-viz w-full px-4 mt-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-center">Spatial Equilibrium Between Two Cities</h3>

      {/* Controls */}
      <div className="mb-8 bg-white p-6 rounded border border-gray-300">
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Select Parameter to Vary:</label>
          <select
            value={paramToVary}
            onChange={(e) => setParamToVary(e.target.value as ParameterToVary)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="wageCityA">City A Wage</option>
            <option value="wageCityB">City B Wage</option>
            <option value="baseRentCityA">City A Base Rent</option>
            <option value="baseRentCityB">City B Base Rent</option>
            <option value="elasticityCityA">City A Housing Elasticity</option>
            <option value="elasticityCityB">City B Housing Elasticity</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* City A Parameters */}
          <div>
            <h4 className="text-lg font-bold mb-3 text-red-700">City A</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Wage (£k)</label>
                <input
                  type="number"
                  min="40"
                  max="120"
                  step="1"
                  value={wageCityA}
                  onChange={(e) => setWageCityA(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Base Rent (£k)</label>
                <input
                  type="number"
                  min="10"
                  max="40"
                  step="0.5"
                  value={baseRentCityA}
                  onChange={(e) => setBaseRentCityA(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Housing Elasticity</label>
                <input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={elasticityCityA}
                  onChange={(e) => setElasticityCityA(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* City B Parameters */}
          <div>
            <h4 className="text-lg font-bold mb-3 text-blue-700">City B</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Wage (£k)</label>
                <input
                  type="number"
                  min="30"
                  max="90"
                  step="1"
                  value={wageCityB}
                  onChange={(e) => setWageCityB(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Base Rent (£k)</label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  step="0.5"
                  value={baseRentCityB}
                  onChange={(e) => setBaseRentCityB(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Housing Elasticity</label>
                <input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={elasticityCityB}
                  onChange={(e) => setElasticityCityB(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Container */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Population Distribution Chart */}
        <div className="bg-white p-6 rounded border border-gray-300">
          <h4 className="text-lg font-bold mb-2 text-center">Population Distribution</h4>
          <p className="text-sm text-gray-600 mb-4 text-center">
            How population splits between cities as <strong>{currentParamMeta.label}</strong> varies. The vertical line
            shows your current setting ({currentParamMeta.currentValue}
            {currentParamMeta.unit}).
          </p>
          <div className="overflow-x-auto">
            <svg width={width} height={height} className="mx-auto">
              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                  <g key={fraction}>
                    <line
                      x1={0}
                      x2={chartWidth}
                      y1={chartHeight * (1 - fraction)}
                      y2={chartHeight * (1 - fraction)}
                      stroke="#e5e7eb"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={-10}
                      y={chartHeight * (1 - fraction)}
                      textAnchor="end"
                      alignmentBaseline="middle"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {(fraction * 100).toFixed(0)}%
                    </text>
                  </g>
                ))}

                {/* Current value vertical line */}
                {(() => {
                  const x = xScale(currentParamMeta.currentValue);
                  if (!isFinite(x)) return null;
                  return (
                    <line
                      x1={x}
                      x2={x}
                      y1={0}
                      y2={chartHeight}
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                })()}

                {/* City A population (red) */}
                <path d={createPath((d) => d.popCityA, popMin, popMax)} fill="none" stroke="#ef4444" strokeWidth="2" />

                {/* City B population (blue) */}
                <path
                  d={createPath((d) => TOTAL_POPULATION - d.popCityA, popMin, popMax)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* X-axis */}
                <line x1={0} x2={chartWidth} y1={chartHeight} y2={chartHeight} stroke="#374151" strokeWidth="2" />
                <text x={chartWidth / 2} y={chartHeight + 40} textAnchor="middle" fontSize="12" fontWeight="bold">
                  {currentParamMeta.label} ({currentParamMeta.unit})
                </text>

                {/* X-axis labels */}
                {Array.from({ length: 7 }, (_, i) => {
                  const val = xMin + (i / 6) * (xMax - xMin);
                  const x = xScale(val);
                  if (!isFinite(x)) return null;
                  return (
                    <text key={i} x={x} y={chartHeight + 20} textAnchor="middle" fontSize="10" fill="#374151">
                      {val.toFixed(0)}
                    </text>
                  );
                })}

                {/* Y-axis */}
                <line x1={0} x2={0} y1={0} y2={chartHeight} stroke="#374151" strokeWidth="2" />
                <text
                  x={-40}
                  y={chartHeight / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  transform={`rotate(-90, -40, ${chartHeight / 2})`}
                >
                  Population Share
                </text>

                {/* Legend */}
                <g transform={`translate(${chartWidth + 10}, 20)`}>
                  <rect x={0} y={0} width={15} height={3} fill="#ef4444" />
                  <text x={20} y={5} fontSize="10" alignmentBaseline="middle">
                    City A
                  </text>

                  <rect x={0} y={15} width={15} height={3} fill="#3b82f6" />
                  <text x={20} y={20} fontSize="10" alignmentBaseline="middle">
                    City B
                  </text>
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* Rent Chart */}
        <div className="bg-white p-6 rounded border border-gray-300">
          <h4 className="text-lg font-bold mb-2 text-center">Housing Costs</h4>
          <p className="text-sm text-gray-600 mb-4 text-center">
            How rents adjust with population changes. Cities with more population have higher rents.
          </p>
          <div className="overflow-x-auto">
            <svg width={width} height={height} className="mx-auto">
              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Grid lines */}
                {Array.from({ length: 6 }, (_, i) => {
                  const value = rentMin + (i / 5) * (rentMax - rentMin);
                  const y = yScale(value, rentMin, rentMax);
                  if (!isFinite(y)) return null;
                  return (
                    <g key={i}>
                      <line x1={0} x2={chartWidth} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="2,2" />
                      <text x={-10} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#6b7280">
                        £{(value / 1000).toFixed(0)}k
                      </text>
                    </g>
                  );
                })}

                {/* Current value vertical line */}
                {(() => {
                  const x = xScale(currentParamMeta.currentValue);
                  if (!isFinite(x)) return null;
                  return (
                    <line
                      x1={x}
                      x2={x}
                      y1={0}
                      y2={chartHeight}
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                })()}

                {/* City A rent (red) */}
                <path
                  d={createPath((d) => d.rentCityA, rentMin, rentMax)}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />

                {/* City B rent (blue) */}
                <path
                  d={createPath((d) => d.rentCityB, rentMin, rentMax)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* Axes */}
                <line x1={0} x2={chartWidth} y1={chartHeight} y2={chartHeight} stroke="#374151" strokeWidth="2" />
                <line x1={0} x2={0} y1={0} y2={chartHeight} stroke="#374151" strokeWidth="2" />

                <text x={chartWidth / 2} y={chartHeight + 40} textAnchor="middle" fontSize="12" fontWeight="bold">
                  {currentParamMeta.label} ({currentParamMeta.unit})
                </text>
                <text
                  x={-40}
                  y={chartHeight / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  transform={`rotate(-90, -40, ${chartHeight / 2})`}
                >
                  Annual Rent
                </text>

                {/* X-axis labels */}
                {Array.from({ length: 7 }, (_, i) => {
                  const val = xMin + (i / 6) * (xMax - xMin);
                  const x = xScale(val);
                  if (!isFinite(x)) return null;
                  return (
                    <text key={i} x={x} y={chartHeight + 20} textAnchor="middle" fontSize="10" fill="#374151">
                      {val.toFixed(0)}
                    </text>
                  );
                })}

                {/* Legend */}
                <g transform={`translate(${chartWidth + 10}, 20)`}>
                  <rect x={0} y={0} width={15} height={3} fill="#ef4444" />
                  <text x={20} y={5} fontSize="10" alignmentBaseline="middle">
                    City A
                  </text>

                  <rect x={0} y={15} width={15} height={3} fill="#3b82f6" />
                  <text x={20} y={20} fontSize="10" alignmentBaseline="middle">
                    City B
                  </text>
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* Utility Chart */}
        <div className="bg-white p-6 rounded border border-gray-300">
          <h4 className="text-lg font-bold mb-2 text-center">Utility (Equilibrium Condition)</h4>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Workers migrate until utilities are equal. When the lines cross, we&apos;re in equilibrium.
          </p>
          <div className="overflow-x-auto">
            <svg width={width} height={height} className="mx-auto">
              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Grid lines */}
                {Array.from({ length: 6 }, (_, i) => {
                  const value = utilMin + (i / 5) * (utilMax - utilMin);
                  const y = yScale(value, utilMin, utilMax);
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

                {/* Current value vertical line */}
                {(() => {
                  const x = xScale(currentParamMeta.currentValue);
                  if (!isFinite(x)) return null;
                  return (
                    <line
                      x1={x}
                      x2={x}
                      y1={0}
                      y2={chartHeight}
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                })()}

                {/* City A utility (red) */}
                <path
                  d={createPath((d) => d.utilityCityA, utilMin, utilMax)}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />

                {/* City B utility (blue) */}
                <path
                  d={createPath((d) => d.utilityCityB, utilMin, utilMax)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {/* Axes */}
                <line x1={0} x2={chartWidth} y1={chartHeight} y2={chartHeight} stroke="#374151" strokeWidth="2" />
                <line x1={0} x2={0} y1={0} y2={chartHeight} stroke="#374151" strokeWidth="2" />

                <text x={chartWidth / 2} y={chartHeight + 40} textAnchor="middle" fontSize="12" fontWeight="bold">
                  {currentParamMeta.label} ({currentParamMeta.unit})
                </text>
                <text
                  x={-40}
                  y={chartHeight / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  transform={`rotate(-90, -40, ${chartHeight / 2})`}
                >
                  Utility
                </text>

                {/* X-axis labels */}
                {Array.from({ length: 7 }, (_, i) => {
                  const val = xMin + (i / 6) * (xMax - xMin);
                  const x = xScale(val);
                  if (!isFinite(x)) return null;
                  return (
                    <text key={i} x={x} y={chartHeight + 20} textAnchor="middle" fontSize="10" fill="#374151">
                      {val.toFixed(0)}
                    </text>
                  );
                })}

                {/* Legend */}
                <g transform={`translate(${chartWidth + 10}, 20)`}>
                  <rect x={0} y={0} width={15} height={3} fill="#ef4444" />
                  <text x={20} y={5} fontSize="10" alignmentBaseline="middle">
                    City A
                  </text>

                  <rect x={0} y={15} width={15} height={3} fill="#3b82f6" />
                  <text x={20} y={20} fontSize="10" alignmentBaseline="middle">
                    City B
                  </text>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
      {/* End Charts Container */}

      {/* Current Equilibrium Summary */}
      <div
        className={`p-4 rounded text-center ${isInEquilibrium ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}
      >
        <div className="font-bold text-lg mb-2">
          {isInEquilibrium ? "✓ In Equilibrium" : `⚠ Not in Equilibrium (utility difference: ${utilDiff.toFixed(3)})`}
        </div>
        <div className="text-sm">
          At your current settings: {(equilibrium.popCityA / 1000000).toFixed(1)}M in City A,{" "}
          {(equilibrium.popCityB / 1000000).toFixed(1)}M in City B
        </div>
      </div>
    </div>
  );
}
