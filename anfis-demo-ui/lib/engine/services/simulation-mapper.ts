import { RoundAnalytics } from '@/lib/analytics/types';
import {
    calculateModelConfidence,
    DEFAULT_MODEL_METRICS,
    getDominantArchetype
} from '@/lib/analytics/utils';
import { PipelineState, TelemetryFeatures } from '../../types';
import {
    mapAdaptationDeltas,
    mapBehaviorCategories,
    mapValidationChecks
} from '../mappers';
import { PipelineOutput as BackendPipelineOutput } from '../types';
import {
    mapDeltasToArchetypes,
    mapSoftMembership
} from '../utils';

/**
 * Maps the backend API response to the UI State structure.
 */
export function mapBackendToUI(backendResult: BackendPipelineOutput): Partial<PipelineState> {
    return {
        normalizedFeatures: backendResult.normalized_features,
        behaviorCategories: mapBehaviorCategories(backendResult),
        validationChecks: mapValidationChecks(backendResult),
        adaptationDeltas: mapAdaptationDeltas(backendResult),
        rulesFired: backendResult.inference.rulesFired || [],
        softMembership: mapSoftMembership(backendResult.soft_membership),
        modelMetrics: DEFAULT_MODEL_METRICS,
        output: {
            adjustedMultiplier: backendResult.target_multiplier,
            confidence: calculateModelConfidence(backendResult.validation.membership_sum),
            ruleActivations: backendResult.inference.rulesFired || []
        },
        metadata: {
            deltas: mapDeltasToArchetypes(backendResult.deltas)
        }
    };
}

/**
 * Maps backend result to a RoundAnalytics object for history tracking
 */
export function mapBackendToRoundAnalytics(
    backendResult: BackendPipelineOutput, 
    telemetry: TelemetryFeatures, 
    roundNumber: number
): RoundAnalytics {
    return {
        roundNumber,
        timestamp: Date.now(),
        duration: 5,
        features: telemetry,
        deltas: {
            combat: backendResult.deltas.delta_combat,
            collect: backendResult.deltas.delta_collect,
            explore: backendResult.deltas.delta_explore
        },
        softMembership: {
            combat: backendResult.soft_membership.soft_combat,
            collect: backendResult.soft_membership.soft_collect,
            explore: backendResult.soft_membership.soft_explore
        },
        membershipSum: backendResult.validation.membership_sum,
        // @ts-ignore
        targetMultiplier: backendResult.target_multiplier, 
        adjustedMultiplier: backendResult.target_multiplier,
        dominantArchetype: getDominantArchetype(backendResult.soft_membership),
        deltaFromPrevious: null,
        isClamped: {
            lower: backendResult.target_multiplier <= 0.6,
            upper: backendResult.target_multiplier >= 1.4
        },
        ruleActivations: backendResult.inference.rulesFired || [],
        validation: {
            membership_sum: backendResult.validation.membership_sum,
            delta_range_ok: backendResult.validation.delta_range_ok,
            multiplier_clamped: backendResult.validation.multiplier_clamped,
            all_params_in_bounds: backendResult.validation.all_params_in_bounds
        }
    };
}
