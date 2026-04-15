/**
 * Display a single parameter adjustment row
 */
function ParameterAdjustmentRow({ delta, idx }: { delta: any; idx: number }) {
    const change = delta.change !== undefined 
        ? delta.change 
        : ((delta.after - delta.before) / delta.before) * 100;
    const changeClass = change > 0 ? 'text-emerald-400' : change < 0 ? 'text-rose-400' : 'text-muted-foreground';
    
    return (
        <div className="flex items-center justify-between bg-card/20 p-2.5 rounded border border-border/15">
            <div className="flex-1">
                <span className="text-xs text-foreground/80 font-medium">{delta.field}</span>
                {delta.category && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary/70 border border-primary/20">
                        {delta.category}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {delta.before?.toFixed(3)} -> {delta.after?.toFixed(3)}
                </span>
                <span className={`text-xs font-mono font-bold ${changeClass} min-w-[60px] text-right`}>
                    {change > 0 && '+'}{change?.toFixed(1)}%
                </span>
            </div>
        </div>
    );
}

/**
 * Display list of parameter adjustments
 */
export function ParameterAdjustmentsList({ deltas }: { deltas: any[] }) {
    return (
        <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">
                Parameter Adjustments
            </div>
            {deltas.map((delta, idx) => (
                <ParameterAdjustmentRow key={idx} delta={delta} idx={idx} />
            ))}
        </div>
    );
}
