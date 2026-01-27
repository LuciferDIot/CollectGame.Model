// Main Pipeline Orchestrator
// Executes the complete ANFIS pipeline from raw telemetry to adapted parameters

import { calculateActivityScores } from './activity';
import { applyAdaptationContract } from './adaptation';
import { KMeansSoftMembership } from './clustering';
import { MLPInference } from './mlp';
import { MinMaxNormalizer } from './normalization';
import type {
    ClusterCentroid,
    DeathEvent,
    Deltas,
    DeploymentManifest,
    MLPWeights,
    PipelineOutput,
    ScalerParams,
    SoftMembership,
    TelemetryWindow,
} from './types';

export class ANFISPipeline {
  private normalizer: MinMaxNormalizer;
  private clustering: KMeansSoftMembership;
  private mlp: MLPInference;
  private manifest: DeploymentManifest;
  private previousSoftMembership: { soft_combat: number; soft_collect: number; soft_explore: number } | null = null;

  constructor(
    scalerParams: ScalerParams,
    centroids: Record<string, ClusterCentroid>,
    mlpWeights: MLPWeights,
    manifest: DeploymentManifest
  ) {
    this.normalizer = new MinMaxNormalizer(scalerParams);
    this.clustering = new KMeansSoftMembership(centroids);
    this.mlp = new MLPInference(mlpWeights);
    this.manifest = manifest;
  }

  /**
   * Execute the full pipeline on a telemetry window
   */
  process(telemetry: TelemetryWindow, deaths?: DeathEvent): PipelineOutput {
    const duration_minutes = (telemetry.duration ?? 30) / 60;
    this.validateDuration(duration_minutes);

    // Step 2-5: Feature Processing & Clustering
    const cleanedFeatures = { ...telemetry.features };
    const normalized = this.normalizer.normalize(cleanedFeatures);
    const activityScores = calculateActivityScores(normalized);
    const softMembership = this.clustering.calculateMembership(activityScores);
    
    if (!this.clustering.validateMembership(softMembership)) {
      console.warn('Soft membership does not sum to 1.0:', softMembership);
    }

    // Step 6: Delta Computation
    const deltas = this.computeDeltas(softMembership);
    this.previousSoftMembership = { ...softMembership };

    // Step 7-8: ANFIS Input & Inference
    const anfisInput = {
      soft_combat: softMembership.soft_combat,
      soft_collect: softMembership.soft_collect,
      soft_explore: softMembership.soft_explore,
      delta_combat: deltas.delta_combat,
      delta_collect: deltas.delta_collect,
      delta_explore: deltas.delta_explore,
    };
    const mlpResult = this.mlp.predict(anfisInput);
    const mlpOutput = mlpResult.result;

    // Step 9: Target Multiplier
    const { targetMultiplier, multiplierClamped } = this.computeTargetMultiplier(mlpOutput);

    // Step 10: Adaptation
    const adaptedParameters = applyAdaptationContract(targetMultiplier, softMembership);

    // Final Validation & Return
    return {
      filtering: { passed: true, duration_minutes },
      normalized_features: normalized,
      activity_scores: activityScores,
      soft_membership: softMembership,
      deltas,
      anfis_input: [
        anfisInput.soft_combat,
        anfisInput.soft_collect,
        anfisInput.soft_explore,
        anfisInput.delta_combat,
        anfisInput.delta_collect,
        anfisInput.delta_explore,
      ],
      mlp_output: mlpOutput,
      inference: {
        rulesFired: mlpResult.activations.map((val, idx) => ({
          ruleName: `Hidden Neuron #${idx + 1}`,
          strength: val
        })).sort((a,b) => b.strength - a.strength) // Auto-sort by strength for UI
      },
      target_multiplier: targetMultiplier,
      adapted_parameters: adaptedParameters,
      validation: this.validateResult(softMembership, deltas, adaptedParameters, multiplierClamped),
    };
  }

  private validateDuration(minutes: number): void {
    const { duration_min_minutes, duration_cap_minutes } = this.manifest.hard_constraints;
    if (minutes < duration_min_minutes || minutes > duration_cap_minutes) {
      console.warn(
        `Duration ${minutes.toFixed(1)}min outside production range [${duration_min_minutes}, ${duration_cap_minutes}] - allowing for demo`
      );
    }
  }

  private computeDeltas(current: SoftMembership): Deltas {
    if (!this.previousSoftMembership) {
      return { delta_combat: 0, delta_collect: 0, delta_explore: 0 };
    }
    return {
      delta_combat: current.soft_combat - this.previousSoftMembership.soft_combat,
      delta_collect: current.soft_collect - this.previousSoftMembership.soft_collect,
      delta_explore: current.soft_explore - this.previousSoftMembership.soft_explore,
    };
  }

  private computeTargetMultiplier(rawOutput: number): { targetMultiplier: number; multiplierClamped: boolean } {
    const [minM, maxM] = this.manifest.hard_constraints.target_multiplier_range;
    const targetMultiplier = Math.max(minM, Math.min(maxM, rawOutput));
    return {
      targetMultiplier,
      multiplierClamped: rawOutput !== targetMultiplier
    };
  }

  private validateResult(
    softMembership: SoftMembership,
    deltas: Deltas,
    adaptedParams: any,
    multiplierClamped: boolean
  ) {
    const membershipSum = softMembership.soft_combat + softMembership.soft_collect + softMembership.soft_explore;
    const deltaRangeOk = 
      Math.abs(deltas.delta_combat) <= 1.0 &&
      Math.abs(deltas.delta_collect) <= 1.0 &&
      Math.abs(deltas.delta_explore) <= 1.0;
    
    const allParamsInBounds = Object.values(adaptedParams).every((param: any) => !param.clamped);

    return {
      membership_sum: membershipSum,
      delta_range_ok: deltaRangeOk,
      multiplier_clamped: multiplierClamped,
      all_params_in_bounds: allParamsInBounds,
    };
  }

  /**
   * Reset delta state (for new player sessions)
   */
  reset() {
    this.previousSoftMembership = null;
  }

  /**
   * Process multiple windows in sequence (for session simulation)
   */
  processSequence(windows: TelemetryWindow[]): PipelineOutput[] {
    this.reset();
    return windows.map((window) => this.process(window));
  }
}
