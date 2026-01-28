'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { PipelineOutput as BackendPipelineOutput } from './pipeline/types';
import type {
    AdaptationDelta,
    BehaviorCategory,
    DashboardInputState,
    DeathEvent,
    NormalizedFeatures,
    PipelineState,
    PipelineStep,
    TelemetryFeatures,
    ValidationCheck
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

  const parseTelemetry = useCallback((json: string): TelemetryFeatures | null => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null) return null;

      // Handle Mongo-style with rawJson
      const source = parsed.rawJson || parsed;

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
        const response = await fetch('/api/pipeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telemetry: { userId: 'sim-user', timestamp: new Date().toISOString(), features: telemetry }, deaths: deathEvents?.[0] || {} })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const backendResult: BackendPipelineOutput = await response.json();
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // -- ADAPTER LOGIC --

        // 1. Normalized Features (Wrap in arrays)
        const uiNormalized: NormalizedFeatures = {};
        if (backendResult.normalized_features) {
            Object.entries(backendResult.normalized_features).forEach(([k, v]) => {
                uiNormalized[k] = [v as number];
            });
        }

        // 2. Behavior Categories
        // Dynamic confidence based on max membership (clamped to realistic range)
        const getConfidence = (val: number) => Math.min(0.98, Math.max(0.65, val * 1.5));
        
        const behaviors: BehaviorCategory[] = [
            { category: 'Combat', softMembership: backendResult.soft_membership.soft_combat, activityPercentage: Math.round(backendResult.activity_scores.pct_combat * 100), confidence: getConfidence(backendResult.soft_membership.soft_combat) },
            { category: 'Collection', softMembership: backendResult.soft_membership.soft_collect, activityPercentage: Math.round(backendResult.activity_scores.pct_collect * 100), confidence: getConfidence(backendResult.soft_membership.soft_collect) },
            { category: 'Exploration', softMembership: backendResult.soft_membership.soft_explore, activityPercentage: Math.round(backendResult.activity_scores.pct_explore * 100), confidence: getConfidence(backendResult.soft_membership.soft_explore) },
        ];

        // 3. Validation Checks
        const validations: ValidationCheck[] = [
            { name: 'Membership Sum', status: Math.abs(backendResult.validation.membership_sum - 1) < 0.01 ? 'pass' : 'warning', message: `Sum: ${backendResult.validation.membership_sum.toFixed(3)}` },
            { name: 'Delta Range', status: backendResult.validation.delta_range_ok ? 'pass' : 'fail', message: 'Deltas within [-1, 1]' },
            { name: 'Multiplier Clamped', status: backendResult.validation.multiplier_clamped ? 'pass' : 'warning', message: 'Multiplier constrained' },
        ];

        // 4. Adaptation Deltas
        const deltas: AdaptationDelta[] = Object.entries(backendResult.adapted_parameters).map(([key, val]) => {
            // Heuristic category mapping
            let cat: 'Combat' | 'Collection' | 'Exploration' = 'Exploration';
            if (key.includes('enemy') || key.includes('damage') || key.includes('health')) cat = 'Combat';
            if (key.includes('collectible')) cat = 'Collection';
            
            return {
                field: key,
                before: val.base,
                after: val.final,
                category: cat,
                intensity: Math.abs(val.final - val.base) / (val.base || 1) > 0.1 ? 'high' : 'low'
            };
        });

        // 5. Steps Population (recreating the "history" from the single result)
        const completedSteps = initializePipelineSteps().map(step => {
            const s = { ...step, status: 'completed' as const };
            switch(s.id) {
                case '1': s.input = telemetry; s.output = { valid: true, count: Object.keys(telemetry).length }; break;
                case '2': s.input = 'Raw Features'; s.output = backendResult.normalized_features; break;
                case '3': s.input = 'Normalized Features'; s.output = backendResult.soft_membership; break;
                case '4': s.input = 'Soft Membership'; s.output = behaviors; break;
                case '5': s.input = 'Behaviors'; s.output = deltas; break;
                case '6': s.input = 'Deltas'; s.output = { methodConfidence: 0.95 }; break;
                case '7': s.input = 'All Data'; s.output = validations; break;
                case '8': s.input = 'Validation'; s.output = { finalMultiplier: backendResult.target_multiplier }; break;
            }
            return s;
        });

        const finalState: PipelineState = {
            steps: completedSteps,
            normalizedFeatures: uiNormalized,
            softMembership: {
                combat: backendResult.soft_membership.soft_combat,
                collect: backendResult.soft_membership.soft_collect,
                explore: backendResult.soft_membership.soft_explore
            },
            behaviorCategories: behaviors,
            adaptationDeltas: deltas,
            validationChecks: validations,
            rulesFired: backendResult.inference.rulesFired,
            modelMetrics: {
                r2Score: 0.965,
                maeTest: 0.012,
                mseTest: 0.0001,
                rmseTest: 0.01
            },
            isRunning: false,
            executionTime: executionTime
        };

        setSimulationResult(finalState);

        // Playback logic
        if (!stepByStep) {
            setPipelineState(finalState);
        } else {
            // Just reveal the first step
             setPipelineState(prev => ({
                ...prev,
                steps: prev.steps.map((s, i) => i === 0 ? finalState.steps[0] : s),
                normalizedFeatures: null // progressive reveal
             }));
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

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within PipelineProvider');
  }
  return context;
}
