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
                <div className="flex flex-col gap-6 mt-6 px-2 select-none">
                    {/* Branding Header */}
                    <div className="flex flex-col items-center gap-3 py-4 opacity-60">
                        <div className="w-16 h-16 rounded-full border border-slate-800 flex items-center justify-center relative">
                            <div className="absolute inset-0 border border-slate-800 rounded-full animate-[spin_10s_linear_infinite]" />
                            <BrainCircuit className="w-8 h-8 text-slate-700" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase tracking-[0.2em] font-bold">How to Use</p>
                    </div>

                    {/* Step-by-Step Tutorial Cards */}
                    <div className="flex flex-col gap-3">
                        <TutorialStep
                            number={1}
                            icon={<FileJson className="w-4 h-4 text-cyan-400" />}
                            title="Paste game telemetry data"
                            description='In the left panel, paste a JSON object with stats from one play session — kills, damage, distance, items collected, etc.'
                            color="cyan"
                        />
                        <TutorialStep
                            number={2}
                            icon={<PlayCircle className="w-4 h-4 text-emerald-400" />}
                            title="Click Run Simulation"
                            description="Press the Run button to send the data through the AI pipeline. You will see each processing step appear here in real time."
                            color="emerald"
                        />
                        <TutorialStep
                            number={3}
                            icon={<BrainCircuit className="w-4 h-4 text-violet-400" />}
                            title="Watch the AI think"
                            description="The pipeline normalizes the data, classifies the play style (Combat / Collection / Exploration), and calculates a difficulty adjustment."
                            color="violet"
                        />
                        <TutorialStep
                            number={4}
                            icon={<BarChart3 className="w-4 h-4 text-amber-400" />}
                            title="Open Analytics to see results"
                            description='Click the "Analytics" button (top-right) to see a plain-English summary, charts, and exactly which game settings the AI changed.'
                            color="amber"
                        />
                        <TutorialStep
                            number={5}
                            icon={<Zap className="w-4 h-4 text-rose-400" />}
                            title="Run again to see comparisons"
                            description="Submit a second round to see how the AI adapts. The Adaptation tab will show what changed versus the previous window and why."
                            color="rose"
                        />
                    </div>

                    {/* What is this system? */}
                    <div className="border border-slate-800/60 rounded-lg p-4 bg-slate-900/20 mt-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">What is this?</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            This is an <span className="text-slate-400 font-medium">ANFIS-based Adaptive Difficulty System</span>.
                            It watches how a player behaves in the game and automatically adjusts parameters —
                            like enemy count, item spawns, and stamina — to keep the experience fun and challenging for that specific player.
                        </p>
                    </div>
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
