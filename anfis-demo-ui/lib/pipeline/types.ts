// Type definitions for the ANFIS pipeline

export interface TelemetryFeatures {
  enemiesHit: number;
  damageDone: number;
  timeInCombat: number;
  kills: number;
  itemsCollected: number;
  pickupAttempts: number;
  timeNearInteractables: number;
  distanceTraveled: number;
  timeSprinting: number;
  timeOutOfCombat: number;
}

export interface TelemetryWindow {
  userId: string;
  timestamp: string;
  features: TelemetryFeatures;
  duration?: number;
  rawJson?: any; // Should be ignored
}

export interface DeathEvent {
  userId: string;
  timestamp: string;
  deathCount?: number;
}

export interface NormalizedFeatures extends TelemetryFeatures {}

export interface ActivityScores {
  pct_combat: number;
  pct_collect: number;
  pct_explore: number;
}

export interface SoftMembership {
  soft_combat: number;
  soft_collect: number;
  soft_explore: number;
}

export interface Deltas {
  delta_combat: number;
  delta_collect: number;
  delta_explore: number;
}

export interface ANFISInput {
  soft_combat: number;
  soft_collect: number;
  soft_explore: number;
  delta_combat: number;
  delta_collect: number;
  delta_explore: number;
}

export interface AdaptedParameter {
  base: number;
  final: number;
  clamped: boolean;
}

export interface AdaptationResult {
  enemy_spawn_interval: AdaptedParameter;
  global_enemy_cap: AdaptedParameter;
  enemy_damage_intensity: AdaptedParameter;
  enemy_max_health: AdaptedParameter;
  stamina_regen: AdaptedParameter;
  stamina_damage: AdaptedParameter;
  dash_cooldown: AdaptedParameter;
  collectible_count: AdaptedParameter;
  collectible_spawn_interval: AdaptedParameter;
  collectible_lifetime: AdaptedParameter;
  player_damage_intensity: AdaptedParameter;
  player_max_health: AdaptedParameter;
}

export interface PipelineOutput {
  filtering: {
    passed: boolean;
    duration_seconds?: number;
  };
  normalized_features: NormalizedFeatures;
  activity_scores: ActivityScores;
  soft_membership: SoftMembership;
  deltas: Deltas;
  anfis_input: number[];
  mlp_output: number;
  // Exposing internal activations for visualization
  inference: {
    rulesFired: {
      ruleName: string;
      strength: number;
    }[];
  };
  target_multiplier: number;
  adapted_parameters: AdaptationResult;
  validation: {
    membership_sum: number;
    delta_range_ok: boolean;
    multiplier_clamped: boolean;
    all_params_in_bounds: boolean;
  };
}

export interface ScalerParams {
  features: string[];
  data_min: number[];
  data_max: number[];
  data_range: number[];
  min_value: number;
  max_value: number;
}

export interface ClusterCentroid {
  archetype: string; // 'Combat' | 'Collection' | 'Exploration'
  centroid: {
    pct_combat: number;
    pct_collect: number;
    pct_explore: number;
  };
}

export interface MLPWeights {
  architecture: {
    input_size: number;
    hidden_layers: number[];
    output_size: number;
    activation: string;
    output_activation: string;
  };
  feature_order: string[];
  weights: number[][][];
  biases: number[][];
  training_metrics: {
    train_mae: number;
    test_mae: number;
    train_mse: number;
    test_mse: number;
    train_r2: number;
    test_r2: number;
    num_iterations: number;
    num_samples: number;
  };
  version: string;
  status: string;
}

export interface DeploymentManifest {
  version: string;
  status: string;
  pipeline: {
    features: string[];
    num_features: number;
    k_clusters: number;
    anfis_architecture: string;
    training_samples: number;
  };
  hard_constraints: {
    duration_min_minutes: number;
    duration_cap_minutes: number;
    target_multiplier_range: number[]; // [min, max]
    archetype_modifier_range: number[]; // [min, max]
  };
}
