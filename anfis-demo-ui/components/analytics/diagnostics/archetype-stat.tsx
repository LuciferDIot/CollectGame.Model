import type { Archetype } from '@/lib/analytics';
import { Target } from 'lucide-react';

export function ArchetypeStat({ type, pct, isDominant }: { type: Archetype, pct: number, isDominant: boolean }) {
    const colors = {
        combat: 'text-red-600 dark:text-red-400 bg-red-500',
        collect: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500',
        explore: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500'
    };
    
    return (
        <div className={`relative px-2 py-1.5 rounded border ${isDominant ? 'bg-muted border-border' : 'bg-transparent border-transparent'}`}>
            <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${colors[type].split(' ')[0]}`}>
                    {type}
                </span>
                {isDominant && <Target className={`w-3 h-3 ${colors[type].split(' ')[0]}`} />}
            </div>
            <div className="flex items-end gap-1">
                <span className="text-lg font-mono leading-none text-foreground">
                    {(pct * 100).toFixed(0)}
                </span>
                <span className="text-[10px] text-muted-foreground mb-0.5">%</span>
            </div>
            
            {/* Mini Bar */}
            <div className="h-0.5 w-full bg-muted mt-1 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${colors[type].split(' ')[2]}`} 
                    style={{ width: `${pct * 100}%` }}
                />
            </div>
        </div>
    );
}
