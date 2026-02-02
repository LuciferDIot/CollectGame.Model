import { ParameterMetadata, SoftMembership } from '../engine/types';

/**
 * Game Mechanics and Rules
 * Contains domain-specific logic for how game systems interact.
 */

interface ArchetypeInfluence {
    influence: number;
    sensitivity: number;
}

/**
 * Determines which archetype influences a parameter and by how much.
 * Reads the parameter configuration's weights and the current player membership.
 */
export function getArchetypeInfluence(
    config: ParameterMetadata, 
    membership: SoftMembership
): ArchetypeInfluence {
    // Default fallback (Neutral)
    const result = { influence: 0, sensitivity: 0.3 };

    if (!config.archetypeInfluence?.enabled || !config.archetypeInfluence.weights) {
        return { influence: 0, sensitivity: 0 }; // No influence
    }

    const weights = config.archetypeInfluence.weights;

    if (weights.combat) {
        result.influence = membership.soft_combat;
        result.sensitivity = weights.combat;
    } else if (weights.explore) {
        result.influence = membership.soft_explore;
        result.sensitivity = weights.explore;
    } else if (weights.collect) {
        result.influence = membership.soft_collect;
        result.sensitivity = weights.collect;
    }

    return result;
}

/**
 * Calculates a component score by summing its normalized feature contributions.
 */
export function calculateComponentSum(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0);
}

/**
 * Calculates a percentage share of a total score.
 * Handles division by zero by returning a balanced default (0.3333).
 */
export function calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0.3333;
    return part / total;
}
