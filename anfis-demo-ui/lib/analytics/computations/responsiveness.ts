import { ResponsivenessLevel, RoundAnalytics } from '../types';

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
