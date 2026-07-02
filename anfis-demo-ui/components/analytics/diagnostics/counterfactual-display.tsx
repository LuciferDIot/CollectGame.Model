import { CounterfactualResult } from '@/lib/analytics/counterfactuals';
import { Binary, Compass, Swords } from 'lucide-react';

export function CounterfactualDisplay({ result }: { result: CounterfactualResult }) {
    if (!result) return null;
    
    const impactColor = result.percentDifference > 5 ? 'text-amber-600 dark:text-amber-400' : 
                       result.percentDifference < -5 ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground';
    
    return (
        <div className="space-y-3">
             <div className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">Static Multiplier (No Deltas)</span>
                 <span className="font-mono text-foreground/70">{result.staticMultiplier.toFixed(2)}x</span>
             </div>
             <div className="flex items-center justify-between text-xs font-bold">
                 <span className="text-foreground">Actual Multiplier (With Deltas)</span>
                 <span className="font-mono text-foreground">{result.actualMultiplier.toFixed(2)}x</span>
             </div>
             
             <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                 <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                     Dynamic Adjust
                 </span>
                 <span className={`text-xs font-mono font-bold ${impactColor}`}>
                     {result.percentDifference > 0 ? '+' : ''}{result.percentDifference.toFixed(1)}%
                 </span>
             </div>
             
             {/* Archetype Contribution to Difference */}
             <div className="grid grid-cols-3 gap-1 pt-1">
                 <div className="bg-muted/50 rounded p-1 text-center border border-border/50">
                     <Swords className="w-2 h-2 text-red-500 mx-auto mb-1" />
                     <div className="text-[9px] text-muted-foreground">
                        {result.contributions.combat.toFixed(2)}
                     </div>
                 </div>
                 <div className="bg-muted/50 rounded p-1 text-center border border-border/50">
                      <Binary className="w-2 h-2 text-emerald-500 mx-auto mb-1" />
                      <div className="text-[9px] text-muted-foreground">
                        {result.contributions.collect.toFixed(2)}
                      </div>
                 </div>
                 <div className="bg-muted/50 rounded p-1 text-center border border-border/50">
                      <Compass className="w-2 h-2 text-cyan-500 mx-auto mb-1" />
                      <div className="text-[9px] text-muted-foreground">
                        {result.contributions.explore.toFixed(2)}
                      </div>
                 </div>
             </div>
        </div>
    )
}
