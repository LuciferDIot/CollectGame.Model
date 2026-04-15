
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/session/pipeline-context';

export function PerformanceMetrics() {
  const { pipelineState } = usePipeline();

  return (
    <div>
      <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
        Model Performance
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <span className="text-xs text-slate-400">Silhouette Score</span>
            <p className="text-2xl font-bold text-green-400 mt-1 font-mono">0.375</p>
            <p className="text-[10px] text-slate-500 mt-1">Clustering quality</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <span className="text-xs text-slate-400">DB Index</span>
            <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">0.977</p>
            <p className="text-[10px] text-slate-500 mt-1">Separation metric</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <span className="text-xs text-slate-400">Target CV</span>
            <p className="text-2xl font-bold text-cyan-400 mt-1 font-mono">0.022</p>
            <p className="text-[10px] text-slate-500 mt-1">Low variance</p>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="p-4">
            <span className="text-xs text-slate-400">Entropy</span>
            <p className="text-2xl font-bold text-purple-400 mt-1 font-mono">1.405</p>
            <p className="text-[10px] text-slate-500 mt-1">High diversity</p>
          </div>
        </Card>
        {pipelineState.modelMetrics && (
          <>
            <Card className="bg-slate-800/50 border-slate-700">
              <div className="p-4">
                <span className="text-xs text-slate-400">R^2 Score</span>
                <p className="text-2xl font-bold text-green-400 mt-1 font-mono">
                  {pipelineState.modelMetrics.r2Score.toFixed(3)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">High accuracy</p>
              </div>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <div className="p-4">
                <span className="text-xs text-slate-400">Test MAE</span>
                <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">
                  {pipelineState.modelMetrics.maeTest.toFixed(3)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Low error</p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
