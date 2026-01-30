'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { METRIC_EXPLANATIONS } from '@/lib/analytics/educational-content';
import { cn } from '@/lib/utils';
import { BookOpen, Calculator, Eye } from 'lucide-react';

interface MetricDetailModalProps {
  metricKey: string;
  isOpen: boolean;
  onClose: () => void;
  currentValue?: string | number | null;
  status?: 'success' | 'warning' | 'error' | 'neutral';
}

export function MetricDetailModal({ 
  metricKey, 
  isOpen, 
  onClose, 
  currentValue,
  status = 'neutral'
}: MetricDetailModalProps) {
  const content = METRIC_EXPLANATIONS[metricKey];

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Cyberpunk Modal: Dark Blue/Black gradient, Tech Borders, Neon Accents */}
      <DialogContent className="max-w-[600px] border-none bg-transparent p-0 shadowable overflow-hidden">
        <div className="relative bg-[#0b0d14] border border-cyan-900/50 text-slate-200 p-6 rounded-xl shadow-[0_0_40px_rgba(8,145,178,0.15)] overflow-hidden">
          
          {/* Decorative glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <DialogHeader className="border-b border-white/5 pb-4 relative z-10">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-cyan-950/30 rounded border border-cyan-500/20">
                 <Calculator className="w-5 h-5 text-cyan-400" />
               </div>
               <div>
                  <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wide uppercase">
                    {content.title}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs font-mono mt-1">
                    SYSTEM_METRIC_ID: {metricKey.toUpperCase()}
                  </DialogDescription>
               </div>
            </div>
            <div className="mt-4 text-sm text-slate-300 leading-relaxed font-light">
               {content.what}
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-6 relative z-10">
            
            {/* 1. WHY IT MATTERS - Cyberpunk Panel */}
            <section className="space-y-2">
               <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                 <Eye className="w-3 h-3" /> Strategic Value
               </h4>
               <p className="text-sm text-amber-100/80 bg-amber-950/10 p-4 rounded border-l-2 border-amber-500/50 leading-relaxed font-light">
                 {content.why}
               </p>
            </section>

            {/* 2. COMPUTATION & READING */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <section className="space-y-2">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-500">
                    <Calculator className="w-3 h-3" /> Algorithm
                  </h4>
                  <div className="text-xs text-cyan-300 font-mono bg-cyan-950/20 p-3 rounded border border-cyan-900/30 break-all shadow-inner">
                    {content.computed}
                  </div>
               </section>

               <section className="space-y-2">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">
                    <BookOpen className="w-3 h-3" /> Interpretation
                  </h4>
                  <p className="text-xs text-emerald-200/70 p-3 bg-emerald-950/10 rounded border border-emerald-900/20 italic">
                    {content.reading}
                  </p>
               </section>
            </div>

            {/* 3. CURRENT VALUE HIGHLIGHT */}
            {currentValue !== undefined && (
               <section className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                     <span className="text-xs text-slate-500 font-bold uppercase tracking-[0.15em]">Live Telemetry</span>
                     <div className={cn(
                        "text-2xl font-mono font-bold px-4 py-2 rounded bg-opacity-20 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)]",
                        status === 'success' ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" :
                        status === 'warning' ? "bg-amber-950 text-amber-400 border border-amber-500/30" :
                        status === 'error' ? "bg-red-950 text-red-400 border border-red-500/30" :
                        "bg-slate-800 text-slate-200 border border-slate-700"
                     )}>
                        {currentValue}
                     </div>
                  </div>
               </section>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
