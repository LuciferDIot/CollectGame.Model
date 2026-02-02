import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MetricCardProps {
  label: string;
  subLabel?: string;
  status: 'success' | 'warning' | 'error' | 'neutral';
  value: string | number;
  detail?: string;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({ 
  label, 
  subLabel, 
  status, 
  value, 
  detail, 
  onClick,
  className 
}: MetricCardProps) {
    const styles = {
        success: {
            border: "border-emerald-500/20",
            bg: "bg-emerald-950/20",
            text: "text-emerald-400",
            indicator: "bg-emerald-500/50",
            icon: <ShieldCheck className="w-3.5 h-3.5" />,
            glow: "drop-shadow-[0_0_3px_rgba(16,185,129,0.3)]"
        },
        warning: {
            border: "border-amber-500/20",
            bg: "bg-amber-950/20",
            text: "text-amber-400",
            indicator: "bg-amber-500/50",
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            glow: ""
        },
        error: {
            border: "border-red-500/20",
            bg: "bg-red-950/20",
            text: "text-red-400",
            indicator: "bg-red-500/50",
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            glow: ""
        },
        neutral: {
            border: "border-slate-500/20",
            bg: "bg-slate-950/20",
            text: "text-slate-400",
            indicator: "bg-slate-500/50",
            icon: <Activity className="w-3.5 h-3.5" />,
            glow: ""
        }
    };

    const currentStyle = styles[status] || styles.neutral;

    return (
        <div 
          onClick={onClick}
          className={cn(
            "relative group overflow-hidden rounded bg-[#0b1221] border border-slate-800/60 transition-all duration-300",
            onClick && "cursor-pointer hover:border-cyan-500/50",
            className
          )}
        >
            {/* Status Indicator Line */}
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${currentStyle.indicator} group-hover:w-1.5 transition-all`} />
            
            <div className="p-3 pl-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center shrink-0 border bg-cover",
                      currentStyle.border, currentStyle.bg, currentStyle.text
                   )}>
                      {currentStyle.icon}
                   </div>
                   <div>
                      <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 group-hover:text-cyan-300 transition-colors">
                        {label}
                      </h4>
                      {subLabel && (
                        <div className="text-[9px] text-slate-600 font-mono flex items-center gap-1">
                            <Activity className="w-2 h-2" />
                            {subLabel}
                        </div>
                      )}
                   </div>
                </div>

                <div className="text-right">
                   <div className={cn(
                      "font-mono font-bold text-xs tracking-wider",
                      currentStyle.text,
                      currentStyle.glow
                   )}>
                      {value}
                   </div>
                   {detail && (
                     <div className="text-[9px] text-slate-500 font-mono uppercase">
                        {detail}
                     </div>
                   )}
                </div>
            </div>
            
            {/* Hover Scanline */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
        </div>
    )
}
