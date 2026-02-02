/**
 * ============================================================================
 * MATHEMATICAL FORMULAS - Pure Math Utilities
 * ============================================================================
 * 
 * === WHAT IS THIS FILE? ===
 * Collection of pure mathematical functions used throughout the application.
 * No game logic, no business rules - just math!
 * 
 * === WHY SEPARATE FILE? ===
 * - **Reusability**: Used by many different modules
 * - **Testability**: Easy to unit test mathematical correctness
 * - **Maintainability**: Math bugs found in one place
 * - **Clarity**: Separates "what to do" from "how to calculate"
 * 
 * === WHAT'S INSIDE? ===
 * 1. clamp() - Keep values within bounds
 * 2. applyDirectScaling() - Multiply by difficulty
 * 3. applyInverseScaling() - Divide by difficulty (safely)
 * 4. calculateCanonicalModifier() - Archetype influence formula
 * 5. isApproximatelyEqual() - Floating-point comparison
 * 
 * ============================================================================
 */

/**
 * ============================================================================
 * FUNCTION: clamp()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Restricts a number to stay within a minimum and maximum range.
 * 
 * === WHY DO WE NEED IT? ===
 * Safety! Prevents values from going outside acceptable limits.
 * 
 * Examples where we use it:
 * - Difficulty multiplier: Must stay between 0.6 and 1.4
 * - Health values: Can't be negative or above maximum
 * - Percentages: Must be between 0% and 100%
 * 
 * === THE FORMULA ===
 * ```
 * If value < min: return min
 * If value > max: return max
 * Otherwise: return value
 * ```
 * 
 * === EXAMPLES ===
 * 
 * Example 1: Value too high
 * ```typescript
 * clamp(150, 0, 100)
 * // Returns: 100 (clamped to maximum)
 * ```
 * 
 * Example 2: Value too low
 * ```typescript
 * clamp(-5, 0, 100)
 * // Returns: 0 (clamped to minimum)
 * ```
 * 
 * Example 3: Value within range
 * ```typescript
 * clamp(50, 0, 100)
 * // Returns: 50 (no clamping needed)
 * ```
 * 
 * Example 4: Difficulty multiplier clamp
 * ```typescript
 * // AI suggested 2.0x difficulty (way too hard!)
 * clamp(2.0, 0.6, 1.4)
 * // Returns: 1.4 (safely limited to maximum)
 * ```
 * 
 * @param value - The number to constrain
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Value constrained to [min, max] range
 * 
 * ============================================================================
 */
export function clamp(value: number, min: number, max: number): number {
    // Math.max(min, X) ensures X >= min
    // Math.min(max, X) ensures X <= max
    // Combining them constrains X to [min, max]
    return Math.max(min, Math.min(max, value));
}

/**
 * ============================================================================
 * FUNCTION: applyDirectScaling()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Scales a value UP or DOWN by multiplying.
 * 
 * === WHEN TO USE ===
 * For parameters that should increase with difficulty:
 * - Enemy health (harder → more health)
 * - Enemy damage (harder → more damage)
 * - Enemy count (harder → more enemies)
 * 
 * === THE FORMULA ===
 * ```
 * result = base × multiplier
 * ```
 * 
 * === EXAMPLES ===
 * 
 * Example 1: Increase enemy health
 * ```typescript
 * applyDirectScaling(100, 1.2)
 * // Base health: 100
 * // Multiplier: 1.2 (20% harder)
 * // Result: 120 (20% more health)
 * ```
 * 
 * Example 2: Decrease difficulty
 * ```typescript
 * applyDirectScaling(100, 0.8)
 * // Base health: 100
 * // Multiplier: 0.8 (20% easier)
 * // Result: 80 (20% less health)
 * ```
 * 
 * Example 3: No change
 * ```typescript
 * applyDirectScaling(100, 1.0)
 * // Base health: 100
 * // Multiplier: 1.0 (no change)
 * // Result: 100 (stays the same)
 * ```
 * 
 * @param base - The starting value
 * @param totalMultiplier - How much to scale (1.0 = no change)
 * @returns Scaled value (base × multiplier)
 * 
 * ============================================================================
 */
export function applyDirectScaling(base: number, totalMultiplier: number): number {
    return base * totalMultiplier;
}

