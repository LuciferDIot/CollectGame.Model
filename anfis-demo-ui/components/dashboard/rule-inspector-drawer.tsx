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
      <DrawerContent className="bg-slate-950 border-t border-slate-800 max-h-[85vh]">
        <div className="mx-auto w-full max-w-4xl p-6">
          <DrawerHeader className="px-0 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <GitBranch className="w-24 h-24 text-white" />
            </div>
            <DrawerTitle className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <GitBranch className="w-6 h-6 text-pink-500" />
              ANFIS Inference Engine
            </DrawerTitle>
            <DrawerDescription className="text-slate-400">
              Real-time visualization of the {rules.length} fuzzy logic rules evaluated for this decision.
            </DrawerDescription>
          </DrawerHeader>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stats Column */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-pink-950/20 border border-pink-900/30">
                <h4 className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-1">Active Rules</h4>
                <p className="text-3xl font-mono font-bold text-slate-100">{activeRules.length}</p>
                <p className="text-xs text-pink-500/60 mt-1">/ {rules.length} total</p>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Rules with firing strength &gt; 0.001. Each rule is one IF-THEN condition in the ANFIS layer. Only active rules contribute to the final output.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/30">
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Inference Time</h4>
                <p className="text-3xl font-mono font-bold text-slate-100">{pipelineState.executionTime.toFixed(1)}ms</p>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Total time to run the full 8-step pipeline for this window: normalise → cluster → membership → rules → defuzzify → surrogate → clamp → output.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rule Distribution</h4>
                <div className="flex gap-1 h-12 items-end">
                  {rules.slice(0, 20).map((r, i) => (
                    <div key={i} className="flex-1 bg-slate-700 hover:bg-pink-500 transition-colors rounded-t-sm" style={{ height: `${r.strength * 100}%` }} title={`Rule ${i + 1}: ${r.strength.toFixed(3)}`} />
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Bar height = firing strength of each rule. Hover a bar to see its value. Most rules fire near zero — only a few dominate.
                </p>
              </div>
            </div>

            {/* Main Rules List */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Firing Strengths (Desc)
              </h3>
              <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                Each row is a <span className="text-slate-400">hidden neuron</span> in the ANFIS rule layer — one learned IF-THEN pattern.
                The number is its <span className="text-pink-400 font-mono">firing strength</span> (0–1): how well the current player telemetry satisfies that rule's conditions.
                Higher = more influence on the final difficulty multiplier.
                <span className="block mt-1 text-slate-600 italic">Design: 16 neurons chosen via 5-fold CV — fewest neurons that kept R² ≥ 0.93. More neurons overfit on the ~200-session training set.</span>
              </p>
              <ScrollArea className="h-[360px] rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                <div className="space-y-3">
                  {activeRules.map((rule, idx) => (
                    <div key={idx} className="group flex items-center gap-4 p-2 rounded hover:bg-white/5 transition-colors">
                      <span className="w-24 text-[10px] uppercase font-mono text-slate-500 shrink-0">{rule.ruleName}</span>

                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-600 to-rose-400 rounded-full transition-all duration-300 group-hover:shadow-[0_0_10px_rgba(244,114,182,0.4)]"
                          style={{ width: `${rule.strength * 100}%` }}
                        />
                      </div>

                      <span className="w-12 text-right font-mono text-xs text-pink-300 font-bold">
                        {rule.strength.toFixed(3)}
                      </span>
                    </div>
                  ))}
                  {activeRules.length === 0 && (
                    <div className="text-center py-12 text-slate-500 italic">No significant rule activation</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}
