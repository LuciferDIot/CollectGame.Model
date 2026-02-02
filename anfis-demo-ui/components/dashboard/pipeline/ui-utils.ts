
// --- Styling Helpers ---

export function getStatusColorClasses(status: string): string {
    if (status === 'completed') return 'border-emerald-500/50 text-emerald-400';
    if (status === 'running') return 'border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]';
    if (status === 'error') return 'border-destructive text-destructive';
    return 'border-border/50 text-muted-foreground';
}

export function getCardBackgroundClasses(isRunning: boolean): string {
    return isRunning 
        ? 'bg-card/90 backdrop-blur-md border-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]' 
        : 'bg-card/50 backdrop-blur-sm border-border/30 hover:border-primary/25 hover:bg-card/70 transition-all duration-300';
}

export function getHeaderTitleColor(isRunning: boolean): string {
    return isRunning ? 'text-cyan-400' : 'text-slate-200';
}

export function getBaseIconClasses(): string {
    return "absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 bg-slate-950 transition-colors duration-300";
}

// --- Formatting Helpers ---

export function formatVelocityValue(val: any): string {
    return Number(val).toFixed(4);
}

export function formatMultiplier(val: any): string {
    return Number(val).toFixed(2);
}

export function formatCoordinate(val: number): string {
    return val.toFixed(2);
}
