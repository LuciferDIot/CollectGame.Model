'use client';

import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/session/pipeline-context';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { JsonEditorDialog } from './json-editor-dialog';

const TELEMETRY_SCHEMA = [
  { field: 'enemiesHit', type: 'number', required: true, description: 'Number of enemies hit during combat' },
  { field: 'damageDone', type: 'number', required: true, description: 'Total damage dealt' },
  { field: 'timeInCombat', type: 'number', required: true, description: 'Seconds spent in combat' },
  { field: 'kills', type: 'number', required: true, description: 'Total enemy kills' },
  { field: 'itemsCollected', type: 'number', required: true, description: 'Items successfully collected' },
  { field: 'pickupAttempts', type: 'number', required: true, description: 'Total pickup attempts' },
  { field: 'timeNearInteractables', type: 'number', required: true, description: 'Seconds near collectibles' },
  { field: 'distanceTraveled', type: 'number', required: true, description: 'Total movement distance' },
  { field: 'timeSprinting', type: 'number', required: true, description: 'Seconds spent sprinting' },
  { field: 'timeOutOfCombat', type: 'number', required: true, description: 'Seconds exploring/idle' },
  { field: 'deathCount', type: 'number', required: false, description: 'Total deaths in this window (Optional)' },
];

export function LeftPanel() {
  const { inputState, setTelemetryJson, setDeathEventsJson } = usePipeline();
  const [showSchema, setShowSchema] = useState(false);

  useEffect(() => {
    const handleLoadExample = (event: Event) => {
      const customEvent = event as CustomEvent;
      setTelemetryJson(customEvent.detail.telemetry);
      // setDeathEventsJson removed - unified payload
    };

    window.addEventListener('loadExample', handleLoadExample);
    return () => window.removeEventListener('loadExample', handleLoadExample);
  }, [setTelemetryJson, setDeathEventsJson]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Telemetry Data Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Telemetry Input
                </label>
                <JsonEditorDialog 
                    title="Telemetry JSON Editor" 
                    value={inputState.telemetryJson} 
                    onChange={setTelemetryJson}
                    description="Paste your Mongo-style telemetry document here."
                />
            </div>
            <textarea
              value={inputState.telemetryJson}
              onChange={(e) => setTelemetryJson(e.target.value)}
              placeholder="Paste telemetry JSON here..."
              className="w-full h-32 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:bg-slate-800 transition-all resize-none"
              spellCheck="false"
            />
            {inputState.telemetryError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded px-3 py-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{inputState.telemetryError}</span>
              </div>
            )}
            {!inputState.telemetryError && inputState.telemetryJson && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-950/20 border border-green-900/30 rounded px-3 py-2">
                <CheckCircle size={14} className="flex-shrink-0" />
                <span>Valid JSON</span>
              </div>
            )}
          </div>

          {/* Death Events Section */}
          {/* Death Events Section Removed - Merged into Telemetry */}

          {/* Schema Section */}
          <Card className="bg-slate-800/30 border-slate-700">
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/20 transition-colors"
            >
              <span className="text-xs font-semibold text-slate-200">Schema Expectations</span>
              <ChevronDown 
                size={16} 
                className="text-slate-400 transition-transform"
                style={{ transform: showSchema ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {showSchema && (
              <div className="border-t border-slate-700/50 p-3 space-y-2">
                <p className="text-xs font-medium text-slate-300 mb-2">Expected Telemetry Fields:</p>
                <ul className="space-y-2">
                  {TELEMETRY_SCHEMA.map((field) => (
                    <li key={field.field} className="text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <code className="text-blue-300 font-mono text-xs">{field.field}</code>
                          <span className="text-slate-500 ml-1">({field.type})</span>
                          <p className="text-slate-400 mt-0.5 text-[10px] leading-relaxed">{field.description}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Input Summary - Clear counters for telemetry and death events */}
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              let telemetryFieldCount = 0;
              try {
                if (inputState.telemetryJson) {
                  const parsed = JSON.parse(inputState.telemetryJson);
                  telemetryFieldCount = Object.keys(parsed).length;
                }
              } catch (e) {
                // Invalid JSON
              }
              
              if (telemetryFieldCount > 0) {
                return (
                  <Card className="bg-blue-950/30 border-blue-900/50">
                    <div className="p-3">
                      <p className="text-xs text-blue-300">
                        <span className="font-semibold">Telemetry:</span> {telemetryFieldCount} field{telemetryFieldCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </Card>
                );
              }
              return null;
            })()}
            
            {/* Death Event Summary Removed */}
          </div>
        </div>
      </div>
    </div>
  );
}