/**
 * ============================================================================
 * FUNCTION: applyInverseScaling()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Scales a value in the OPPOSITE direction - dividing instead of multiplying.
 * 
 * === WHEN TO USE ===
 * For parameters that should DECREASE with difficulty:
 * - Health pickups (harder → fewer pickups)
 * - Ammo drops (harder → less ammo)
 * - Cooldown times (harder → longer cooldowns)
 * 
 * === WHY INVERSE? ===
 * 
 * If difficulty goes UP, we want these things to go DOWN:
 * - Direct scaling: 100 × 1.2 = 120 ❌ (health pickups increase!)
 * - Inverse scaling: 100 / 1.2 = 83 ✅ (health pickups decrease!)
 * 
 * === THE FORMULA ===
 * ```
 * result = base / multiplier
 * ```
 * 
 * But with SAFETY:
 * ```
 * safeMultiplier = max(0.001, multiplier)  // Prevent division by zero
 * result = base / safeMultiplier
 * ```
 * 
 * === EXAMPLES ===
 * 
 * Example 1: Decrease health pickups (harder game)
 * ```typescript
 * applyInverseScaling(100, 1.2)
 * // Base pickups: 100
 * // Multiplier: 1.2 (20% harder)
 * // Result: 83.33 (17% fewer pickups)
 * ```
 * 
 * Example 2: Increase health pickups (easier game)
 * ```typescript
 * applyInverseScaling(100, 0.8)
 * // Base pickups: 100
 * // Multiplier: 0.8 (20% easier)
 * // Result: 125 (25% more pickups)
 * ```
 * 
 * Example 3: Division by zero safety
 * ```typescript
 * applyInverseScaling(100, 0.0)
 * // Multiplier: 0.0 (would cause crash!)
 * // Safe multiplier: 0.001 (minimum allowed)
 * // Result: 100,000 (very large, but doesn't crash)
 * ```
 * 
 * === WHY MINIMUM OF 0.001? ===
 * 
 * Without safety:
 * - 100 / 0 = Infinity → Program crashes! 💥
 * 
 * With safety:
 * - 100 / 0.001 = 100,000 → Large but valid number ✅
 * - Gets clamped by min/max in adaptation anyway
 * 
 * @param base - The starting value
 * @param totalMultiplier - How much to scale (1.0 = no change)
 * @returns Inversely scaled value (base / multiplier)
 * 
 * ============================================================================
 */
export function applyInverseScaling(base: number, totalMultiplier: number): number {
    // Ensure multiplier is never zero or negative
    const safeMultiplier = Math.max(0.001, totalMultiplier);
    return base / safeMultiplier;
}

/**
 * ============================================================================
 * FUNCTION: calculateCanonicalModifier()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Calculates how much a player's archetype (playstyle) should affect
 * a specific game parameter.
 * 
 * === THE CONCEPT ===
 * 
 * Two inputs:
 * 1. **Influence** (0-1): How much player matches this archetype
 *    Example: 0.7 = 70% combat-focused player
 * 
 * 2. **Sensitivity** (0-1): How much this parameter cares about archetype
 *    Example: 0.3 = parameter moderately sensitive to combat
 * 
 * Output:
 * - **Modifier** (~0.85-1.15): Adjustment factor for parameter
 *   Example: 1.05 = increase parameter by 5%
 * 
 * === THE FORMULA ===
 * 
 * ```
 * lowerBound = 1.0 - (sensitivity / 2)
 * upperBound = 1.0 + (sensitivity / 2)
 * modifier = lowerBound + (sensitivity × influence)
 * result = clamp(modifier, lowerBound, upperBound)
 * ```
 * 
 * === WHY THIS FORMULA? ===
 * 
 * We want:
 * - Neutral player (influence = 0.5) → modifier = 1.0 (no change)
 * - High archetype (influence = 1.0) → modifier = upperBound
 * - Low archetype (influence = 0.0) → modifier = lowerBound
 * - Sensitivity controls the RANGE of adjustment
 * 
 * === DETAILED WALKTHROUGH ===
 * 
 * Example: Enemy Health for Combat Players
 * 
 * Inputs:
 * ```
 * influence  = 0.7  (70% combat-focused)
 * sensitivity = 0.3  (30% sensitivity to combat)
 * ```
 * 
 * Step 1: Calculate bounds
 * ```
 * lowerBound = 1.0 - (0.3 / 2) = 1.0 - 0.15 = 0.85
 * upperBound = 1.0 + (0.3 / 2) = 1.0 + 0.15 = 1.15
 * 
 * Range: 0.85 to 1.15 (±15% adjustment possible)
 * ```
 * 
 * Step 2: Calculate modifier
 * ```
 * modifier = 0.85 + (0.3 × 0.7)
 *          = 0.85 + 0.21
 *          = 1.06
 * ```
 * 
 * Step 3: Clamp to bounds
 * ```
 * result = clamp(1.06, 0.85, 1.15)
 *        = 1.06 (within bounds, no clamping needed)
 * ```
 * 
 * Interpretation:
 * "Combat-focused player (70%) gets enemy health increased by 6%"
 * 
 * === MORE EXAMPLES ===
 * 
 * Example 1: Neutral Player
 * ```typescript
 * calculateCanonicalModifier(0.5, 0.3)
 * // influence = 0.5 (neutral)
 * // lowerBound = 0.85
 * // modifier = 0.85 + (0.3 × 0.5) = 0.85 + 0.15 = 1.0
 * // Returns: 1.0 (no change for neutral player)
 * ```
 * 
 * Example 2: Maximum Archetype
 * ```typescript
 * calculateCanonicalModifier(1.0, 0.3)
 * // influence = 1.0 (100% focused)
 * // modifier = 0.85 + (0.3 × 1.0) = 1.15
 * // Returns: 1.15 (maximum increase)
 * ```
 * 
 * Example 3: Low Sensitivity
 * ```typescript
 * calculateCanonicalModifier(0.8, 0.1)
 * // sensitivity = 0.1 (parameter barely cares)
 * // lowerBound = 0.95, upperBound = 1.05
 * // modifier = 0.95 + (0.1 × 0.8) = 1.03
 * // Returns: 1.03 (small adjustment only)
 * ```
 * 
 * @param influence - Player's membership in archetype (0-1)
 * @param sensitivity - Parameter's responsiveness to archetype (0-1)
 * @returns Modifier for parameter scaling (typically 0.7-1.3)
 * 
 * === LEGACY NOTE ===
 * Based on original implementation that used lower/upper bound approach
 * for symmetric, bounded influence calculations.
 * 
 * ============================================================================
 */
