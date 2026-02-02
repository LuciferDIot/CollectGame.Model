'use client';

import { PipelineStepItem } from '@/components/dashboard/pipeline/step-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { usePipeline } from '@/lib/session/pipeline-context';
import { AnimatePresence } from 'framer-motion';
import { BrainCircuit, Cpu } from 'lucide-react';

export function CenterPanel() {
  const { pipelineState } = usePipeline();
  // Use extracted hook for auto-scroll logic
  const scrollRef = useAutoScroll([pipelineState.steps.length, pipelineState.executionTime]);

  return (
    <div className="h-full flex flex-col bg-background/60 backdrop-blur-lg border-r border-border relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-size-[50px_50px] opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(to right, var(--primary) 1px, transparent 1px), linear-gradient(to bottom, var(--primary) 1px, transparent 1px)' }} 
      />
      
      {/* Header */}
      <div className="h-12 border-b border-border bg-background/40 backdrop-blur-md flex items-center px-4 justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground/90 tracking-tight">Pipeline Execution</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground/60">
             {pipelineState.isRunning ? (
                 <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    RUNNING
                 </span>
             ) : (
                 <span className="text-slate-600">IDLE</span>
             )}
             {pipelineState.executionTime > 0 && (
                 <span className="ml-3 text-cyan-600 border-l border-slate-800 pl-3">
                     {pipelineState.executionTime.toFixed(1)}ms
                 </span>
             )}
        </div>
      </div>

      {/* Steps List */}
      <ScrollArea className="flex-1 basis-0 min-h-0 w-full relative" ref={scrollRef} type="always">
          <div className="p-6 space-y-4 min-h-full pb-20 relative z-10">
            {/* Decorative Connection Line */}
            <div className="absolute left-[29px] top-6 bottom-20 w-px bg-border/30 -z-10 shadow-[0_0_10px_rgba(var(--primary-rgb),0.05)]" />

            <AnimatePresence mode='popLayout'>
                {pipelineState.steps.map((step, index) => (
                    <PipelineStepItem 
                        key={step.id} 
                        step={step} 
                        index={index} 
                        isLast={index === pipelineState.steps.length - 1} 
                    />
                ))}
            </AnimatePresence>
            
            {pipelineState.steps.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-40 mt-20 select-none pointer-events-none">
                    <div className="w-32 h-32 rounded-full border border-slate-800 flex items-center justify-center relative">
                        <div className="absolute inset-0 border border-slate-800 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-2 border border-slate-800/60 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]" />
                        <BrainCircuit className="w-12 h-12 text-slate-800" />
                    </div>
                    <p className="text-xs text-slate-700 uppercase tracking-[0.2em] mt-6 font-bold">System Online</p>
                    <p className="text-xs text-slate-800 font-mono mt-2">Awaiting Telemetry Stream</p>
                </div>
            )}
          </div>
      </ScrollArea>
      
      {/* Decorative HUD Corners */}
      <div className="absolute top-12 left-0 w-4 h-4 border-l border-t border-primary/20" />
      <div className="absolute top-12 right-0 w-4 h-4 border-r border-t border-primary/20" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-primary/20" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-primary/20" />

      {/* Scanning Line Animation (Overlay) */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent pointer-events-none -translate-y-full animate-[scan_8s_ease-in-out_infinite]" />

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background via-background/80 to-transparent pointer-events-none" />
    </div>
  );
}
