'use client';

import { Button } from '@/components/ui/button';
import EXAMPLE_DATASETS from '@/lib/data/examples.json';
import { usePipeline } from '@/lib/pipeline-context';
import { cn } from '@/lib/utils';
import { BarChart3, Download, PlayCircle, Terminal, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import { AnalyticsSlideOver } from './analytics-slide-over';

export function TopBar() {
  const { runSimulation, resetDashboard, pipelineState, inputState } = usePipeline();
  const [stepByStep, setStepByStep] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleLoadExample = () => {
    // Pick random example to base values on
    const randomIndex = Math.floor(Math.random() * EXAMPLE_DATASETS.length);
    const example = EXAMPLE_DATASETS[randomIndex] as any;

    // Use a fixed User ID for session continuity testing, or randomize if requested
    const stableUserId = "test-subject-001"; 

    // Construct Clean Telemetry Object
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
            timeOutOfCombat: example.features.timeOutOfCombat ?? Math.floor(Math.random() * 60)
        }
    };

    // Construct Clean Death Events
    const deathEventsPayload = (example.deaths || []).map((d: any) => ({
        userId: stableUserId,
        timestamp: new Date().toISOString(),
        location: d.location || 'Zone_1',
        cause: d.cause || 'Combat'
    }));

    window.dispatchEvent(new CustomEvent('loadExample', {
      detail: {
        telemetry: JSON.stringify(telemetryPayload, null, 2),
        deathEvents: JSON.stringify(deathEventsPayload, null, 2),
      },
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
            deathEvents: inputState.deathEventsJson ? JSON.parse(inputState.deathEventsJson) : null 
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
      <div className="h-auto md:h-20 border-b border-cyan-500/10 bg-[#050a14]/90 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center px-4 md:px-6 py-4 md:py-0 gap-4 md:gap-6 relative z-50">
        
        {/* Glow Line */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />

        <div className="flex-1 w-full md:w-auto">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <Terminal className="w-5 h-5 text-cyan-400" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-sm font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Adaptive Telemetry Dashboard
                </h1>
                <p className="text-[10px] text-slate-500 font-mono tracking-wider">ANFIS PIPELINE v2.2.0-ALPHA</p>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:ml-auto">
          <label className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors mr-2">
            <input 
              type="checkbox" 
              checked={stepByStep} 
              onChange={(e) => setStepByStep(e.target.checked)}
              className="w-3.5 h-3.5 rounded-sm border-slate-700 bg-slate-950/50 accent-cyan-500"
            />
            <span className="whitespace-nowrap">Step-by-Step Execution</span>
          </label>

          <div className="hidden md:block w-px h-6 bg-slate-800" />

          <Button 
            variant="outline"
            size="sm"
            onClick={handleLoadExample}
            title="Load random example"
            className="gap-2 h-9 border-slate-700/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/10 bg-transparent flex-1 md:flex-none uppercase text-[10px] font-bold tracking-wider transition-all"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Load Data</span>
            <span className="sm:hidden">Load</span>
          </Button>
          
          <Button 
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            title="Run simulation"
            className={cn(
                "gap-2 h-9 border-0 font-bold uppercase text-[10px] tracking-wider flex-1 md:flex-none transition-all shadow-lg",
                isRunning ? "bg-slate-800 text-slate-500" : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20 hover:shadow-cyan-500/40"
            )}
          >
            <PlayCircle size={14} className={cn(isRunning && "animate-spin")} />
            {isRunning ? 'Processing...' : 'Run Simulation'}
          </Button>

          {pipelineState.executionTime > 0 && (
            <Button 
              size="sm"
              onClick={() => setAnalyticsOpen(true)}
              title="Open analytics dashboard"
              className="gap-2 h-9 bg-purple-600 hover:bg-purple-500 text-white border-0 font-bold uppercase text-[10px] tracking-wider shadow-lg shadow-purple-900/40 animate-in fade-in zoom-in duration-300 flex-1 md:flex-none"
            >
              <BarChart3 size={14} />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
          )}
          
          <div className="hidden md:block w-px h-6 bg-slate-800" />

          <Button 
            variant="outline"
            size="sm"
            onClick={handleExport}
            title="Export results"
            className="gap-2 h-9 border-slate-700/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/10 bg-transparent flex-1 md:flex-none uppercase text-[10px] font-bold tracking-wider transition-all"
          >
            <Download size={14} />
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              resetDashboard();
              setIsRunning(false);
            }}
            title="Reset text-red-500"
            className="gap-2 h-9 border-slate-700/60 text-slate-500 hover:text-red-400 hover:border-red-500/50 hover:bg-red-950/10 bg-transparent flex-1 md:flex-none uppercase text-[10px] font-bold tracking-wider transition-all"
          >
            <XCircle size={14} />
          </Button>
        </div>
      </div>
      
      <AnalyticsSlideOver open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
    </>
  );
}
