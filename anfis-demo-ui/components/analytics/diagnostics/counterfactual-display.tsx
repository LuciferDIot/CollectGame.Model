import { CounterfactualResult } from '@/lib/analytics/counterfactuals';
import { Binary, Compass, Swords } from 'lucide-react';

export function CounterfactualDisplay({ result }: { result: CounterfactualResult }) {
    if (!result) return null;
    
    const impactColor = result.percentDifference > 5 ? 'text-amber-400' : 
                       result.percentDifference < -5 ? 'text-cyan-400' : 'text-slate-400';
    
    return (
        <div className="space-y-3">
             <div className="flex items-center justify-between text-xs">
                 <span className="text-slate-500">Static Multiplier (No Deltas)</span>
                 <span className="font-mono text-slate-400">{result.staticMultiplier.toFixed(2)}x</span>
             </div>
             <div className="flex items-center justify-between text-xs font-bold">
                 <span className="text-slate-300">Actual Multiplier (With Deltas)</span>
                 <span className="font-mono text-white">{result.actualMultiplier.toFixed(2)}x</span>
             </div>
             
             <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between">
                 <span className="text-[10px] uppercase tracking-wider text-slate-500">
                     Dynamic Adjust
                 </span>
                 <span className={`text-xs font-mono font-bold ${impactColor}`}>
                     {result.percentDifference > 0 ? '+' : ''}{result.percentDifference.toFixed(1)}%
                 </span>
             </div>
             
             {/* Archetype Contribution to Difference */}
             <div className="grid grid-cols-3 gap-1 pt-1">
                 <div className="bg-slate-900/50 rounded p-1 text-center border border-slate-800/50">
                     <Swords className="w-2 h-2 text-red-500 mx-auto mb-1" />
                     <div className="text-[9px] text-slate-500">
                        {result.contributions.combat.toFixed(2)}
                     </div>
                 </div>
                 <div className="bg-slate-900/50 rounded p-1 text-center border border-slate-800/50">
                      <Binary className="w-2 h-2 text-emerald-500 mx-auto mb-1" />
                      <div className="text-[9px] text-slate-500">
                        {result.contributions.collect.toFixed(2)}
                      </div>
                 </div>
                 <div className="bg-slate-900/50 rounded p-1 text-center border border-slate-800/50">
                      <Compass className="w-2 h-2 text-cyan-500 mx-auto mb-1" />
                      <div className="text-[9px] text-slate-500">
                        {result.contributions.explore.toFixed(2)}
                      </div>
                 </div>
             </div>
        </div>
    )
}
