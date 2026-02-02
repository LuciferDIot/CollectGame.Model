/**
 * Change badge component for adapted parameters
 * Shows percentage change with color coding
 */
export function ChangeBadge({ change }: { change: number | undefined }) {
    if (!change) return null;
    
    const changePercent = change.toFixed(1);
    const isIncrease = change > 0;
    
    if (isIncrease) {
        return (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                +{changePercent}%
            </span>
        );
    }
    
    return (
        <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20">
            {changePercent}%
        </span>
    );
}

/**
 * Individual parameter card showing before/after values
 */
export function ParameterCard({ param, index }: { param: any, index: number }) {
    return (
        <div className="bg-card/40 rounded-lg border border-border/25 p-2.5 hover:bg-card/60 transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground font-medium">{param.field || `Param #${index}`}</span>
                    {param.category && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary/80 border border-primary/20">
                            {param.category}
                        </span>
                    )}
                </div>
                <ChangeBadge change={param.change} />
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
}

/**
 * Render array of adapted parameters
 */
export function ArrayParameters({ params }: { params: any[] }) {
    if (params.length === 0) {
        return (
            <div className="text-xs text-muted-foreground/30 italic p-2 border border-dashed border-border/20 rounded">
                No parameters adapted
            </div>
        );
    }
    
    return (
        <div className="space-y-2">
            {params.map((param, index) => (
                <ParameterCard key={index} param={param} index={index} />
            ))}
        </div>
    );
}

/**
 * Render object-based (legacy) parameters
 */
export function ObjectParameters({ params }: { params: Record<string, any> }) {
    if (Object.keys(params).length === 0) {
        return (
            <div className="text-xs text-muted-foreground/30 italic p-2 border border-dashed border-border/20 rounded">
                Waiting for parameters...
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 gap-2">
            {Object.entries(params).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-card/40 p-2 rounded border border-border/30">
                    <span className="text-xs text-muted-foreground">{key}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-primary">{String(value)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
