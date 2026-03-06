import { describe, it, expect } from 'vitest';
import { applyAdaptationContract } from '../lib/engine/adaptation';

describe('Adaptation Sensitivity (v2.2)', () => {
    const mockSoftMembership = {
        soft_combat: 0.8,
        soft_collect: 0.1,
        soft_explore: 0.1
    };

    it('should apply per-parameter sensitivity', () => {
        const result = applyAdaptationContract(1.2, mockSoftMembership as any);

        /**
         * TEST CASE: Positive AI Adjustment (Multiplier 1.2 = +20% harder) 
         * 
         * Formula: Final = Base * (AI_Multiplier * CanonicalModifier)
         * CanonicalModifier = (1 - Sens/2) + (Sens * Influence)
         * 
         * This formula ensures that difficulty adjustments are balanced by the player's 
         * playstyle. If a player is a Combat expert (80%), combat-related difficulty 
         * parameters (Health, Spawn Rate) should scale more aggressively.
         * 
         * 1. Health Adjustment (Enemy Health Sens = 0.20, Player Combat Influence = 0.8)
         *    CanMod = (1.0 - 0.1) + (0.2 * 0.8) = 0.9 + 0.16 = 1.06
         *    Expect: 100 * (1.2 * 1.06) = 127.2
         */
        const healthParam = result.enemy_max_health;
        expect(healthParam?.final).toBeCloseTo(127.2, 1);

        /**
         * 2. Spawn Rate Adjustment (Enemy Spawn Sens = 0.35, Player Combat Influence = 0.8)
         *    CanMod = (1.0 - 0.175) + (0.35 * 0.8) = 0.825 + 0.28 = 1.105
         *    Expect: 35 * (1.2 * 1.105) = 46.41
         */
        const spawnRateParam = result.global_enemy_cap;
        expect(spawnRateParam?.final).toBeCloseTo(46.41, 1);
    });

    it('should apply archetype influence to relevant parameters', () => {
        /**
         * TEST CASE: Playstyle Bias (Multiplier 1.0 = Neutral AI)
         * 
         * Even if the AI doesn't see a difficulty change (targetMultiplier = 1.0), 
         * the player's 80% combat focus should still push combat-rated parameters 
         * UP slightly based on the Canonical Modifier logic.
         * 
         * Enemy Damage Intensity Base is 10.0.
         */
        const result = applyAdaptationContract(1.0, mockSoftMembership as any);

        const damageParam = result.enemy_damage_intensity;
        expect(damageParam?.final).toBeGreaterThan(10.0);
    });
});
