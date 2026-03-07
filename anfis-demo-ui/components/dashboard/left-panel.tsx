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
    <div className="flex flex-col h-full bg-background/20 backdrop-blur-md overflow-hidden border-r border-border/30">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-5 space-y-6">
          {/* Telemetry Data Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Source Telemetry
                </label>
              </div>
              <JsonEditorDialog
                title="Telemetry JSON Editor"
                value={inputState.telemetryJson}
                onChange={setTelemetryJson}
                description="Paste your Mongo-style telemetry document here."
              />
            </div>
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-linear-to-br from-primary/20 via-transparent to-accent/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-[2px]" />
              <textarea
                value={inputState.telemetryJson}
                onChange={(e) => setTelemetryJson(e.target.value)}
                placeholder="Paste telemetry JSON here..."
                className="relative w-full h-40 p-4 bg-secondary/30 backdrop-blur-sm border border-border/60 rounded-xl text-foreground text-xs font-mono placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-0 focus:bg-secondary/40 transition-all resize-none shadow-inner"
                spellCheck="false"
              />
            </div>

            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              {inputState.telemetryError && (
                <div className="flex items-center gap-2.5 text-[10px] font-bold text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5 uppercase tracking-wider">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{inputState.telemetryError}</span>
                </div>
              )}
              {!inputState.telemetryError && inputState.telemetryJson && (
                <div className="flex items-center gap-2.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2.5 uppercase tracking-wider">
                  <CheckCircle size={14} className="shrink-0" />
                  <span>Stream Validated</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <SchemaViewer />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <InputStatus json={inputState.telemetryJson} />
          </div>
        </div>
      </div>
    </div>
  );
}
