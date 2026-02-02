import type { TelemetryFeatures } from '@/lib/engine/types';

/**
 * Configuration for pipeline execution
 */
export interface PipelineExecutionConfig {
    userId: string;
    telemetry: TelemetryFeatures;
    deathEvents: any[];
    lastRound: any;
    executePipelineLogic: Function;
    onError: (error: any) => void;
}

/**
 * Execute pipeline logic with error handling
 * Uses config object to avoid excess function arguments
 */
export async function executePipelineWithErrorHandling(config: PipelineExecutionConfig) {
    try {
        const startTime = performance.now();
        const result = await config.executePipelineLogic(
            config.userId, 
            config.telemetry, 
            config.deathEvents as any[], 
            config.lastRound || undefined
        );
        
        const executionTime = performance.now() - startTime;
        return { result, executionTime };
    } catch (e) {
        console.error("Simulation failed", e);
        config.onError(e);
        return null;
    }
}
