/**
 * ============================================================================
 * GAME MECHANICS - Mathematical Helper Functions
 * ============================================================================
 * 
 * === WHAT IS THIS FILE? ===
 * This file contains small, reusable mathematical functions that help with
 * game-related calculations. Think of these as "tiny calculators" that other
 * parts of the system use.
 * 
 * === WHY SEPARATE FILE? ===
 * - **Reusability**: Many files need these same calculations
 * - **Testing**: Easier to test small functions independently
 * - **Clarity**: Keeps complex files cleaner by extracting common logic
 * 
 * === WHAT'S INSIDE? ===
 * 1. getArchetypeInfluence() - Determines how player type affects parameters
 * 2. calculateComponentSum() - Adds up numbers safely
 * 3. calculatePercentage() - Divides safely (handles zero!)
 * 
 * ============================================================================
 */

import { ParameterMetadata, SoftMembership } from '../engine/types';

/**
 * === DATA STRUCTURE: ArchetypeInfluence ===
 * 
 * Describes HOW MUCH a player's playstyle should affect a game parameter.
 * 
 * @property influence - The player's membership in the relevant archetype (0-1)
 *   Example: 0.7 = Player is 70% Combat-focused
 * 
 * @property sensitivity - How strongly this parameter responds to that archetype (0-1)
 *   Example: 0.8 = This parameter is very sensitive to combat style
 * 
 * Combined Example:
 *   influence = 0.7 (70% combat player)
 *   sensitivity = 0.8 (parameter highly sensitive to combat)
 *   Result: Strong upward adjustment for this parameter
 */
interface ArchetypeInfluence {
    influence: number;      // Player's membership (0-1)
    sensitivity: number;    // Parameter's responsiveness (0-1)
}

/**
 * ============================================================================
 * FUNCTION: getArchetypeInfluence()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Determines which player archetype (Combat/Collection/Exploration) affects
 * a specific game parameter and by how much.
 * 
 * === WHY DO WE NEED THIS? ===
 * 
 * Different parameters respond to different playstyles:
 * 
 * - **Enemy Health** should increase for Combat-focused players
 *   (They're good at fighting, make it harder!)
 * 
 * - **Pickup Spawn Rate** should increase for Collection-focused players
 *   (They like gathering, give them more to find!)
 * 
 * - **Map Size** might increase for Exploration-focused players
 *   (They like exploring, give them more space!)
 * 
 * === HOW IT WORKS ===
 * 
 * 1. CHECK IF ENABLED
 *    - Some parameters aren't affected by playstyle
 *    - Return 0 influence if disabled
 * 
 * 2. READ CONFIG WEIGHTS
 *    - Each parameter has weights for combat/collect/explore
 *    - Example: { combat: 0.8, explore: 0.0, collect: 0.0 }
 *    - This means "only combat affects this parameter"
 * 
 * 3. FIND DOMINANT ARCHETYPE
 *    - Check which weight is non-zero
 *    - Use the corresponding membership value
 * 
 * 4. RETURN INFLUENCE + SENSITIVITY
 *    - influence = Player's membership in that archetype
 *    - sensitivity = How much this parameter cares
 * 
 * === EXAMPLE 1: ENEMY HEALTH ===
 * 
 * Parameter Config:
 * ```json
 * {
 *   "archetypeInfluence": {
 *     "enabled": true,
 *     "weights": {
 *       "combat": 0.9,    // Highly sensitive to combat
 *       "explore": 0.0,   // Doesn't care about exploration
 *       "collect": 0.0    // Doesn't care about collection
 *     }
 *   }
 * }
 * ```
 * 
 * Player Membership:
 * ```json
 * {
 *   "soft_combat": 0.75,    // 75% combat-focused
 *   "soft_explore": 0.15,
 *   "soft_collect": 0.10
 * }
 * ```
 * 
 * Result:
 * ```json
 * {
 *   "influence": 0.75,      // Player's combat membership
 *   "sensitivity": 0.9      // Parameter's combat sensitivity
 * }
 * ```
 * 
 * Interpretation:
 * "This combat-focused player (75%) should get a strong difficulty increase
 *  (sensitivity 90%) for enemy health."
 * 
 * === EXAMPLE 2: DISABLED INFLUENCE ===
 * 
 * Parameter Config:
 * ```json
 * {
 *   "archetypeInfluence": {
 *     "enabled": false
 *   }
 * }
 * ```
 * 
 * Result:
 * ```json
 * {
 *   "influence": 0,
 *   "sensitivity": 0
 * }
 * ```
 * 
 * Interpretation:
 * "This parameter doesn't change based on playstyle."
 * 
 * @param config - Parameter metadata (what affects this parameter?)
 * @param membership - Player's archetype memberships (what type of player are they?)
 * @returns Influence object with membership value and sensitivity
 * 
 * ============================================================================
 */
