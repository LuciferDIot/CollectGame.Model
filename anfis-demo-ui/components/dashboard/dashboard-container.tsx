'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePipeline } from '@/lib/session/pipeline-context';
import { AlertCircle } from 'lucide-react';
import { CenterPanel } from './center-panel';
import { LeftPanel } from './left-panel';
import { TopBar } from './top-bar';

function PipelineErrorAlert() {
  const { pipelineState, setPipelineState } = usePipeline();
  
  if (!pipelineState.error) return null;

  return (
    <div className="absolute top-16 left-0 right-0 z-50 p-4">
      <Alert variant="destructive" className="mx-auto max-w-2xl shadow-lg border-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Simulation Error</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>{pipelineState.error}</span>
          <button 
            onClick={() => setPipelineState(prev => ({ ...prev, error: null }))}
            className="text-xs underline ml-4 hover:text-white font-bold"
          >
            Dismiss
          </button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function DashboardContainer() {
  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden">
      {/* Top Bar Container - Always visible */}
      <div className="shrink-0 border-b border-border bg-background/60 backdrop-blur-md z-20">
        <TopBar />
        <PipelineErrorAlert />
      </div>

      {/* Main Content Wrapper - Flex-col on mobile, Grid on desktop */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[280px_1fr] overflow-hidden min-h-0">
        {/* Left Panel Container - Hidden on mobile, visible on Desktop
            On mobile, this is accessed via the Sheet in TopBar
        */}
        <div className="hidden lg:flex flex-col border-r border-border bg-background/30 overflow-y-auto overflow-x-hidden min-h-0">
          <LeftPanel />
        </div>

        {/* Center Panel Container - Full width on mobile */}
        <div className="flex flex-col bg-background/20 overflow-hidden min-h-0 flex-1">
          <CenterPanel />
        </div>
      </div>
    </div>
  );
}
