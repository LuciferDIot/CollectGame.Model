import { DashboardInputState } from '@/lib/types';
import { useCallback, useState } from 'react';
import { parseDeathEvents, parseTelemetry } from './parsers';

export function useInputState() {
  const [inputState, setInputState] = useState<DashboardInputState>({
    telemetryJson: '',
    deathEventsJson: '',
    telemetryError: null,
    deathEventsError: null,
  });

  const setTelemetryJson = useCallback((json: string) => {
    const parsed = parseTelemetry(json);
    setInputState((prev) => ({
      ...prev,
      telemetryJson: json,
      telemetryError: parsed === null && json.trim() ? 'Invalid JSON format' : null,
    }));
  }, []);

  const setDeathEventsJson = useCallback((json: string) => {
    const parsed = parseDeathEvents(json);
    setInputState((prev) => ({
      ...prev,
      deathEventsJson: json,
      deathEventsError: parsed === null && json.trim() ? 'Invalid JSON format' : null,
    }));
  }, []);

  const resetInputState = useCallback(() => {
    setInputState({
      telemetryJson: '',
      deathEventsJson: '',
      telemetryError: null,
      deathEventsError: null,
    });
  }, []);

  return { 
    inputState, 
    setInputState, 
    setTelemetryJson, 
    setDeathEventsJson,
    resetInputState 
  };
}
