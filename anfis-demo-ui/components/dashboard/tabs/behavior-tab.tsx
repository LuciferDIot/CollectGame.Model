
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/pipeline-context';
import { ProgressRing } from '../progress-ring';

export function BehaviorTab() {
  const { pipelineState } = usePipeline();

  return (
    <div className="m-0 p-6 space-y-6">
      <h3 className="text-sm font-semibold text-slate-100">Behavior Distribution</h3>
      
      <div className="grid grid-cols-3 gap-4">
        {pipelineState.behaviorCategories.map((cat) => (
          <Card key={cat.category} className="bg-slate-800/50 border-slate-700">
            <div className="p-4 flex flex-col items-center">
              <ProgressRing
                value={cat.softMembership * 100}
                size={100}
                strokeWidth={8}
                color={
                  cat.category === 'Combat' ? '#ef4444' :
                  cat.category === 'Collection' ? '#f59e0b' :
                  '#06b6d4'
                }
                label={cat.category}
              />
              <div className="mt-3 space-y-1 w-full text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Activity</span>
                  <code className="text-slate-200">{cat.activityPercentage}%</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence</span>
                  <code className={cat.confidence > 0.85 ? 'text-green-400' : 'text-amber-400'}>
                    {(cat.confidence * 100).toFixed(0)}%
                  </code>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
