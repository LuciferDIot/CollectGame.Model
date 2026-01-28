// K-Means clustering and soft membership calculation

import type { ActivityScores, ClusterCentroid, SoftMembership } from './types';

export class KMeansSoftMembership {
  private centroids: ClusterCentroid[];
  private combatIdx: number;
  private collectIdx: number;
  private exploreIdx: number;

  constructor(centroids: Record<string, ClusterCentroid>) {
    // Convert to array and find indices
    this.centroids = Object.values(centroids);
    
    this.combatIdx = this.centroids.findIndex(c => c.archetype === 'Combat');
    this.collectIdx = this.centroids.findIndex(c => c.archetype === 'Collection');
    this.exploreIdx = this.centroids.findIndex(c => c.archetype === 'Exploration');

    if ([this.combatIdx, this.collectIdx, this.exploreIdx].includes(-1)) {
      throw new Error('Missing archetype centroids');
    }
  }

  /**
   * Calculate soft membership using inverse distance weighting (IDW)
   * 
   * Process:
   * 1. Calculate Euclidean distance to each centroid
   * 2. Compute inverse distances: 1 / (distance + epsilon)
   * 3. Normalize to sum to 1.0
   */
  calculateMembership(activityScores: ActivityScores): SoftMembership {
    const point = [
      activityScores.pct_combat,
      activityScores.pct_collect,
      activityScores.pct_explore,
    ];

    // Calculate distances to each centroid
    const distances = this.centroids.map((centroid) => {
      const centroidPoint = [
        centroid.centroid.pct_combat,
        centroid.centroid.pct_collect,
        centroid.centroid.pct_explore,
      ];

      // Euclidean distance
      return Math.sqrt(
        point.reduce((sum, val, idx) => {
          const diff = val - centroidPoint[idx];
          return sum + diff * diff;
        }, 0)
      );
    });

    // Inverse distance with epsilon to avoid division by zero
    const epsilon = 1e-10;
    const invDistances = distances.map((d) => 1 / (d + epsilon));

    // Normalize to sum to 1.0
    const sumInvDist = invDistances.reduce((sum, val) => sum + val, 0);
    const softMembership = invDistances.map((val) => val / sumInvDist);

    return {
      soft_combat: softMembership[this.combatIdx],
      soft_collect: softMembership[this.collectIdx],
      soft_explore: softMembership[this.exploreIdx],
    };
  }

  /**
   * Validate that soft membership sums to 1.0 (within floating point tolerance)
   */
  validateMembership(membership: SoftMembership): boolean {
    const sum = membership.soft_combat + membership.soft_collect + membership.soft_explore;
    const tolerance = 1e-6;
    return Math.abs(sum - 1.0) < tolerance;
  }
}
