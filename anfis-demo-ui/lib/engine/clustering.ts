/**
 * ============================================================================
 * FUZZY CLUSTERING - The "Degrees of Truth" Calculator
 * ============================================================================
 * 
 * === WHAT IS THIS FILE? ===
 * This file implements "Fuzzy Clustering" - a way to classify players into
 * multiple categories AT THE SAME TIME with different intensities.
 * 
 * === WHY "FUZZY"? ===
 * 
 * Traditional ("Crisp") Classification:
 * ```
 * Player is EITHER:
 * - Combat-focused (100%) OR
 * - Collection-focused (100%) OR
 * - Exploration-focused (100%)
 * 
 * Binary choice - you're IN one category or OUT
 * ```
 * 
 * Fuzzy Classification:
 * ```
 * Player is ALL THREE, in different amounts:
 * - Combat-focused (70%)
 * - Collection-focused (20%)
 * - Exploration-focused (10%)
 * 
 * Total: 100% (but distributed across all categories!)
 * ```
 * 
 * === THE ALGORITHM: K-MEANS + INVERSE DISTANCE WEIGHTING ===
 * 
 * Think of it like this:
 * 1. We have 3 "ideal players" (archetypes) positioned in space
 * 2. You're a dot somewhere in that space
 * 3. We measure how close you are to each ideal player
 * 4. Closer = higher membership percentage
 * 
 * === EXAMPLE ===
 * 
 * Imagine 3 reference points (centroids):
 * - Combat Center: Located at (0.8, 0.1, 0.1)
 * - Collection Center: Located at (0.1, 0.8, 0.1)
 * - Exploration Center: Located at (0.1, 0.1, 0.8)
 * 
 * Your position: (0.6, 0.3, 0.1)
 * 
 * Distances:
 * - To Combat Center: 0.23 units (close!)
 * - To Collection Center: 0.57 units (far)
 * - To Exploration Center: 0.71 units (very far)
 * 
 * Because you're closest to Combat, you get highest Combat membership!
 * 
 * ============================================================================
 */

import { isApproximatelyEqual } from '../math/formulas';
import { calculateEuclideanDistance } from '../math/statistics';
import type { ActivityScores, ClusterCentroid, SoftMembership } from './types';

/**
 * ============================================================================
 * CLASS: KMeansSoftMembership
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Calculates how much a player belongs to each of the three archetypes
 * (Combat, Collection, Exploration) using distance-based fuzzy logic.
 * 
 * === THE THREE ARCHETYPES (CENTROIDS) ===
 * 
 * These are "ideal players" we learned from analyzing thousands of sessions:
 * 
 * 1. **COMBAT ARCHETYPE**
 *    - Very high combat activity (~80%)
 *    - Low collection (~10%)
 *    - Low exploration (~10%)
 * 
 * 2. **COLLECTION ARCHETYPE**
 *    - Low combat (~10%)
 *    - Very high collection (~80%)
 *    - Low exploration (~10%)
 * 
 * 3. **EXPLORATION ARCHETYPE**
 *    - Low combat (~10%)
 *    - Low collection (~10%)
 *    - Very high exploration (~80%)
 * 
 * === HOW IT WORKS ===
 * 
 * 1. CONSTRUCTOR: Load the three archetype centroids
 * 2. calculateMembership(): Compare player to each archetype
 * 3. Return fuzzy membership percentages
 * 
 * ============================================================================
 */
export class KMeansSoftMembership {
  // === INTERNAL STATE ===
  private centroids: ClusterCentroid[];    // The three "ideal players"
  private combatIdx: number;               // Index of combat centroid in array
  private collectIdx: number;              // Index of collection centroid
  private exploreIdx: number;              // Index of exploration centroid

