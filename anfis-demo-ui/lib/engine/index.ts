// ------------------------------------------------------------------
// THE PIPELINE ORCHESTRATOR (The Conductor)
// ------------------------------------------------------------------
// This file is the "Brain" of the operation.
// Like a conductor in an orchestra, it tells every instrument (algorithm)
// when to play and what data to process.
//
// IT DOES NOT DO THE MATH ITSELF.
// It calls other dedicated workers (Normalizer, Clusterer, MLP) to do the heavy lifting.
// ------------------------------------------------------------------

import { PipelineSessionManager } from '../session/session-manager';
import { calculateActivityScores } from './activity';
import { applyAdaptationContract } from './adaptation';
import { KMeansSoftMembership } from './clustering';
import { MLPInference } from './mlp';
import { MinMaxNormalizer } from './normalization';
import {
  validateDuration,
  validatePipelineResult
} from './validators';

import type {
  ClusterCentroid,
  DeploymentManifest,
  MLPWeights,
  PipelineOutput,
  ScalerParams,
  TelemetryWindow
} from './types';

export class ANFISPipeline {
  private normalizer: MinMaxNormalizer;
  private clustering: KMeansSoftMembership;
  private mlp: MLPInference;
  private sessionManager: PipelineSessionManager;
  private manifest: DeploymentManifest;
  private mlpNeutral: number;

  constructor(
    scalerParams: ScalerParams,
    centroids: Record<string, ClusterCentroid>,
    mlpWeights: MLPWeights,
    manifest: DeploymentManifest
  ) {
    this.normalizer = new MinMaxNormalizer(scalerParams);
    this.clustering = new KMeansSoftMembership(centroids);
    this.mlp = new MLPInference(mlpWeights);
    this.sessionManager = new PipelineSessionManager();
    this.manifest = manifest;
    // Neutral baseline: MLP output for balanced (⅓,⅓,⅓) no-delta input.
    // Stored in anfis_mlp_weights.json; auto-updated by notebook 07 after each retrain.
    this.mlpNeutral = mlpWeights.mlp_neutral ?? 0.932;
  }

  /**
   * Main Pipeline Orchestrator
   * Executes the 8-Step ANFIS processing flow as defined in Thesis Section 4.2.
   * 
   * @param telemetry Raw telemetry window from the client
   * @param deaths Optional death events for context
   */
  process(telemetry: TelemetryWindow): PipelineOutput {
    const perfTimings: Record<string, number> = {};
    const t0 = performance.now();

    // Step 1: Telemetry Acquisition & Validation
    // Thesis Section 4.2.1
    this.step1_AcquireAndValidate(telemetry);

    // Step 2: Normalization
    // Eq 3.1: Min-Max Scaling
    const normalized = this.step2_NormalizeFeatures(telemetry.features);

    // Step 3: Activity Scoring
    // Eq 3.2: Heuristic Categorization
    const activityScores = this.step3_CalculateActivityScores(normalized);

    // Step 4: Fuzzy Clustering (Fuzzification)
    // Eq 3.5: Soft Membership (FCM-IDW)
    const softMembership = this.step4_FuzzyClustering(activityScores);

    // Step 5: Defuzzification & Temporal Dynamics
    // Eq 4.2: Delta Calculation (Velocity)
    // Parse timestamp if available (handles ISO strings)
    const timestamp = telemetry.timestamp
      ? new Date(telemetry.timestamp).getTime()
      : Date.now();

    const deltas = this.step5_ComputeDeltas(telemetry.userId, softMembership, timestamp);

    // Step 6: Inference Engine (Rules Layer)
    // Neural Surrogate Forward Pass
    const { anfisInput, mlpResult } = this.step6_InferenceEngine(softMembership, deltas);

    // Step 7: Adaptation Analysis
    // Constraint satisfaction and parameter scaling
    const { targetMultiplier, multiplierClamped, adaptedParameters } = this.step7_AdaptationAnalysis(mlpResult.result, softMembership);

    // Step 8: Result Aggregation
    // Final packaging for Client-Server contract
    perfTimings.total = performance.now() - t0;

    return {
      filtering: { passed: true, duration_seconds: telemetry.duration ?? 30 },
      normalized_features: normalized,
      activity_scores: activityScores,
      soft_membership: softMembership,
      deltas,
      anfis_input: anfisInput,
      mlp_output: mlpResult.result,
      inference: {
        rulesFired: mlpResult.activations.map((val, idx) => ({
          ruleName: `Hidden Neuron #${idx + 1}`,
          strength: val
        })).sort((a, b) => b.strength - a.strength)
      },
      target_multiplier: targetMultiplier,
      adapted_parameters: adaptedParameters,
      validation: validatePipelineResult(softMembership, deltas, adaptedParameters, multiplierClamped),
      performance_timings: perfTimings,
    } as any;
  }

