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
    <div className="xl:col-span-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <GitBranch className="w-3.5 h-3.5" />
        <span className="text-xs font-bold uppercase tracking-wider font-mono">
          02. Archetype Decomposition
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 content-start">
        {categories.map((cat) => (
          <Card
            key={cat.category}
            className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-all p-0 overflow-hidden relative group"
          >
             <div className="absolute top-2 right-2 z-10">
                <EducationalDrawer 
                   contentKey={`archetype_${cat.category.toLowerCase()}`} 
                   trigger={<span className="sr-only">Info</span>} 
                />
             </div>
             
             {/* Clickable Area */}
             <div 
                onClick={() => onMetricSelect?.(`archetype_${cat.category.toLowerCase()}`)}
                className="absolute inset-0 z-0 cursor-pointer hover:bg-white/[0.02] transition-colors" 
             />

            <div className="flex items-stretch pointer-events-none relative z-10">
              {/* Left Color strip */}
              <div
                className={cn(
                  "w-1.5",
                  cat.category === 'Combat' ? "bg-red-500" :
                  cat.category === 'Collection' ? "bg-emerald-500" :
                  "bg-amber-500"
                )}
              />

              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        getTextColor(cat.category)
                      )}
                    >
                      {cat.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      ID: {cat.category.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono text-xl font-bold text-slate-100 tracking-tighter">
                    {(cat.softMembership * 100).toFixed(1)}
                    <span className="text-xs text-slate-500 ml-0.5">%</span>
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                      <span>Membership Vector</span>
                      <span>{cat.softMembership.toFixed(4)}</span>
                    </div>
                    <Progress
                      value={cat.softMembership * 100}
                      className="h-1.5 bg-slate-800"
                      indicatorClassName={cn(
                         cat.category === 'Combat' ? "bg-red-500" :
                         cat.category === 'Collection' ? "bg-emerald-500" :
                         "bg-amber-500"
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                        Activity %
                      </span>
                      <span className="text-sm font-mono text-slate-300">
                        {cat.activityPercentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                        Confidence
                      </span>
                      <span className="text-sm font-mono text-slate-300">
                        {(cat.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
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
