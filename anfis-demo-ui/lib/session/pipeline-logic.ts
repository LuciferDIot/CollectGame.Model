import { runSimulationService } from '@/lib/engine/simulation-runner';
import type { DeathEvent, TelemetryFeatures as EngineFeatures } from '@/lib/engine/types';
import { PipelineState, PipelineStep } from '@/lib/types';
import { INITIAL_PIPELINE_STEPS } from './pipeline-constants';
import { buildFinalStateObject } from './state-builder';

export interface SimulationExecutionResult {
    backendResult: any;
    mappedState: Partial<PipelineState>;
    roundAnalytics: any;
    completedSteps: PipelineStep[];
}

export const executePipelineLogic = async (
    userId: string,
    telemetry: EngineFeatures, 
    deathEvents: DeathEvent[], 
    lastRound: any
): Promise<SimulationExecutionResult> => {
      // 1. Fetch from Backend
      const backendResult = await runSimulationService.fetchSimulationResults(telemetry as any, deathEvents as any, userId);
      
      // 2. Map to UI State
      const mappedState = runSimulationService.mapBackendToUI(backendResult);

      // 3. Round Analytics
      const nextRoundNumber = (lastRound?.roundNumber || 0) + 1;
      const roundAnalytics = runSimulationService.mapBackendToRoundAnalytics(
          backendResult, 
          telemetry as any, 
          nextRoundNumber
      );

      // 4. History Reconstruction
      // We import initial steps here to avoid passing them or create new ones
      const initialSteps = INITIAL_PIPELINE_STEPS; 
      const completedSteps = runSimulationService.reconstructPipelineSteps(
          initialSteps, 
          telemetry as any, 
          mappedState, 
          lastRound
      );

      return { backendResult, mappedState, roundAnalytics, completedSteps };
};

export const constructFinalState = (
    prevState: PipelineState,
    result: SimulationExecutionResult,
    executionTime: number
): PipelineState => {
    const { mappedState, completedSteps } = result;
    return buildFinalStateObject(prevState, mappedState, completedSteps, executionTime);
}