  // --- Private "Thesis Step" Implementations ---

  /**
   * Step 1: Acquisition & Validation
   * Ensures data integrity before processing.
   */
  private step1_AcquireAndValidate(telemetry: TelemetryWindow): void {
    validateDuration(telemetry.duration ?? 30);
  }

  /**
   * Step 2: Feature Normalization (Min-Max)
   * ---------------------------------------
   * CONCEPT: "Comparing Apples to Apples"
   * The game sends us data in different units (e.g., Distance in meters, Damage in points).
   * The AI can't understand these raw numbers.
   *
   * WHAT WE DO:
   * We first compute two derived features from raw telemetry, then squash all numbers
   * into a range between 0 and 1 using the trained MinMax scaler.
   *
   * DERIVED FEATURES (v2.2):
   * - damagePerHit       = damageDone / max(enemiesHit, 1)
   *     Captures weapon-class-agnostic combat intensity. Sniper players land
   *     few hits but high damage-per-hit; spray players show the inverse.
   *     Without this, snipers are underrepresented in the combat score.
   *
   * - pickupAttemptRate  = pickupAttempts / max(timeNearInteractables, 1)
   *     Distinguishes deliberate collectors (high rate) from explorers who
   *     pass near items incidentally (low rate). Reduces cross-archetype
   *     contamination between Collection and Exploration clusters.
   */
  private step2_NormalizeFeatures(features: any) {
    // Pre-compute derived features from raw values before normalization
    const damage_per_hit = (features.damageDone ?? 0) / Math.max(features.enemiesHit ?? 0, 1);
    const pickup_attempt_rate = (features.pickupAttempts ?? 0) / Math.max(features.timeNearInteractables ?? 0, 1);

    // Merge derived features with raw telemetry — scaler picks them up by name
    const enrichedFeatures = { ...features, damage_per_hit, pickup_attempt_rate };
    return this.normalizer.normalize(enrichedFeatures);
  }

  /**
   * Step 3: Activity Scoring
   * ------------------------
   * CONCEPT: "Rule of Thumb"
   * Before asking the AI, we use simple logic to guess what the player is doing.
   * This is a "Heuristic" - a mental shortcut.
   */
  private step3_CalculateActivityScores(normalized: any) {
    return calculateActivityScores(normalized);
  }

  /**
   * Step 4: Fuzzy Clustering (The "Fuzzy" Part)
   * -------------------------------------------
   * CONCEPT: "Degrees of Truth"
   * In traditional logic, a player is either "Aggressive" OR "Passive". (Black and White).
   * In Fuzzy Logic, a player can be "80% Aggressive AND 20% Passive". (Shades of Grey).
   * 
   * WHAT WE DO:
   * We calculate how close the player is to our predefined "Archetypes" (Combat, Collect, Explore).
   */
  private step4_FuzzyClustering(activityScores: any) {
    return this.clustering.calculateMembership(activityScores);
  }

  /**
   * Step 5: Temporal Delta Computation
   * Calculates the rate of change (Velocity) of the user's state.
   * Delta = Current_Membership - Previous_Membership
   */
  private step5_ComputeDeltas(userId: string, currentMembership: any, timestamp?: number) {
    return this.sessionManager.computeDeltasAndUpdate(userId, currentMembership);
  }

