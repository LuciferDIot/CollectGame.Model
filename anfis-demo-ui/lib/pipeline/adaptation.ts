import type {
    AdaptationRegistry,
    AdaptationResult,
    AdaptedParameter,
    ParameterMetadata,
    ScalingMode,
    SoftMembership
} from './types';

/**
 * Default Configuration for Gameplay Parameters.
 * This acts as the central registry for all adaptable values.
 * Values are migrated from the original hardcoded implementation.
 */
export const DEFAULT_PARAMETER_REGISTRY: AdaptationRegistry = {
  // Combat Parameters
  enemy_spawn_interval: {
    id: 'enemy_spawn_interval',
    baseValue: 40,
    min: 20,
    max: 80,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: true, weights: { combat: 0.3 } } // Sensitivity 0.3
  },
  global_enemy_cap: {
    id: 'global_enemy_cap',
    baseValue: 35,
    min: 15,
    max: 60,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { combat: 0.3 } }
  },
  enemy_damage_intensity: {
    id: 'enemy_damage_intensity',
    baseValue: 10,
    min: 5,
    max: 18,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { combat: 0.3 } }
  },
  enemy_max_health: {
    id: 'enemy_max_health',
    baseValue: 100,
    min: 60,
    max: 180,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { combat: 0.3 } }
  },

  // Exploration Parameters
  stamina_regen: {
    id: 'stamina_regen',
    baseValue: 12,
    min: 6,
    max: 24,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: true, weights: { explore: 0.3 } }
  },
  stamina_damage: {
    id: 'stamina_damage',
    baseValue: 5,
    min: 2,
    max: 10,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { explore: 0.3 } }
  },
  dash_cooldown: {
    id: 'dash_cooldown',
    baseValue: 3,
    min: 1.5,
    max: 5,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { explore: 0.3 } }
  },

  // Collection Parameters
  collectible_count: {
    id: 'collectible_count',
    baseValue: 120,
    min: 60,
    max: 240,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: true, weights: { collect: 0.3 } }
  },
  collectible_spawn_interval: {
    id: 'collectible_spawn_interval',
    baseValue: 40,
    min: 20,
    max: 80,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { collect: 0.3 } }
  },
  collectible_lifetime: {
    id: 'collectible_lifetime',
    baseValue: 30,
    min: 15,
    max: 60,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: true, weights: { collect: 0.3 } }
  },

  // Neutral / Player Parameters
  player_damage_intensity: {
    id: 'player_damage_intensity',
    baseValue: 16,
    min: 10,
    max: 32,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: false }
  },
  player_max_health: {
    id: 'player_max_health',
    baseValue: 180,
    min: 120,
    max: 360,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: false }
  }
};

/**
 * Backend Adaptation Layer
 * 
 * Handles strict parameter scaling, safety clamping, and archetype influence.
 * Purely configuration driven.
 */
export class AdaptationBackend {
  constructor(private registry: AdaptationRegistry = DEFAULT_PARAMETER_REGISTRY) {}

  /**
   * Main entry point for adaptation.
   */
  public adapt(
    targetMultiplier: number,
    softMembership: SoftMembership
  ): AdaptationResult {
    const result: AdaptationResult = {};

    for (const key in this.registry) {
      const config = this.registry[key];
      result[key] = this.adaptSingleParameter(config, targetMultiplier, softMembership);
    }

    return result;
  }

  /**
   * Adapts a single parameter based on its metadata configuration.
   */
  private adaptSingleParameter(
    config: ParameterMetadata,
    multiplier: number,
    softMembership: SoftMembership
  ): AdaptedParameter {
    // 1. Calculate Aggregate Modifiers
    const archMod = this.computeArchetypeModifier(config, softMembership);
    
    // 2. Apply Scaling (Direct vs Inverse)
    const rawValue = this.applyScaling(config.baseValue, multiplier * archMod, config.scaling);

    // 3. Safety Clamping (Mandatory)
    const finalValue = this.clamp(rawValue, config.min, config.max);

    return {
      id: config.id,
      base: config.baseValue,
      final: finalValue,
      clamped: Math.abs(finalValue - rawValue) > 0.0001, // Float tolerance
      metadata: config
    };
  }

  /**
   * Computes the archetype influence modifier.
   * Uses the formula: 1.0 + (Sensitivity * (SoftMembership - 0.5)) ?
   * Or the canonical: clamp(0.85 + 0.30 * soft, 0.85, 1.15) which assumes sensitivity 0.3
   * General form: LowerBound + Sensitivity * SoftMember
   * where LowerBound = 1 - (Sensitivity / 2).
   */
  private computeArchetypeModifier(
    config: ParameterMetadata, 
    membership: SoftMembership
  ): number {
    if (!config.archetypeInfluence?.enabled) {
      return 1.0;
    }

    const weights = config.archetypeInfluence.weights;
    if (!weights) return 1.0;

    // Determine primary influence source
    let influence = 0;
    let sensitivity = 0.3; // Default canonical sensitivity

    if (weights.combat) {
      influence = membership.soft_combat;
      sensitivity = weights.combat;
    } else if (weights.explore) {
      influence = membership.soft_explore;
      sensitivity = weights.explore;
    } else if (weights.collect) {
      influence = membership.soft_collect;
      sensitivity = weights.collect;
    }

    // Canonical Formula Generalization
    // If sensitivity is 0.3, range is [0.85, 1.15]. Center is 1.0 at influence=0.5
    // 0.85 + 0.3 * influence
    const lowerBound = 1.0 - (sensitivity / 2);
    const upperBound = 1.0 + (sensitivity / 2);
    
    const modifier = lowerBound + (sensitivity * influence);
    
    return this.clamp(modifier, lowerBound, upperBound);
  }

  private applyScaling(base: number, totalMultiplier: number, mode: ScalingMode): number {
    if (mode === 'Inverse') {
      // Avoid division by zero
      const safeMultiplier = Math.max(0.001, totalMultiplier);
      return base / safeMultiplier;
    }
    return base * totalMultiplier;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

// Singleton Instance for direct usage
export const adaptationBackend = new AdaptationBackend();

/**
 * Legacy/Contract Interface
 * Maintains compatibility with existing pipeline imports.
 */
export function applyAdaptationContract(
  targetMultiplier: number,
  softMembership: SoftMembership
): AdaptationResult {
  return adaptationBackend.adapt(targetMultiplier, softMembership);
}

/**
 * Validation Helper
 */
export function validateAdaptation(result: AdaptationResult): boolean {
  return Object.values(result).every(param => !param.clamped);
}
