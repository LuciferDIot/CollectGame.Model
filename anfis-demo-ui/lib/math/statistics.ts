/**
 * ============================================================================
 * STATISTICAL MATH HELPERS - Pure Statistical Functions
 * ============================================================================
 * 
 * === WHAT IS THIS FILE? ===
 * Pure statistical mathematical operations used for data analysis and
 * distance calculations throughout the pipeline.
 * 
 * === WHY SEPARATE FILE? ===
 * - **Reusability**: Used by clustering, analytics, and diagnostics
 * - **Testability**: Easy to verify mathematical correctness
 * - **Clarity**: Keeps complex stats logic in one place
 * - **Standard Library**: Common stats functions you'd find in NumPy/SciPy
 * 
 * === WHAT'S INSIDE? ===
 * 1. calculateMean() - Average of numbers
 * 2. calculateStandardDeviation() - Spread of data
 * 3. calculateAbsoluteSum() - Sum of magnitudes
 * 4. calculateEuclideanDistance() - Straight-line distance in N-D space
 * 
 * ============================================================================
 */

/**
 * ============================================================================
 * FUNCTION: calculateMean()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Calculates the arithmetic mean (average) of a set of numbers.
 * 
 * === THE FORMULA ===
 * ```
 * mean = (sum of all values) / (count of values)
 * mean = (x₁ + x₂ + x₃ + ... + xₙ) / n
 * ```
 * 
 * === WHY DO WE NEED IT? ===
 * - Understanding "typical" or "central" value
 * - Baseline for calculating variance/standard deviation
 * - Smoothing noisy measurements
 * 
 * === EXAMPLES ===
 * 
 * Example 1: Player kill counts over 5 rounds
 * ```typescript
 * calculateMean([10, 15, 12, 8, 20])
 * // Sum: 10 + 15 + 12 + 8 + 20 = 65
 * // Count: 5
 * // Mean: 65 / 5 = 13
 * // Interpretation: "Player averages 13 kills per round"
 * ```
 * 
 * Example 2: Membership values
 * ```typescript
 * calculateMean([0.7, 0.8, 0.75, 0.72])
 * // Sum: 2.97
 * // Count: 4
 * // Mean: 0.7425
 * // Interpretation: "Average combat membership is 74.25%"
 * ```
 * 
 * Example 3: Empty array (edge case)
 * ```typescript
 * calculateMean([])
 * // Sum: 0
 * // Count: 0
 * // Returns: 0 (avoids division by zero)
 * // Interpretation: "No data available"
 * ```
 * 
 * @param values - Array of numbers to average
 * @returns Mean (average) of all values, or 0 if array is empty
 * 
 * === TECHNICAL NOTE ===
 * Uses reduce() for efficient single-pass summation
 * 
 * ============================================================================
 */
export function calculateMean(values: number[]): number {
    // Edge case: empty array would cause division by zero
    if (values.length === 0) return 0;
    
    // Sum all values using reduce
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    // Divide by count to get average
    return sum / values.length;
}

/**
 * ============================================================================
 * FUNCTION: calculateStandardDeviation()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Measures how "spread out" numbers are from their average.
 * 
 * === WHY DO WE NEED IT? ===
 * - Detect inconsistent player behavior
 * - Identify outliers and anomalies
 * - Measure prediction reliability
 * 
 * **Low Standard Deviation**:
 * - Values are clustered close to mean
 * - Consistent, predictable behavior
 * - Example: [10, 11, 10, 9, 10] -> std = 0.71
 * 
 * **High Standard Deviation**:
 * - Values are widely scattered
 * - Inconsistent, erratic behavior  
 * - Example: [5, 20, 2, 18, 5] -> std = 8.43
 * 
 * === THE FORMULA ===
 * 
 * Sample Standard Deviation (what we use):
 * ```
 * variance = Σ(xᵢ - mean)^2 / (n - 1)
 * std = √variance
 * ```
 * 
 * Why (n - 1) instead of n?
 * - Bessel's correction for sample data
 * - Provides unbiased estimate
 * - Standard in statistics
 * 
 * === STEP-BY-STEP EXAMPLE ===
 * 
 * Player damage values: [10, 15, 12, 8, 20]
 * 
 * Step 1: Calculate mean
 * ```
 * mean = (10 + 15 + 12 + 8 + 20) / 5 = 13
 * ```
 * 
 * Step 2: Calculate squared differences from mean
 * ```
 * (10 - 13)^2 = (-3)^2 = 9
 * (15 - 13)^2 = (2)^2 = 4
 * (12 - 13)^2 = (-1)^2 = 1
 * (8 - 13)^2 = (-5)^2 = 25
 * (20 - 13)^2 = (7)^2 = 49
 * ```
 * 
 * Step 3: Sum squared differences
 * ```
 * sum = 9 + 4 + 1 + 25 + 49 = 88
 * ```
 * 
 * Step 4: Calculate variance (divide by n-1)
 * ```
 * variance = 88 / (5 - 1) = 88 / 4 = 22
 * ```
 * 
 * Step 5: Take square root for standard deviation
 * ```
 * std = √22 ≈ 4.69
 * ```
 * 
 * Interpretation:
 * "Player damage varies by about +/-4.69 from the average of 13"
 * 
 * === MORE EXAMPLES ===
 * 
 * Example 1: Consistent player
 * ```typescript
 * calculateStandardDeviation([10, 11, 10, 9, 10])
 * // Mean: 10
 * // Variance: 0.5
 * // Std: 0.71
 * // Interpretation: Very consistent performance
 * ```
 * 
 * Example 2: Erratic player
 * ```typescript
 * calculateStandardDeviation([5, 20, 2, 18, 5])
 * // Mean: 10
 * // Variance: 71
 * // Std: 8.43
 * // Interpretation: Highly variable performance
 * ```
 * 
 * Example 3: Edge case - too few values
 * ```typescript
 * calculateStandardDeviation([5])
 * // Only 1 value, can't calculate spread
 * // Returns: 0 (no variability with 1 point)
 * ```
 * 
 * @param values - Array of numbers to analyze
 * @returns Standard deviation, or 0 if fewer than 2 values
 * 
 * === MATHEMATICAL NOTE ===
 * We use sample std deviation (n-1) not population std (n)
 * because we're analyzing gameplay samples, not entire populations.
 * 
 * ============================================================================
 */
