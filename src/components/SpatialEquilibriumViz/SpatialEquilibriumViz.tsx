"use client";

import React, { useState, useMemo } from "react";

interface EquilibriumResult {
  popLondon: number;
  popNewcastle: number;
  rentLondon: number;
  rentNewcastle: number;
  consumptionLondon: number;
  consumptionNewcastle: number;
  utilityLondon: number;
  utilityNewcastle: number;
}

const TOTAL_POPULATION = 1000000;
const INITIAL_WAGE_NEWCASTLE = 45000;
const INITIAL_BASE_RENT_LONDON = 24000;
const INITIAL_BASE_RENT_NEWCASTLE = 8400;

function calculateUtility(consumption: number, amenity: number = 1.0): number {
  return consumption > 0 ? amenity * Math.log(consumption) : -Infinity;
}

function calculateRent(
  population: number,
  baseRent: number,
  elasticity: number,
  totalPop: number
): number {
  const popShare = population / totalPop;
  return baseRent * (1 + (popShare - 0.5) / elasticity);
}

function findEquilibrium(
  wageLondon: number,
  wageNewcastle: number,
  baseRentLondon: number,
  baseRentNewcastle: number,
  elasticityLondon: number,
  elasticityNewcastle: number,
  amenityLondon: number = 1.0,
  amenityNewcastle: number = 1.0,
  totalPop: number = TOTAL_POPULATION
): EquilibriumResult {
  const utilityDifference = (popLondon: number) => {
    const popNewcastle = totalPop - popLondon;

    const rentL = calculateRent(
      popLondon,
      baseRentLondon,
      elasticityLondon,
      totalPop
    );
    const rentN = calculateRent(
      popNewcastle,
      baseRentNewcastle,
      elasticityNewcastle,
      totalPop
    );

    const consumptionL = wageLondon - rentL;
    const consumptionN = wageNewcastle - rentN;

    if (consumptionL <= 0 || consumptionN <= 0) {
      return Infinity;
    }

    const utilityL = calculateUtility(consumptionL, amenityLondon);
    const utilityN = calculateUtility(consumptionN, amenityNewcastle);

    return utilityL - utilityN;
  };

  // Bisection search
  let low = 0;
  let high = totalPop;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const diff = utilityDifference(mid);

    if (Math.abs(diff) < 0.001) {
      break;
    }

    if (diff > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const popLondon = (low + high) / 2;
  const popNewcastle = totalPop - popLondon;

  const rentL = calculateRent(
    popLondon,
    baseRentLondon,
    elasticityLondon,
    totalPop
  );
  const rentN = calculateRent(
    popNewcastle,
    baseRentNewcastle,
    elasticityNewcastle,
    totalPop
  );

  const consumptionL = wageLondon - rentL;
  const consumptionN = wageNewcastle - rentN;

  const utilityL = calculateUtility(consumptionL, amenityLondon);
  const utilityN = calculateUtility(consumptionN, amenityNewcastle);

  return {
    popLondon,
    popNewcastle,
    rentLondon: rentL,
    rentNewcastle: rentN,
    consumptionLondon: consumptionL,
    consumptionNewcastle: consumptionN,
    utilityLondon: utilityL,
    utilityNewcastle: utilityN,
  };
}

export default function SpatialEquilibriumViz() {
  const [wagePremium, setWagePremium] = useState(35);
  const [elasticityLondon, setElasticityLondon] = useState(0.5);
  const [elasticityNewcastle, setElasticityNewcastle] = useState(0.8);
  const [amenityLondon, setAmenityLondon] = useState(1.0);

  const equilibrium = useMemo(() => {
    const wageLondon = INITIAL_WAGE_NEWCASTLE + wagePremium * 1000;
    return findEquilibrium(
      wageLondon,
      INITIAL_WAGE_NEWCASTLE,
      INITIAL_BASE_RENT_LONDON,
      INITIAL_BASE_RENT_NEWCASTLE,
      elasticityLondon,
      elasticityNewcastle,
      amenityLondon
    );
  }, [wagePremium, elasticityLondon, elasticityNewcastle, amenityLondon]);

  const wageLondon = INITIAL_WAGE_NEWCASTLE + wagePremium * 1000;
  const utilDiff = Math.abs(
    equilibrium.utilityLondon - equilibrium.utilityNewcastle
  );
  const isInEquilibrium = utilDiff < 0.01;

  return (
    <div className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-center">
        Spatial Equilibrium Between Two Cities
      </h3>

      {/* Sliders */}
      <div className="mb-8 space-y-4 bg-white p-4 rounded border border-gray-300">
        <div>
          <label className="block text-sm font-semibold mb-2">
            London Wage Premium: £{wagePremium}k
          </label>
          <input
            type="range"
            min="20"
            max="60"
            step="1"
            value={wagePremium}
            onChange={(e) => setWagePremium(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            London Housing Elasticity: {elasticityLondon.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={elasticityLondon}
            onChange={(e) => setElasticityLondon(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Newcastle Housing Elasticity: {elasticityNewcastle.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={elasticityNewcastle}
            onChange={(e) => setElasticityNewcastle(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            London Amenity Multiplier: {amenityLondon.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.05"
            value={amenityLondon}
            onChange={(e) => setAmenityLondon(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Population Distribution */}
        <div className="bg-white p-4 rounded border border-gray-300">
          <h4 className="text-lg font-bold mb-4 text-center">
            Population Distribution
          </h4>
          <div className="flex items-end justify-around h-64 px-4">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-red-500 opacity-70 border-2 border-black rounded-t"
                style={{
                  height: `${(equilibrium.popLondon / TOTAL_POPULATION) * 100}%`,
                }}
              />
              <div className="mt-2 text-center">
                <div className="font-bold text-lg">
                  {(equilibrium.popLondon / 1000).toFixed(0)}k
                </div>
                <div className="text-sm">London</div>
              </div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-blue-500 opacity-70 border-2 border-black rounded-t"
                style={{
                  height: `${(equilibrium.popNewcastle / TOTAL_POPULATION) * 100}%`,
                }}
              />
              <div className="mt-2 text-center">
                <div className="font-bold text-lg">
                  {(equilibrium.popNewcastle / 1000).toFixed(0)}k
                </div>
                <div className="text-sm">Newcastle</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wages vs Rent */}
        <div className="bg-white p-4 rounded border border-gray-300">
          <h4 className="text-lg font-bold mb-4 text-center">
            Wages vs Housing Costs
          </h4>
          <div className="flex items-end justify-around h-64 px-4">
            <div className="flex gap-2 flex-1 items-end justify-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-16 bg-green-500 opacity-70 border-2 border-black rounded-t"
                  style={{ height: `${(wageLondon / 80000) * 200}px` }}
                />
                <div className="mt-2 text-xs font-bold">
                  £{(wageLondon / 1000).toFixed(0)}k
                </div>
                <div className="text-xs">Wage</div>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="w-16 bg-red-500 opacity-70 border-2 border-black rounded-t"
                  style={{
                    height: `${(equilibrium.rentLondon / 80000) * 200}px`,
                  }}
                />
                <div className="mt-2 text-xs font-bold">
                  £{(equilibrium.rentLondon / 1000).toFixed(0)}k
                </div>
                <div className="text-xs">Rent</div>
              </div>
            </div>
            <div className="flex gap-2 flex-1 items-end justify-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-16 bg-green-500 opacity-70 border-2 border-black rounded-t"
                  style={{
                    height: `${(INITIAL_WAGE_NEWCASTLE / 80000) * 200}px`,
                  }}
                />
                <div className="mt-2 text-xs font-bold">
                  £{(INITIAL_WAGE_NEWCASTLE / 1000).toFixed(0)}k
                </div>
                <div className="text-xs">Wage</div>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="w-16 bg-red-500 opacity-70 border-2 border-black rounded-t"
                  style={{
                    height: `${(equilibrium.rentNewcastle / 80000) * 200}px`,
                  }}
                />
                <div className="mt-2 text-xs font-bold">
                  £{(equilibrium.rentNewcastle / 1000).toFixed(0)}k
                </div>
                <div className="text-xs">Rent</div>
              </div>
            </div>
          </div>
          <div className="flex justify-around mt-4">
            <div className="text-sm font-semibold">London</div>
            <div className="text-sm font-semibold">Newcastle</div>
          </div>
        </div>

        {/* Consumption */}
        <div className="bg-white p-4 rounded border border-gray-300">
          <h4 className="text-lg font-bold mb-4 text-center">
            Consumption (Wage - Rent)
          </h4>
          <div className="flex items-end justify-around h-64 px-4">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-red-500 opacity-70 border-2 border-black rounded-t"
                style={{
                  height: `${(equilibrium.consumptionLondon / 60000) * 100}%`,
                }}
              />
              <div className="mt-2 text-center">
                <div className="font-bold text-lg">
                  £{(equilibrium.consumptionLondon / 1000).toFixed(0)}k
                </div>
                <div className="text-sm">London</div>
              </div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-blue-500 opacity-70 border-2 border-black rounded-t"
                style={{
                  height: `${(equilibrium.consumptionNewcastle / 60000) * 100}%`,
                }}
              />
              <div className="mt-2 text-center">
                <div className="font-bold text-lg">
                  £{(equilibrium.consumptionNewcastle / 1000).toFixed(0)}k
                </div>
                <div className="text-sm">Newcastle</div>
              </div>
            </div>
          </div>
        </div>

        {/* Utilities */}
        <div className="bg-white p-4 rounded border border-gray-300">
          <h4 className="text-lg font-bold mb-4 text-center">
            Utility (Should Be Equal)
          </h4>
          <div className="flex items-end justify-around h-64 px-4 relative">
            <div
              className="absolute left-0 right-0 border-t-2 border-green-500 border-dashed"
              style={{
                bottom: `${((equilibrium.utilityLondon + equilibrium.utilityNewcastle) / 2 / 12) * 100}%`,
              }}
            >
              <span className="text-xs text-green-700 font-semibold">
                Equilibrium
              </span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-red-500 opacity-70 border-2 border-black rounded-t"
                style={{
                  height: `${(equilibrium.utilityLondon / 12) * 100}%`,
                }}
              />
              <div className="mt-2 text-center">
                <div className="font-bold text-lg">
                  {equilibrium.utilityLondon.toFixed(2)}
                </div>
                <div className="text-sm">London</div>
              </div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-blue-500 opacity-70 border-2 border-black rounded-t"
                style={{
                  height: `${(equilibrium.utilityNewcastle / 12) * 100}%`,
                }}
              />
              <div className="mt-2 text-center">
                <div className="font-bold text-lg">
                  {equilibrium.utilityNewcastle.toFixed(2)}
                </div>
                <div className="text-sm">Newcastle</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div
        className={`p-4 rounded text-center font-bold mb-4 ${
          isInEquilibrium
            ? "bg-green-100 text-green-800"
            : "bg-orange-100 text-orange-800"
        }`}
      >
        {isInEquilibrium
          ? "✓ In Equilibrium"
          : `⚠ Not in equilibrium (diff: ${utilDiff.toFixed(3)})`}
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200 text-sm italic">
        <p className="mb-2">
          <strong>With these parameters:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            {(equilibrium.popLondon / 1000).toFixed(0)}k workers choose London,{" "}
            {(equilibrium.popNewcastle / 1000).toFixed(0)}k choose Newcastle
          </li>
          <li>
            London&apos;s high wages (£{(wageLondon / 1000).toFixed(0)}k) are
            offset by high rents (£
            {(equilibrium.rentLondon / 1000).toFixed(0)}k)
          </li>
          <li>
            After paying rent, both cities offer similar consumption (London: £
            {(equilibrium.consumptionLondon / 1000).toFixed(0)}k, Newcastle: £
            {(equilibrium.consumptionNewcastle / 1000).toFixed(0)}k)
          </li>
          <li>
            Utilities are{" "}
            {isInEquilibrium
              ? "equal—no incentive to move"
              : "different—workers will migrate"}
          </li>
        </ul>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm mt-4">
        <p className="font-bold mb-2">INTERACTIVE CONTROLS:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Adjust the wage premium to see how population shifts</li>
          <li>
            Lower housing elasticity = more inelastic supply = bigger rent
            increases with population
          </li>
          <li>
            Higher London amenities = can support more people even with higher
            costs
          </li>
        </ul>
      </div>
    </div>
  );
}
