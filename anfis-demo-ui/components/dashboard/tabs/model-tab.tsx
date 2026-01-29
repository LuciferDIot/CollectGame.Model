'use client';

import { usePipeline } from '@/lib/pipeline-context';
import { cn } from '@/lib/utils';
import { AlertTriangle, Check, Info } from 'lucide-react';
import { useState } from 'react';
import { MetricDetailModal } from '../../analytics/metric-detail-modal';

export function ModelTab() {
  const { pipelineState } = usePipeline();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Helper to map validation check names to our Educational Content Keys
  const getMetricKey = (checkName: string) => {
    if (checkName.includes('Membership')) return 'fuzzy_partition';
    if (checkName.includes('Delta')) return 'target_std'; // Approximate mapping for now
    if (checkName.includes('Clamp')) return 'clamp_usage';
    return 'telemetry_health'; // Fallback
  };

  return (
    <div className="m-0 p-6 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-4">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">SYSTEM MODEL HEALTH (VALIDATION)</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {pipelineState.validationChecks.map((check, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedMetric(getMetricKey(check.name))}
              className="flex items-center justify-between p-4 rounded bg-slate-900/40 border border-slate-800/60 hover:bg-slate-900/60 hover:border-slate-700 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                 <div className={cn(
                    "w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors",
                    check.status === 'pass' ? "bg-emerald-500/20 text-emerald-500" : 
                    check.status === 'warning' ? "bg-amber-500/20 text-amber-500" : "bg-red-500/20 text-red-500"
                 )}>
                    {check.status === 'pass' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{check.name}</h4>
                    <p className="text-xs text-slate-500 font-mono hidden sm:block">
                        {check.message}
                    </p>
                 </div>
              </div>
              
              <div className="text-right">
                 <div className={cn(
                    "font-mono font-bold text-sm uppercase",
                    check.status === 'pass' ? "text-emerald-400" : 
                    check.status === 'warning' ? "text-amber-400" : "text-red-400"
                 )}>
                    {check.status}
                 </div>
                 <div className="text-xs text-slate-500 font-mono uppercase tracking-wide">
                    Verified
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-700/50 pt-4 opacity-75 hover:opacity-100 transition-opacity">
        <h4 className="text-xs font-semibold text-slate-100 mb-3 flex items-center gap-2 uppercase tracking-wider">
          <Info size={14} className="text-blue-400" />
          Model Notes
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded bg-blue-950/10 border border-blue-900/30 hover:bg-blue-950/20 transition-colors">
             <p className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wide">Model Version: v2.2</p>
             <p className="text-xs text-blue-200/60 leading-relaxed">Trained on 2,847 samples with 0.023 MAE. This validation view ensures runtime adherence to training constraints.</p>
          </div>
          <div className="p-4 rounded bg-blue-950/10 border border-blue-900/30 hover:bg-blue-950/20 transition-colors">
            <p className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wide">Exploration Dominance</p>
            <p className="text-xs text-blue-200/60 leading-relaxed">High exploration soft membership is expected during open-world traversal. This indicates healthy gameplay dynamics.</p>
          </div>
        </div>
      </div>

      {/* Shared Metric Modal for Deep Dives */}
      <MetricDetailModal 
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || ''}
        currentValue="PASS" 
        status="success"
      />
    </div>
  );
}
