// --- Archetype \u0026 Category Helpers ---

export function getDominantArchetype(soft: { soft_combat: number; soft_collect: number; soft_explore: number }) {
    const max = Math.max(soft.soft_combat, soft.soft_collect, soft.soft_explore);
    if (max === soft.soft_combat) return 'combat';
    if (max === soft.soft_collect) return 'collect';
    return 'explore';
}

export function inferCategoryFromKey(key: string): 'Combat' | 'Collection' | 'Exploration' {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('enemy') || lowerKey.includes('damage') || lowerKey.includes('health')) return 'Combat';
    if (lowerKey.includes('collect') || lowerKey.includes('spawn')) return 'Collection';
    return 'Exploration';
}

// --- Math \u0026 Intensity Helpers ---

export function calculatePercentageChange(base: number, final: number): number {
    if (base === 0) return 0; // Avoid division by zero
    return Math.abs(final - base) / base;
}

export function determineIntensity(percentChange: number): 'low' | 'medium' | 'high' {
    if (percentChange > 0.2) return 'high';
    if (percentChange > 0.1) return 'medium';
    return 'low';
}

// --- Validation Helpers ---

import { isApproximatelyEqual } from '../math/formulas';

export function checkMembershipSumValidity(sum: number): 'valid' | 'warning' | 'error' {
    if (isApproximatelyEqual(sum, 1.0, 0.001)) return 'valid';
    if (!isApproximatelyEqual(sum, 1.0, 0.05)) return 'error'; // Error if diff > 0.05
    return 'warning';
}

export function calculateModelConfidence(currentConf: number): number {
    return currentConf > 0.8 ? 0.95 : 0.60;
}

export const DEFAULT_MODEL_METRICS = {
    r2Score: 0.965,
    maeTest: 0.012,
    mseTest: 0.0001,
    rmseTest: 0.01
};
