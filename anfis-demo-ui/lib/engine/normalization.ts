/**
 * ============================================================================
 * NORMALIZATION MODULE - Making Numbers Comparable
 * ============================================================================
 * 
 * === WHAT IS THIS FILE? ===
 * This file handles "normalization" - converting different types of numbers
 * into a standard 0-1 scale so they can be compared fairly.
 * 
 * === WHY DO WE NEED IT? ===
 * 
 * Imagine comparing:
 * - Distance: 1,500 meters
 * - Damage: 450 points
 * - Time: 120 seconds
 * 
 * Which is "bigger"? We can't compare them directly!
 * 
 * Normalization converts everything to 0-1:
 * - Distance: 0.75 (75% of typical max distance)
 * - Damage: 0.45 (45% of typical max damage)
 * - Time: 0.6 (60% of typical max time)
 * 
 * Now we CAN compare them!
 * 
 * === THE FORMULA ===
 * 
 * For each number:
 *   normalized = (value - minimum) / (maximum - minimum)
 * 
 * Example:
 *   Health = 50 (out of 0-100 range)
 *   normalized = (50 - 0) / (100 - 0) = 0.5
 * 
 * ============================================================================
 */

import { clamp } from '../math/formulas';
import type { NormalizedFeatures, ScalerParams, TelemetryFeatures } from './types';

/**
 * ============================================================================
 * CLASS: MinMaxNormalizer
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Takes game data (kills, damage, distance, etc.) and converts each one
 * to a 0-1 scale using the Min-Max formula.
 * 
 * === HOW IT WORKS ===
 * 
 * 1. SETUP (Constructor):
 *    - Loads pre-calculated min/max values for each feature
 *    - These were learned from analyzing thousands of gameplay sessions
 * 
 * 2. NORMALIZE:
 *    - Takes raw game data
 *    - Converts each field to 0-1 scale
 *    - Returns normalized version
 * 
 * 3. DENORMALIZE (Optional):
 *    - Reverse operation for debugging
 *    - Converts 0-1 back to original scale
 * 
 * === EXAMPLE ===
 * 
 * Input (Raw):
 * {
 *   enemiesKilled: 10,    // out of typical 0-50 range
 *   damageDone: 800,      // out of typical 0-2000 range
 *   distance: 1200        // out of typical 0-3000 range
 * }
 * 
 * Output (Normalized):
 * {
 *   enemiesKilled: 0.2,   // 10/50 = 20% of max
 *   damageDone: 0.4,      // 800/2000 = 40% of max
 *   distance: 0.4         // 1200/3000 = 40% of max
 * }
 * 
 * ============================================================================
 */
export class MinMaxNormalizer {
  // === INTERNAL STATE ===
  // These store the "learned" min/max values from training data
  
  private features: string[];      // Names of features (e.g., "enemiesKilled", "damageDone")
  private dataMin: number[];       // Minimum value for each feature (learned from data)
  private dataMax: number[];       // Maximum value for each feature (learned from data)
  private dataRange: number[];     // Range (max - min) for each feature
  private minValue: number;        // Target minimum for normalized output (usually 0)
  private maxValue: number;        // Target maximum for normalized output (usually 1)

  /**
   * === CONSTRUCTOR ===
   * 
   * Sets up the normalizer with pre-calculated statistics.
   * 
   * WHAT ARE SCALER PARAMS?
   * These are the "configuration" learned during training:
   * - For each game feature (kills, damage, etc.)
   * - We know the typical minimum and maximum values
   * - Based on analyzing thousands of real gameplay sessions
   * 
   * EXAMPLE SCALER PARAMS:
   * {
   *   features: ["enemiesKilled", "damageDone"],
   *   data_min: [0, 0],           // Both start at 0
   *   data_max: [50, 2000],       // Max kills: 50, max damage: 2000
   *   data_range: [50, 2000],     // Same as max - min
   *   min_value: 0,               // Normalize to 0-1 range
   *   max_value: 1
   * }
   * 
   * @param scalerParams - Pre-calculated statistics from training
   */
  constructor(scalerParams: ScalerParams) {
    this.features = scalerParams.features;
    this.dataMin = scalerParams.data_min;
    this.dataMax = scalerParams.data_max;
    this.dataRange = scalerParams.data_range;
    this.minValue = scalerParams.min_value;
    this.maxValue = scalerParams.max_value;
  }

