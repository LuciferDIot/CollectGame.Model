'use client';

import { Button } from '@/components/ui/button';
import EXAMPLE_DATASETS from '@/lib/data/examples.json';
import { usePipeline } from '@/lib/pipeline-context';
import { BarChart3, Download, PlayCircle, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import { AnalyticsSlideOver } from './analytics-slide-over';

export function TopBar() {
  const { runSimulation, resetDashboard, pipelineState, inputState } = usePipeline();
  const [stepByStep, setStepByStep] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleLoadExample = () => {
    // Pick random example
    const randomIndex = Math.floor(Math.random() * EXAMPLE_DATASETS.length);
    const example = EXAMPLE_DATASETS[randomIndex] as any; // Cast to any to avoid strict JSON type inference issues

    // Construct Telemetry Object
    const telemetryPayload = {
        _id: { "$oid": "generated_" + example.sessionId },
        userId: { "$oid": example.userId },
        timestamp: { "$date": example.timestamp },
        sessionId: example.sessionId,
        ...example.features,
        rawJson: {
            ...example.features
        }
    };

    // Construct Death Events
    const deathEventsPayload = (example.deaths || []).map((d: any) => ({
        _id: { "$oid": "death_" + Math.random().toString(36).substr(2, 9) },
        userId: { "$oid": example.userId },
        timestamp: { "$date": d.timestamp },
        sessionId: example.sessionId,
        location: d.location || 'Unknown',
        cause: d.cause || 'Unknown'
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
      <div className="h-auto md:h-20 border-b border-blue-500/10 bg-slate-950/50 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center px-4 md:px-6 py-4 md:py-0 gap-4 md:gap-6">
        <div className="flex-1 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold text-slate-100">Adaptive Telemetry Dashboard</h1>
            <p className="text-xs text-slate-400">ANFIS pipeline validation & analysis</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:ml-auto">
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/30 rounded-md cursor-pointer transition-colors mr-2">
            <input 
              type="checkbox" 
              checked={stepByStep} 
              onChange={(e) => setStepByStep(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="whitespace-nowrap">Step-by-Step</span>
          </label>

          <div className="hidden md:block w-px h-6 bg-slate-700/50" />

          <Button 
            variant="outline"
            size="sm"
            onClick={handleLoadExample}
            title="Load random example"
            className="gap-2 h-9 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent flex-1 md:flex-none"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Load Random</span>
            <span className="sm:hidden">Load</span>
          </Button>
          
          <Button 
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            title="Run simulation"
            className="gap-2 h-9 bg-blue-600 hover:bg-blue-500 text-white border-0 font-medium shadow-lg shadow-blue-900/20 flex-1 md:flex-none"
          >
            <PlayCircle size={16} />
            {isRunning ? 'Running...' : 'Run'}
          </Button>

          {pipelineState.executionTime > 0 && (
            <Button 
              size="sm"
              onClick={() => setAnalyticsOpen(true)}
              title="Open analytics dashboard"
              className="gap-2 h-9 bg-cyan-600 hover:bg-cyan-500 text-white border-0 font-medium shadow-lg shadow-cyan-900/20 animate-in fade-in zoom-in duration-300 flex-1 md:flex-none"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
          )}
          
          <Button 
            variant="outline"
            size="sm"
            onClick={handleExport}
            title="Export results"
            className="gap-2 h-9 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent flex-1 md:flex-none"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              resetDashboard();
              setIsRunning(false);
            }}
            title="Reset dashboard"
            className="gap-2 h-9 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent hover:border-red-500/50 hover:bg-red-500/10 flex-1 md:flex-none"
          >
            <XCircle size={16} />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>
      
      <AnalyticsSlideOver open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
    </>
  );
}