  /**
   * === CONSTRUCTOR ===
   * 
   * Sets up the clustering system with pre-calculated "ideal player" positions.
   * 
   * WHAT ARE CENTROIDS?
   * Think of centroids as "reference players" - perfect examples of each playstyle.
   * We learned these from analyzing thousands of real gameplay sessions.
   * 
   * Example Centroid:
   * ```json
   * {
   *   "archetype": "Combat",
   *   "centroid": {
   *     "pct_combat": 0.75,
   *     "pct_collect": 0.15,
   *     "pct_explore": 0.10
   *   }
   * }
   * ```
   * 
   * HOW THEY WERE LEARNED:
   * 1. Collected data from 10,000+ gameplay sessions
   * 2. Grouped similar players together (K-Means clustering algorithm)
   * 3. Found the "average" player in each group
   * 4. These averages became our centroids!
   * 
   * WHY THREE CENTROIDS?
   * - We identified three distinct playstyles from analysis
   * - More than three would over-complicate
   * - Fewer would lose important distinctions
   * 
   * @param centroids - Pre-calculated ideal player positions
   * @throws Error if any of the three archetypes are missing
   */
  constructor(centroids: Record<string, ClusterCentroid>) {
    // ========================================
    // STEP 1: CONVERT TO ARRAY
    // ========================================
    // Input is an object, we need an array for processing
    this.centroids = Object.values(centroids);
    
    // ========================================
    // STEP 2: FIND INDEX OF EACH ARCHETYPE
    // ========================================
    // We need to remember which position in the array corresponds to which archetype
    // This lets us return results in the correct format later
    
    this.combatIdx = this.centroids.findIndex(c => c.archetype === 'Combat');
    this.collectIdx = this.centroids.findIndex(c => c.archetype === 'Collection');
    this.exploreIdx = this.centroids.findIndex(c => c.archetype === 'Exploration');

    // ========================================
    // STEP 3: VALIDATE WE HAVE ALL THREE
    // ========================================
    // If any index is -1, that archetype wasn't found - this is a fatal error!
    if ([this.combatIdx, this.collectIdx, this.exploreIdx].includes(-1)) {
      throw new Error('Missing archetype centroids');
    }
  }

