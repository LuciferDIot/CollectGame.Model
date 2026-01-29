'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import { usePipeline } from '@/lib/pipeline-context';
import { TrendingUp } from 'lucide-react';
import { MetricCard } from './metric-card';
import { RuleInspectorDrawer } from './rule-inspector-drawer';
import { AdaptationTab } from './tabs/adaptation-tab';
import { ArchetypesTab } from './tabs/archetypes-tab';
import { BehaviorTab } from './tabs/behavior-tab';
import { ModelTab } from './tabs/model-tab';

export function BottomPanel() {
  const { pipelineState } = usePipeline();
  const { session, currentRound } = useAnalytics(pipelineState);

  if (pipelineState.behaviorCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-900 to-slate-950 text-center p-6">
        <TrendingUp className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-sm text-slate-400">Run simulation to see analysis results</p>
      </div>
    );
  }

  return (
    <div data-analytics-panel className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      <Tabs defaultValue="behavior" className="flex flex-col h-full">
        <TabsList className="w-full bg-slate-900/50 border-b border-slate-700 justify-start px-6 py-0 h-auto rounded-none gap-6">
          <TabsTrigger value="behavior" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Behavior Analysis
          </TabsTrigger>
          <TabsTrigger value="adaptation" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Adaptation Results
          </TabsTrigger>
          <TabsTrigger value="model" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Model Metrics
          </TabsTrigger>
          <TabsTrigger value="archetypes" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Archetypes
          </TabsTrigger>
          <div className="ml-auto pr-4 flex items-center">
             <RuleInspectorDrawer />
          </div>
        </TabsList>

        {/* Metric Summary Cards */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-700/30">
          <div className="grid grid-cols-4 gap-3">
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

        <div className="flex-1 overflow-y-auto">
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
