/**
 * Detect if value is clamped at lower or upper bound
 */
import { ClampStatistics, ClampStatus, RoundAnalytics } from '../types';

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
