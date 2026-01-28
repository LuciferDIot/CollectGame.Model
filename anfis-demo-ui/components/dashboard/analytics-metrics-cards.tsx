
import { usePipeline } from '@/lib/pipeline-context';

export function AnalyticsMetricsCards() {
  const { pipelineState } = usePipeline();

  return (
    <div className="px-6 pt-5 pb-4 border-b border-slate-700/30 bg-slate-900/20">
      <div className="grid grid-cols-3 gap-3">
        {pipelineState.behaviorCategories.map((cat) => (
          <div
            key={cat.category}
            className="relative overflow-hidden rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 hover:border-slate-600/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{cat.category}</span>
              <div className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                cat.softMembership > 0.5 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                cat.softMembership > 0.3 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-slate-700/50 text-slate-400 border border-slate-600/30'
              }`}>
                {cat.softMembership > 0.5 ? 'HIGH' : cat.softMembership > 0.3 ? 'MED' : 'LOW'}
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-100 font-mono tracking-tight">
                {(cat.softMembership * 100).toFixed(0)}
              </span>
              <span className="text-sm text-slate-500 font-mono">%</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px]">
              <span className="text-slate-500">Activity:</span>
              <span className="font-mono text-slate-300">{cat.activityPercentage}%</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500 cursor-help" title="Heuristic confidence indicator (not probabilistic certainty)">Conf:</span>
              <span className={`font-mono ${cat.confidence > 0.85 ? 'text-green-400' : 'text-amber-400'}`}>
                {(cat.confidence * 100).toFixed(0)}%
              </span>
            </div>
            {/* Background gradient indicator */}
            <div 
              className={`absolute bottom-0 left-0 h-1 transition-all ${
                cat.category === 'Combat' ? 'bg-gradient-to-r from-red-500/50 to-red-600/30' :
                cat.category === 'Collection' ? 'bg-gradient-to-r from-amber-500/50 to-amber-600/30' :
                'bg-gradient-to-r from-cyan-500/50 to-cyan-600/30'
              }`}
              style={{ width: `${cat.softMembership * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
