import type {
  AdaptationRegistry,
  AdaptationResult,
  AdaptedParameter,
  ParameterMetadata,
  SoftMembership
} from './types';

/**
 * Perceived-difficulty sensitivity per parameter.
 *
 * These replace the previous uniform 0.3. Each value reflects how perceptible
 * a change in that parameter is to a player. Higher = player notices smaller
 * deltas -> system makes subtler adjustments before the player feels it.
 *
 * Rationale:
 *   ENEMY_HEALTH  0.20 -- health only manifests as time-to-kill; subtle at small deltas
 *   ENEMY_DAMAGE  0.25 -- damage spike is felt immediately on being hit; moderate
 *   SPAWN_RATE    0.35 -- more enemies on screen is immediately obvious
 *   SPAWN_DELAY   0.30 -- faster respawns are noticed within 1-2 encounters
 *
 * Parameters not listed here (collectible_*, stamina_*, player_*, dash_cooldown)
 * retain 0.3 as a neutral default pending dedicated gameplay tuning data.
 */
const SENSITIVITY = {
  ENEMY_HEALTH: 0.20,
  ENEMY_DAMAGE: 0.25,
  SPAWN_RATE: 0.35,
  SPAWN_DELAY: 0.30,
  DEFAULT: 0.30,  // kept as named constant for traceability
} as const;


export const DEFAULT_PARAMETER_REGISTRY: AdaptationRegistry = {
  // Combat Parameters
  enemy_spawn_interval: {
    id: 'enemy_spawn_interval',
    baseValue: 40,
    min: 20,
    max: 80,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: true, weights: { soft_combat: SENSITIVITY.SPAWN_DELAY } }
  },
  global_enemy_cap: {
    id: 'global_enemy_cap',
    baseValue: 35,
    min: 15,
    max: 60,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { soft_combat: SENSITIVITY.SPAWN_RATE } }
  },
  enemy_damage_intensity: {
    id: 'enemy_damage_intensity',
    baseValue: 10,
    min: 5,
    max: 18,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { soft_combat: SENSITIVITY.ENEMY_DAMAGE } }
  },
  enemy_max_health: {
    id: 'enemy_max_health',
    baseValue: 100,
    min: 60,
    max: 180,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { soft_combat: SENSITIVITY.ENEMY_HEALTH } }
  },

  // Exploration Parameters
  stamina_regen: {
    id: 'stamina_regen',
    baseValue: 12,
    min: 6,
    max: 24,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: true, weights: { soft_explore: 0.3 } }
  },
  stamina_damage: {
    id: 'stamina_damage',
    baseValue: 5,
    min: 2,
    max: 10,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { soft_explore: 0.3 } }
  },
  dash_cooldown: {
    id: 'dash_cooldown',
    baseValue: 3,
    min: 1.5,
    max: 5,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { soft_explore: 0.3 } }
  },

  // Collection Parameters
  collectible_count: {
    id: 'collectible_count',
    baseValue: 120,
    min: 60,
    max: 240,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: true, weights: { soft_collect: 0.3 } }
  },
  collectible_spawn_interval: {
    id: 'collectible_spawn_interval',
    baseValue: 40,
    min: 20,
    max: 80,
    scaling: 'Direct',
    archetypeInfluence: { enabled: true, weights: { soft_collect: 0.3 } }
  },
  collectible_lifetime: {
    id: 'collectible_lifetime',
    baseValue: 30,
    min: 15,
    max: 60,
    scaling: 'Inverse',
    archetypeInfluence: { enabled: true, weights: { soft_collect: 0.3 } }
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
import { getArchetypeInfluence } from '../game/mechanics';
import {
  applyDirectScaling,
  applyInverseScaling,
  calculateCanonicalModifier,
  clamp
} from '../math/formulas';

// ... (Registry Omitted, unchanged) ...

export class AdaptationBackend {
  constructor(private registry: AdaptationRegistry = DEFAULT_PARAMETER_REGISTRY) { }

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
    // 1. Calculate Aggregate Modifiers from Game Mechanics
    const { influence, sensitivity } = getArchetypeInfluence(config, softMembership);

    // 2. Pure Math: Calculate Canonical Modifier
    const archMod = (sensitivity > 0)
      ? calculateCanonicalModifier(influence, sensitivity)
      : 1.0;

    // 3. Pure Math: Apply Scaling (Direct vs Inverse)
    const totalMultiplier = multiplier * archMod;
    const rawValue = (config.scaling === 'Inverse')
      ? applyInverseScaling(config.baseValue, totalMultiplier)
      : applyDirectScaling(config.baseValue, totalMultiplier);

    // 4. Pure Math: Safety Clamping
    const finalValue = clamp(rawValue, config.min, config.max);

    return {
      id: config.id,
      base: config.baseValue,
      final: finalValue,
      clamped: Math.abs(finalValue - rawValue) > 0.0001,
      metadata: config
    };
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
