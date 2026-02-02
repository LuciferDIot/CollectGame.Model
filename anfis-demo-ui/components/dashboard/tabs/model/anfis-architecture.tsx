
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/session/pipeline-context';

export function AnfisArchitecture() {
  const { pipelineState } = usePipeline();

  return (
    <div>
      <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-purple-400"></span>
        ANFIS Architecture
      </h4>
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-4 space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Input Features</span>
            <code className="text-purple-300 font-mono">6 (3 soft + 3 deltas)</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Model Type</span>
            <code className="text-purple-300 font-mono">MLP Surrogate</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Output Range</span>
            <code className="text-purple-300 font-mono">[0.5, 1.5]</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Training Samples</span>
            <code className="text-purple-300 font-mono">{pipelineState.steps.length > 0 ? '2,109' : 'N/A'}</code>
          </div>
        </div>
      </Card>
    </div>
  );
}
