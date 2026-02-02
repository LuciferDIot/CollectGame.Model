
// --- Styling Helpers ---

export function getStatusColorClasses(status: string): string {
    if (status === 'completed') return 'border-emerald-500/50 text-emerald-500';
    if (status === 'running') return 'border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]';
    if (status === 'error') return 'border-red-500 text-red-500';
    return 'border-slate-700 text-slate-600';
}

export function getCardBackgroundClasses(isRunning: boolean): string {
    return isRunning 
        ? 'bg-slate-900/80 border-cyan-500/50 shadow-lg' 
        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50';
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
