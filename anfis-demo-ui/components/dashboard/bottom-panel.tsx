'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import { usePipeline } from '@/lib/pipeline-context';
import { Activity, Database, GlobeLock, Terminal, TrendingUp } from 'lucide-react';
import { MetricCard } from './metric-card';
import { RuleInspectorDrawer } from './rule-inspector-drawer';
import { AdaptationTab } from './tabs/adaptation-tab';
import { ArchetypesTab } from './tabs/archetypes-tab';
import { BehaviorTab } from './tabs/behavior-tab';
import { ModelTab } from './tabs/model-tab';

export function BottomPanel() {
  const { pipelineState } = usePipeline();
  const { session, currentRound } = useAnalytics();

  if (pipelineState.behaviorCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050a14] relative overflow-hidden text-center p-6">
        <div className="absolute inset-0 bg-[size:40px_40px] opacity-10 pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)' }} 
        />
        <div className="p-8 rounded-full bg-cyan-500/5 border border-cyan-500/10 mb-6 relative">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-cyan-500/20" />
          <Terminal className="w-12 h-12 text-cyan-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest mb-2">System Idle</h3>
        <p className="text-xs text-slate-500 font-mono">Initiate simulation sequence to visualize telemetry stream.</p>
      </div>
    );
  }

  return (
    <div data-analytics-panel className="flex flex-col h-full bg-[#050a14] relative overflow-hidden">
        
      {/* Background Data Grid */}
      <div className="absolute inset-0 bg-[size:30px_30px] opacity-10 pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(to right, #0891b2 1px, transparent 1px), linear-gradient(to bottom, #0891b2 1px, transparent 1px)' }} 
      />

      <Tabs defaultValue="behavior" className="flex flex-col h-full z-10">
        <div className="w-full bg-slate-950/80 backdrop-blur-sm border-b border-cyan-500/20 overflow-x-auto scrollbar-none">
            <TabsList className="justify-start px-4 py-0 h-10 rounded-none gap-1 bg-transparent w-max md:w-full">
            <TabsTrigger value="behavior" className="relative group data-[state=active]:bg-cyan-950/30 data-[state=active]:text-cyan-400 rounded-t-md px-4 py-2 border-b-2 border-transparent data-[state=active]:border-cyan-500 transition-all">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" /> Behavior
                </span>
            </TabsTrigger>
            <TabsTrigger value="adaptation" className="relative group data-[state=active]:bg-cyan-950/30 data-[state=active]:text-purple-400 rounded-t-md px-4 py-2 border-b-2 border-transparent data-[state=active]:border-purple-500 transition-all">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" /> Adaptation
                </span>
            </TabsTrigger>
            <TabsTrigger value="model" className="relative group data-[state=active]:bg-cyan-950/30 data-[state=active]:text-emerald-400 rounded-t-md px-4 py-2 border-b-2 border-transparent data-[state=active]:border-emerald-500 transition-all">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" /> Model
                </span>
            </TabsTrigger>
            <TabsTrigger value="archetypes" className="relative group data-[state=active]:bg-cyan-950/30 data-[state=active]:text-amber-400 rounded-t-md px-4 py-2 border-b-2 border-transparent data-[state=active]:border-amber-500 transition-all">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <GlobeLock className="w-3.5 h-3.5" /> Archetypes
                </span>
            </TabsTrigger>
            <div className="ml-auto flex items-center pl-4">
                <RuleInspectorDrawer />
            </div>
            </TabsList>
        </div>

        {/* Metric Summary Cards Bar - Responsive Grid */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineState.behaviorCategories.map((cat) => (
              <MetricCard
                key={cat.category}
                label={cat.category}
                value={(cat.softMembership * 100).toFixed(1)}
                suffix="%"
                color={
                  cat.category === 'Combat' ? 'combat' :
                  cat.category === 'Collection' ? 'collection' :
                  'exploration'
                }
                trend={cat.softMembership > 0.33 ? 'up' : 'down'}
                trendValue={`${cat.activityPercentage}% activity`}
                help={{
                  title: `${cat.category} Membership`,
                  description: `How accurately your current actions fit the ${cat.category} archetype.`,
                  calculation: `μ_${cat.category.toLowerCase()}(x) = 1 / (1 + d(x, center)^2)`,
                  interpretation: "Used to weight the rules. High membership means the rules for this style will dominate the final difficulty decision."
                }}
              />
            ))}
            <MetricCard
              label="Confidence"
              value="94.5"
              suffix="%"
              color="neutral"
              trend="up"
              trendValue="High"
              help={{
                title: "Inference Confidence",
                description: "The system's certainty that the current difficulty adaptation is mathematically optimal.",
                calculation: "AVG(Rule_Firing_Strengths) * Stability_Index",
                interpretation: "If confidence drops < 80%, the system will throttle changes to avoid erratic behavior."
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#050a14]/80">
          <TabsContent value="behavior" className="m-0 h-full">
            <BehaviorTab />
          </TabsContent>

          <TabsContent value="adaptation" className="m-0 h-full">
            <AdaptationTab />
          </TabsContent>

          <TabsContent value="model" className="m-0 h-full">
            <ModelTab />
          </TabsContent>

          <TabsContent value="archetypes" className="m-0 h-full">
            <ArchetypesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
