import { usePipeline } from '@/lib/session/pipeline-context';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import { InputStatus } from './input-status';
import { JsonEditorDialog } from './json-editor-dialog';
import { SchemaViewer } from './schema-viewer';

export function LeftPanel() {
  const { inputState, setTelemetryJson, setDeathEventsJson } = usePipeline();

  useEffect(() => {
    const handleLoadExample = (event: Event) => {
      const customEvent = event as CustomEvent;
      setTelemetryJson(customEvent.detail.telemetry);
    };

    window.addEventListener('loadExample', handleLoadExample);
    return () => window.removeEventListener('loadExample', handleLoadExample);
  }, [setTelemetryJson, setDeathEventsJson]);

  return (
    <div className="flex flex-col h-full bg-linear-to-b from-slate-900 to-slate-950 overflow-hidden">
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
                <AlertCircle size={14} className="shrink-0" />
                <span>{inputState.telemetryError}</span>
              </div>
            )}
            {!inputState.telemetryError && inputState.telemetryJson && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-950/20 border border-green-900/30 rounded px-3 py-2">
                <CheckCircle size={14} className="shrink-0" />
                <span>Valid JSON</span>
              </div>
            )}
          </div>

          <SchemaViewer />

          <div className="grid grid-cols-2 gap-2">
            <InputStatus json={inputState.telemetryJson} />
          </div>
        </div>
      </div>
    </div>
  );
}
