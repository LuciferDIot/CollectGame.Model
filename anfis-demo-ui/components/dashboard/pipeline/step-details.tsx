import { isSmallObject } from '@/lib/utils';
import { Layers } from 'lucide-react';
import { AdaptationDetails } from './adaptation-details';
import { ResultDetails } from './result-details';

type StepDetail = Record<string, any>;

/**
 * Generic step details renderer
 */
function GenericStepDetails({ details, step, isInput }: { details: StepDetail, step: any, isInput?: boolean }) {
    if (Array.isArray(details)) {
        return (
            <div className="space-y-2">
                {details.map((item, index) => (
                    <div key={index} className="bg-card/15 rounded-lg border border-border/10 p-3">
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
                
                if (Array.isArray(value)) {
                    return (
                        <div key={key} className="bg-card/15 rounded-lg border border-border/10 p-3">
                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Layers className="w-3 h-3" />
                                {label}
                            </div>
                            <div className="space-y-1.5">
                                {value.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 bg-card/20 rounded border border-border/10">
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
                
                if (typeof value !== 'object' || value === null) {
                    return (
                        <div key={key} className="flex items-center justify-between py-2 px-3 bg-card/20 rounded-lg border border-border/10 hover:bg-card/30 hover:border-border/20 transition-all duration-200">
                            <span className="text-xs font-medium text-muted-foreground capitalize">{label}</span>
                            <span className="text-xs font-mono text-foreground/90 ml-4 truncate max-w-[200px]">{String(value)}</span>
                        </div>
                    );
                }
                
                if (isSmallObject(value)) {
                    return (
                        <div key={key} className="bg-card/15 rounded-lg border border-border/10 p-3">
                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Layers className="w-3 h-3" />
                                {label}
                            </div>
                            <PipelineStepDetails step={step} details={value} isInput={isInput} />
                        </div>
                    );
                }
                
                return (
                    <div key={key} className="flex items-center justify-between py-2 px-3 bg-card/10 rounded-lg border border-dashed border-border/10">
                        <span className="text-xs font-medium text-muted-foreground capitalize">{label}</span>
                        <span className="text-[10px] text-muted-foreground/50 italic">Complex Data</span>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Main pipeline step details component
 */
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
