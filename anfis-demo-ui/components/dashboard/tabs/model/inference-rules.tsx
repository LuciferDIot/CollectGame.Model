
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/session/pipeline-context';

export function InferenceRules() {
  const { pipelineState } = usePipeline();

  if (pipelineState.rulesFired.length === 0) return null;

  return (
    <div>
      <h4 
        className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2 cursor-help" 
        title="Activation strength of hidden neurons in the neuro-fuzzy surrogate model"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
        Hidden Unit Activations ({pipelineState.rulesFired.length})
      </h4>
      <Card className="bg-card border-border">
        <div className="p-4 space-y-2">
          {pipelineState.rulesFired.slice(0, 5).map((rule, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/80">{rule.ruleName}</span>
                <code className="text-amber-600 dark:text-amber-300 font-mono">{(rule.strength * 100).toFixed(1)}%</code>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all"
                  style={{ width: `${rule.strength * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

