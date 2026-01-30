'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';
import { ExecutiveHealthPanel } from '../../analytics/executive-health-panel';
import { MetricDetailModal } from '../../analytics/metric-detail-modal';

export function ModelTab() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  return (
    <div className="m-0 p-6 space-y-8 max-w-[1600px] mx-auto">
      <ExecutiveHealthPanel />

      <div className="border-t border-slate-700/50 pt-4 opacity-75 hover:opacity-100 transition-opacity">
        <h4 className="text-xs font-semibold text-slate-100 mb-3 flex items-center gap-2 uppercase tracking-wider">
          <Info size={14} className="text-blue-400" />
          Model Notes
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setSelectedMetric && setSelectedMetric('model_metadata')}
            className="p-4 rounded bg-blue-950/10 border border-blue-900/30 hover:bg-blue-950/20 transition-colors cursor-help group"
          >
             <p className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wide group-hover:text-blue-200">Model Version: v2.2</p>
             <p className="text-xs text-blue-200/60 leading-relaxed">Trained on 2,847 samples with 0.023 MAE. This validation view ensures runtime adherence to training constraints.</p>
          </div>
          <div 
            onClick={() => setSelectedMetric && setSelectedMetric('fuzzy_partition')}
            className="p-4 rounded bg-blue-950/10 border border-blue-900/30 hover:bg-blue-950/20 transition-colors cursor-help group"
          >
            <p className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wide group-hover:text-blue-200">Exploration Dominance</p>
            <p className="text-xs text-blue-200/60 leading-relaxed">High exploration soft membership is expected during open-world traversal. This indicates healthy gameplay dynamics.</p>
          </div>
        </div>
      </div>
      
      <MetricDetailModal 
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || ''}
        currentValue="Info" 
        status="neutral"
      />
    </div>
  );
}
