/**
 * Pure Statistical Math Helpers.
 * Centralizes common statistical operations to avoid inline repetitive logic.
 */

/**
 * Calculates the arithmetic mean of an array of numbers.
 * Returns 0 if the array is empty.
 */
export function calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
}

/**
 * Calculates the standard deviation of an array of numbers.
 * Returns 0 if the array has fewer than 2 elements.
 */
export function calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = calculateMean(values);
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
    
    return Math.sqrt(variance);
}

/**
 * Calculates the sum of absolute values in an array.
 * Useful for magnitude calculations.
 */
export function calculateAbsoluteSum(values: number[]): number {
    return values.reduce((acc, val) => acc + Math.abs(val), 0);
}

/**
 * Calculates the Euclidean distance between two vectors.
 */
export function calculateEuclideanDistance(point1: number[], point2: number[]): number {
    if (point1.length !== point2.length) return 0;
    
    const squaredDiffSum = point1.reduce((acc, val, idx) => {
        return acc + Math.pow(val - point2[idx], 2);
    }, 0);
    
    return Math.sqrt(squaredDiffSum);
}
