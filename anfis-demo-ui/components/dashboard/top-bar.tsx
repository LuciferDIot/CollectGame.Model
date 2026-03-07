'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import EXAMPLE_DATASETS from '@/lib/data/examples.json';
import { usePipeline } from '@/lib/session/pipeline-context';
import { cn } from '@/lib/utils';
import { BarChart3, BrainCircuit, Database, Download, PlayCircle, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import { AnalyticsSlideOver } from './analytics-slide-over';
import { LeftPanel } from './left-panel';

export function TopBar() {
  const { runSimulation, resetDashboard, pipelineState, inputState } = usePipeline();
  const [stepByStep, setStepByStep] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleLoadExample = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_DATASETS.length);
    const example = EXAMPLE_DATASETS[randomIndex] as any;
    const stableUserId = "test-subject-001";
    const telemetryPayload = {
      userId: stableUserId,
      sessionId: `session-${Date.now()}`,
      timestamp: new Date().toISOString(),
      telemetry: {
        enemiesHit: example.features.enemiesHit ?? Math.floor(Math.random() * 20),
        damageDone: example.features.damageDone ?? Math.floor(Math.random() * 500),
        timeInCombat: example.features.timeInCombat ?? Math.floor(Math.random() * 60),
        kills: example.features.kills ?? Math.floor(Math.random() * 10),
        itemsCollected: example.features.itemsCollected ?? Math.floor(Math.random() * 10),
        pickupAttempts: example.features.pickupAttempts ?? Math.floor(Math.random() * 15),
        timeNearInteractables: example.features.timeNearInteractables ?? Math.floor(Math.random() * 30),
        distanceTraveled: example.features.distanceTraveled ?? Math.floor(Math.random() * 1000),
        timeSprinting: example.features.timeSprinting ?? Math.floor(Math.random() * 30),
        timeOutOfCombat: example.features.timeOutOfCombat ?? Math.floor(Math.random() * 60),
        deathCount: (example.deaths?.length) ?? Math.floor(Math.random() * 3),
      }
    };
    window.dispatchEvent(new CustomEvent('loadExample', {
      detail: { telemetry: JSON.stringify(telemetryPayload, null, 2) },
    }));
  };

  const handleRun = async () => {
    setIsRunning(true);
    await runSimulation(stepByStep);
    setIsRunning(false);
  };

  const handleExport = () => {
    try {
      const state = {
        telemetry: inputState.telemetryJson ? JSON.parse(inputState.telemetryJson) : null,
        deathEvents: inputState.deathEventsJson ? JSON.parse(inputState.deathEventsJson) : null,
      };
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'telemetry-results.json';
      a.click();
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  return (
    <>
      <div className="glass-panel border-b border-primary/10 relative z-50">
        {/* Subtle top line glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-sm pointer-events-none" />

        {/* ── Desktop layout: single flex row ── */}
        <div className="hidden md:flex items-center h-16 px-6 gap-4">
          {/* Branding */}
          <button onClick={resetDashboard} title="Reset" className="flex items-center gap-3 group shrink-0">
            <div className="p-2 rounded-xl tech-border bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              <BrainCircuit className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tighter neon-text uppercase leading-none">AURA</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase">Online</span>
              </div>
              <p className="text-[9px] text-muted-foreground/60 font-mono tracking-widest mt-0.5 uppercase">ANFIS Adaptive Engine v2.2</p>
            </div>
          </button>

          {/* Push actions to the right */}
          <div className="flex-1" />

          {/* Step-by-step toggle */}
          <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-primary cursor-pointer transition-colors group">
            <input
              type="checkbox"
              checked={stepByStep}
              onChange={(e) => setStepByStep(e.target.checked)}
              className="w-3.5 h-3.5 border-border bg-background/50 accent-primary"
            />
            <span className="whitespace-nowrap">Step-by-Step</span>
          </label>

          <div className="w-px h-6 bg-border/40" />

          <Button variant="outline" size="sm" onClick={handleLoadExample} title="Load random example"
            className="gap-1.5 h-8 px-3 border-border/40 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 bg-background/20 uppercase text-[10px] font-bold tracking-wider rounded-lg"
          >
            <Upload size={13} /> Load Dataset
          </Button>

          <Button size="sm" onClick={handleRun} disabled={isRunning} title="Run simulation"
            className={cn(
              "gap-1.5 h-8 px-4 border-0 font-black uppercase text-[10px] tracking-widest rounded-lg overflow-hidden group relative",
              isRunning
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.5)] hover:shadow-[0_0_25px_-5px_rgba(var(--primary-rgb),0.7)] hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <PlayCircle size={14} className={cn(isRunning && "animate-spin")} />
            {isRunning ? 'Processing...' : 'Execute Sequence'}
          </Button>

          {pipelineState.executionTime > 0 && (
            <Button size="sm" onClick={() => setAnalyticsOpen(true)} title="Open analytics"
              className="gap-1.5 h-8 px-4 bg-indigo-600 hover:bg-indigo-500 text-white border-0 font-black uppercase text-[10px] tracking-widest rounded-lg shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.7)] animate-fade-in transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <BarChart3 size={14} className="text-white" />
              <span className="text-white">Analytics Console</span>
            </Button>
          )}

          <div className="w-px h-6 bg-border/40" />

          <Button variant="outline" size="sm" onClick={handleExport} title="Export results"
            className="h-8 w-8 p-0 border-border/40 text-muted-foreground hover:text-accent hover:border-accent/40 hover:bg-accent/5 bg-background/20 rounded-lg"
          >
            <Download size={13} />
          </Button>

          <Button variant="outline" size="sm" onClick={() => { resetDashboard(); setIsRunning(false); }} title="Reset simulation"
            className="h-8 w-8 p-0 border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 bg-background/20 rounded-lg"
          >
            <XCircle size={13} />
          </Button>
        </div>

        {/* ── Mobile layout: two rows ── */}
        <div className="flex md:hidden flex-col">
          {/* Mobile Row 1: Branding + Inputs sheet */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/20">
            <button onClick={resetDashboard} className="flex items-center gap-2 group">
              <div className="p-1.5 rounded-lg tech-border bg-primary/10 group-hover:bg-primary/20 transition-all">
                <BrainCircuit className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-tighter neon-text uppercase">AURA</span>
                  <span className="px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 uppercase">Online</span>
                </div>
              </div>
            </button>

            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="border-border/60 bg-secondary/50 text-muted-foreground h-8 px-3 text-[10px] font-bold uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5 mr-1.5" /> Inputs
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(300px,85vw)] p-0 border-r border-border bg-background/95 backdrop-blur-xl">
                <SheetHeader className="px-4 py-3 border-b border-border">
                  <SheetTitle className="text-sm font-semibold">Telemetry Inputs</SheetTitle>
                </SheetHeader>
                <div className="h-full overflow-y-auto pb-16">
                  <LeftPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Mobile Row 2: All action buttons in a scrollable row */}
          <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
            {/* Step-by-step */}
            <label className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={stepByStep}
                onChange={(e) => setStepByStep(e.target.checked)}
                className="w-3 h-3 accent-primary"
              />
              <span className="whitespace-nowrap">Steps</span>
            </label>

            <div className="w-px h-5 bg-border/40 shrink-0" />

            {/* Load */}
            <Button variant="outline" size="sm" onClick={handleLoadExample}
              className="gap-1 h-8 px-3 border-border/40 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 bg-background/20 uppercase text-[10px] font-bold tracking-wider rounded-lg shrink-0"
            >
              <Upload size={12} /> Load
            </Button>

            {/* Run */}
            <Button size="sm" onClick={handleRun} disabled={isRunning}
              className={cn(
                "gap-1 h-8 px-3 border-0 font-black uppercase text-[10px] tracking-wider rounded-lg shrink-0",
                isRunning
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground shadow-[0_0_15px_-5px_rgba(var(--primary-rgb),0.6)]"
              )}
            >
              <PlayCircle size={13} className={cn(isRunning && "animate-spin")} />
              {isRunning ? '...' : 'Run'}
            </Button>

            {/* Analytics — appears after pipeline runs */}
            {pipelineState.executionTime > 0 && (
              <Button size="sm" onClick={() => setAnalyticsOpen(true)}
                className="gap-1 h-8 px-3 bg-violet-600 hover:bg-violet-500 text-white border-0 font-black uppercase text-[10px] tracking-wider rounded-lg shadow-[0_0_15px_-5px_rgba(139,92,246,0.5)] animate-fade-in shrink-0"
              >
                <BarChart3 size={13} /> Analytics
              </Button>
            )}

            <div className="w-px h-5 bg-border/40 shrink-0" />

            {/* Export */}
            <Button variant="outline" size="sm" onClick={handleExport} title="Export"
              className="h-8 w-8 p-0 border-border/40 text-muted-foreground hover:text-accent hover:border-accent/40 hover:bg-accent/5 bg-background/20 rounded-lg shrink-0"
            >
              <Download size={13} />
            </Button>

            {/* Reset */}
            <Button variant="outline" size="sm" onClick={() => { resetDashboard(); setIsRunning(false); }} title="Reset"
              className="h-8 w-8 p-0 border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 bg-background/20 rounded-lg shrink-0"
            >
              <XCircle size={13} />
            </Button>
          </div>
        </div>
      </div>

      <AnalyticsSlideOver open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
    </>
  );
}
