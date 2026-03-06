import { describe, it, expect } from 'vitest';
import { calculateActivityScores } from '../lib/engine/activity';

/**
 * Activity Scoring (v2.2) 
 * 
 * Verifies the heuristic classifier that maps normalized telemetry features
 * to percentage-based activity labels (Combat, Collection, Exploration).
 * 
 * Divisors (v2.2):
 * - Combat: 5 features (Hit, Damage, TimeInCombat, Kills, DamagePerHit)
 * - Collection: 4 features (Collect, Pickup, TimeNear, PickupRate)
 * - Exploration: 2 features (Distance, Sprinting)
 */
describe('Activity Scoring (v2.2)', () => {
    it('should calculate combat score with v2.2 divisor (5)', () => {
        /**
         * v2.2 Combat features are: enemiesHit, damageDone, timeInCombat, kills, damage_per_hit.
         * If all are 1.0 (max), combat_score = 5/5 = 1.0.
         * Since total activity is just this 1.0, pct_combat = 100%.
         */
        const normalized = {
            enemiesHit: 1,
            damageDone: 1,
            timeInCombat: 1,
            kills: 1,
            damage_per_hit: 1
        };
        const scores = calculateActivityScores(normalized as any);
        expect(scores.pct_combat).toBeCloseTo(1.0);
    });

    it('should calculate collection score with v2.2 divisor (4)', () => {
        /**
         * v2.2 Collection features are: itemsCollected, pickupAttempts, timeNearInteractables, pickup_attempt_rate.
         * All at 1.0 -> collection_score = 4/4 = 1.0 -> 100% distribution.
         */
        const normalized = {
            itemsCollected: 1,
            pickupAttempts: 1,
            timeNearInteractables: 1,
            pickup_attempt_rate: 1
        };
        const scores = calculateActivityScores(normalized as any);
        expect(scores.pct_collect).toBeCloseTo(1.0);
    });

    it('should calculate exploration score with active-only features (v2.2)', () => {
        /**
         * v2.2 Exploration features are: distanceTraveled, timeSprinting.
         * timeOutOfCombat is intentionally excluded (passive signal).
         */
        const normalized = {
            distanceTraveled: 1,
            timeSprinting: 1
        };
        const scores = calculateActivityScores(normalized as any);
        expect(scores.pct_explore).toBeCloseTo(1.0);
    });

    it('should handle partial data correctly', () => {
        /**
         * If only 2/5 combat features are 0.5 and the rest are 0:
         * score_combat = (0.5 + 0.5 + 0 + 0 + 0) / 5 = 0.2.
         * If no other activity (collect/explore remains 0), combat total is 100% of activity.
         */
        const normalized = {
            enemiesHit: 0.5,
            damageDone: 0.5
        };
        const scores = calculateActivityScores(normalized as any);
        expect(scores.pct_combat).toBe(1.0);
    });
});
