'use client';

import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RuleFired } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface RulesPanelProps {
  rules: RuleFired[];
}

export function RulesPanel({ rules }: RulesPanelProps) {
  // Logic already passed in sorted, but nice to be safe or re-sort if needed.
  // Assuming 'rules' passed here are the ones we want to show.
  
  return (
    <div className="xl:col-span-4 flex flex-col gap-3 min-h-[300px]">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <Zap className="w-3.5 h-3.5" />
        <EducationalDrawer 
          contentKey="rule_firing_strength"
          trigger={
             <span className="text-xs font-bold uppercase tracking-wider font-mono cursor-help hover:text-blue-400 transition-colors border-b border-dotted border-slate-600">
                03. Inference Rules Trace
             </span>
          }
        />
      </div>
      <Card className="flex-1 bg-slate-950/50 border-slate-800 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase">
            <span>Activation Threshold &gt; 0.01</span>
            <span>Total: {rules.length}</span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-0">
            {rules.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-500 italic">
                  No significant rule activation.
                </p>
              </div>
            ) : (
              rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors group"
                >
                  <div className="w-8 shrink-0 flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-mono text-slate-600">
                      STR
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold font-mono",
                        rule.strength > 0.5
                          ? "text-emerald-400"
                          : "text-blue-400"
                      )}
                    >
                      {rule.strength.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate font-mono text-wrap leading-tight">
                      {rule.ruleName}
                    </p>
                    <Progress
                      value={rule.strength * 100}
                      className="h-1 w-full mt-1.5 bg-slate-800"
                      indicatorClassName={
                        rule.strength > 0.5
                          ? "bg-emerald-500/70"
                          : "bg-blue-500/70"
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