export function getArchetypeInfluence(
    config: ParameterMetadata, 
    membership: SoftMembership
): ArchetypeInfluence {
    // ========================================
    // STEP 1: CHECK IF INFLUENCE IS ENABLED
    // ========================================
    // Some parameters are static - they don't change based on playstyle
    // Example: Base movement speed, UI scale, audio volume
    
    if (!config.archetypeInfluence?.enabled || !config.archetypeInfluence.weights) {
        // Return zero influence - parameter not affected by playstyle
        return { influence: 0, sensitivity: 0 };
    }

    // ========================================
    // STEP 2: INITIALIZE DEFAULT RESULT
    // ========================================
    // Start with neutral values
    const result = { influence: 0, sensitivity: 0.3 };

    // ========================================
    // STEP 3: GET WEIGHT CONFIGURATION
    // ========================================
    // Extract the weights that define which archetype affects this parameter
    const weights = config.archetypeInfluence.weights;

    // ========================================
    // STEP 4: FIND DOMINANT ARCHETYPE
    // ========================================
    // Check which archetype has a non-zero weight
    // Priority: Combat → Exploration → Collection
    // (Only one archetype can influence each parameter)
    
    /**
     * === COMBAT CHECK ===
     * If combat weight exists and is non-zero:
     * - Use player's combat membership
     * - Use combat sensitivity value
     */
    if (weights.combat) {
        result.influence = membership.soft_combat;
        result.sensitivity = weights.combat;
    } 
    /**
     * === EXPLORATION CHECK ===
     * If exploration weight exists and is non-zero:
     * - Use player's exploration membership
     * - Use exploration sensitivity value
     */
    else if (weights.explore) {
        result.influence = membership.soft_explore;
        result.sensitivity = weights.explore;
    } 
    /**
     * === COLLECTION CHECK ===
     * If collection weight exists and is non-zero:
     * - Use player's collection membership
     * - Use collection sensitivity value
     */
    else if (weights.collect) {
        result.influence = membership.soft_collect;
        result.sensitivity = weights.collect;
    }

    // ========================================
    // STEP 5: RETURN RESULT
    // ========================================
    return result;
}

/**
 * ============================================================================
 * FUNCTION: calculateComponentSum()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Adds up all numbers in an array. That's it! Simple but important.
 * 
 * === WHY A FUNCTION FOR SIMPLE ADDITION? ===
 * 
 * 1. **Safety**: Handles undefined/null values gracefully
 * 2. **Clarity**: Self-documenting code ("calculate sum" vs "reduce")
 * 3. **Consistency**: One place to update if logic changes
 * 4. **Testing**: Easy to verify correctness
 * 
 * === EXAMPLES ===
 * 
 * Example 1: Normal Usage
 * ```typescript
 * calculateComponentSum([0.8, 0.9, 0.7, 0.6])
 * // Returns: 3.0
 * ```
 * 
 * Example 2: Empty Array
 * ```typescript
 * calculateComponentSum([])
 * // Returns: 0
 * ```
 * 
 * Example 3: Single Value
 * ```typescript
 * calculateComponentSum([5.5])
 * // Returns: 5.5
 * ```
 * 
 * === REAL-WORLD USE ===
 * 
 * In Activity Scoring:
 * ```typescript
 * const combatScore = calculateComponentSum([
 *   normalized.enemiesHit,      // 0.8
 *   normalized.damageDone,      // 0.9
 *   normalized.timeInCombat,    // 0.7
 *   normalized.kills            // 0.6
 * ]);
 * // combatScore = 3.0
 * ```
 * 
 * @param values - Array of numbers to add together
 * @returns Sum of all values (0 if array is empty)
 * 
 * === TECHNICAL NOTE ===
 * Uses Array.reduce() with initial value of 0
 * - Iterates through each value
 * - Adds it to running sum
 * - Returns final total
 * 
 * ============================================================================
 */
export function calculateComponentSum(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0);
}

