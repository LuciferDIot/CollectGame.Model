import { calculateComponentSum, calculatePercentage } from '../game/mechanics';
import type { ActivityScores, NormalizedFeatures } from './types';

/**
 * Computes per-archetype activity percentages from normalized telemetry.
 *
 * Each archetype score is the average of its constituent features (not a sum),
 * so every archetype has an equal ceiling of 1.0 regardless of how many features
 * it uses. Using sums would give Combat (5 features) a structural ceiling
 * advantage over Exploration (2 features), biasing soft membership toward Combat
 * for any player with moderate activity across all categories.
 *
 * timeOutOfCombat is excluded from the Exploration score. It accumulates passively
 * whenever a player is not in combat -- including combat-intent players waiting for
 * enemies to spawn on a sparse map. It is also the arithmetic complement of
 * timeInCombat (they sum to session duration), making the two features redundant
 * and inversely correlated. Exploration uses only active movement signals.
 */
export function calculateActivityScores(normalized: NormalizedFeatures): ActivityScores {
  // Combat: 5 features (includes damage_per_hit derived in step2)
  const score_combat = calculateComponentSum([
    normalized.enemiesHit as number,
    normalized.damageDone as number,
    normalized.timeInCombat as number,
    normalized.kills as number,
    (normalized.damage_per_hit as number) ?? 0,
  ]) / 5;

  // Collection: 4 features (includes pickup_attempt_rate derived in step2)
  const score_collect = calculateComponentSum([
    normalized.itemsCollected as number,
    normalized.pickupAttempts as number,
    normalized.timeNearInteractables as number,
    (normalized.pickup_attempt_rate as number) ?? 0,
  ]) / 4;

  // Exploration: 2 active movement features only
  const score_explore = calculateComponentSum([
    (normalized.distanceTraveled as number) ?? 0,
    (normalized.timeSprinting as number) ?? 0,
  ]) / 2;

  const score_total = score_combat + score_collect + score_explore;

  // calculatePercentage handles division by zero (returns 1/3 each when total = 0)
  return {
    pct_combat: calculatePercentage(score_combat, score_total),
    pct_collect: calculatePercentage(score_collect, score_total),
    pct_explore: calculatePercentage(score_explore, score_total),
  };
}
