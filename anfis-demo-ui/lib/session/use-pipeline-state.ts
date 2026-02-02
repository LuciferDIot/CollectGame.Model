import { PipelineState } from '@/lib/types';
import { useState } from 'react';

export function usePipelineStateHook() {
  const [pipelineState, setPipelineState] = useState<PipelineState>({
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

  const [currentStep, setCurrentStep] = useState(0);
  const [stepByStepMode, setStepByStepMode] = useState(false);
  const [simulationResult, setSimulationResult] = useState<PipelineState | null>(null);

  return {
    pipelineState, setPipelineState,
    currentStep, setCurrentStep,
    stepByStepMode, setStepByStepMode,
    simulationResult, setSimulationResult
  };
}
