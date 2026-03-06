import { describe, it, expect } from 'vitest';
import { KMeansSoftMembership } from '../lib/engine/clustering';
import clusterCentroids from '../models/cluster_centroids.json';

/**
 * KMeansSoftMembership Unit Tests
 * 
 * Verifies the playstyle classifier that maps 3D activity scores
 * to fuzzy archetype memberships (Combat, Collection, Exploration).
 */
describe('KMeansSoftMembership', () => {
    const clustering = new KMeansSoftMembership(clusterCentroids as any);

    it('should calculate membership that sums to 1.0', () => {
        /**
         * MANDATORY PROPERTY: The sum of all memberships must be ~1.0
         * regardless of how weird the input activity is.
         */
        const results = clustering.calculateMembership({
            pct_combat: 0.5,
            pct_collect: 0.3,
            pct_explore: 0.2
        });

        const sum = results.soft_combat + results.soft_collect + results.soft_explore;
        expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should give ~100% membership to the exact centroid archetype', () => {
        /**
         * TEST CASE: Direct Match
         * If a player's activity EXACTLY matches the Combat archetype centroid,
         * their soft_combat membership should be near 1.0.
         */
        const combatCentroid = (clusterCentroids as any)["2"].centroid;
        const results = clustering.calculateMembership(combatCentroid);

        expect(results.soft_combat).toBeGreaterThan(0.99);
        expect(results.soft_collect).toBeLessThan(0.01);
        expect(results.soft_explore).toBeLessThan(0.01);
    });

    it('should correctly validate membership sums', () => {
        /**
         * Verifies the utility function used for pipeline health checks.
         */
        const valid = { soft_combat: 0.7, soft_collect: 0.2, soft_explore: 0.1 };
        const invalid = { soft_combat: 0.5, soft_collect: 0.5, soft_explore: 0.5 };

        expect(clustering.validateMembership(valid)).toBe(true);
        expect(clustering.validateMembership(invalid)).toBe(false);
    });
});