export function calculateStandardDeviation(values: number[]): number {
    // Need at least 2 values to calculate spread
    if (values.length < 2) return 0;
    
    // Step 1: Calculate mean (average)
    const mean = calculateMean(values);
    
    // Step 2: Calculate variance (average squared difference from mean)
    // Using (n-1) for sample standard deviation (Bessel's correction)
    const variance = values.reduce((acc, val) => {
        return acc + Math.pow(val - mean, 2);
    }, 0) / (values.length - 1);
    
    // Step 3: Standard deviation is square root of variance
    return Math.sqrt(variance);
}

/**
 * ============================================================================
 * FUNCTION: calculateAbsoluteSum()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Sums the absolute values (magnitudes) of all numbers.
 * 
 * === WHY ABSOLUTE VALUES? ===
 * 
 * Regular sum:
 * ```
 * [-5, +3, -2, +4] -> sum = 0
 * // Positive and negative cancel out!
 * ```
 * 
 * Absolute sum:
 * ```
 * [-5, +3, -2, +4] -> |sum| = 5 + 3 + 2 + 4 = 14
 * // Total magnitude of change!
 * ```
 * 
 * === WHEN TO USE ===
 * - Measuring total amount of change (regardless of direction)
 * - Calculating "Manhattan distance" (city-block distance)
 * - Detecting overall activity level
 * 
 * === EXAMPLES ===
 * 
 * Example 1: Behavioral deltas
 * ```typescript
 * // Player changed playstyle:
 * // Combat: +0.15 (increased)
 * // Collect: -0.10 (decreased)
 * // Explore: -0.05 (decreased)
 * 
 * calculateAbsoluteSum([0.15, -0.10, -0.05])
 * // = |0.15| + |-0.10| + |-0.05|
 * // = 0.15 + 0.10 + 0.05
 * // = 0.30
 * 
 * // Interpretation: "Total behavioral change magnitude is 30%"
 * ```
 * 
 * Example 2: Position movement
 * ```typescript
 * // Player movement in 3D: [x, y, z]
 * calculateAbsoluteSum([3, -4, 2])
 * // = |3| + |-4| + |2|
 * // = 3 + 4 + 2
 * // = 9
 * 
 * // Interpretation: "Total distance traveled: 9 units"
 * ```
 * 
 * Example 3: Empty array
 * ```typescript
 * calculateAbsoluteSum([])
 * // Returns: 0 (no values to sum)
 * ```
 * 
 * @param values - Array of numbers (can be positive or negative)
 * @returns Sum of absolute values (always non-negative)
 * 
 * === MATHEMATICAL NOTE ===
 * This implements the L₁ norm (Manhattan/Taxicab distance)
 * Different from Euclidean distance (L₂ norm)
 * 
 * ============================================================================
 */
export function calculateAbsoluteSum(values: number[]): number {
    // Sum the absolute value of each number
    return values.reduce((acc, val) => acc + Math.abs(val), 0);
}

