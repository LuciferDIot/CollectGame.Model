import { Activity, Layers, Zap } from 'lucide-react';

import { isSmallObject } from '@/lib/utils'; // Keep cn if used, add isSmallObject

// Helper to render complex outputs safely
type StepDetail = Record<string, any>;

// --- Sub Renderers ---

import { DetailRow, SmallObjectDetails } from '@/components/analytics/shared/detail-row';

// ... other imports ...

function GenericStepDetails({ details, step, isInput }: { details: StepDetail, step: any, isInput?: boolean }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(details).map(([key, value]) => {
                if (key === 'valid' || key === 'methodConfidence') return null;
                
                const label = key.replace(/([A-Z])/g, ' $1').trim();
                
                // 1. Primitives
                if (typeof value !== 'object' || value === null) {
                    const isLongValue = String(value).length > 20;
                    return <DetailRow key={key} label={label} value={String(value)} isLongValue={isLongValue} />;
                }
                
                // 2. Small Objects (Recurse)
                if (isSmallObject(value)) {
                    return (
                      <SmallObjectDetails key={key} label={label}>
                        <PipelineStepDetails step={step} details={value} isInput={isInput} />
                      </SmallObjectDetails>
                    );
                }
                
                // 3. Complex Fallback
                return (
                    <div key={key} className="col-span-2 flex justify-between py-1 border-b border-slate-800/40">
                        <span className="text-[10px] text-slate-500 uppercase">{label}</span>
                        <span className="text-[10px] text-slate-600 italic">Complex Data</span>
                    </div>
                );
            })}
        </div>
    );
}

import { formatCoordinate, formatMultiplier, formatVelocityValue } from './ui-utils';

function AdaptationDetails({ details }: { details: any }) {
    return (
        <div className="bg-slate-950 rounded p-3 border border-slate-800">
            <div className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                State Evolution
            </div>
            
            {/* Previous State Vector */}
            {details.previousState && (
                <div className="mb-3">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Previous State (t-1)</div>
                        <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1">
                            <span className="block text-[9px] text-slate-600">CMB</span>
                            <span className="text-xs text-slate-400 font-mono">{formatCoordinate(details.previousState.softMembership?.combat)}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1">
                            <span className="block text-[9px] text-slate-600">COL</span>
                            <span className="text-xs text-slate-400 font-mono">{formatCoordinate(details.previousState.softMembership?.collect)}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1">
                            <span className="block text-[9px] text-slate-600">EXP</span>
                            <span className="text-xs text-slate-400 font-mono">{formatCoordinate(details.previousState.softMembership?.explore)}</span>
                        </div>
                        </div>
                </div>
            )}
            
            {/* Calculated Velocity */}
            <div>
                    <div className="text-[10px] text-emerald-600 uppercase mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Calculated Velocity
                    </div>
                    {details.behavioralDeltas ? (
                        <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded px-2 py-1">
                            <span className="block text-[9px] text-emerald-700">Δ Combat</span>
                            <span className="text-xs text-emerald-400 font-mono font-bold">{formatVelocityValue(details.behavioralDeltas.Combat)}</span>
                        </div>
                        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded px-2 py-1">
                            <span className="block text-[9px] text-emerald-700">Δ Collect</span>
                            <span className="text-xs text-emerald-400 font-mono font-bold">{formatVelocityValue(details.behavioralDeltas.Collection)}</span>
                        </div>
                        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded px-2 py-1">
                            <span className="block text-[9px] text-emerald-700">Δ Explore</span>
                            <span className="text-xs text-emerald-400 font-mono font-bold">{formatVelocityValue(details.behavioralDeltas.Exploration)}</span>
                        </div>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-600 italic">No delta history available</div>
                    )}
            </div>
        </div>
    )
}

function ResultDetails({ details }: { details: any }) {
    const adaptedParams = details.adaptedParameters || {};

    return (
        <div className="space-y-3">
             <div className="bg-emerald-950/10 rounded p-3 border border-emerald-900/30">
                 <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Optimization Status</span>
                     <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                         {details.status}
                     </span>
                 </div>
                 <div className="flex items-baseline justify-between">
                     <span className="text-xs text-slate-400">Global Multiplier</span>
                     <span className="text-xl font-bold text-white font-mono">{formatMultiplier(details.finalMultiplier)}x</span>
                 </div>
             </div>

             <div className="space-y-2">
                 <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider flex items-center gap-2">
                     <Layers className="w-3 h-3" />
                     Adapted Parameters
                 </div>
                 
                 {Object.keys(adaptedParams).length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                          {Object.entries(adaptedParams).map(([key, value]) => (
                               <div key={key} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-800/50">
                                   <span className="text-xs text-slate-300">{key}</span>
                                   <div className="flex items-center gap-2">
                                       <span className="text-xs font-mono text-cyan-300">{String(value)}</span>
                                   </div>
                               </div>
                          ))}
                      </div>
                 ) : (
                     <div className="text-xs text-slate-500 italic p-2 border border-dashed border-slate-800 rounded">
                         Waiting for parameters...
                     </div>
                 )}
             </div>
        </div>
    );
}

// --- Main Export ---

export function PipelineStepDetails({ step, details, isInput = false }: { step: any, details: StepDetail, isInput?: boolean }) {
  const isAdaptation = !isInput && (step.name === 'Adaptation Analysis' || step.name === 'Defuzzification');
  const isResult = !isInput && step.name === 'Results Aggregation';
  
  if (isAdaptation) {
     return <AdaptationDetails details={details} />;
  }

  if (isResult) {
     return <ResultDetails details={details} />;
  }

  return <GenericStepDetails details={details} step={step} isInput={isInput} />;
}
