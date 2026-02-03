'use client';

import React from 'react';
import { PipelineContext, PipelineContextType, usePipeline } from './context-definitions';
import { parseDeathEvents, parseTelemetry } from './parsers';
import { useDashboardControls } from './use-dashboard-controls';
import { useInputState } from './use-input-state';
import { usePipelineRunner } from './use-pipeline-runner';
import { usePipelineStateHook } from './use-pipeline-state';

export { usePipeline };

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const { 
      inputState, setInputState, 
      setTelemetryJson, setDeathEventsJson,
      resetInputState
  } = useInputState();

  const {
    pipelineState, setPipelineState,
    currentStep, setCurrentStep,
    stepByStepMode, setStepByStepMode,
    simulationResult, setSimulationResult
  } = usePipelineStateHook();
  
  // Use extracted runner hook
  const { runSimulation, lastRoundRef } = usePipelineRunner({
      inputState, setInputState,
      pipelineState, setPipelineState,
      setSimulationResult,
      setCurrentStep, setStepByStepMode
  });

  const { advanceStep, resetDashboard } = useDashboardControls({
      simulationResult, pipelineState,
      currentStep, setCurrentStep,
      setPipelineState, setInputState,
      setStepByStepMode, setSimulationResult
  });

  const value: PipelineContextType = {
    pipelineState, inputState,
    setTelemetryJson, setDeathEventsJson,
    runSimulation, resetDashboard, advanceStep,
    parseTelemetry, parseDeathEvents,
    setPipelineState, setInputState
  };

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}
