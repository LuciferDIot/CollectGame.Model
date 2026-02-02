import { Deltas, PipelineOutput, SoftMembership } from './types';

// --- Mapping Helpers ---
export function mapSoftMembership(soft: { soft_combat: number; soft_collect: number; soft_explore: number }) {
    return {
        combat: soft.soft_combat,
        collect: soft.soft_collect,
        explore: soft.soft_explore
    };
}

export function mapDeltasToArchetypes(deltas: { delta_combat: number; delta_collect: number; delta_explore: number }) {
    return {
        Combat: deltas.delta_combat,
        Collection: deltas.delta_collect,
        Exploration: deltas.delta_explore
    };
}

// --- Telemetry Helpers ---
export function formatTelemetryOutput(filtering: PipelineOutput['filtering']) {
    return {
        valid: filtering.passed,
        duration: `${filtering.duration_seconds}s`,
        events: 10 // Mock count, would be real in prod
    };
}

// --- Delta Math ---
export function calculatePreviousState(current: SoftMembership, deltas: Deltas): SoftMembership {
    return {
        soft_combat: current.soft_combat - deltas.delta_combat,
        soft_collect: current.soft_collect - deltas.delta_collect,
        soft_explore: current.soft_explore - deltas.delta_explore
    };
}

export function calculateDeltaVector(current: SoftMembership, previous: SoftMembership): Deltas {
    return {
        delta_combat: current.soft_combat - previous.soft_combat,
        delta_collect: current.soft_collect - previous.soft_collect,
        delta_explore: current.soft_explore - previous.soft_explore
    };
}

// --- Session Logic ---
export function hasSessionTimedOut(lastTimestamp: number, timeoutMs: number): boolean {
    return (Date.now() - lastTimestamp) > timeoutMs;
}

// --- Inference Helpers ---
export function getTopRules(rulesFired: PipelineOutput['inference']['rulesFired'], count: number = 3) {
    return rulesFired.slice(0, count);
}

// --- Aggregation Helpers ---
export function determineOptimizationStatus(validation: PipelineOutput['validation']): 'OPTIMAL' | 'CLAMPED' {
    return validation.all_params_in_bounds ? 'OPTIMAL' : 'CLAMPED';
}
