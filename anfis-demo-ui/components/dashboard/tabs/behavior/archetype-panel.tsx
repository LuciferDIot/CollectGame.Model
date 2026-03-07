'use client';

import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BehaviorCategory } from '@/lib/types';
import { cn, getTextColor } from '@/lib/utils';
import { GitBranch } from 'lucide-react';

interface ArchetypePanelProps {
  categories: BehaviorCategory[];
  onMetricSelect?: (key: string) => void;
}

export function ArchetypePanel({ categories, onMetricSelect }: ArchetypePanelProps) {


  return (
    <div className="xl:col-span-12 flex flex-col gap-4">
      <div className="flex items-center gap-3 text-muted-foreground pb-2">
        <div className="w-8 h-px bg-primary/30" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono text-primary/80">
          Archetype Decomposition Logic
        </span>
        <div className="flex-1 h-px bg-linear-to-r from-primary/30 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 content-start">
        {categories.map((cat) => (
          <Card
            key={cat.category}
            className="glass-card bg-secondary/20 border-white/5 hover:bg-secondary/30 transition-all p-0 overflow-hidden relative group rounded-2xl"
          >
            <div className="absolute top-4 right-4 z-20">
              <EducationalDrawer
                contentKey={`archetype_${cat.category.toLowerCase()}`}
                trigger={<span className="sr-only">Info</span>}
              />
            </div>

            {/* Interaction Overlay */}
            <div
              onClick={() => onMetricSelect?.(`archetype_${cat.category.toLowerCase()}`)}
              className="absolute inset-0 z-10 cursor-pointer hover:bg-white/[0.03] transition-colors"
            />

            <div className="flex items-stretch pointer-events-none relative z-10 h-full min-h-[160px]">
              {/* Vertical Identity Bar */}
              <div
                className={cn(
                  "w-1.5 shadow-[0_0_15px_-2px_rgba(var(--primary-rgb),0.3)]",
                  cat.category === 'Combat' ? "bg-chart-5" :
                    cat.category === 'Collection' ? "bg-chart-3" :
                      "bg-chart-4"
                )}
              />

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em]",
                          cat.category === 'Combat' ? "text-chart-5" :
                            cat.category === 'Collection' ? "text-chart-3" :
                              "text-chart-4"
                        )}
                      >
                        {cat.category} Archetype
                      </span>
                      <span className="text-[9px] text-muted-foreground opacity-40 font-mono tracking-tighter">
                        REF_ID: 0x{cat.category.substring(0, 3).toUpperCase()}_VECTOR
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-3xl text-foreground tracking-tighter tabular-nums drop-shadow-sm">
                        {(cat.softMembership * 100).toFixed(1)}
                        <span className="text-xs text-muted-foreground/40 ml-1 font-bold">%</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase text-muted-foreground font-black tracking-[0.1em]">
                        <span>Soft Membership Strength</span>
                        <span className="font-mono">{cat.softMembership.toFixed(4)}</span>
                      </div>
                      <div className="h-2 bg-background/50 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_-2px_rgba(var(--primary-rgb),0.5)]",
                            cat.category === 'Combat' ? "bg-chart-5" :
                              cat.category === 'Collection' ? "bg-chart-3" :
                                "bg-chart-4"
                          )}
                          style={{ width: `${cat.softMembership * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground/50 uppercase font-black tracking-widest mb-1 leading-none">
                      Activity Index
                    </span>
                    <span className="text-sm font-black text-foreground/80 tracking-tight leading-none group-hover:text-primary transition-colors">
                      {cat.activityPercentage}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground/50 uppercase font-black tracking-widest mb-1 leading-none">
                      Confidence
                    </span>
                    <span className="text-sm font-black text-foreground/80 tracking-tight leading-none group-hover:text-accent transition-colors">
                      {(cat.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
