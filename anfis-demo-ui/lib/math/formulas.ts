/**
 * Pure Mathematical Formulas used across the application.
 * Contains generic scaling, clamping, and algorithmic transformations.
 */

/**
 * Constrains a value between a minimum and maximum.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Applies direct linear scaling: Base * Multiplier
 */
export function applyDirectScaling(base: number, totalMultiplier: number): number {
    return base * totalMultiplier;
}

/**
 * Applies inverse scaling: Base / Multiplier
 * Safely handles division by zero or near-zero multipliers.
 */
export function applyInverseScaling(base: number, totalMultiplier: number): number {
    const safeMultiplier = Math.max(0.001, totalMultiplier);
    return base / safeMultiplier;
}

/**
 * Calculates the Canonical Modifier based on influence and sensitivity.
 * Formula: Center + (Sensitivity * (Influence - 0.5)) -> Normalized form?
 * 
 * Based on legacy implementation:
 * LowerBound = 1.0 - (Sensitivity / 2)
 * Modifier = LowerBound + (Sensitivity * Influence)
 * 
 * Example: Sensitivity 0.3, Influence 0.5 (Neutral)
 * Lower = 0.85
 * Mod = 0.85 + 0.15 = 1.0
 */
export function calculateCanonicalModifier(influence: number, sensitivity: number): number {
    const lowerBound = 1.0 - (sensitivity / 2);
    const upperBound = 1.0 + (sensitivity / 2);
    
    const modifier = lowerBound + (sensitivity * influence);
    
    return clamp(modifier, lowerBound, upperBound);
}

/**
 * Checks if two numbers are approximately equal within a tolerance.
 * Essential for floating point comparisons.
 */
export function isApproximatelyEqual(a: number, b: number, tolerance: number = 0.001): boolean {
    return Math.abs(a - b) < tolerance;
}
