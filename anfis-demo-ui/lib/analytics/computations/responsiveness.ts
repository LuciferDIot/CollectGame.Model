import {
    calculateAbsoluteSum,
    calculateMean
} from '@/lib/math/statistics';
import { ResponsivenessLevel, RoundAnalytics } from '../types';

/**
 * Compute average delta magnitude
 */
export function computeAvgDeltaMagnitude(rounds: RoundAnalytics[]): number {
  if (rounds.length === 0) return 0;
  
  const magnitudes = rounds.map(r => 
    calculateAbsoluteSum([r.deltas.combat, r.deltas.collect, r.deltas.explore])
  );
  
  return calculateMean(magnitudes);
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
  // Total magnitude sum divided by total number of components
  const allDeltaComponents = recent.flatMap(r => [
      r.deltas.combat, 
      r.deltas.collect, 
      r.deltas.explore
  ]);

  const avgBehaviorDelta = calculateMean(allDeltaComponents.map(Math.abs));
  
  // Calculate average absolute change in multiplier
  const validMultiplierDeltas = recent
      .filter(r => r.deltaFromPrevious !== null)
      .map(r => Math.abs(r.deltaFromPrevious!));

  const avgMultiplierDelta = calculateMean(validMultiplierDeltas);
  
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