export function calculateCanonicalModifier(influence: number, sensitivity: number): number {
    // Calculate the adjustment range
    const lowerBound = 1.0 - (sensitivity / 2);
    const upperBound = 1.0 + (sensitivity / 2);
    
    // Calculate linear interpolation across range
    const modifier = lowerBound + (sensitivity * influence);
    
    // Ensure result stays within calculated bounds
    return clamp(modifier, lowerBound, upperBound);
}

/**
 * ============================================================================
 * FUNCTION: isApproximatelyEqual()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Checks if two numbers are "close enough" to be considered equal.
 * 
 * === WHY DO WE NEED THIS? ===
 * 
 * **THE FLOATING-POINT PROBLEM:**
 * 
 * Computers can't store exact decimals:
 * ```typescript
 * 0.1 + 0.2 === 0.3  // Returns: false! 😱
 * 0.1 + 0.2          // Actually: 0.30000000000000004
 * ```
 * 
 * This causes bugs:
 * ```typescript
 * membership.combat + membership.collect + membership.explore === 1.0
 * // Returns: false (even though it should be true!)
 * // Actual sum: 0.9999999999999999 or 1.0000000000000002
 * ```
 * 
 * Solution: Check if difference is tiny instead of exact equality!
 * 
 * === THE FORMULA ===
 * ```
 * |a - b| < tolerance
 * ```
 * 
 * === EXAMPLES ===
 * 
 * Example 1: Floating-point rounding
 * ```typescript
 * isApproximatelyEqual(0.1 + 0.2, 0.3, 0.001)
 * // a = 0.30000000000000004
 * // b = 0.3
 * // difference = 0.00000000000000004
 * // tolerance = 0.001
 * // 0.00000000000000004 < 0.001 → true ✅
 * ```
 * 
 * Example 2: Membership validation
 * ```typescript
 * const sum = 0.333333 + 0.333333 + 0.333334
 * isApproximatelyEqual(sum, 1.0, 0.001)
 * // sum = 1.000000
 * // difference from 1.0 = 0.0
 * // Returns: true ✅
 * ```
 * 
 * Example 3: Actually different numbers
 * ```typescript
 * isApproximatelyEqual(1.5, 1.0, 0.001)
 * // difference = 0.5
 * // 0.5 < 0.001 → false ❌
 * // These are genuinely different!
 * ```
 * 
 * Example 4: Custom tolerance
 * ```typescript
 * isApproximatelyEqual(1.002, 1.0, 0.01)
 * // difference = 0.002
 * // 0.002 < 0.01 → true ✅ (within 1% tolerance)
 * 
 * isApproximatelyEqual(1.002, 1.0, 0.001)
 * // difference = 0.002
 * // 0.002 < 0.001 → false ❌ (exceeds 0.1% tolerance)
 * ```
 * 
 * @param a - First number
 * @param b - Second number
 * @param tolerance - Maximum acceptable difference (default: 0.001 = 0.1%)
 * @returns true if numbers are within tolerance, false otherwise
 * 
 * === COMMON TOLERANCES ===
 * - 0.001 (default): Good for most comparisons (0.1% precision)
 * - 0.00001: Very strict comparison (0.001% precision)
 * - 0.01: Looser comparison (1% precision)
 * - 1e-6: Scientific precision (0.0001%)
 * 
 * ============================================================================
 */
export function isApproximatelyEqual(a: number, b: number, tolerance: number = 0.001): boolean {
    // Calculate absolute difference
    // Math.abs ensures result is always positive
    return Math.abs(a - b) < tolerance;
}

/**
 * ============================================================================
 * USAGE EXAMPLES ACROSS THE SYSTEM
 * ============================================================================
 * 
 * === Example 1: Parameter Adaptation ===
 * ```typescript
 * // In adaptation.ts:
 * const rawValue = applyDirectScaling(baseHealth, multiplier);
 * const finalValue = clamp(rawValue, minHealth, maxHealth);
 * ```
 * 
 * === Example 2: Archetype Influence ===
 * ```typescript
 * // In game/mechanics.ts:
 * const modifier = calculateCanonicalModifier(combatMembership, sensitivity);
 * const adjustedMultiplier = globalMultiplier * modifier;
 * ```
 * 
 * === Example 3: Validation ===
 * ```typescript
 * // In clustering.ts:
 * const sum = soft_combat + soft_collect + soft_explore;
 * const isValid = isApproximatelyEqual(sum, 1.0, 1e-6);
 * ```
 * 
 * ============================================================================
 */
