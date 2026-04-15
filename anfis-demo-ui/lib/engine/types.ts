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
  deathCount: number;
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
  timestamp: string | number;
  deathCount?: number;
}

export interface NormalizedFeatures {
  [key: string]: number | number[];
}

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
  id: string; // Added for list identification
  base: number;
  final: number;
  clamped: boolean;
  metadata?: ParameterMetadata; // Optional trace back to config
}

export type ScalingMode = 'Direct' | 'Inverse';

export interface ArchetypeWeights {
  soft_combat?: number;
  soft_collect?: number;
  soft_explore?: number;
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
    rule_activations: any[];
    rulesFired: any[];
  };
  behavior_analysis?: {
    classification?: {
      active_behaviors: string[];
    };
  };
  fuzzification?: {
    soft_membership: SoftMembership;
  };
  target_multiplier: number;
  adapted_parameters: any;
  adaptation?: {
    parameter_adjustments: Record<string, number>;
  };
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
  /** Empirical [min, max] of the MLP's raw output -- stored for documentation. */
  output_range?: number[];
  /** MLP output for balanced (0.33,0.33,0.33) no-delta input -- the semantic neutral point.
   *  Recomputed and stored automatically by notebook 07 after each retrain. */
  mlp_neutral?: number;
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

/**
 * AdaptationAuditRecord
 *
 * Persisted for every runtime adaptation decision.  Captures the full context
 * of what was applied, whether any safety clamps fired, and whether the session
 * state was freshly reset -- enabling post-hoc evaluation of the bounded,
 * forward-only adaptation guarantee stated in the thesis.
 *
 * Storage suggestion: append to a rolling JSONL file per userId, or insert
 * into a dedicated `adaptation_audit` collection in MongoDB alongside the
 * existing telemetry documents.
 */
export interface AdaptationAuditRecord {
  /** Player this adaptation was computed for. */
  userId: string;
  /** ISO-8601 timestamp of when the decision was made (server-side). */
  timestamp: string;
  /** Final target multiplier delivered to the game (post-calibration, post-clamp). */
  targetMultiplier: number;
  /** The 12+ PCG parameter values that were sent to Unreal Engine. */
  adaptedParameters: Record<string, number>;
  /**
   * True when the raw MLP output + calibration fell outside [0.6, 1.4]
   * and had to be clamped.  Non-zero clamp rate indicates the model is
   * consistently hitting its safety boundary -- worth monitoring.
   */
  wasClamped: boolean;
  /**
   * True when the session timeout fired and deltas were zeroed.
   * Differentiates a "no behavioural change" signal from a "session reset"
   * signal, which is important for interpreting audit logs.
   */
  sessionResetApplied: boolean;
}

