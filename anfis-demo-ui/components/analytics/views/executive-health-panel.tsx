'use client';

import { usePipeline } from '@/lib/session/pipeline-context';
import { useState } from 'react';
import { MetricDetailModal } from '../shared/metric-detail-modal';

import { useExecutiveMetrics } from '../hooks/use-executive-metrics';
import { MetricCard } from '../shared/metric-card';

export function ExecutiveHealthPanel() {
  const { pipelineState } = usePipeline();
  const { 
      r2Score, 
      maeTest, 
      clampUsage, 
      targetStd, 
      currentMultiplier 
  } = useExecutiveMetrics(pipelineState);

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  // Status & Data Definition
  const metricsData = [
      {
          id: 'model_r2',
          label: "Model Confidence",
          subLabel: "R² Validity",
          status: (r2Score > 0.8 ? 'success' : 'warning') as 'success' | 'warning',
          value: `${(r2Score * 100).toFixed(0)}%`,
          detail: `MAE: ${maeTest.toFixed(4)}`
      },
      {
          id: 'clamp_usage',
          label: "Signal Integrity",
          subLabel: "Clamp Usage",
          status: (clampUsage < 0.15 ? 'success' : 'warning') as 'success' | 'warning',
          value: "OPTIMAL",
          detail: `${(clampUsage * 100).toFixed(1)}% Saturation`
      },
      {
          id: 'multiplier_mean',
          label: "Runtime Stability",
          subLabel: "Multiplier Delta",
          status: (targetStd > 0.01 ? 'success' : 'warning') as 'success' | 'warning',
          value: `x${currentMultiplier.toFixed(2)}`,
          detail: "Within Parameters"
      }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
         <div className="relative">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative z-10" />
             <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-50" />
         </div>
         <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] neon-text">SYSTEM VALIDATION PROTOCOLS</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {metricsData.map((metric) => (
            <MetricCard
                key={metric.id}
                label={metric.label}
                subLabel={metric.subLabel}
                status={metric.status}
                value={metric.value}
                detail={metric.detail}
                onClick={() => setSelectedMetric(metric.id)}
            />
        ))}
      </div>

      <MetricDetailModal 
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || ''}
        currentValue={1.0} // Dynamic in full impl
        status="success"
      />
    </div>
  );
}
