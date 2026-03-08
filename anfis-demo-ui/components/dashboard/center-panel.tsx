'use client';

import React from 'react';
import { PipelineStepItem } from '@/components/dashboard/pipeline/step-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { usePipeline } from '@/lib/session/pipeline-context';
import { AnimatePresence } from 'framer-motion';
import { BarChart3, BrainCircuit, Cpu, FileJson, PlayCircle, Zap } from 'lucide-react';

export function CenterPanel() {
  const { pipelineState } = usePipeline();
  // Use extracted hook for auto-scroll logic
  const scrollRef = useAutoScroll([pipelineState.steps.length, pipelineState.executionTime]);

  return (
    <div className="h-full flex flex-col glass-panel border-r border-border/30 relative overflow-hidden">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 bg-size-[60px_60px] opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(to right, oklch(0.72 0.14 210) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.72 0.14 210) 1px, transparent 1px)' }}
      />

      {/* Premium Header */}
      <div className="h-14 border-b border-white/5 bg-background/20 backdrop-blur-xl flex items-center px-6 justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </div>
          <span className="text-[10px] font-black text-foreground uppercase tracking-[0.25em]">
            Pipeline Sequence
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
            {pipelineState.isRunning ? (
              <span className="text-primary flex items-center gap-2 animate-pulse">
                ACTIVE_STREAM
              </span>
            ) : (
              <span className="opacity-50">STDBY_MODE</span>
            )}
            {pipelineState.executionTime > 0 && (
              <span className="text-accent border-l border-white/10 pl-4">
                {pipelineState.executionTime.toFixed(2)}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Steps List */}
      <ScrollArea className="flex-1 basis-0 min-h-0 w-full relative custom-scrollbar" ref={scrollRef} type="always">
        <div className="p-8 space-y-6 min-h-full pb-24 relative z-10 max-w-4xl mx-auto">
          {/* Decorative Connection Line */}
          <div className="absolute left-[39px] top-8 bottom-24 w-px bg-linear-to-b from-primary/30 via-accent/20 to-transparent -z-10" />

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
            <div className="flex flex-col gap-8 mt-4 px-2 select-none animate-fade-in">
              {/* Branding Header */}
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-2xl tech-border flex items-center justify-center relative bg-primary/5">
                  <div className="absolute inset-0 border border-primary/20 rounded-2xl animate-[spin_12s_linear_infinite] opacity-30" />
                  <BrainCircuit className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mb-1">Deployment Guide</p>
                  <p className="text-[11px] text-muted-foreground/60 italic font-serif">Follow the sequence to initialize AURA</p>
                </div>
              </div>

              {/* Step-by-Step Tutorial cards with enhanced glass effect */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TutorialStep
                  number={1}
                  icon={<FileJson className="w-5 h-5 text-chart-1" />}
                  title="Ingest Telemetry"
                  description='Paste JSON-formatted player behavioral data into the source console.'
                  color="cyan"
                />
                <TutorialStep
                  number={2}
                  icon={<PlayCircle className="w-5 h-5 text-chart-3" />}
                  title="Start Simulation"
                  description="Execute the pipeline to begin the multi-stage fuzzy inference process."
                  color="emerald"
                />
                <TutorialStep
                  number={3}
                  icon={<BrainCircuit className="w-5 h-5 text-chart-2" />}
                  title="Analyze Logic"
                  description="Observe real-time clustering, rule activations, and parameter adaptation."
                  color="violet"
                />
                <TutorialStep
                  number={4}
                  icon={<BarChart3 className="w-5 h-5 text-chart-4" />}
                  title="Review Console"
                  description='Examine performance deltas and system transparency in the Analytics view.'
                  color="amber"
                />
              </div>

              {/* System Summary */}
              <div className="border border-white/5 rounded-2xl p-6 bg-secondary/20 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Zap size={12} className="text-primary" />
                  System Architecture
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AURA utilizes an <span className="text-foreground font-bold">ANFIS-based Inference Engine</span> to bridge high-resolution gameplay telemetry with low-latency parameter adaptation. By mapping behavioral archetypes through soft-clustering, the system facilitates dynamic, personalized challenge scaling without sacrificing gameplay cohesion.
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Premium HUD Decor */}
      <div className="absolute top-14 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/20 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-14 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/20 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary/20 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/20 rounded-br-sm pointer-events-none" />

      {/* Advanced Scanning Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent pointer-events-none -translate-y-full animate-[scan_10s_ease-in-out_infinite] opacity-30" />

      {/* Elegant Edge Fades */}
      <div className="absolute top-14 left-0 right-0 h-12 bg-linear-to-b from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background via-background/80 to-transparent z-20 pointer-events-none" />
    </div>
  );
}

function TutorialStep({ number, icon, title, description, color }: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';
}) {
  const borderColors = {
    cyan: 'border-cyan-800/40',
    emerald: 'border-emerald-800/40',
    violet: 'border-violet-800/40',
    amber: 'border-amber-800/40',
    rose: 'border-rose-800/40',
  };
  const numberColors = {
    cyan: 'text-cyan-600',
    emerald: 'text-emerald-600',
    violet: 'text-violet-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
  };

  return (
    <div className={`flex gap-3 p-3 rounded-lg border bg-slate-900/20 ${borderColors[color]}`}>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className={`text-[10px] font-bold font-mono ${numberColors[color]}`}>{number}</span>
        <div className="mt-0.5">{icon}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-300 mb-0.5">{title}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
