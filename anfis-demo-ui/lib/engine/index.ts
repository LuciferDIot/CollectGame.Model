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
    DeathEvent,
    DeploymentManifest,
    MLPWeights,
    PipelineOutput,
    ScalerParams,
    TelemetryWindow,
} from './types';

export class ANFISPipeline {
  private normalizer: MinMaxNormalizer;
  private clustering: KMeansSoftMembership;
  private mlp: MLPInference;
  private sessionManager: PipelineSessionManager;
  private manifest: DeploymentManifest;

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
  }

  /**
   * Main Pipeline Orchestrator
   * Executes the 8-Step ANFIS processing flow as defined in Thesis Section 4.2.
   * 
   * @param telemetry Raw telemetry window from the client
   * @param deaths Optional death events for context
   */
  process(telemetry: TelemetryWindow, deaths?: DeathEvent): PipelineOutput {
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
        })).sort((a,b) => b.strength - a.strength)
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
   * We squash all numbers into a range between 0 and 1.
   * Example: 50 Health (0-100 scale) becomes 0.5.
   */
  private step2_NormalizeFeatures(features: any) {
    return this.normalizer.normalize(features);
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
    return this.sessionManager.computeDeltasAndUpdate(userId, currentMembership, timestamp);
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
   * Helper: Safety Clamping
   * Ensures the Multiplier adheres to the deployment manifest constraints.
   */
  private computeTargetMultiplier(rawOutput: number): { targetMultiplier: number; multiplierClamped: boolean } {
    const [minM, maxM] = this.manifest.hard_constraints.target_multiplier_range;
    const targetMultiplier = Math.max(minM, Math.min(maxM, rawOutput));
    return {
      targetMultiplier,
      multiplierClamped: rawOutput !== targetMultiplier
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
