
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/session/pipeline-context';

export function DeltaMetrics() {
  const { pipelineState } = usePipeline();
  
  return (
    <div>
      <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
        Temporal Signals (Delta v2.0)
      </h4>
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-4 space-y-2">
          <div className="text-[10px] text-slate-500 mb-2">Per-window behavioral change detection</div>
          <div className="grid grid-cols-3 gap-3">
            {['combat', 'collect', 'explore'].map((type, idx) => {
              // Mock delta values - in real implementation, get from pipelineState if available
              const deltaValue = idx === 0 ? -0.08 : idx === 1 ? 0.05 : 0.12;
              const color = type === 'combat' ? 'red' : type === 'collect' ? 'amber' : 'cyan';
              
              return (
                <div key={type} className="bg-slate-900/50 rounded p-3">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Δ{type}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold font-mono text-${color}-400`}>
                      {deltaValue > 0 ? '+' : ''}{deltaValue.toFixed(3)}
                    </span>
                    <span className={`text-xs ${deltaValue > 0 ? 'text-green-400' : deltaValue < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {deltaValue > 0 ? '↑' : deltaValue < 0 ? '↓' : '−'}
                    </span>
                  </div>
                  {type === 'explore' && (
                    <div className="mt-2 text-[9px] text-green-400 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-green-400"></span>
                      r=0.808 correlation
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
