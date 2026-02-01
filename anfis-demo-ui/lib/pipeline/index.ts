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
  // State: Map<UserId, UserState> to handle multi-user sessions
  private userStates: Map<string, { lastSoftMembership: SoftMembership; lastTimestamp: number }> = new Map();
  private readonly STATE_TIMEOUT_MS = 40000; // 40 seconds

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
    const perfTimings: Record<string, number> = {};
    const duration_seconds = telemetry.duration ?? 30;
    const userId = telemetry.userId; // Essential for state management
    
    this.validateDuration(duration_seconds);

    // Step 2-5: Feature Processing & Clustering
    const cleanedFeatures = { ...telemetry.features };
    
    const t0 = performance.now();
    const normalized = this.normalizer.normalize(cleanedFeatures);
    perfTimings.normalization = performance.now() - t0;
    
    const t1 = performance.now();
    const activityScores = calculateActivityScores(normalized);
    perfTimings.activityScoring = performance.now() - t1;
    
    const t2 = performance.now();
    const softMembership = this.clustering.calculateMembership(activityScores);
    perfTimings.clustering = performance.now() - t2;
    
    if (!this.clustering.validateMembership(softMembership)) {
      console.warn('Soft membership does not sum to 1.0:', softMembership);
    }

    // Step 6: Delta Computation
    const t3 = performance.now();
    const deltas = this.computeDeltas(userId, softMembership);
    perfTimings.deltaComputation = performance.now() - t3;
    
    // Update State for next window
    this.userStates.set(userId, {
        lastSoftMembership: { ...softMembership },
        lastTimestamp: Date.now()
    });

    // Step 7-8: ANFIS Input & Inference
    const anfisInput = {
      soft_combat: softMembership.soft_combat,
      soft_collect: softMembership.soft_collect,
      soft_explore: softMembership.soft_explore,
      delta_combat: deltas.delta_combat,
      delta_collect: deltas.delta_collect,
      delta_explore: deltas.delta_explore,
    };
    const t4 = performance.now();
    const mlpResult = this.mlp.predict(anfisInput);
    perfTimings.mlpInference = performance.now() - t4;
    const mlpOutput = mlpResult.result;

    // Step 9: Target Multiplier
    const { targetMultiplier, multiplierClamped } = this.computeTargetMultiplier(mlpOutput);

    // Step 10: Adaptation
    const t5 = performance.now();
    const adaptedParameters = applyAdaptationContract(targetMultiplier, softMembership);
    perfTimings.adaptation = performance.now() - t5;

    // Final Validation & Return
    perfTimings.total = performance.now() - t0;
    
    // Log performance in development
    if (typeof window !== 'undefined' && (window as any).__ANFIS_DEBUG__) {
      console.log('[ANFIS Performance]', perfTimings);
    }
    
    return {
      filtering: { passed: true, duration_seconds },
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
      performance_timings: perfTimings,
    } as any;
  }

  private validateDuration(seconds: number): void {
    const DEMO_MIN_SECONDS = 20;
    const DEMO_MAX_SECONDS = 300; // 5 minutes

    if (seconds < DEMO_MIN_SECONDS || seconds > DEMO_MAX_SECONDS) {
      console.warn(
        `Duration ${seconds}s outside demo range [${DEMO_MIN_SECONDS}s, ${DEMO_MAX_SECONDS}s]`
      );
    }
  }

  private computeDeltas(userId: string, current: SoftMembership): Deltas {
    const userState = this.userStates.get(userId);
    const now = Date.now();

    // Condition 1: New User (No history)
    if (!userState) {
      return { delta_combat: 0, delta_collect: 0, delta_explore: 0 };
    }

    // Condition 2: Stale Session (Timeout exceeded)
    // If the lag between requests is > 40s, we reset delta to 0 prevents 
    // calculating velocity across a pause screen or disconnect
    if (now - userState.lastTimestamp > this.STATE_TIMEOUT_MS) {
        console.log(`[Pipeline] Session timeout for ${userId} (>${this.STATE_TIMEOUT_MS}ms). Resetting Deltas.`);
        return { delta_combat: 0, delta_collect: 0, delta_explore: 0 };
    }

    // Normal calculation
    return {
      delta_combat: current.soft_combat - userState.lastSoftMembership.soft_combat,
      delta_collect: current.soft_collect - userState.lastSoftMembership.soft_collect,
      delta_explore: current.soft_explore - userState.lastSoftMembership.soft_explore,
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
  /**
   * Reset delta state (for new player sessions or debugging)
   * can pass userId to reset specific user, or null/undefined to reset ALL
   */
  reset(userId?: string) {
    if (userId) {
        this.userStates.delete(userId);
    } else {
        this.userStates.clear();
    }
  }

  /**
   * Process multiple windows in sequence (for session simulation)
   */
  processSequence(windows: TelemetryWindow[]): PipelineOutput[] {
    this.reset();
    return windows.map((window) => this.process(window));
  }
}