/**
 * ============================================================================
 * FUNCTION: calculateEuclideanDistance()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Calculates the straight-line distance between two points in N-dimensional
 * space (2D, 3D, or higher).
 * 
 * === THE FORMULA ===
 * 
 * 2D (X, Y):
 * ```
 * distance = √[(x₁-x₂)^2 + (y₁-y₂)^2]
 * ```
 * 
 * 3D (X, Y, Z):
 * ```
 * distance = √[(x₁-x₂)^2 + (y₁-y₂)^2 + (z₁-z₂)^2]
 * ```
 * 
 * N-D (generalized):
 * ```
 * distance = √[Σ(aᵢ - bᵢ)^2]
 * ```
 * 
 * === WHY "EUCLIDEAN"? ===
 * Named after Greek mathematician Euclid. This is the "ordinary" distance
 * you'd measure with a ruler - the shortest path between two points.
 * 
 * === STEP-BY-STEP EXAMPLE (3D) ===
 * 
 * Player archetype positions:
 * - Current: [0.6, 0.3, 0.1] (combat, collect, explore)
 * - Combat Centroid: [0.8, 0.1, 0.1]
 * 
 * Question: "How far is player from Combat archetype?"
 * 
 * Step 1: Calculate differences
 * ```
 * Δcombat = 0.6 - 0.8 = -0.2
 * Δcollect = 0.3 - 0.1 = +0.2
 * Δexplore = 0.1 - 0.1 = 0.0
 * ```
 * 
 * Step 2: Square each difference
 * ```
 * (Δcombat)^2 = (-0.2)^2 = 0.04
 * (Δcollect)^2 = (0.2)^2 = 0.04
 * (Δexplore)^2 = (0.0)^2 = 0.00
 * ```
 * 
 * Step 3: Sum squared differences
 * ```
 * sum = 0.04 + 0.04 + 0.00 = 0.08
 * ```
 * 
 * Step 4: Take square root
 * ```
 * distance = √0.08 ≈ 0.283
 * ```
 * 
 * Interpretation:
 * "Player is 0.283 units away from Combat archetype"
 * 
 * === MORE EXAMPLES ===
 * 
 * Example 1: 2D position distance
 * ```typescript
 * calculateEuclideanDistance([0, 0], [3, 4])
 * // Differences: [3, 4]
 * // Squared: [9, 16]
 * // Sum: 25
 * // Distance: √25 = 5
 * 
 * // Classic 3-4-5 right triangle!
 * ```
 * 
 * Example 2: Same point (zero distance)
 * ```typescript
 * calculateEuclideanDistance([1, 2, 3], [1, 2, 3])
 * // All differences are 0
 * // Distance: 0
 * ```
 * 
 * Example 3: Mismatched lengths (error case)
 * ```typescript
 * calculateEuclideanDistance([1, 2], [1, 2, 3])
 * // Different dimensions!
 * // Returns: 0 (invalid comparison)
 * ```
 * 
 * === WHERE WE USE IT ===
 * 
 * **Fuzzy Clustering** (clustering.ts):
 * - Calculate distance from player to each archetype centroid
 * - Closer centroid = higher membership
 * 
 * **Example**:
 * ```typescript
 * const distToCombat = calculateEuclideanDistance(
 *   playerVector,
 *   combatCentroid
 * );
 * // Small distance -> High combat membership
 * ```
 * 
 * @param point1 - First point as array [x, y, z, ...]
 * @param point2 - Second point as array [x, y, z, ...]
 * @returns Straight-line distance, or 0 if dimensions don't match
 * 
 * === MATHEMATICAL PROPERTIES ===
 * 
 * 1. **Symmetry**: dist(A, B) = dist(B, A)
 * 2. **Non-negative**: Always ≥ 0
 * 3. **Identity**: dist(A, A) = 0
 * 4. **Triangle Inequality**: dist(A, C) ≤ dist(A, B) + dist(B, C)
 * 
 * === ALTERNATIVE DISTANCE METRICS ===
 * 
 * We could also use:
 * - **Manhattan Distance**: Sum of absolute differences (L₁ norm)
 * - **Chebyshev Distance**: Maximum difference (L∞ norm)
 * - **Cosine Distance**: Angle between vectors
 * 
 * But Euclidean is most intuitive and standard for clustering.
 * 
 * ============================================================================
 */
export function calculateEuclideanDistance(point1: number[], point2: number[]): number {
    // Validate: both points must have same number of dimensions
    if (point1.length !== point2.length) return 0;
    
    // Calculate sum of squared differences
    const squaredDiffSum = point1.reduce((acc, val, idx) => {
        // Get difference for this dimension
        const diff = val - point2[idx];
        
        // Square it and add to accumulator
        return acc + Math.pow(diff, 2);
    }, 0);
    
    // Return square root (Pythagorean theorem in N dimensions)
    return Math.sqrt(squaredDiffSum);
}

/**
 * ============================================================================
 * USAGE EXAMPLES ACROSS THE SYSTEM
 * ============================================================================
 * 
 * === Example 1: Clustering (clustering.ts) ===
 * ```typescript
 * const distances = centroids.map(centroid => {
 *   return calculateEuclideanDistance(playerPoint, centroidPoint);
 * });
 * // Find which archetype is closest
 * ```
 * 
 * === Example 2: Analytics (analytics/) ===
 * ```typescript
 * const avgDamage = calculateMean(damageHistory);
 * const consistency = calculateStandardDeviation(damageHistory);
 * // Determine if player is consistent or erratic
 * ```
 * 
 * === Example 3: Deltas (session-manager.ts) ===
 * ```typescript
 * const totalChange = calculateAbsoluteSum([
 *   delta_combat,
 *   delta_collect,
 *   delta_explore
 * ]);
 * // Measure magnitude of  behavioral shift
 * ```
 * 
 * ============================================================================
 */
