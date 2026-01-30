// Runtime Analytics Computation Engine
// Pure functions for ANFIS v2.2 inference diagnostics

import type {
  AnalyticsConfig,
  RoundAnalytics,
  SessionAnalytics
} from './types';
import { DEFAULT_ANALYTICS_CONFIG } from './types';

// Import computations
import {
  computeArchetypeDistribution
} from './computations/behavior';
import {
  computeClampStatistics
} from './computations/clamp';
import {
  computeAvgDeltaMagnitude,
  computeResponsiveness
} from './computations/responsiveness';
import {
  computeRollingCorrelation,
  computeRollingStats
} from './computations/statistics';

// Re-export constants
export * from './constants';

// Re-export computations for backward compatibility
export * from './computations/behavior';
export * from './computations/clamp';
export * from './computations/responsiveness';
export * from './computations/statistics';

/**
 * Build complete session analytics from round data
 */
export function buildSessionAnalytics(
  rounds: RoundAnalytics[],
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): SessionAnalytics {
  const multipliers = rounds.map(r => r.targetMultiplier);
  
  const rollingStats = computeRollingStats(multipliers, config.rollingWindow);
  const clampStats = computeClampStatistics(rounds);
  const avgMagnitude = computeAvgDeltaMagnitude(rounds);
  const responsiveness = computeResponsiveness(rounds, config.deltaNoiseThreshold);
  const archetypeDistribution = computeArchetypeDistribution(rounds);
  
  // Compute rolling correlation for responsiveness accuracy
  // Correlate |Delta Behavior| with |Delta Multiplier|
  // Needs arrays of magnitudes
  const deltaBehaviorMagnitudes = rounds.map(r => 
    Math.abs(r.deltas.combat) + Math.abs(r.deltas.collect) + Math.abs(r.deltas.explore)
  );
  const deltaMultiplierMagnitudes = rounds.map(r => 
    r.deltaFromPrevious !== null ? Math.abs(r.deltaFromPrevious) : 0
  );
  
  const responsivenessCorrelation = computeRollingCorrelation(
    deltaBehaviorMagnitudes, 
    deltaMultiplierMagnitudes, 
    Math.min(rounds.length, config.rollingWindow)
  );

  // Overall statistics
  const avgMultiplier =
    multipliers.length > 0
      ? multipliers.reduce((sum, val) => sum + val, 0) / multipliers.length
      : 0;
  
  const stdMultiplier =
    multipliers.length > 1
      ? Math.sqrt(
          multipliers.reduce((sum, val) => sum + Math.pow(val - avgMultiplier, 2), 0) /
            (multipliers.length - 1)
        )
      : 0;
  
  return {
    rounds,
    history: rounds, // Populate the alias
    currentRound: rounds.length,
    rollingMean: rollingStats?.mean ?? null,
    rollingStd: rollingStats?.std ?? null,
    avgMultiplier,
    stdMultiplier,
    clampPercentage: clampStats,
    dominantArchetypeDistribution: archetypeDistribution,
    avgDeltaMagnitude: avgMagnitude,
    responsivenessScore: responsiveness, // Keep legacy heuristic for fallback/simplified view
    responsivenessCorrelation: responsivenessCorrelation ?? 0, // New rigorous metric
  };
}
