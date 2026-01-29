'use client';

import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/pipeline-context';

export function ArchetypesTab() {
  const { pipelineState } = usePipeline();

  return (
    <div className="m-0 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-100">Behavior Archetypes</h3>
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-950/20 border-red-900/30">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-red-300 mb-3">Combat</h4>
            <p className="text-xs text-slate-400 mb-3">High combat engagement, aggressive playstyle</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Combat %</span>
                <span className="text-red-300 font-mono">~65%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Collection %</span>
                <span className="text-slate-500 font-mono">~15%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Exploration %</span>
                <span className="text-slate-500 font-mono">~20%</span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-amber-950/20 border-amber-900/30">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-amber-300 mb-3">Collection</h4>
            <p className="text-xs text-slate-400 mb-3">Resource-focused, strategic gathering</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Combat %</span>
                <span className="text-slate-500 font-mono">~20%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Collection %</span>
                <span className="text-amber-300 font-mono">~60%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Exploration %</span>
                <span className="text-slate-500 font-mono">~20%</span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-cyan-950/20 border-cyan-900/30">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-cyan-300 mb-3">Exploration</h4>
            <p className="text-xs text-slate-400 mb-3">Discovery-oriented, passive gameplay</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Combat %</span>
                <span className="text-slate-500 font-mono">~10%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Collection %</span>
                <span className="text-slate-500 font-mono">~15%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Exploration %</span>
                <span className="text-cyan-300 font-mono">~75%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-4">
          <h4 className="text-xs font-semibold text-slate-300 mb-3">Current Session Classification</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Closest Archetype</span>
                <span className="text-cyan-300 font-semibold">Exploration</span>
              </div>
              <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${pipelineState.softMembership?.explore ? pipelineState.softMembership.explore * 100 : 0}%` }} />
              </div>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              {pipelineState.softMembership?.explore ? (pipelineState.softMembership.explore * 100).toFixed(1) : '0'}% match
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
