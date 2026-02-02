import { calculateStaticBaseline, simulateDeltaImpact } from './simulation';
import type { RoundAnalytics } from './types';
import { calculatePercentageChange } from './utils';

export interface CounterfactualResult {
  staticMultiplier: number;
  actualMultiplier: number;
  percentDifference: number;
  contributions: {
      combat: number;
      collect: number;
      explore: number;
  };
}

/**
 * Calculates the hypothetical target multiplier if no adaptation (deltas) had occurred.
 * This effectively simulates "Option A" (Static Context only) vs "Option B" (Dynamic Context).
 */
export function calculateCounterfactuals(round: RoundAnalytics): CounterfactualResult {
  // 1. Option B: The actual calculated multiplier (includes Delta)
  const actualMultiplier = round.targetMultiplier;

  // 2. Simulate the impact of the behavioral deltas
  const simulation = simulateDeltaImpact(round.deltas);

  // 3. Option A: Calculate Hypothetical Static Baseline
  const staticMultiplier = calculateStaticBaseline(actualMultiplier, simulation.estimatedImpact);

  return {
    staticMultiplier: staticMultiplier,
    actualMultiplier: actualMultiplier,
    percentDifference: calculatePercentageChange(staticMultiplier, actualMultiplier) * 100,
    contributions: simulation.contributions
  };
}
