import { Zap } from 'lucide-react';

/**
 * Display adaptation method badge
 */
export function AdaptationMethodBadge({ method }: { method: string }) {
    return (
        <div className="bg-blue-500/5 rounded p-3 border border-blue-500/20 backdrop-blur-sm">
            <div className="flex items-baseline gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Adaptation Method</span>
                <span className="text-sm font-bold text-blue-400">{method}</span>
            </div>
        </div>
    );
}

/**
 * Fallback message when no deltas available
 */
export function NoDeltasFallback() {
    return (
        <div className="text-xs text-muted-foreground/40 italic p-3 border border-dashed border-border/10 rounded">
            No adaptation deltas available for this step
        </div>
    );
}
