'use client';

import { Badge } from '@/components/ui/badge';
import { usePipeline } from '@/lib/session/pipeline-context';
import { Activity } from 'lucide-react';
import { ArchetypePanel } from './behavior/archetype-panel';
import { RulesPanel } from './behavior/rules-panel';
import { TelemetryPanel } from './behavior/telemetry-panel';

import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
import { MetricDetailModal } from '@/components/analytics/shared/metric-detail-modal';
import { useTutorial } from '@/lib/analytics/tutorial-context';
import { useState } from 'react';

export function BehaviorTab() {
  const { pipelineState } = usePipeline();
  const { normalizedFeatures, rulesFired, behaviorCategories } = pipelineState;
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { tutorialMode } = useTutorial();

  // Logic: Sort rules and filter
  const activeRules = [...(rulesFired || [])]
    .sort((a, b) => b.strength - a.strength)
    .filter((r) => r.strength > 0.01);

  // Logic: Flatten features
  const featuresList = normalizedFeatures
    ? Object.entries(normalizedFeatures).flatMap(([key, values]) => {
      const val = Array.isArray(values) ? values[values.length - 1] : (values as number);
      return { name: key, value: val };
    })
    : [];

  return (
    <div className="h-full flex flex-col p-4 sm:p-5 space-y-4 w-full animate-fade-in">
      {/* System Context Banner -- tutorial mode only */}
      {tutorialMode && (
        <div className="p-4 mb-6 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm flex items-start gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">System Context</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              This module visualizes the <span className="text-foreground font-bold italic">Behavioral Inference Sequence</span>. It decodes raw gameplay telemetry into fuzzy archetypes, utilizing soft-clustering to determine playstyle alignment and drive downstream adaptation logic.
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between pb-6 border-b border-border/40">
        <div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-2 group">
            <Activity className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform" />
            Inference Engine
            <EducationalDrawer
              contentKey="anfis_pipeline_overview"
              trigger={<span className="ml-3 px-2 py-0.5 rounded-lg border border-primary/30 bg-primary/10 text-[9px] text-primary cursor-help hover:bg-primary/20 transition-all uppercase tracking-widest font-black">Open Specs</span>}
            />
          </h2>
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-1.5 uppercase tracking-widest flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              REAL-TIME_FUZZY_LOGIC
            </span>
            <span className="opacity-40">|</span>
            <span title="Full browser-to-server-to-browser round trip">FETCH_LATENCY: {pipelineState.executionTime.toFixed(1)}MS</span>
            <span className="opacity-40">|</span>
            <span title="Server-side ANFIS pipeline compute only">PIPELINE_LATENCY: {pipelineState.pipelineProcessTime.toFixed(3)}MS</span>
          </p>
        </div>
        <Badge variant="outline" className="font-black text-[10px] border-primary/30 bg-primary/5 text-primary px-3 py-1 rounded-lg tracking-widest">
          ACTIVE_RULES: {activeRules.length}
        </Badge>
      </div>

      {/* Main Grid Layout */}
      <div className="space-y-6 pt-4">
        {/* Top Row: Telemetry + Rules side by side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Feature Inputs */}
          <TelemetryPanel
            features={featuresList}
            onMetricSelect={setSelectedMetric}
          />

          {/* 3. Rule Trace */}
          <RulesPanel rules={activeRules} />
        </div>

        {/* Bottom Row: Archetype Decomposition full width */}
        <ArchetypePanel
          categories={behaviorCategories}
          onMetricSelect={setSelectedMetric}
        />
      </div>

      <MetricDetailModal
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || ''}
        currentValue="Active"
        status="neutral"
      />
    </div>
  );
}