  /**
   * ============================================================================
   * MAIN METHOD: calculateMembership()
   * ============================================================================
   * 
   * === WHAT IT DOES ===
   * Takes a player's activity scores and calculates how similar they are to
   * each of the three ideal archetypes.
   * 
   * === THE ALGORITHM: INVERSE DISTANCE WEIGHTING (IDW) ===
   * 
   * Think of it like MAGNETS:
   * - Each archetype is a magnet
   * - Closer magnets have stronger "pull"
   * - We calculate the strength of each magnet's pull
   * - Convert pulls to percentages
   * 
   * === MATHEMATICAL PROCESS ===
   * 
   * 1. **CALCULATE DISTANCES**
   *    - Measure how far player is from each archetype
   *    - Uses Euclidean distance (straight-line distance in 3D space)
   * 
   * 2. **INVERT DISTANCES**
   *    - Closer = smaller distance → want BIGGER membership
   *    - So we use: membership ∝ 1/distance
   *    - Add tiny epsilon to avoid division by zero
   * 
   * 3. **NORMALIZE TO PERCENTAGES**
   *    - Sum all inverse distances
   *    - Divide each by the sum
   *    - Result: percentages that add to 100%!
   * 
   * === DETAILED EXAMPLE ===
   * 
   * Input Player Activity:
   * ```json
   * {
   *   "pct_combat": 0.60,    // 60% combat activity
   *   "pct_collect": 0.25,   // 25% collection activity
   *   "pct_explore": 0.15    // 15% exploration activity
   * }
   * ```
   * 
   * Centroid Positions:
   * ```json
   * Combat:     [0.75, 0.15, 0.10]
   * Collection: [0.15, 0.75, 0.10]
   * Exploration: [0.10, 0.15, 0.75]
   * ```
   * 
   * Step 1: Calculate Distances
   * ```
   * Player position: [0.60, 0.25, 0.15]
   * 
   * Distance to Combat:
   *   √[(0.60-0.75)² + (0.25-0.15)² + (0.15-0.10)²]
   *   = √[0.0225 + 0.01 + 0.0025]
   *   = √0.035
   *   = 0.187 units
   * 
   * Distance to Collection:
   *   √[(0.60-0.15)² + (0.25-0.75)² + (0.15-0.10)²]
   *   = √[0.2025 + 0.25 + 0.0025]
   *   = √0.455
   *   = 0.675 units
   * 
   * Distance to Exploration:
   *   √[(0.60-0.10)² + (0.25-0.15)² + (0.15-0.75)²]
   *   = √[0.25 + 0.01 + 0.36]
   *   = √0.62
   *   = 0.787 units
   * ```
   * 
   * Step 2: Calculate Inverse Distances
   * ```
   * epsilon = 0.0000000001 (prevent division by zero)
   * 
   * invDist_Combat     = 1 / (0.187 + epsilon) = 5.35
   * invDist_Collection = 1 / (0.675 + epsilon) = 1.48
   * invDist_Exploration = 1 / (0.787 + epsilon) = 1.27
   * 
   * Total = 5.35 + 1.48 + 1.27 = 8.10
   * ```
   * 
   * Step 3: Normalize to Percentages
   * ```
   * soft_combat     = 5.35 / 8.10 = 0.66 (66%)
   * soft_collect    = 1.48 / 8.10 = 0.18 (18%)
   * soft_explore    = 1.27 / 8.10 = 0.16 (16%)
   * 
   * Verification: 0.66 + 0.18 + 0.16 = 1.00 ✅
   * ```
   * 
   * Output:
   * ```json
   * {
   *   "soft_combat": 0.66,
   *   "soft_collect": 0.18,
   *   "soft_explore": 0.16
   * }
   * ```
   * 
   * Interpretation:
   * "This player is primarily Combat-focused (66%) with some Collection (18%)
   *  and Exploration (16%) tendencies."
   * 
   * @param activityScores - Player's activity percentages (must sum to 1.0)
   * @returns Fuzzy membership in each archetype (also sums to 1.0)
   * 
   * ============================================================================
   */
  calculateMembership(activityScores: ActivityScores): SoftMembership {
    // ========================================
    // STEP 1: CONVERT TO 3D POINT
    // ========================================
    // Represent player as coordinates in 3D space
    // X-axis: Combat activity
    // Y-axis: Collection activity
    // Z-axis: Exploration activity
    const point = [
      activityScores.pct_combat,
      activityScores.pct_collect,
      activityScores.pct_explore,
    ];

    // ========================================
    // STEP 2: CALCULATE DISTANCES TO EACH CENTROID
    // ========================================
    // For each archetype (Combat, Collection, Exploration):
    // 1. Get its 3D coordinates
    // 2. Calculate straight-line distance to player
    const distances = this.centroids.map((centroid) => {
      // Convert centroid to 3D point
      const centroidPoint = [
        centroid.centroid.pct_combat,
        centroid.centroid.pct_collect,
        centroid.centroid.pct_explore,
      ];

      // Calculate Euclidean distance (straight line in 3D space)
      // Formula: √[(x₁-x₂)² + (y₁-y₂)² + (z₁-z₂)²]
      return calculateEuclideanDistance(point, centroidPoint);
    });

    // ========================================
    // STEP 3: CALCULATE INVERSE DISTANCES
    // ========================================
    // We want: Closer = Higher membership
    // So we invert the distances: membership ∝ 1/distance
    
    /**
     * WHY ADD EPSILON?
     * 
     * If distance is exactly 0 (player perfectly matches an archetype):
     * - 1/0 = Infinity → Program crashes!
     * 
     * By adding tiny epsilon (0.0000000001):
     * - 1/(0 + epsilon) = very large number → Very high membership ✅
     * - Player gets ~100% for that archetype
     * - No crash!
     */
    const epsilon = 1e-10;  // 0.0000000001
    const invDistances = distances.map((d) => 1 / (d + epsilon));

    // ========================================
    // STEP 4: NORMALIZE TO SUM TO 1.0
    // ========================================
    // Currently, inverse distances are arbitrary numbers
    // We need them to be percentages that sum to 100%
    
    // Calculate total of all inverse distances
    const sumInvDist = invDistances.reduce((sum, val) => sum + val, 0);
    
    // Divide each by total to get percentages
    const softMembership = invDistances.map((val) => val / sumInvDist);

    // ========================================
    // STEP 5: RETURN IN NAMED FORMAT
    // ========================================
    // Convert from array [combat, collect, explore] to named object
    return {
      soft_combat: softMembership[this.combatIdx],
      soft_collect: softMembership[this.collectIdx],
      soft_explore: softMembership[this.exploreIdx],
    };
  }

