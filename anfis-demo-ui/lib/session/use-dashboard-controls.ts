import { DashboardInputState, PipelineState } from '@/lib/types';
import { Dispatch, SetStateAction } from 'react';

interface UseDashboardControlsProps {
    simulationResult: PipelineState | null;
    pipelineState: PipelineState;
    currentStep: number;
    setCurrentStep: Dispatch<SetStateAction<number>>;
    setPipelineState: Dispatch<SetStateAction<PipelineState>>;
    setInputState: Dispatch<SetStateAction<DashboardInputState>>;
    setStepByStepMode: Dispatch<SetStateAction<boolean>>;
    setSimulationResult: Dispatch<SetStateAction<PipelineState | null>>;
}

export function useDashboardControls({
    simulationResult,
    pipelineState,
    currentStep,
    setCurrentStep,
    setPipelineState,
    setInputState,
    setStepByStepMode,
    setSimulationResult
}: UseDashboardControlsProps) {

    const advanceStep = () => {
        if (!simulationResult) return;
        if (currentStep >= pipelineState.steps.length) return;
        
        const nextIndex = currentStep + 1;
        setCurrentStep(nextIndex);
    
        // Reveal up to nextIndex
        setPipelineState(prev => ({
            ...prev,
            steps: simulationResult.steps.map((s, i) => i <= nextIndex ? s : prev.steps[i]), // Show completed step
            // progressively fill in the other state if needed, or just let the tabs read undefined
            normalizedFeatures: nextIndex >= 1 ? simulationResult.normalizedFeatures : prev.normalizedFeatures,
            behaviorCategories: nextIndex >= 3 ? simulationResult.behaviorCategories : prev.behaviorCategories,
            // etc...
            isRunning: nextIndex < 7
        }));
    };

    const resetDashboard = () => {
        setInputState({
          telemetryJson: '',
          deathEventsJson: '',
          telemetryError: null,
          deathEventsError: null,
        });
    
        setPipelineState({
          steps: [],
          normalizedFeatures: null,
          softMembership: null,
          behaviorCategories: [],
          adaptationDeltas: [],
          validationChecks: [],
          rulesFired: [],
          isRunning: false,
          executionTime: 0,
        });
    
        setCurrentStep(0);
        setStepByStepMode(false);
        setSimulationResult(null);
    };

    return { advanceStep, resetDashboard };
}
