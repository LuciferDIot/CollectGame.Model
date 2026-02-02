import { calculateComponentSum, calculatePercentage } from '../game/mechanics';
import type { ActivityScores, NormalizedFeatures } from './types';

/**
 * Calculate activity scores from normalized features
 * 
 * Formula (as per deployment manifest):
 * - pct_combat = (enemiesHit + damageDone + timeInCombat + kills) / 4
 * - pct_collect = (itemsCollected + pickupAttempts + timeNearInteractables) / 3
 * - pct_explore = (distanceTraveled + timeSprinting + timeOutOfCombat) / 3
 */
export function calculateActivityScores(normalized: NormalizedFeatures): ActivityScores {
  // 1. Calculate raw component scores (sum of normalized features)
  const score_combat = calculateComponentSum([
    normalized.enemiesHit as number,
    normalized.damageDone as number,
    normalized.timeInCombat as number,
    normalized.kills as number
  ]);

  const score_collect = calculateComponentSum([
    normalized.itemsCollected as number,
    normalized.pickupAttempts as number,
    normalized.timeNearInteractables as number
  ]);

  const score_explore = calculateComponentSum([
    normalized.distanceTraveled as number,
    normalized.timeSprinting as number,
    normalized.timeOutOfCombat as number
  ]);

  // 2. Calculate total score
  const score_total = score_combat + score_collect + score_explore;

  // 3. Normalize to percentages using safe helper
  return {
    pct_combat: calculatePercentage(score_combat, score_total),
    pct_collect: calculatePercentage(score_collect, score_total),
    pct_explore: calculatePercentage(score_explore, score_total),
  };
}
