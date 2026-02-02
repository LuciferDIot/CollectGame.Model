import { Layers } from 'lucide-react';
import { ArrayParameters, ObjectParameters } from './parameter-components';

/**
 * Format multiplier for display
 */
function formatMultiplier(val: number | undefined): string {
    return val ? val.toFixed(2) : '1.00';
}

/**
 * Display results aggregation details with adapted parameters
 */
export function ResultDetails({ details }: { details: any }) {
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
                 
                 {isArray ? <ArrayParameters params={adaptedParams} /> : <ObjectParameters params={adaptedParams} />}
             </div>
        </div>
    );
}
