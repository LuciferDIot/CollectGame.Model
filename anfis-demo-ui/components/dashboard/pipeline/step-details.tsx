import { Activity, Layers, Zap } from 'lucide-react';

import { isSmallObject } from '@/lib/utils'; // Keep cn if used, add isSmallObject

// Helper to render complex outputs safely
type StepDetail = Record<string, any>;

// --- Sub Renderers ---


// ... other imports ...

function GenericStepDetails({ details, step, isInput }: { details: StepDetail, step: any, isInput?: boolean }) {
    // Handle arrays at the top level
    if (Array.isArray(details)) {
        return (
            <div className="space-y-2">
                {details.map((item, index) => (
                    <div key={index} className="bg-card/30 rounded-lg border border-border/20 p-3">
                        <div className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">Item {index}</div>
                        <PipelineStepDetails step={step} details={item} isInput={isInput} />
                    </div>
                ))}
            </div>
        );
    }
    
    const entries = Object.entries(details).filter(([key]) => key !== 'valid' && key !== 'methodConfidence');
    
    return (
        <div className="space-y-2">
            {entries.map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').trim();
                
                // 1. Arrays: Display as numbered list
                if (Array.isArray(value)) {
                    return (
                        <div key={key} className="bg-card/30 rounded-lg border border-border/20 p-3">
                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Layers className="w-3 h-3" />
                                {label}
                            </div>
                            <div className="space-y-1.5">
                                {value.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-card/40 rounded border border-border/20">
                                        <span className="text-[10px] text-muted-foreground font-mono">#{idx}</span>
                                        {typeof item === 'object' && item !== null ? (
                                            <div className="flex-1 ml-3">
                                                <PipelineStepDetails step={step} details={item} isInput={isInput} />
                                            </div>
                                        ) : (
                                            <span className="text-xs font-mono text-foreground/90">{String(item)}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                
                // 2. Primitives: Clean single-line display
                if (typeof value !== 'object' || value === null) {
                    return (
                        <div key={key} className="flex items-center justify-between py-2 px-3 bg-card/40 rounded-lg border border-border/20 hover:bg-card/60 hover:border-border/40 transition-all duration-200">
                            <span className="text-xs font-medium text-muted-foreground capitalize">{label}</span>
                            <span className="text-xs font-mono text-foreground/90 ml-4 truncate max-w-[200px]">{String(value)}</span>
                        </div>
                    );
                }
                
                // 3. Small Objects: Nested card layout
                if (isSmallObject(value)) {
                    return (
                        <div key={key} className="bg-card/30 rounded-lg border border-border/20 p-3">
                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Layers className="w-3 h-3" />
                                {label}
                            </div>
                            <PipelineStepDetails step={step} details={value} isInput={isInput} />
                        </div>
                    );
                }
                
                // 4. Complex Fallback: Placeholder
                return (
                    <div key={key} className="flex items-center justify-between py-2 px-3 bg-card/20 rounded-lg border border-dashed border-border/20">
                        <span className="text-xs font-medium text-muted-foreground capitalize">{label}</span>
                        <span className="text-[10px] text-muted-foreground/50 italic">Complex Data</span>
                    </div>
                );
            })}
        </div>
    );
}

import { formatCoordinate, formatMultiplier, formatVelocityValue } from './ui-utils';

function AdaptationDetails({ details }: { details: any }) {
    return (
        <div className="bg-background/80 rounded p-3 border border-border/50 backdrop-blur-sm">
            <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                State Evolution
            </div>
            
            {/* Previous State Vector */}
            {details.previousState && (
                <div className="mb-3">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">Previous State (t-1)</div>
                        <div className="grid grid-cols-3 gap-2">
                        <div className="bg-background/40 border border-border/40 rounded px-2 py-1">
                            <span className="block text-[9px] text-muted-foreground/50">CMB</span>
                            <span className="text-xs text-muted-foreground font-mono">{formatCoordinate(details.previousState.softMembership?.combat)}</span>
                        </div>
                        <div className="bg-background/40 border border-border/40 rounded px-2 py-1">
                            <span className="block text-[9px] text-muted-foreground/50">COL</span>
                            <span className="text-xs text-muted-foreground font-mono">{formatCoordinate(details.previousState.softMembership?.collect)}</span>
                        </div>
                        <div className="bg-background/40 border border-border/40 rounded px-2 py-1">
                            <span className="block text-[9px] text-muted-foreground/50">EXP</span>
                            <span className="text-xs text-muted-foreground font-mono">{formatCoordinate(details.previousState.softMembership?.explore)}</span>
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
                        <div className="text-xs text-muted-foreground/40 italic">No delta history available</div>
                    )}
            </div>
        </div>
    )
}

function ResultDetails({ details }: { details: any }) {
    const adaptedParams = details.adaptedParameters || {};
    const isArray = Array.isArray(adaptedParams);

    return (
        <div className="space-y-3">
             <div className="bg-emerald-500/5 rounded p-3 border border-emerald-500/20 backdrop-blur-sm">
                 <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Optimization Status</span>
                     <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                         {details.status}
                     </span>
                 </div>
                 <div className="flex items-baseline justify-between">
                     <span className="text-xs text-muted-foreground">Global Multiplier</span>
                     <span className="text-xl font-bold text-foreground font-mono">{formatMultiplier(details.finalMultiplier)}x</span>
                 </div>
             </div>

             <div className="space-y-2">
                 <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                     <Layers className="w-3 h-3" />
                     Adapted Parameters
                 </div>
                 
                 {isArray ? (
                     // Array of AdaptationDelta objects
                     adaptedParams.length > 0 ? (
                        <div className="space-y-2">
                            {adaptedParams.map((param: any, index: number) => {
                                const changePercent = param.change?.toFixed(1) || '0.0';
                                const isIncrease = (param.change || 0) > 0;
                                const isDecrease = (param.change || 0) < 0;
                                
                                return (
                                    <div key={index} className="bg-card/40 rounded-lg border border-border/25 p-2.5 hover:bg-card/60 transition-all duration-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-foreground font-medium">{param.field || `Param #${index}`}</span>
                                                {param.category && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary/80 border border-primary/20">
                                                        {param.category}
                                                    </span>
                                                )}
                                            </div>
                                            {isIncrease && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    +{changePercent}%
                                                </span>
                                            )}
                                            {isDecrease && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                    {changePercent}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center justify-between py-1 px-2 bg-background/40 rounded">
                                                <span className="text-[10px] text-muted-foreground">Before</span>
                                                <span className="text-xs font-mono text-muted-foreground/80">{param.before?.toFixed(3) || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-1 px-2 bg-primary/5 rounded border border-primary/20">
                                                <span className="text-[10px] text-primary font-medium">After</span>
                                                <span className="text-xs font-mono text-primary font-bold">{param.after?.toFixed(3) || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                     ) : (
                         <div className="text-xs text-muted-foreground/30 italic p-2 border border-dashed border-border/20 rounded">
                             No parameters adapted
                         </div>
                     )
                 ) : (
                     // Object-based parameters (legacy fallback)
                     Object.keys(adaptedParams).length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                              {Object.entries(adaptedParams).map(([key, value]) => (
                                   <div key={key} className="flex items-center justify-between bg-card/40 p-2 rounded border border-border/30">
                                       <span className="text-xs text-muted-foreground">{key}</span>
                                       <div className="flex items-center gap-2">
                                           <span className="text-xs font-mono text-primary">{String(value)}</span>
                                       </div>
                                   </div>
                              ))}
                          </div>
                     ) : (
                         <div className="text-xs text-muted-foreground/30 italic p-2 border border-dashed border-border/20 rounded">
                             Waiting for parameters...
                         </div>
                     )
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
