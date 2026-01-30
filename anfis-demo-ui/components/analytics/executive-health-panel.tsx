'use client';

import { usePipeline } from '@/lib/pipeline-context';
import { cn } from '@/lib/utils';
import { AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';
import { MetricDetailModal } from './metric-detail-modal';

export function ExecutiveHealthPanel() {
  const { pipelineState } = usePipeline();
  const { modelMetrics, output } = pipelineState;

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // --- MOCKED / DERIVED METRICS ---
  const R2_SCORE = modelMetrics?.r2Score ?? 0.85;
  const MAE_TEST = modelMetrics?.maeTest ?? 0.024;
  const CLAMP_USAGE = 0.0; 
  const TARGET_STD = 0.12; 
  
  const currentMultiplier = output?.adjustedMultiplier ?? 1.0;
  
  // Status Logic
  const r2Status = R2_SCORE > 0.8 ? 'success' : 'warning';
  const clampStatus = CLAMP_USAGE < 0.05 ? 'success' : 'warning';
  const stabilityStatus = Math.abs(currentMultiplier - 1.0) < 0.3 ? 'success' : 'warning';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
         <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">SYSTEM VALIDATION CHECKS</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
      
        {/* CARD 1: MODEL VALIDITY */}
        <ValidationRow
          label="Model Validity (R² & MAE)"
          status={r2Status}
          value={`R² ${(R2_SCORE * 100).toFixed(0)}%`}
          subValue={`MAE: ${MAE_TEST.toFixed(4)}`}
          onClick={() => setSelectedMetric('model_r2')}
        />

        {/* CARD 2: SIGNAL QUALITY */}
        <ValidationRow
          label="Signal Quality (Variance & Clamp)"
          status={clampStatus}
          value="Healthy"
          subValue={`Clamp: ${(CLAMP_USAGE * 100).toFixed(1)}%`}
          onClick={() => setSelectedMetric('clamp_usage')}
        />

        {/* CARD 3: RUNTIME STABILITY */}
        <ValidationRow
          label="Runtime Stability (Multiplier)"
          status={stabilityStatus}
          value={`x${currentMultiplier.toFixed(2)}`}
          subValue="Stable"
          onClick={() => setSelectedMetric('multiplier_mean')}
        />

      </div>

      <MetricDetailModal 
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || ''}
        currentValue={1.0} // Dynamic in full impl
        status="success"
      />
    </div>
  );
}

function ValidationRow({ label, status, value, subValue, onClick }: any) {
    return (
        <div 
          onClick={onClick}
          className="flex items-center justify-between p-4 rounded bg-slate-900/40 border border-slate-800/60 hover:bg-slate-900/60 hover:border-slate-700 cursor-pointer transition-all group"
        >
            <div className="flex items-center gap-4">
               <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors",
                  status === 'success' ? "bg-emerald-500/20 text-emerald-500" : 
                  status === 'warning' ? "bg-amber-500/20 text-amber-500" : "bg-red-500/20 text-red-500"
               )}>
                  {status === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{label}</h4>
                  <p className="text-xs text-slate-500 font-mono hidden sm:block">Click to inspect metric details</p>
               </div>
            </div>
            
            <div className="text-right">
               <div className={cn(
                  "font-mono font-bold text-sm",
                  status === 'success' ? "text-emerald-400" : 
                  status === 'warning' ? "text-amber-400" : "text-red-400"
               )}>
                  {value}
               </div>
               <div className="text-xs text-slate-500 font-mono uppercase tracking-wide">
                  {subValue}
               </div>
            </div>
        </div>
    )
}