/**
 * ============================================================================
 * FUNCTION: calculatePercentage()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Safely calculates what percentage one number is of another.
 * Crucially: **NEVER crashes from division by zero!**
 * 
 * === THE DIVISION BY ZERO PROBLEM ===
 * 
 * Normal division:
 * ```typescript
 * 5 / 0  // ERROR: Division by zero!
 * // Program crashes 💥
 * ```
 * 
 * This function:
 * ```typescript
 * calculatePercentage(5, 0)  // Returns: 0.3333
 * // Program continues safely ✅
 * ```
 * 
 * === WHY RETURN 0.3333 INSTEAD OF 0? ===
 * 
 * If total is zero, it means the player did NOTHING:
 * - No combat
 * - No collection
 * - No exploration
 * 
 * Problem: We need to return SOMETHING for all three categories
 * 
 * Options:
 * 1. Return [0, 0, 0] → Breaks "must sum to 100%" rule
 * 2. Return [100%, 0, 0] → Unfairly favors combat
 * 3. Return [33%, 33%, 33%] → Fair default! ✅
 * 
 * By returning 0.3333 (33.33%), all three categories get equal weight
 * when we have no data.
 * 
 * === EXAMPLES ===
 * 
 * Example 1: Normal Usage
 * ```typescript
 * calculatePercentage(0.75, 1.35)
 * // Returns: 0.556 (55.6%)
 * 
 * // Calculation: 0.75 ÷ 1.35 = 0.556
 * ```
 * 
 * Example 2: Zero Total (Edge Case)
 * ```typescript
 * calculatePercentage(0, 0)
 * // Returns: 0.3333 (33.33%)
 * 
 * // Player did nothing, so default to balanced distribution
 * ```
 * 
 * Example 3: Real Activity Scoring
 * ```typescript
 * // Player data:
 * combatScore = 2.5
 * collectionScore = 0.8
 * explorationScore = 1.2
 * totalScore = 4.5
 * 
 * // Calculate percentages:
 * pct_combat = calculatePercentage(2.5, 4.5)    // 0.556 (55.6%)
 * pct_collect = calculatePercentage(0.8, 4.5)   // 0.178 (17.8%)
 * pct_explore = calculatePercentage(1.2, 4.5)   // 0.267 (26.7%)
 * 
 * // Verify they sum to 100%:
 * 0.556 + 0.178 + 0.267 = 1.001 ≈ 1.0 ✅
 * ```
 * 
 * === WHY NOT JUST `part / total`? ===
 * 
 * Without the safety check:
 * ```typescript
 * function unsafePercentage(part, total) {
 *   return part / total;  // Can crash!
 * }
 * 
 * unsafePercentage(1, 0)  // Returns: Infinity (breaks everything!)
 * ```
 * 
 * With the safety check:
 * ```typescript
 * calculatePercentage(1, 0)  // Returns: 0.3333 (safe default)
 * ```
 * 
 * @param part - The portion you're measuring (e.g., combat score)
 * @param total - The whole thing (e.g., total activity score)
 * @returns Percentage as decimal (0.0 to 1.0), or 0.3333 if total is zero
 * 
 * === IMPORTANT NOTES ===
 * 
 * 1. **Return Value Range**
 *    - Normal case: 0.0 to 1.0 (0% to 100%)
 *    - Zero case: Exactly 0.3333 (33.33%)
 * 
 * 2. **Precision**
 *    - Uses floating-point division
 *    - May have tiny rounding errors (0.3333333...)
 *    - Acceptable for our use case
 * 
 * 3. **Edge Cases Handled**
 *    - ✅ total = 0: Returns 0.3333
 *    - ✅ part = 0: Returns 0.0
 *    - ✅ part > total: Returns value > 1.0 (valid!)
 *    - ✅ negative values: Works correctly
 * 
 * ============================================================================
 */
export function calculatePercentage(part: number, total: number): number {
    // ========================================
    // SAFETY CHECK: HANDLE DIVISION BY ZERO
    // ========================================
    // If total is zero, we can't divide
    // Return balanced default (33.33%) instead of crashing
    if (total === 0) return 0.3333;
    
    // ========================================
    // NORMAL CASE: CALCULATE PERCENTAGE
    // ========================================
    // Standard division: part ÷ total
    return part / total;
}

/**
 * ============================================================================
 * USAGE SUMMARY
 * ============================================================================
 * 
 * These three functions work together in the Activity Scoring system:
 * 
 * Step 1: Sum feature values
 * ```typescript
 * const combatScore = calculateComponentSum([0.8, 0.9, 0.7, 0.6]);
 * // combatScore = 3.0
 * ```
 * 
 * Step 2: Calculate total
 * ```typescript
 * const total = combatScore + collectScore + exploreScore;
 * // total = 4.5
 * ```
 * 
 * Step 3: Convert to percentages
 * ```typescript
 * const pct_combat = calculatePercentage(combatScore, total);
 * // pct_combat = 0.667 (66.7%)
 * ```
 * 
 * Step 4: Determine parameter adjustments
 * ```typescript
 * const influence = getArchetypeInfluence(enemyHealthConfig, membership);
 * // Use influence to scale difficulty adjustments
 * ```
 * 
 * Result: Perfectly tuned difficulty based on player behavior! 🎮
 * 
 * ============================================================================
 */
