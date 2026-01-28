// Activity Score calculation module

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
  const score_combat =
    normalized.enemiesHit +
    normalized.damageDone +
    normalized.timeInCombat +
    normalized.kills;

  const score_collect =
    normalized.itemsCollected +
    normalized.pickupAttempts +
    normalized.timeNearInteractables;

  const score_explore =
    normalized.distanceTraveled +
    normalized.timeSprinting +
    normalized.timeOutOfCombat;

  // 2. Calculate total score
  const score_total = score_combat + score_collect + score_explore;

  // 3. Normalize to percentages (Handle division by zero)
  // Default to equal distribution if no activity
  if (score_total === 0) {
    return {
      pct_combat: 0.3333,
      pct_collect: 0.3333,
      pct_explore: 0.3333,
    };
  }

  return {
    pct_combat: score_combat / score_total,
    pct_collect: score_collect / score_total,
    pct_explore: score_explore / score_total,
  };
}
