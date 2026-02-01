'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { RoundAnalytics } from './analytics/types';
import { runSimulationService } from './pipeline/simulation-runner';
import type {
    DashboardInputState,
    DeathEvent,
    PipelineState,
    PipelineStep,
    TelemetryFeatures
} from './types';

interface PipelineContextType {
  pipelineState: PipelineState;
  inputState: DashboardInputState;
  setTelemetryJson: (json: string) => void;
  setDeathEventsJson: (json: string) => void;
  runSimulation: (stepByStep: boolean) => Promise<void>;
  resetDashboard: () => void;
  advanceStep: () => void;
  parseTelemetry: (json: string) => TelemetryFeatures | null;
  parseDeathEvents: (json: string) => DeathEvent[] | null;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const [inputState, setInputState] = useState<DashboardInputState>({
    telemetryJson: '',
    deathEventsJson: '',
    telemetryError: null,
    deathEventsError: null,
  });

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
  
  // Track the last complete round for history visualization (Previous State)
  const lastRoundRef = useRef<RoundAnalytics | null>(null);

  const parseTelemetry = useCallback((json: string): TelemetryFeatures | null => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null) return null;

      // Handle Mongo-style with rawJson, or clean nested structure, or flat
      const source = parsed.rawJson || parsed.telemetry || parsed;

      // Helper to safely get number from snake_case or camelCase
      const getNum = (obj: any, snake: string, camel: string): number => {
          if (snake in obj) return Number(obj[snake]);
          if (camel in obj) return Number(obj[camel]);
          return 0;
      };

      // Map to expected structure
      const features: TelemetryFeatures = {
          enemiesHit: getNum(source, 'enemies_hit', 'enemiesHit'),
          damageDone: getNum(source, 'damage_done', 'damageDone'),
          timeInCombat: getNum(source, 'time_in_combat', 'timeInCombat'),
          kills: getNum(source, 'kills', 'kills'),
          itemsCollected: getNum(source, 'items_collected', 'itemsCollected'),
          pickupAttempts: getNum(source, 'pickup_attempts', 'pickupAttempts'),
          timeNearInteractables: getNum(source, 'time_near_interactables', 'timeNearInteractables'),
          distanceTraveled: getNum(source, 'distance_traveled', 'distanceTraveled'),
          timeSprinting: getNum(source, 'time_sprinting', 'timeSprinting'),
          timeOutOfCombat: getNum(source, 'time_out_of_combat', 'timeOutOfCombat'),
      };

