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
  combat: number;
  collect: number;
  explore: number;
}

export interface ANFISInput {
  combat: number;
  collect: number;
  explore: number;
  delta_combat: number;
  delta_collect: number;
  delta_explore: number;
}

export interface AdaptedParameter {
  id: string; // Added for list identification
  base: number;
  final: number;
  clamped: boolean;
  metadata?: ParameterMetadata; // Optional trace back to config
}

export type ScalingMode = 'Direct' | 'Inverse';

export interface ArchetypeWeights {
  combat?: number;
  collect?: number;
  explore?: number;
}

export interface ParameterMetadata {
  id: string;
  baseValue: number;
  min: number;
  max: number;
  scaling: ScalingMode;
  archetypeInfluence?: {
    enabled: boolean;
    weights?: ArchetypeWeights;
  };
}

export type AdaptationRegistry = Record<string, ParameterMetadata>;

export type AdaptationResult = Record<string, AdaptedParameter>;

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

// UI/State types
// Re-export PipelineState from core types to maintain backward compatibility but single source of truth
export type { PipelineState } from '@/lib/types';