  /**
   * Step 6: Inference Engine (The "Brain")
   * --------------------------------------
   * CONCEPT: "Neural Surrogate"
   * Real ANFIS rules are very slow to calculate mathematically.
   * Instead, we trained a small Neural Network (MLP) to mimic the ANFIS rules perfectly.
   * It's like having a cheat sheet that gives the answer instantly.
   */
  private step6_InferenceEngine(softMembership: any, deltas: any) {
    const anfisInput = [
      softMembership.soft_combat,
      softMembership.soft_collect,
      softMembership.soft_explore,
      deltas.delta_combat,
      deltas.delta_collect,
      deltas.delta_explore,
    ];

    // Object form for MLP (matches internal key structure)
    const inputObj = {
      soft_combat: softMembership.soft_combat,
      soft_collect: softMembership.soft_collect,
      soft_explore: softMembership.soft_explore,
      delta_combat: deltas.delta_combat,
      delta_collect: deltas.delta_collect,
      delta_explore: deltas.delta_explore,
    };

    return {
      anfisInput,
      mlpResult: this.mlp.predict(inputObj) // <-- The Magic happens here
    };
  }

  /**
   * Step 7: Adaptation Analysis
   * ---------------------------
   * CONCEPT: "The Contract"
   * The AI gives us a "Global Multiplier" (e.g., 1.2x Difficulty).
   * We need to translate this into specific changes for the game (e.g., Enemy Health * 1.2).
   * 
   * SAFETY:
   * We also apply "Clamps" (0.6x to 1.4x) to ensure the game never becomes impossible
   * or too boring, even if the AI suggests extreme values.
   */
  private step7_AdaptationAnalysis(rawOutput: number, softMembership: any) {
    const { targetMultiplier, multiplierClamped } = this.computeTargetMultiplier(rawOutput);
    const adaptedParameters = applyAdaptationContract(targetMultiplier, softMembership);

    return { targetMultiplier, multiplierClamped, adaptedParameters };
  }

  /**
   * Helper: Safety Clamping + Output Rescaling
   *
   * WHY RESCALING IS NEEDED:
   * The MLP surrogate was trained on ANFIS outputs that fell in the range
   * [0.535, 0.976] — the training dataset only contained sessions where the
   * AI recommended "easier" adjustments. Without rescaling the MLP always
   * produces values below 1.0 (always "easier"), and the full [0.6, 1.4]
   * deployment range is never reached.
   *
   * The rescaling linearly maps the empirical MLP output range → deployment
   * range so that:
   *   MLP min (0.535) → deployment min (0.6)   — maximum easier
   * Neutral-centred mapping:
   *   raw == mlp_neutral  → 1.0  (no change)
   *   raw >  mlp_neutral  → harder  (amplified by AMPLIFICATION)
   *   raw <  mlp_neutral  → easier  (amplified by AMPLIFICATION)
   *
   * mlp_neutral is stored in anfis_mlp_weights.json and auto-updated by
   * notebook 07 after each retrain — no code changes needed.
   * AMPLIFICATION is a fixed design constant (±0.4 raw → ±0.8 display).
   */
  private computeTargetMultiplier(rawOutput: number): { targetMultiplier: number; multiplierClamped: boolean } {
    const [minM, maxM] = this.manifest.hard_constraints.target_multiplier_range;

    // Amplification: how much a 1-unit deviation from neutral shifts the display.
    // 2.0 means raw±0.4 from neutral → display±0.8 (reaching the 0.6–1.4 extremes).
    const AMPLIFICATION = 2.0;
    const rescaled = 1.0 + (rawOutput - this.mlpNeutral) * AMPLIFICATION;

    const targetMultiplier = Math.max(minM, Math.min(maxM, rescaled));
    return {
      targetMultiplier,
      multiplierClamped: rescaled !== targetMultiplier
    };
  }

  // Delegate reset to session manager
  reset(userId?: string) {
    this.sessionManager.reset(userId);
  }

  processSequence(windows: TelemetryWindow[]): PipelineOutput[] {
    this.reset();
    return windows.map((window) => this.process(window));
  }
}
