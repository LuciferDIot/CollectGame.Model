import { RoundAnalytics } from '@/lib/analytics/types';
import { TelemetryFeatures as EngineFeatures } from '@/lib/engine/types';
import { DashboardInputState, PipelineState } from '@/lib/types';
import { useRef } from 'react';
import { animateSimulation } from './animation';
import { mergeTelemetryWithDeaths, parseTelemetry } from './parsers';
import { INITIAL_PIPELINE_STEPS } from './pipeline-constants';
import { constructFinalState, executePipelineLogic } from './pipeline-logic';

interface SimulationRunnerProps {
    inputState: DashboardInputState;
    setInputState: React.Dispatch<React.SetStateAction<DashboardInputState>>;
    pipelineState: PipelineState;
    setPipelineState: React.Dispatch<React.SetStateAction<PipelineState>>;
    setSimulationResult: React.Dispatch<React.SetStateAction<PipelineState | null>>;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    setStepByStepMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export function usePipelineRunner({
    inputState,
    setInputState,
    pipelineState,
    setPipelineState,
    setSimulationResult,
    setCurrentStep,
    setStepByStepMode
}: SimulationRunnerProps) {
    
    const lastRoundRef = useRef<RoundAnalytics | null>(null);

    const initSimulationState = (stepByStep: boolean) => {
        setStepByStepMode(stepByStep);
        setCurrentStep(0);
        setPipelineState((prev) => ({
          ...prev,
          steps: INITIAL_PIPELINE_STEPS,
          isRunning: true,
          executionTime: 0,
        }));
    };

    const handleSimulationPlayback = async (
        stepByStep: boolean, 
        result: any, 
        finalState: PipelineState, 
        executionTime: number
    ) => {
        if (!stepByStep) {
            setPipelineState(finalState);
        } else {
            await animateSimulation({
                initialSteps: INITIAL_PIPELINE_STEPS, 
                completedSteps: result.completedSteps, 
                finalState, 
                executionTime, 
                setPipelineState
            });
        }
    };

    // Helper: Validate inputs (Refactored CC = 1)
    const validateInputs = () => {
        const parsed = parseTelemetry(inputState.telemetryJson);
        const features = parsed?.features as unknown as EngineFeatures;
        
        if (!features) {
          setInputState((prev) => ({ ...prev, telemetryError: 'Invalid telemetry JSON' }));
          return null;
        }

        const userId = parsed?.userId || 'unknown-user';
        const unifiedTelemetry = mergeTelemetryWithDeaths(features, inputState.deathEventsJson);

        return { userId, telemetry: unifiedTelemetry };
    };

    // Main simulation runner (CC = 3)
    const runSimulation = async (stepByStep: boolean = false) => {
        const inputs = validateInputs();
        if (!inputs) return;
        
        const { userId, telemetry } = inputs;
        initSimulationState(stepByStep);
    
        try {
            const startTime = performance.now();
            // Pass empty array for deathEvents because it's now inside telemetry
            const result = await executePipelineLogic(
                userId, telemetry, [], lastRoundRef.current || undefined
            );
            
            const executionTime = performance.now() - startTime;
            lastRoundRef.current = result.roundAnalytics;
    
            const finalState = constructFinalState(pipelineState, result, executionTime);
            setSimulationResult(finalState);
    
            await handleSimulationPlayback(stepByStep, result, finalState, executionTime);
        } catch (e) {
            console.error("Simulation failed", e);
            setPipelineState(prev => ({ ...prev, isRunning: false }));
        }
    };

    return { runSimulation, lastRoundRef };
}
