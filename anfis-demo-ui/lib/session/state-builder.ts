import { PipelineState, PipelineStep } from '@/lib/types';

const DEFAULT_STATE_VALUES = {
    normalizedFeatures: null,
    softMembership: null,
    behaviorCategories: [],
    adaptationDeltas: [],
    validationChecks: [],
    rulesFired: [],
    metadata: null,
    output: null,
    modelMetrics: null
};

// Helper: Pure object construction
export const buildFinalStateObject = (
    prevState: PipelineState,
    mapped: Partial<PipelineState>,
    steps: PipelineStep[],
    time: number,
    pipelineProcessTime: number = 0
): PipelineState => {
    return {
        ...prevState,
        ...DEFAULT_STATE_VALUES,
        ...mapped,
        steps,
        isRunning: false,
        executionTime: time,
        pipelineProcessTime,
    } as PipelineState;
}
