
import { cn } from "@/lib/utils";

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  isLongValue?: boolean;
  className?: string;
  valueClassName?: string;
}

export function DetailRow({ 
  label, 
  value, 
  isLongValue = false,
  className,
  valueClassName
}: DetailRowProps) {
    return (
        <div className={cn(
          "flex items-baseline justify-between py-1 border-b border-slate-800/40",
          isLongValue ? 'col-span-2' : '',
          className
        )}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">{label}</span>
            <span className={cn("font-mono text-xs text-slate-300 break-all text-right", valueClassName)}>
                {value}
            </span>
        </div>
    );
}

interface SmallObjectDetailsProps {
  label: string;
  children: React.ReactNode;
}

export function SmallObjectDetails({ label, children }: SmallObjectDetailsProps) {
    return (
        <div className="col-span-2 mt-2">
            <div className="text-[9px] text-cyan-600/70 uppercase tracking-widest mb-1 pl-1 border-l-2 border-cyan-800/30">
                {label}
            </div>
            <div className="pl-2 border-l border-slate-800 bg-slate-900/30 p-2 rounded">
                {children}
            </div>
        </div>
    );
}
