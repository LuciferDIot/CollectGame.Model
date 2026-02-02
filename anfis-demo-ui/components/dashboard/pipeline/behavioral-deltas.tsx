/**
 * Display a single behavioral delta row
 */
function BehavioralDeltaRow({ category, delta, previousValue }: { 
    category: string; 
    delta: number; 
    previousValue: number;
}) {
    const changeClass = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-muted-foreground';
    const currentValue = previousValue + delta;
    
    return (
        <div className="flex items-center justify-between bg-card/20 p-2.5 rounded border border-border/15">
            <div className="flex-1">
                <span className="text-xs text-foreground/80 font-medium">{category}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {previousValue.toFixed(3)} → {currentValue.toFixed(3)}
                </span>
                <span className={`text-xs font-mono font-bold ${changeClass} min-w-[60px] text-right`}>
                    {delta > 0 && '+'}{delta?.toFixed(3)}
                </span>
            </div>
        </div>
    );
}

/**
 * Display list of behavioral deltas
 */
export function BehavioralDeltasList({ deltas, previousState }: { 
    deltas: Record<string, any>; 
    previousState: any;
}) {
    return (
        <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">
                Behavioral Shifts
            </div>
            {Object.entries(deltas).map(([category, delta]: [string, any]) => {
                const previousValue = previousState?.softMembership?.[category.toLowerCase()] || 0;
                return (
                    <BehavioralDeltaRow 
                        key={category}
                        category={category}
                        delta={delta}
                        previousValue={previousValue}
                    />
                );
            })}
        </div>
    );
}