  /**
   * ============================================================================
   * HELPER METHOD: validateMembership()
   * ============================================================================
   * 
   * === WHAT IT DOES ===
   * Checks if membership values are valid (sum to 1.0).
   * 
   * === WHY DO WE NEED THIS? ===
   * 
   * The three memberships MUST always sum to exactly 1.0 (100%):
   * - Combat + Collection + Exploration = 1.0
   * 
   * If they don't, something went wrong:
   * - Bug in calculation
   * - Corrupted data
   * - Numerical instability
   * 
   * === THE TOLERANCE PROBLEM ===
   * 
   * Computers can't store exact decimals:
   * ```
   * 0.66 + 0.18 + 0.16 might equal 0.9999999999 or 1.0000000001
   * ```
   * 
   * So we check if it's APPROXIMATELY 1.0:
   * - Allow small error (±0.000001)
   * - Catches real bugs while ignoring rounding
   * 
   * === EXAMPLE ===
   * 
   * Valid Membership:
   * ```typescript
   * validateMembership({
   *   soft_combat: 0.66,
   *   soft_collect: 0.18,
   *   soft_explore: 0.16
   * });
   * // Returns: true (0.66 + 0.18 + 0.16 = 1.0)
   * ```
   * 
   * Invalid Membership (Bug!):
   * ```typescript
   * validateMembership({
   *   soft_combat: 0.5,
   *   soft_collect: 0.3,
   *   soft_explore: 0.1
   * });
   * // Returns: false (0.5 + 0.3 + 0.1 = 0.9 ≠ 1.0)
   * ```
   * 
   * Floating-Point Rounding (OK!):
   * ```typescript
   * validateMembership({
   *   soft_combat: 0.333333,
   *   soft_collect: 0.333333,
   *   soft_explore: 0.333334
   * });
   * // Returns: true (sum = 1.000000 within tolerance)
   * ```
   * 
   * @param membership - The fuzzy membership values to validate
   * @returns true if valid (sums to ~1.0), false if invalid
   * 
   * ============================================================================
   */
  validateMembership(membership: SoftMembership): boolean {
    // ========================================
    // STEP 1: SUM ALL MEMBERSHIPS
    // ========================================
    const sum = membership.soft_combat + membership.soft_collect + membership.soft_explore;
    
    // ========================================
    // STEP 2: CHECK IF APPROXIMATELY 1.0
    // ========================================
    // Allow error of ±0.000001 (1e-6)
    // This is much smaller than any real problem would cause
    return isApproximatelyEqual(sum, 1.0, 1e-6);
  }
}

/**
 * ============================================================================
 * HELPER FUNCTIONS (IMPORTED)
 * ============================================================================
 * 
 * === calculateEuclideanDistance(point1, point2) ===
 * 
 * Calculates straight-line distance between two points in 3D space.
 * 
 * Formula:
 * ```
 * distance = √[(x₁-x₂)² + (y₁-y₂)² + (z₁-z₂)²]
 * ```
 * 
 * Example:
 * ```typescript
 * calculateEuclideanDistance([0.6, 0.25, 0.15], [0.75, 0.15, 0.10])
 * // Returns: 0.187
 * ```
 * 
 * Location: `lib/math/statistics.ts`
 * 
 * === isApproximatelyEqual(a, b, tolerance) ===
 * 
 * Checks if two numbers are approximately equal within tolerance.
 * 
 * Formula:
 * ```
 * |a - b| < tolerance
 * ```
 * 
 * Example:
 * ```typescript
 * isApproximatelyEqual(1.0000001, 1.0, 0.00001)
 * // Returns: true (difference is 0.0000001 < 0.00001)
 * ```
 * 
 * Location: `lib/math/formulas.ts`
 * 
 * ============================================================================
 */
