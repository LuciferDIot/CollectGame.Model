'use client';

import { Badge } from '@/components/ui/badge';
import { usePipeline } from '@/lib/session/pipeline-context';
import { Activity } from 'lucide-react';
import { ArchetypePanel } from './behavior/archetype-panel';
import { RulesPanel } from './behavior/rules-panel';
import { TelemetryPanel } from './behavior/telemetry-panel';

import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
import { MetricDetailModal } from '@/components/analytics/shared/metric-detail-modal';
import { useState } from 'react';

export function BehaviorTab() {
  const { pipelineState } = usePipeline();
  const { normalizedFeatures, rulesFired, behaviorCategories } = pipelineState;
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

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
    <div className="h-full flex flex-col p-6 space-y-2 max-w-[1800px] mx-auto">
      {/* Beginner Intro Banner */}
      <div className="p-3 rounded-lg border border-blue-800/30 bg-blue-950/20 flex items-start gap-2.5">
        <Activity className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-300 mb-0.5">What is this tab?</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This shows <span className="text-slate-300">what the AI detected about how this player plays</span> —
            which raw stats were measured, how they were turned into scores, and which fuzzy rules fired to classify the play style.
          </p>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Behavioral Inference Engine
            <EducationalDrawer 
              contentKey="anfis_pipeline_overview"
              trigger={<span className="ml-2 px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-300 cursor-help hover:bg-blue-500/20 transition-colors uppercase tracking-widest font-mono">Info</span>}
            />
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            REAL-TIME FUZZY LOGIC PIPELINE • CYCLE TICK: {pipelineState.executionTime.toFixed(2)}ms
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs border-blue-900 bg-blue-950/30 text-blue-300">
           ACTIVE RULES: {activeRules.length}
        </Badge>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 h-full min-h-0 pt-4">
        
        {/* 1. Feature Inputs */}
        <TelemetryPanel 
          features={featuresList} 
          onMetricSelect={setSelectedMetric} 
        />

        {/* 2. Archetype Decomposition */}
        <ArchetypePanel 
          categories={behaviorCategories} 
          onMetricSelect={setSelectedMetric} 
        />

        {/* 3. Rule Trace */}
        <RulesPanel rules={activeRules} />

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
