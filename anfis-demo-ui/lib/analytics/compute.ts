// Runtime Analytics Computation Engine
// Pure functions for ANFIS v2.2 inference diagnostics

import type {
    AnalyticsConfig,
    Archetype,
    ClampStatistics,
    ClampStatus,
    ResponsivenessLevel,
    RoundAnalytics,
    SessionAnalytics,
    SoftMembership
} from './types';
import { DEFAULT_ANALYTICS_CONFIG } from './types';

/**
 * Compute rolling statistics over a sliding window
 */
export function computeRollingStats(
  values: number[],
  window: number
): { mean: number; std: number } | null {
  if (values.length === 0) return null;
  
  const slice = values.slice(-window);
  if (slice.length === 0) return null;
  
  const mean = slice.reduce((sum, val) => sum + val, 0) / slice.length;
  
  if (slice.length === 1) {
    return { mean, std: 0 };
  }
  
  const variance =
    slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    (slice.length - 1);
  const std = Math.sqrt(variance);
  
  return { mean, std };
}

/**
 * Detect if value is clamped at lower or upper bound
 */
export function detectClampSaturation(
  value: number,
  lower: number,
  upper: number,
  tolerance: number = 0.0001
): ClampStatus {
  return {
    lower: Math.abs(value - lower) < tolerance,
    upper: Math.abs(value - upper) < tolerance,
  };
}

/**
 * Determine dominant archetype from soft membership
 */
export function getDominantArchetype(soft: SoftMembership): Archetype {
  if (soft.combat >= soft.collect && soft.combat >= soft.explore) {
    return 'combat';
  }
  if (soft.collect >= soft.explore) {
    return 'collect';
  }
  return 'explore';
}

/**
 * Validate soft membership sums to 1.0
 */
export function validateMembershipSum(
  soft: SoftMembership,
  tolerance: number = 0.01
): number {
  const sum = soft.combat + soft.collect + soft.explore;
  return sum;
}

/**
 * Check for archetype starvation (any archetype < threshold for N rounds)
 */
export function checkArchetypeStarvation(
  rounds: RoundAnalytics[],
  threshold: number,
  minRounds: number
): boolean {
  if (rounds.length < minRounds) return false;
  
  const recentRounds = rounds.slice(-minRounds);
  
  // Check if any archetype is consistently below threshold
  const combatStarved = recentRounds.every(r => r.softMembership.combat < threshold);
  const collectStarved = recentRounds.every(r => r.softMembership.collect < threshold);
  const exploreStarved = recentRounds.every(r => r.softMembership.explore < threshold);
  
  return combatStarved || collectStarved || exploreStarved;
}

/**
 * Check for behavior stagnation (same archetype dominant for too long)
 */
export function checkBehaviorStagnation(
  rounds: RoundAnalytics[],
  threshold: number
): boolean {
  if (rounds.length < 5) return false;
  
  const archetypes = rounds.map(r => r.dominantArchetype);
  const counts: Record<Archetype, number> = { combat: 0, collect: 0, explore: 0 };
  
  archetypes.forEach(arch => counts[arch]++);
  
  const maxPercentage = Math.max(...Object.values(counts)) / rounds.length;
  return maxPercentage > threshold;
}

/**
 * Compute clamp statistics over all rounds
 */
export function computeClampStatistics(rounds: RoundAnalytics[]): ClampStatistics {
  if (rounds.length === 0) {
    return { lower: 0, upper: 0, total: 0 };
  }
  
  const lowerCount = rounds.filter(r => r.isClamped.lower).length;
  const upperCount = rounds.filter(r => r.isClamped.upper).length;
  const totalCount = rounds.filter(r => r.isClamped.lower || r.isClamped.upper).length;
  
  return {
    lower: (lowerCount / rounds.length) * 100,
    upper: (upperCount / rounds.length) * 100,
    total: (totalCount / rounds.length) * 100,
  };
}

/**
 * Compute average delta magnitude
 */
export function computeAvgDeltaMagnitude(rounds: RoundAnalytics[]): number {
  if (rounds.length === 0) return 0;
  
  const totalMagnitude = rounds.reduce((sum, round) => {
    const magnitude =
      Math.abs(round.deltas.combat) +
      Math.abs(round.deltas.collect) +
      Math.abs(round.deltas.explore);
    return sum + magnitude;
  }, 0);
  
  return totalMagnitude / rounds.length;
}

/**
 * Compute responsiveness score (heuristic)
 */
export function computeResponsiveness(
  rounds: RoundAnalytics[],
  noiseThreshold: number
): ResponsivenessLevel {
  if (rounds.length < 3) return 'responsive'; // Not enough data
  
  const recent = rounds.slice(-3);
  
  // Calculate average absolute delta magnitude across all behavioral deltas
  const avgBehaviorDelta =
    recent.reduce((sum, r) => {
      return (
        sum +
        Math.abs(r.deltas.combat) +
        Math.abs(r.deltas.collect) +
        Math.abs(r.deltas.explore)
      );
    }, 0) /
    (recent.length * 3);
  
  // Calculate average absolute change in multiplier
  const avgMultiplierDelta =
    recent
      .filter(r => r.deltaFromPrevious !== null)
      .reduce((sum, r) => sum + Math.abs(r.deltaFromPrevious!), 0) /
    recent.filter(r => r.deltaFromPrevious !== null).length;
  
  const behaviorChanging = avgBehaviorDelta > noiseThreshold;
  const multiplierChanging = avgMultiplierDelta > noiseThreshold;
  
  if (behaviorChanging && multiplierChanging) {
    return 'responsive';
  }
  if (behaviorChanging && !multiplierChanging) {
    return 'under-responsive';
  }
  if (!behaviorChanging && multiplierChanging) {
    return 'noisy';
  }
  
  return 'responsive'; // Both stable - acceptable
}

/**
 * Compute archetype distribution percentages
 */
export function computeArchetypeDistribution(
  rounds: RoundAnalytics[]
): Record<Archetype, number> {
  if (rounds.length === 0) {
    return { combat: 0, collect: 0, explore: 0 };
  }
  
  const counts: Record<Archetype, number> = { combat: 0, collect: 0, explore: 0 };
  rounds.forEach(r => counts[r.dominantArchetype]++);
  
  return {
    combat: (counts.combat / rounds.length) * 100,
    collect: (counts.collect / rounds.length) * 100,
    explore: (counts.explore / rounds.length) * 100,
  };
}

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
    currentRound: rounds.length,
    rollingMean: rollingStats?.mean ?? null,
    rollingStd: rollingStats?.std ?? null,
    avgMultiplier,
    stdMultiplier,
    clampPercentage: clampStats,
    dominantArchetypeDistribution: archetypeDistribution,
    avgDeltaMagnitude: avgMagnitude,
    responsivenessScore: responsiveness,
  };
}
