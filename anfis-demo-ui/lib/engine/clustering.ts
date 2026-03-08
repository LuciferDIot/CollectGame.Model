import { isApproximatelyEqual } from '../math/formulas';
import { calculateEuclideanDistance } from '../math/statistics';
import type { ActivityScores, ClusterCentroid, SoftMembership } from './types';

/**
 * Soft membership via Inverse Distance Weighting over K-Means centroids (K=3).
 *
 * IDW was chosen over hard K-Means assignment because boundary players (those
 * equidistant from two centroids) caused oscillation between archetypes on
 * consecutive windows. IDW produces a smooth, continuous membership that
 * satisfies the partition-of-unity constraint (memberships sum to 1.0) by
 * construction, matching the soft membership assumption in the target formula.
 */
export class KMeansSoftMembership {
  private centroids: ClusterCentroid[];
  private combatIdx: number;
  private collectIdx: number;
  private exploreIdx: number;

  constructor(centroids: Record<string, ClusterCentroid>) {
    this.centroids = Object.values(centroids);
    this.combatIdx = this.centroids.findIndex(c => c.archetype === 'Combat');
    this.collectIdx = this.centroids.findIndex(c => c.archetype === 'Collection');
    this.exploreIdx = this.centroids.findIndex(c => c.archetype === 'Exploration');

    if ([this.combatIdx, this.collectIdx, this.exploreIdx].includes(-1)) {
      throw new Error('Missing archetype centroids');
    }
  }

  /**
   * Computes soft membership for a player given their activity scores.
   *
   * Algorithm:
   *   1. Compute Euclidean distance from player point to each centroid
   *   2. Invert distances (closer = higher weight): w_i = 1 / (d_i + ε)
   *   3. Normalise weights to sum to 1.0
   *
   * ε = 1e-10 prevents division by zero if a player sits exactly on a centroid,
   * in which case that archetype receives membership ≈ 1.0.
   */
  calculateMembership(activityScores: ActivityScores): SoftMembership {
    const point = [
      activityScores.pct_combat,
      activityScores.pct_collect,
      activityScores.pct_explore,
    ];

    const distances = this.centroids.map((centroid) => {
      const centroidPoint = [
        centroid.centroid.pct_combat,
        centroid.centroid.pct_collect,
        centroid.centroid.pct_explore,
      ];
      return calculateEuclideanDistance(point, centroidPoint);
    });

    const epsilon = 1e-10;
    const invDistances = distances.map((d) => 1 / (d + epsilon));
    const sumInvDist = invDistances.reduce((sum, val) => sum + val, 0);
    const softMembership = invDistances.map((val) => val / sumInvDist);

    return {
      soft_combat: softMembership[this.combatIdx],
      soft_collect: softMembership[this.collectIdx],
      soft_explore: softMembership[this.exploreIdx],
    };
  }

  validateMembership(membership: SoftMembership): boolean {
    const sum = membership.soft_combat + membership.soft_collect + membership.soft_explore;
    return isApproximatelyEqual(sum, 1.0, 1e-6);
  }
}
