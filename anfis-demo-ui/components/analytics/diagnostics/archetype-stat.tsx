import type { Archetype } from '@/lib/analytics';
import { Target } from 'lucide-react';

export function ArchetypeStat({ type, pct, isDominant }: { type: Archetype, pct: number, isDominant: boolean }) {
    const colors = {
        combat: 'text-red-400 bg-red-400',
        collect: 'text-emerald-400 bg-emerald-400',
        explore: 'text-cyan-400 bg-cyan-400'
    };
    
    return (
        <div className={`relative px-2 py-1.5 rounded border ${isDominant ? 'bg-slate-800 border-slate-700' : 'bg-transparent border-transparent'}`}>
            <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${colors[type].split(' ')[0]}`}>
                    {type}
                </span>
                {isDominant && <Target className={`w-3 h-3 ${colors[type].split(' ')[0]}`} />}
            </div>
            <div className="flex items-end gap-1">
                <span className="text-lg font-mono leading-none text-slate-200">
                    {(pct * 100).toFixed(0)}
                </span>
                <span className="text-[10px] text-slate-500 mb-0.5">%</span>
            </div>
            
            {/* Mini Bar */}
            <div className="h-0.5 w-full bg-slate-800 mt-1 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${colors[type].split(' ')[1]}`} 
                    style={{ width: `${pct * 100}%` }}
                />
            </div>
        </div>
    );
}
