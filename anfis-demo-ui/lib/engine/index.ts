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
    // MLP output for balanced (⅓,⅓,⅓) no-delta input — semantic neutral point.
    // Auto-recomputed by notebook 07 after each retrain; stored in anfis_mlp_weights.json.
    this.mlpNeutral = mlpWeights.mlp_neutral ?? 0.932;
  }

  process(telemetry: TelemetryWindow): PipelineOutput {
    const perfTimings: Record<string, number> = {};
    const t0 = performance.now();

    // Step 1: Validate
    this.step1_AcquireAndValidate(telemetry);

    // Step 2: Normalize (Min-Max, 12 features including 2 derived)
    const normalized = this.step2_NormalizeFeatures(telemetry.features);

    // Step 3: Activity scores (per-archetype averages → equal ceiling)
    const activityScores = this.step3_CalculateActivityScores(normalized);

    // Step 4: Soft membership via IDW (K=3)
    const softMembership = this.step4_FuzzyClustering(activityScores);

    // Step 5: Temporal deltas (window-to-window membership change)
    const timestamp = telemetry.timestamp
      ? new Date(telemetry.timestamp).getTime()
      : Date.now();

    const deltas = this.step5_ComputeDeltas(telemetry.userId, softMembership, timestamp);

    // Step 6: MLP forward pass (6→16→8→1)
    const { anfisInput, mlpResult } = this.step6_InferenceEngine(softMembership, deltas);

    // Step 7: Neutral-centred calibration + parameter adaptation
    const { targetMultiplier, multiplierClamped, adaptedParameters } = this.step7_AdaptationAnalysis(mlpResult.result, softMembership);

    // Step 8: Aggregate result
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

  private step1_AcquireAndValidate(telemetry: TelemetryWindow): void {
    validateDuration(telemetry.duration ?? 30);
  }

  /**
   * Computes two derived features from raw telemetry before passing to the scaler.
   *
   * damagePerHit = damageDone / max(enemiesHit, 1)
   *   Captures weapon-class-agnostic combat intensity. Snipers land few hits but
   *   high damage per hit; without this, sniper-style players are underrepresented
   *   in the combat score relative to their actual engagement.
   *
   * pickupAttemptRate = pickupAttempts / max(timeNearInteractables, 1)
   *   Distinguishes deliberate collectors (high rate) from explorers who pass near
   *   items incidentally (low rate), reducing cross-archetype contamination.
   */
  private step2_NormalizeFeatures(features: any) {
    const damage_per_hit = (features.damageDone ?? 0) / Math.max(features.enemiesHit ?? 0, 1);
    const pickup_attempt_rate = (features.pickupAttempts ?? 0) / Math.max(features.timeNearInteractables ?? 0, 1);
    const enrichedFeatures = { ...features, damage_per_hit, pickup_attempt_rate };
    return this.normalizer.normalize(enrichedFeatures);
  }

  private step3_CalculateActivityScores(normalized: any) {
    return calculateActivityScores(normalized);
  }

  private step4_FuzzyClustering(activityScores: any) {
    return this.clustering.calculateMembership(activityScores);
  }

  private step5_ComputeDeltas(userId: string, currentMembership: any, timestamp?: number) {
    return this.sessionManager.computeDeltasAndUpdate(userId, currentMembership);
  }

  private step6_InferenceEngine(softMembership: any, deltas: any) {
    const anfisInput = [
      softMembership.soft_combat,
      softMembership.soft_collect,
      softMembership.soft_explore,
      deltas.delta_combat,
      deltas.delta_collect,
      deltas.delta_explore,
    ];

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
      mlpResult: this.mlp.predict(inputObj)
    };
  }

  private step7_AdaptationAnalysis(rawOutput: number, softMembership: any) {
    const { targetMultiplier, multiplierClamped } = this.computeTargetMultiplier(rawOutput);
    const adaptedParameters = applyAdaptationContract(targetMultiplier, softMembership);
    return { targetMultiplier, multiplierClamped, adaptedParameters };
  }

  /**
   * Neutral-centred calibration:
   *   display = clamp(1.0 + (raw − mlp_neutral) × AMPLIFICATION, 0.6, 1.4)
   *
   * mlp_neutral is the MLP's raw output for the balanced (⅓,⅓,⅓,0,0,0) input —
   * the semantic definition of "no change needed". This ensures a balanced player
   * always maps to exactly 1.0 regardless of how the training distribution shifts
   * between retrains.
   *
   * AMPLIFICATION = 2.0: a raw deviation of ±0.4 from neutral (achievable by
   * moderate archetype + delta combinations) spans ±0.8 of the display range,
   * reaching the 0.6–1.4 extremes.
   */
  private computeTargetMultiplier(rawOutput: number): { targetMultiplier: number; multiplierClamped: boolean } {
    const [minM, maxM] = this.manifest.hard_constraints.target_multiplier_range;
    const AMPLIFICATION = 2.0;
    const rescaled = 1.0 + (rawOutput - this.mlpNeutral) * AMPLIFICATION;
    const targetMultiplier = Math.max(minM, Math.min(maxM, rescaled));
    return {
      targetMultiplier,
      multiplierClamped: rescaled !== targetMultiplier
    };
  }

  reset(userId?: string) {
    this.sessionManager.reset(userId);
  }

  processSequence(windows: TelemetryWindow[]): PipelineOutput[] {
    this.reset();
    return windows.map((window) => this.process(window));
  }
}
