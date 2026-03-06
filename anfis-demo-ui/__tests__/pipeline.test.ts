import { describe, it, expect, beforeEach } from 'vitest';
import { ANFISPipeline } from '../lib/engine/index';
import scalerParams from '../models/scaler_params.json';
import clusterCentroids from '../models/cluster_centroids.json';
import mlpWeights from '../models/anfis_mlp_weights.json';
import deploymentManifest from '../models/deployment_manifest.json';

describe('ANFISPipeline Integration (v2.2)', () => {
    let pipeline: ANFISPipeline;

    beforeEach(() => {
        pipeline = new ANFISPipeline(
            scalerParams as any,
            clusterCentroids as any,
            mlpWeights as any,
            deploymentManifest as any
        );
    });

    it('should execute full 8-step pipeline correctly', () => {
        /**
         * MOCK TELEMETRY: 
         * Combines combat (hits, damage), collection (items, attempts), 
         * and exploration (distance, sprinting) to exercise all branches.
         */
        const telemetry = {
            userId: 'test-user',
            timestamp: new Date().toISOString(),
            duration: 30,
            features: {
                enemiesHit: 10,
                damageDone: 2000,
                timeInCombat: 25,
                kills: 5,
                itemsCollected: 2,
                pickupAttempts: 3,
                timeNearInteractables: 5,
                distanceTraveled: 100,
                timeSprinting: 10,
                timeOutOfCombat: 5,
                deathCount: 0
            }
        };

        const result = pipeline.process(telemetry);

        /**
         * VERIFICATION 1: Feature Expansion
         * v2.2 expanded 10 telemetry fields into 12 normalized features 
         * adding damage_per_hit and pickup_attempt_rate.
         */
        const normalizedKeys = Object.keys(result.normalized_features);
        expect(normalizedKeys.length).toBe(12);
        expect(normalizedKeys).toContain('damage_per_hit');
        expect(normalizedKeys).toContain('pickup_attempt_rate');

        /**
         * VERIFICATION 2: Classifier Validity 
         * Activity scores must exist for all 3 archetypes.
         */
        expect(result.activity_scores.pct_combat).toBeDefined();
        expect(result.activity_scores.pct_collect).toBeDefined();
        expect(result.activity_scores.pct_explore).toBeDefined();

        /**
         * VERIFICATION 3: Clustering (Soft Membership)
         * Membership values MUST sum to ~1.0 for the inference engine to 
         * perform valid weighted logic.
         */
        const sumMembership = result.soft_membership.soft_combat +
            result.soft_membership.soft_collect +
            result.soft_membership.soft_explore;
        expect(sumMembership).toBeCloseTo(1.0, 1);

        /**
         * VERIFICATION 4: MLP Inference
         * target_multiplier must be within the safety envelope [0.5, 1.5]
         */
        expect(result.mlp_output).toBeDefined();
        const target = result.target_multiplier;
        expect(typeof target).toBe('number');
        expect(target).toBeGreaterThanOrEqual(0.5);
        expect(target).toBeLessThanOrEqual(1.5);

        /**
         * VERIFICATION 5: Final Adaptation
         * Parameters (like enemy health) should be adapted to the new difficulty level.
         */
        expect(Object.keys(result.adapted_parameters).length).toBeGreaterThan(0);
        const healthParam = result.adapted_parameters.enemy_max_health;
        expect(healthParam).toBeDefined();
        expect(healthParam.final).toBeGreaterThan(0);
    });

    it('should handle session resets correctly', () => {
        /**
         * TEST CASE: Reset Branching
         * If Reset field exists, pipelines deltas should be zeroed out
         * to prevent difficulty jumps from inconsistent previous frames.
         */
        const telemetry = {
            userId: 'test-user',
            features: { enemiesHit: 50 },
            reset: true
        };

        const result = pipeline.process(telemetry as any);
        expect(result.deltas.delta_combat).toBe(0);
    });
});
