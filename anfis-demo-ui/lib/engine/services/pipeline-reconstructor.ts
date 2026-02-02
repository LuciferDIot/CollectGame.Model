import { RoundAnalytics } from '@/lib/analytics/types';
import { PipelineState, PipelineStep, TelemetryFeatures } from '../../types';

/**
 * Reconstructs the steps with their final outputs for the "Result" view.
 */
export function reconstructPipelineSteps(
    initialSteps: PipelineStep[], 
    telemetry: TelemetryFeatures, 
    mappedState: Partial<PipelineState>, 
    roundAnalytics?: RoundAnalytics
): PipelineStep[] {
    const steps = initialSteps.map(step => ({ ...step, status: 'completed' as const }));
    
    // Helper to reconstruct state derivation data
    const deltas = mappedState.metadata?.deltas;
    const currentSoft = mappedState.softMembership;

    const deltaOutput = (deltas && currentSoft) ? {
        behavioralDeltas: deltas,
        previousState: {
            softMembership: {
                combat: currentSoft.combat - deltas.Combat,
                collect: currentSoft.collect - deltas.Collection,
                explore: currentSoft.explore - deltas.Exploration
            }
        }
    } : {};

    // 1. Telemetry
    steps[0].output = { valid: true, count: Object.keys(telemetry).length };
    
    // 2. Normalization
    steps[1].output = mappedState.normalizedFeatures;
    
    // 3. Activity Scoring
    // steps[2] is Activity Scoring
    
    // 4. Clustering (Soft Membership)
    steps[3].output = mappedState.softMembership;

    // 5. Defuzzification (Velocity)
    steps[4].output = { ...deltaOutput };

    // 6. Inference (Rules)
    steps[5].output = { 
        firingStrength: mappedState.rulesFired?.slice(0, 3) || [],
        methodConfidence: 0.95 
    };

    // 7. Adaptation Analysis (Context + Latency)
    steps[6].output = { ...deltaOutput };

    // 8. Results Aggregation
    steps[7].output = { 
        finalMultiplier: roundAnalytics?.adjustedMultiplier || 1.0, 
        status: 'Optimized',
        adaptedParameters: mappedState.adaptationDeltas,
        validationChecks: mappedState.validationChecks
    };
    
    return steps;
}
