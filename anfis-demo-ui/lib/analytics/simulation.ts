import { DeltaMetrics } from './types';

/**
 * Counterfactual Simulation Logic
 * Handles "What If?" scenarios for analytics.
 */

interface SimulationResult {
    estimatedImpact: number;
    contributions: {
        combat: number;
        collect: number;
        explore: number;
    };
}

/**
 * Simulates the impact of behavioral deltas on the final multiplier.
 * Uses a weighted linear model as a heuristic for the Non-Linear ANFIS.
 * 
 * Heuristic: Impact = (Combat * 0.3) + (Collect * 0.2) + (Explore * 0.1)
 */
export function simulateDeltaImpact(deltas: DeltaMetrics): SimulationResult {
    const weights = { combat: 0.3, collect: 0.2, explore: 0.1 };
    
    const impact = {
        combat: deltas.combat * weights.combat,
        collect: deltas.collect * weights.collect,
        explore: deltas.explore * weights.explore
    };

    return {
        estimatedImpact: impact.combat + impact.collect + impact.explore,
        contributions: impact
    };
}

/**
 * Calculates the hypothetical "Static" multiplier by removing the estimated impact.
 * Static = Actual - Impact
 */
export function calculateStaticBaseline(actualMultiplier: number, impact: number): number {
    return actualMultiplier - impact;
}