      return features;
    } catch {
      return null;
    }
  }, []);

  const parseDeathEvents = useCallback((json: string): DeathEvent[] | null => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
          return parsed.map((event: any) => ({
              userId: event.userId?.$oid || event.userId || 'unknown',
              timestamp: event.timestamp?.$date || event.timestamp || new Date().toISOString(),
              deathCount: 1 // Default to 1 if just an event presence
          }));
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const setTelemetryJson = useCallback((json: string) => {
    const parsed = parseTelemetry(json);
    setInputState((prev) => ({
      ...prev,
      telemetryJson: json,
      telemetryError: parsed === null && json.trim() ? 'Invalid JSON format' : null,
    }));
  }, [parseTelemetry]);

  const setDeathEventsJson = useCallback((json: string) => {
    const parsed = parseDeathEvents(json);
    setInputState((prev) => ({
      ...prev,
      deathEventsJson: json,
      deathEventsError: parsed === null && json.trim() ? 'Invalid JSON format' : null,
    }));
  }, [parseDeathEvents]);

  const initializePipelineSteps = (): PipelineStep[] => {
    return [
      { id: '1', name: 'Load Input Data', description: 'Parse and validate telemetry JSON', input: null, output: null, status: 'pending' },
      { id: '2', name: 'Normalize Features', description: 'Scale features to [0, 1] range', input: null, output: null, status: 'pending' },
      { id: '3', name: 'Soft Membership', description: 'Calculate fuzzy membership values', input: null, output: null, status: 'pending' },
      { id: '4', name: 'Behavior Classification', description: 'Map to Combat/Collection/Exploration', input: null, output: null, status: 'pending' },
      { id: '5', name: 'Adaptation Analysis', description: 'Compare before/after values', input: null, output: null, status: 'pending' },
      { id: '6', name: 'Confidence Calculation', description: 'Compute confidence metrics', input: null, output: null, status: 'pending' },
      { id: '7', name: 'Validation Checks', description: 'Run sanity checks', input: null, output: null, status: 'pending' },
      { id: '8', name: 'Results Aggregation', description: 'Compile final outputs', input: null, output: null, status: 'pending' },
    ];
  };

  const runSimulation = async (stepByStep: boolean = false) => {
    const telemetry = parseTelemetry(inputState.telemetryJson);
    const deathEvents = inputState.deathEventsJson ? parseDeathEvents(inputState.deathEventsJson) : [];

    if (!telemetry) {
      setInputState((prev) => ({ ...prev, telemetryError: 'Invalid telemetry JSON' }));
      return;
    }

    setStepByStepMode(stepByStep);
    setCurrentStep(0);
    const initialSteps = initializePipelineSteps();
    
    setPipelineState((prev) => ({
      ...prev,
      steps: initialSteps,
      isRunning: true,
      executionTime: 0,
    }));

    try {
        const startTime = performance.now();
        
        // Parse userId from input JSON if available
        let userId = 'sim-user';
        try {
            const raw = JSON.parse(inputState.telemetryJson);
            userId = raw.userId || raw.telemetry?.userId || 'sim-user';
        } catch (e) {
            // ignore JSON parse error, already handled by validation
        }

        // 1. Fetch from Backend
        const backendResult = await runSimulationService.fetchSimulationResults(telemetry, deathEvents, userId);
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // 2. Map to UI State
        const mappedState = runSimulationService.mapBackendToUI(backendResult);

        // 2b. Generate Round Analytics for History/Steps
        // Use lastRound from Ref to determine next round number and previous state
        const nextRoundNumber = (lastRoundRef.current?.roundNumber || 0) + 1;
        
        const roundAnalytics = runSimulationService.mapBackendToRoundAnalytics(
            backendResult, 
            telemetry, 
            nextRoundNumber
        );

        // 3. Reconstruct Steps (History)
        // Pass the PREVIOUS round (lastRoundRef) to popuate "Previous State" in steps
        const completedSteps = runSimulationService.reconstructPipelineSteps(
            initialSteps, 
            telemetry, 
            mappedState, 
            lastRoundRef.current || undefined
        );
        
        // Update History Ref for next run
        lastRoundRef.current = roundAnalytics;

        const finalState: PipelineState = {
            ...pipelineState,
            ...mappedState,
            steps: completedSteps,
            isRunning: false,
            executionTime,
            // Ensure mandatory fields are present if mappedState is partial
            normalizedFeatures: mappedState.normalizedFeatures || null,
            softMembership: mappedState.softMembership || null,
            behaviorCategories: mappedState.behaviorCategories || [],
            adaptationDeltas: mappedState.adaptationDeltas || [],
            validationChecks: mappedState.validationChecks || [],
            rulesFired: mappedState.rulesFired || [],
            metadata: mappedState.metadata || null,
            output: mappedState.output || null,
            modelMetrics: mappedState.modelMetrics || null,
        } as PipelineState;

        setSimulationResult(finalState);

        // Playback logic
        if (!stepByStep) {
            setPipelineState(finalState);
        } else {
            await animateSimulation({
                initialSteps, 
                completedSteps, 
                finalState, 
                executionTime, 
                setPipelineState
            });
        }

    } catch (e) {
        console.error("Simulation failed", e);
        setPipelineState(prev => ({ ...prev, isRunning: false }));
        // In a real app, set an error state on the step
    }
  };

  const advanceStep = async () => {
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

  const value: PipelineContextType = {
    pipelineState,
    inputState,
    setTelemetryJson,
    setDeathEventsJson,
    runSimulation,
    resetDashboard,
    advanceStep,
    parseTelemetry,
    parseDeathEvents,
  };

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}

interface AnimationConfig {
    initialSteps: PipelineStep[];
    completedSteps: PipelineStep[];
    finalState: PipelineState;
    executionTime: number;
    setPipelineState: React.Dispatch<React.SetStateAction<PipelineState>>;
}

async function animateSimulation({
    initialSteps,
    completedSteps,
    finalState,
    executionTime,
    setPipelineState
}: AnimationConfig) {
    const DELAY = 800;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    setPipelineState(prev => ({ ...prev, steps: initialSteps, isRunning: true }));

    // Pure helper to calculate next state for a step index
    const getNextStateForStep = (prev: PipelineState, stepIndex: number): PipelineState => {
        const nextSteps = prev.steps.map((s, idx) => {
            if (idx === stepIndex) return completedSteps[stepIndex];
            if (idx === stepIndex + 1 && stepIndex < 7) return { ...s, status: 'running' as const };
            return s;
        });

        // Simplified progressive reveal lookup
        const revealMap = {
            1: { normalizedFeatures: finalState.normalizedFeatures },
            2: { softMembership: finalState.softMembership },
            3: { behaviorCategories: finalState.behaviorCategories },
            4: { adaptationDeltas: finalState.adaptationDeltas },
            5: { rulesFired: finalState.rulesFired },
            6: { validationChecks: finalState.validationChecks },
            7: { executionTime, modelMetrics: finalState.modelMetrics }
        };

        // Accumulate state updates based on current step index
        let accumulatedUpdates = {};
        for (let k = 1; k <= stepIndex; k++) {
             // @ts-ignore
             accumulatedUpdates = { ...accumulatedUpdates, ...revealMap[k] };
        }

        return {
            ...prev,
            steps: nextSteps,
            ...accumulatedUpdates,
            isRunning: stepIndex < 7
        };
    };

    for (let i = 0; i < completedSteps.length; i++) {
        await delay(DELAY);
        setPipelineState(prev => getNextStateForStep(prev, i));
    }
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within PipelineProvider');
  }
  return context;
}
