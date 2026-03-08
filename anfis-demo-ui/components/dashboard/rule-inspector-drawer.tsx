'use client';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipeline } from '@/lib/session/pipeline-context';
import { Activity, BrainCircuit, GitBranch } from 'lucide-react';

export function RuleInspectorDrawer() {
  const { pipelineState } = usePipeline();
  const rules = pipelineState.rulesFired || [];
  const activeRules = rules.filter(r => r.strength > 0.001).sort((a, b) => b.strength - a.strength);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 shrink-0">
          <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
          <span className="hidden xs:inline">Inspect Engine</span>
          <span className="xs:hidden">Inspect</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 max-h-[90vh]">
        <ScrollArea className="w-full h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl p-6 pb-12">
            <DrawerHeader className="px-0 relative mb-6">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <GitBranch className="w-32 h-32 text-pink-500/20" />
              </div>
              <DrawerTitle className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20">
                  <GitBranch className="w-7 h-7 text-pink-500" />
                </div>
                ANFIS Inference Engine
              </DrawerTitle>
              <DrawerDescription className="text-slate-400 text-base mt-2 max-w-2xl">
                Real-time visualization of the {rules.length} fuzzy logic rules evaluated for this decision.
                The engine uses a learned Takagi-Sugeno-Kang (TSK) model.
              </DrawerDescription>
            </DrawerHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Stats Column */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-5 rounded-2xl bg-linear-to-br from-pink-950/30 to-slate-950/50 border border-pink-900/30 backdrop-blur-sm">
                  <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-3 opacity-80">Active Rules</h4>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-mono font-black text-slate-50 leading-none">{activeRules.length}</p>
                    <p className="text-sm font-medium text-pink-500/60 font-mono">/ {rules.length} total</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Rules with firing strength &gt; 0.001. Each rule is one IF-THEN condition in the ANFIS layer.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-linear-to-br from-blue-950/30 to-slate-950/50 border border-blue-900/30 backdrop-blur-sm">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 opacity-80">Inference Time</h4>
                  <p className="text-4xl font-mono font-black text-slate-50 leading-none">{pipelineState.executionTime.toFixed(1)}<span className="text-xl ml-1 font-normal opacity-40">ms</span></p>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Total execution latency for the full 8-step pipeline including membership calculation and defuzzification.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 opacity-80">Rule Distribution</h4>
                  <div className="flex gap-1 h-16 items-end">
                    {rules.slice(0, 32).map((r, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-slate-700/50 hover:bg-pink-500 transition-all duration-300 rounded-t-[2px]"
                        style={{ height: `${Math.max(r.strength * 100, 4)}%`, opacity: r.strength > 0.001 ? 1 : 0.3 }}
                        title={`Rule ${i + 1}: ${r.strength.toFixed(3)}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-4 leading-relaxed italic">
                    Firing strength distribution. Most rules are quiescent; only a few active rules drive the adaptive logic at any given time.
                  </p>
                </div>
              </div>

              {/* Main Rules List */}
              <div className="lg:col-span-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Firing Strengths (Desc)
                  </h3>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 px-2 py-1 bg-slate-900 rounded border border-slate-800">
                    Sorted by Intensity
                  </div>
                </div>

                <div className="bg-slate-900/20 rounded-2xl border border-slate-800/50 p-1 flex-1">
                  <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {activeRules.map((rule, idx) => (
                      <div key={idx} className="group relative flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-all border border-transparent hover:border-slate-800/50">
                        <div className="w-20 sm:w-28 text-[11px] uppercase font-bold font-mono text-slate-400 shrink-0 tracking-tight">
                          {rule.ruleName}
                        </div>

                        <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden relative border border-slate-700/30">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-400 rounded-full transition-all duration-500 ease-out group-hover:shadow-[0_0_15px_rgba(244,114,182,0.3)]"
                            style={{ width: `${rule.strength * 100}%` }}
                          />
                        </div>

                        <span className="w-14 text-right font-mono text-sm text-pink-400 font-black">
                          {rule.strength.toFixed(3)}
                        </span>
                      </div>
                    ))}
                    {activeRules.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Activity className="w-10 h-10 mb-4 opacity-10" />
                        <p className="italic text-sm">No significant rule activation detected</p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-4 leading-relaxed px-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] mr-2">System Note:</span>
                  16 learned IF-THEN patterns optimized for R² ≥ 0.93. This layer acts as the "reasoning" core of the AURA difficulty adaptation system.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
