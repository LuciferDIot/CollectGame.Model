
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/pipeline-context';

export function AdaptationTab() {
  const { pipelineState } = usePipeline();

  return (
    <div className="m-0 p-6 space-y-6">
      <h3 className="text-sm font-semibold text-slate-100">Parameter Adaptation</h3>
      
      {pipelineState.adaptationDeltas.length > 0 ? (
        <div className="space-y-4">
          {/* Group by category */}
          {['Combat', 'Collection', 'Exploration'].map((category) => {
            const categoryParams = pipelineState.adaptationDeltas.filter(d => d.category === category);
            if (categoryParams.length === 0) return null;

            const categoryColor = category === 'Combat' ? 'red' : category === 'Collection' ? 'amber' : 'cyan';
            
            return (
              <Card key={category} className={`bg-gradient-to-br from-${categoryColor}-950/30 to-${categoryColor}-900/20 border-${categoryColor}-900/30`}>
                <div className="p-4">
                  <h4 className={`text-sm font-semibold text-${categoryColor}-300 mb-3`}>{category} Parameters</h4>
                  <div className="space-y-3">
                    {categoryParams.map((param) => {
                      const change = param.after - param.before;
                      const changePercent = param.before !== 0 ? (change / param.before) * 100 : 0;
                      
                      return (
                        <div key={param.field} className="flex items-center justify-between text-xs bg-slate-900/30 rounded p-2">
                          <div className="flex-1">
                            <span className="text-slate-300 font-medium">{param.field.replace(/_/g, ' ')}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-slate-500">Base:</span>
                              <code className={`text-${categoryColor}-200 font-mono`}>{param.before.toFixed(2)}</code>
                              <span className="text-slate-600">→</span>
                              <span className="text-slate-500">Final:</span>
                              <code className={`text-${categoryColor}-200 font-mono font-bold`}>{param.after.toFixed(2)}</code>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-[10px] font-mono ${
                            change > 0 ? 'bg-green-500/20 text-green-400' : 
                            change < 0 ? 'bg-red-500/20 text-red-400' : 
                            'bg-slate-600/20 text-slate-400'
                          }`}>
                            {change > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 text-sm">
          No adaptation data available
        </div>
      )}
    </div>
  );
}
