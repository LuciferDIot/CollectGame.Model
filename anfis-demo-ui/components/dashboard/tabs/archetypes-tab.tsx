'use client';

import { EducationalDrawer } from '@/components/analytics/educational-drawer';
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/pipeline-context';
import { GlobeLock, SeparatorVertical } from 'lucide-react';
import { useState } from 'react';
import { MetricDetailModal } from '../../analytics/metric-detail-modal';
import { ArchetypeCategoryPanel } from './archetypes/archetype-category-panel';

export function ArchetypesTab() {
  const { pipelineState } = usePipeline();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  return (
    <div className="m-0 p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <GlobeLock className="w-5 h-5 text-blue-400" />
            Adaptation calculation
            <EducationalDrawer 
              contentKey="anfis_pipeline_overview"
              trigger={<span className="ml-2 px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-300 cursor-help hover:bg-blue-500/20 transition-colors uppercase tracking-widest font-mono">Info</span>}
            />
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase">
            REAL-TIME Adaptation Computation • CYCLE TICK: {pipelineState.executionTime.toFixed(2)}ms
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
        <SeparatorVertical className="w-3.5 h-3.5" />
        <EducationalDrawer
          contentKey="input_normalization"
          trigger={
            <span className="text-xs font-bold uppercase tracking-wider font-mono cursor-help hover:text-blue-400 transition-colors border-b border-dotted border-slate-600">
              Behavior Archetypes
            </span>
          }
        />
        </div>
      
        
        <ArchetypeCategoryPanel  onMetricSelect={setSelectedMetric} categories={pipelineState.behaviorCategories} />
        
        <Card 
          onClick={() => setSelectedMetric('session_classification')}
          className="bg-slate-800/50 border-slate-700 cursor-help hover:bg-slate-800/80 transition-colors group"
        >
          <div className="p-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 group-hover:text-blue-300 transition-colors">Current Session Classification</h4>
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

      <MetricDetailModal 
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || ''}
        currentValue="Definition" 
        status="neutral"
      />
    </div>
  );
}
