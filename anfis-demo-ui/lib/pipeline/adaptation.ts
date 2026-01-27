// Unreal Engine Adaptation Contract Implementation (Option B)
// Matches 07_Unreal_Engine_Integration_Guide.md exactly

import type { AdaptationResult, AdaptedParameter, SoftMembership } from './types';

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate archetype modifier
 * Formula: clamp(0.85 + 0.30 * soft_X, 0.85, 1.15)
 */
function calculateArchetypeModifier(softMembership: number): number {
  return clamp(0.85 + 0.30 * softMembership, 0.85, 1.15);
}

interface AdaptationConfig {
  baseValue: number;
  multiplier: number;
  hardMin: number;
  hardMax: number;
  inverse?: boolean;
}

/**
 * Create adapted parameter with clamp tracking
 */
function adaptParameter(config: AdaptationConfig): AdaptedParameter {
  const { baseValue, multiplier, hardMin, hardMax, inverse = false } = config;
  const rawValue = inverse 
    ? baseValue / multiplier 
    : baseValue * multiplier;
  
  const finalValue = clamp(rawValue, hardMin, hardMax);
  
  return {
    base: baseValue,
    final: finalValue,
    clamped: rawValue !== finalValue,
  };
}

// Base values from Unreal Integration Guide
const BASE_VALUES = {
  enemySpawnInterval: 40,
  globalEnemyCap: 35,
  enemyDamageIntensity: 10,
  enemyMaxHealth: 100,
  aiDetectLooking: 1800,
  aiDetectAfter: 2200,
  aiMaxWalkSpeed: 450,
  staminaRegen: 12,
  staminaDamage: 5,
  dashCooldown: 3,
  collectibleCount: 120,
  collectibleSpawnInterval: 40,
  collectibleLifetime: 30,
  playerDamageIntensity: 16,
  playerMaxHealth: 180,
};

interface ParamConfig {
  baseValue: number;
  hardMin: number;
  hardMax: number;
  inverse?: boolean;
}

const PARAM_CONFIGS: Record<string, ParamConfig> = {
  // Combat
  enemy_spawn_interval: { baseValue: BASE_VALUES.enemySpawnInterval, hardMin: 20, hardMax: 80, inverse: true },
  global_enemy_cap: { baseValue: BASE_VALUES.globalEnemyCap, hardMin: 15, hardMax: 60 },
  enemy_damage_intensity: { baseValue: BASE_VALUES.enemyDamageIntensity, hardMin: 5, hardMax: 18 },
  enemy_max_health: { baseValue: BASE_VALUES.enemyMaxHealth, hardMin: 60, hardMax: 180 },
  
  // Exploration
  stamina_regen: { baseValue: BASE_VALUES.staminaRegen, hardMin: 6, hardMax: 24, inverse: true },
  stamina_damage: { baseValue: BASE_VALUES.staminaDamage, hardMin: 2, hardMax: 10 },
  dash_cooldown: { baseValue: BASE_VALUES.dashCooldown, hardMin: 1.5, hardMax: 5 },
  
  // Collection
  collectible_count: { baseValue: BASE_VALUES.collectibleCount, hardMin: 60, hardMax: 240, inverse: true },
  collectible_spawn_interval: { baseValue: BASE_VALUES.collectibleSpawnInterval, hardMin: 20, hardMax: 80 },
  collectible_lifetime: { baseValue: BASE_VALUES.collectibleLifetime, hardMin: 15, hardMax: 60, inverse: true },
  
  // Neutral
  player_damage_intensity: { baseValue: BASE_VALUES.playerDamageIntensity, hardMin: 10, hardMax: 32, inverse: true },
  player_max_health: { baseValue: BASE_VALUES.playerMaxHealth, hardMin: 120, hardMax: 360, inverse: true },
};

function applyAdaptationGroup(
  keys: string[],
  multiplier: number,
  modifier: number = 1.0
): Record<string, AdaptedParameter> {
  const result: Record<string, AdaptedParameter> = {};
  
  for (const key of keys) {
    const config = PARAM_CONFIGS[key];
    if (config) {
      result[key] = adaptParameter({
        ...config,
        multiplier: multiplier * modifier
      });
    }
  }
  
  return result;
}

/**
 * Apply Option B: Archetype-Aware Adaptation
 * 
 * This implements the exact formula from the Unreal Engine Integration Guide:
 * - ArchetypeModifier = clamp(0.85 + 0.30 * soft_X, 0.85, 1.15)
 * - EffectiveValue = clamp(BaseValue * M * ArchetypeModifier, HardMin, HardMax)
 * 
 * For inverse parameters (spawn intervals, regen, etc.):
 * - EffectiveValue = clamp(BaseValue / (M * ArchetypeModifier), HardMin, HardMax)
 */
export function applyAdaptationContract(
  targetMultiplier: number,
  softMembership: SoftMembership
): AdaptationResult {
  // Calculate archetype modifiers
  const A_c = calculateArchetypeModifier(softMembership.soft_combat);
  const A_e = calculateArchetypeModifier(softMembership.soft_explore);
  const A_l = calculateArchetypeModifier(softMembership.soft_collect);
  const M = targetMultiplier;

  return {
    ...applyAdaptationGroup(['enemy_spawn_interval', 'global_enemy_cap', 'enemy_damage_intensity', 'enemy_max_health'], M, A_c),
    ...applyAdaptationGroup(['stamina_regen', 'stamina_damage', 'dash_cooldown'], M, A_e),
    ...applyAdaptationGroup(['collectible_count', 'collectible_spawn_interval', 'collectible_lifetime'], M, A_l),
    ...applyAdaptationGroup(['player_damage_intensity', 'player_max_health'], M),
  } as unknown as AdaptationResult;
}

/**
 * Validate that all parameters are within their hard bounds
 */
export function validateAdaptation(result: AdaptationResult): boolean {
  return Object.values(result).every(param => !param.clamped);
}
