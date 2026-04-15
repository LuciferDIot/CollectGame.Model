'use client';

import { useTutorial } from '@/lib/analytics/tutorial-context';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { MetricDetailModal } from '../../analytics/shared/metric-detail-modal';
import { ExecutiveHealthPanel } from '../../analytics/views/executive-health-panel';

export function ModelTab() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { tutorialMode } = useTutorial();

  return (
    <div className="m-0 p-4 sm:p-5 space-y-6 w-full">
      {/* Intro banner -- tutorial mode only */}
      {tutorialMode && (
        <div className="p-3 rounded-lg border border-violet-800/30 bg-violet-950/20 flex items-start gap-2.5">
          <Info size={16} className="text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-violet-300 mb-0.5">What is this tab?</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This shows <span className="text-slate-300">how accurate the AI model is</span> and the technical details of how it was trained.
              R^2 close to 1.0 means very accurate predictions. MAE (Mean Absolute Error) shows the average prediction mistake in multiplier units.
            </p>
          </div>
        </div>
      )}

      <ExecutiveHealthPanel />

      {/* Model Notes -- tutorial mode only */}
      {tutorialMode && (
        <div className="border-t border-slate-700/50 pt-4 opacity-75 hover:opacity-100 transition-opacity">
          <h4 className="text-xs font-semibold text-slate-100 mb-3 flex items-center gap-2 uppercase tracking-wider">
            <Info size={14} className="text-blue-400" />
            Model Notes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedMetric('model_metadata')}
              className="p-4 rounded bg-blue-950/10 border border-blue-900/30 hover:bg-blue-950/20 transition-colors cursor-help group"
            >
              <p className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wide group-hover:text-blue-200">Model Version: v2.2 (Derived Features)</p>
              <p className="text-xs text-blue-200/60 leading-relaxed">Trained on 3,240 samples with 0.011 MAE. Combat adds damagePerHit; Collection adds pickupAttemptRate. Active-signals-only exploration. All archetypes averaged to equal ceiling of 1.0.</p>
            </div>
            <div
              onClick={() => setSelectedMetric('fuzzy_partition')}
              className="p-4 rounded bg-blue-950/10 border border-blue-900/30 hover:bg-blue-950/20 transition-colors cursor-help group"
            >
              <p className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wide group-hover:text-blue-200">Exploration Scoring (v2.1)</p>
              <p className="text-xs text-blue-200/60 leading-relaxed">Exploration score uses only active movement signals: distanceTraveled + timeSprinting. timeOutOfCombat is excluded -- it is a passive signal and the arithmetic complement of timeInCombat.</p>
            </div>
          </div>
        </div>
      )}

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