  /**
   * === MAIN METHOD: normalize() ===
   * 
   * Converts raw game data to normalized 0-1 scale.
   * 
   * === THE PROCESS ===
   * 
   * For each feature (kills, damage, distance, etc.):
   * 
   * 1. GET RAW VALUE
   *    Example: player killed 10 enemies
   * 
   * 2. APPLY FORMULA
   *    normalized = (10 - 0) / (50 - 0) = 0.2
   *    (10 is 20% of the way from 0 to 50)
   * 
   * 3. HANDLE EDGE CASES
   *    - If range is 0 (min = max), return min_value
   *    - If value is outside range, clamp it to [0, 1]
   * 
   * 4. STORE RESULT
   *    enemiesKilled: 0.2
   * 
   * === SPECIAL CASES ===
   * 
   * Case 1: Missing Data
   *   If player has no value for a feature → default to 0
   * 
   * Case 2: Zero Range
   *   If min = max (no variation in training data) → return min_value
   *   Example: If all players always start with 100 health
   * 
   * Case 3: Out of Range
   *   If value > max or value < min → clamp to [0, 1]
   *   Example: Player killed 100 enemies (way above typical 50 max)
   *   Result: Clamped to 1.0
   * 
   * @param features - Raw game data (kills, damage, distance, etc.)
   * @returns Normalized version with all values in 0-1 range
   */
  normalize(features: TelemetryFeatures): NormalizedFeatures {
    const normalized: any = {};

    // Loop through each feature we need to normalize
    this.features.forEach((featureName, idx) => {
      // ========================================
      // STEP 1: GET RAW VALUE
      // ========================================
      // Extract the value from input data, default to 0 if missing
      const rawValue = (features as any)[featureName] ?? 0;
      
      // ========================================
      // STEP 2: HANDLE EDGE CASE - ZERO RANGE
      // ========================================
      // If min = max, we can't divide by zero!
      // This happens when a feature has no variation in training data
      if (this.dataRange[idx] === 0) {
        normalized[featureName] = this.minValue;
        return; // Skip to next feature
      }
      
      // ========================================
      // STEP 3: APPLY MIN-MAX FORMULA
      // ========================================
      // Formula: (value - min) / (max - min)
      // 
      // Example:
      //   rawValue = 10 (enemies killed)
      //   dataMin[idx] = 0 (minimum kills ever seen)
      //   dataRange[idx] = 50 (max - min = 50 - 0)
      //   
      //   scaled = (10 - 0) / 50 = 0.2
      const scaled = (rawValue - this.dataMin[idx]) / this.dataRange[idx];
      
      // ========================================
      // STEP 4: CLAMP TO VALID RANGE
      // ========================================
      // Ensure result is between minValue and maxValue (usually 0 and 1)
      // This handles cases where player does something extreme:
      //   - Kills way more enemies than anyone in training data
      //   - Takes way more damage than expected
      // 
      // clamp() function ensures: minValue <= result <= maxValue
      normalized[featureName] = clamp(scaled, this.minValue, this.maxValue);
    });

    return normalized as NormalizedFeatures;
  }

  /**
   * === INVERSE METHOD: denormalize() ===
   * 
   * Converts normalized 0-1 values BACK to original scale.
   * 
   * === WHY DO WE NEED THIS? ===
   * 
   * Mainly for:
   * - DEBUGGING: Check if normalization worked correctly
   * - DISPLAY: Show original values to users
   * - VERIFICATION: Ensure no data was lost in transformation
   * 
   * === THE FORMULA ===
   * 
   * Original = normalized × (max - min) + min
   * 
   * === EXAMPLE ===
   * 
   * Normalized: 0.2
   * Range: 0-50
   * 
   * Original = 0.2 × (50 - 0) + 0 = 10
   * 
   * === PROCESS ===
   * 
   * For each normalized feature:
   * 
   * 1. GET NORMALIZED VALUE (0-1 scale)
   *    Example: 0.4
   * 
   * 2. MULTIPLY BY RANGE
   *    0.4 × 2000 = 800
   * 
   * 3. ADD MINIMUM
   *    800 + 0 = 800
   * 
   * 4. RESULT
   *    Original damage value: 800 points
   * 
   * @param normalized - Data in 0-1 scale
   * @returns Data in original scale (kills, damage, etc.)
   */
  denormalize(normalized: NormalizedFeatures): TelemetryFeatures {
    const original: any = {};

    // Loop through each feature
    this.features.forEach((featureName, idx) => {
      // ========================================
      // STEP 1: GET NORMALIZED VALUE
      // ========================================
      const scaledValue = (normalized as any)[featureName] ?? 0;
      
      // ========================================
      // STEP 2: APPLY INVERSE FORMULA
      // ========================================
      // Formula: value = normalized × range + min
      // 
      // Example:
      //   scaledValue = 0.4 (normalized)
      //   dataRange[idx] = 2000 (max damage - min damage)
      //   dataMin[idx] = 0 (min damage)
      //   
      //   original = 0.4 × 2000 + 0 = 800 damage
      original[featureName] = scaledValue * this.dataRange[idx] + this.dataMin[idx];
    });

    return original as TelemetryFeatures;
  }
}

/**
 * ============================================================================
 * MATHEMATICAL EXPLANATION
 * ============================================================================
 * 
 * === WHY MIN-MAX NORMALIZATION? ===
 * 
 * Other options exist (Z-score, Log scaling), but Min-Max is best for us because:
 * 
 * 1. PRESERVES RELATIONSHIPS
 *    - If A > B in original data, then A > B in normalized data
 *    - Order is maintained
 * 
 * 2. BOUNDED OUTPUT
 *    - Always between 0 and 1 (with clamping)
 *    - No surprise extreme values
 * 
 * 3. INTUITIVE
 *    - 0.0 = minimum performance
 *    - 0.5 = average performance
 *    - 1.0 = maximum performance
 * 
 * 4. REVERSIBLE
 *    - Can always convert back to original
 *    - No information loss
 * 
 * === EXAMPLE WALKTHROUGH ===
 * 
 * Training Data (from 1000 players):
 * - Minimum kills: 0
 * - Maximum kills: 50
 * - Average kills: 15
 * 
 * Player A: 10 kills → normalized = 10/50 = 0.2 (below average)
 * Player B: 15 kills → normalized = 15/50 = 0.3 (average)
 * Player C: 30 kills → normalized = 30/50 = 0.6 (above average)
 * Player D: 100 kills → normalized = 100/50 = 2.0 → clamped to 1.0 (exceptional!)
 * 
 * Now the AI can easily see who's performing well!
 * 
 * ============================================================================
 */
