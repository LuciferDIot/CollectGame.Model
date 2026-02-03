import { DeathEvent } from '@/lib/engine/types';
import { DashboardInputState, PipelineState, TelemetryFeatures } from '@/lib/types';
import { createContext, useContext } from 'react';

export interface PipelineContextType {
  pipelineState: PipelineState;
  inputState: DashboardInputState;
  setTelemetryJson: (json: string) => void;
  setDeathEventsJson: (json: string) => void;
  runSimulation: (stepByStep: boolean) => Promise<void>;
  resetDashboard: () => void;
  advanceStep: () => void;
  parseTelemetry: (json: string) => { userId: string, features: TelemetryFeatures } | null;
  parseDeathEvents: (json: string) => DeathEvent[] | null;
  setPipelineState: React.Dispatch<React.SetStateAction<PipelineState>>;
}

export const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within PipelineProvider');
  }
  return context;
}
