import { RoundAnalytics } from '@/lib/analytics/types';
import { TelemetryFeatures as EngineFeatures } from '@/lib/engine/types';
import { DashboardInputState, PipelineState } from '@/lib/types';
import { useRef } from 'react';
import { animateSimulation } from './animation';
import { parseDeathEvents, parseTelemetry } from './parsers';
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

    const runSimulation = async (stepByStep: boolean = false) => {
        // 1. Parse & Validate Inputs
        const telemetry = parseTelemetry(inputState.telemetryJson) as unknown as EngineFeatures;
        const deathEvents = inputState.deathEventsJson ? parseDeathEvents(inputState.deathEventsJson) : [];
    
        if (!telemetry) {
          setInputState((prev) => ({ ...prev, telemetryError: 'Invalid telemetry JSON' }));
          return;
        }
    
        // 2. Reset / Init State
        setStepByStepMode(stepByStep);
        setCurrentStep(0);
        
        setPipelineState((prev) => ({
          ...prev,
          steps: INITIAL_PIPELINE_STEPS,
          isRunning: true,
          executionTime: 0,
        }));
    
        try {
            const startTime = performance.now();
            
            // 3. Exec Logic
            const result = await executePipelineLogic(
                telemetry, 
                (deathEvents || []) as any[], 
                lastRoundRef.current || undefined
            );
            
            const executionTime = performance.now() - startTime;
    
            // 4. Update References
            lastRoundRef.current = result.roundAnalytics;
    
            // 5. Construct Final State
            const finalState = constructFinalState(pipelineState, result, executionTime);
    
            setSimulationResult(finalState);
    
            // 6. Playback
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
    
        } catch (e) {
            console.error("Simulation failed", e);
            setPipelineState(prev => ({ ...prev, isRunning: false }));
        }
    };

    return { runSimulation, lastRoundRef };
}
