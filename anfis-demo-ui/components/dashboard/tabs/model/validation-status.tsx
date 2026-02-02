
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/session/pipeline-context';

export function ValidationStatus() {
  const { pipelineState } = usePipeline();

  return (
    <div>
      <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
        Validation Checks
      </h4>
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-4 space-y-2">
          {pipelineState.validationChecks.length > 0 ? (
            pipelineState.validationChecks.map((check) => (
              <div key={check.name} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                    check.status === 'pass' ? 'bg-green-500/20 text-green-400' :
                    check.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠' : '✗'}
                  </div>
                  <span className="text-sm text-slate-300">{check.name}</span>
                </div>
                <code className="text-xs text-slate-500 font-mono">{check.message}</code>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3 py-2">
              <div className="w-5 h-5 rounded flex items-center justify-center text-xs bg-green-500/20 text-green-400">✓</div>
              <span className="text-sm text-slate-300">All validations passed</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
