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
        <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 flex items-start gap-2.5">
          <Info size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-0.5">What is this tab?</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This shows <span className="text-foreground">how accurate the AI model is</span> and the technical details of how it was trained.
              R^2 close to 1.0 means very accurate predictions. MAE (Mean Absolute Error) shows the average prediction mistake in multiplier units.
            </p>
          </div>
        </div>
      )}

      <ExecutiveHealthPanel />

      {/* Model Notes -- tutorial mode only */}
      {tutorialMode && (
        <div className="border-t border-border/50 pt-4 opacity-75 hover:opacity-100 transition-opacity">
          <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
            <Info size={14} className="text-blue-600 dark:text-blue-400" />
            Model Notes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedMetric('model_metadata')}
              className="p-4 rounded bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors cursor-help group"
            >
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-200">Model Version: v2.2.1 (Neutral-Centred)</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Trained on 3,240 samples with 0.0123 MAE. Combat adds damagePerHit; Collection adds pickupAttemptRate. Active-signals-only exploration. Combat and Collection ceilings are 1.0; Exploration ceiling is 0.5.</p>
            </div>
            <div
              onClick={() => setSelectedMetric('fuzzy_partition')}
              className="p-4 rounded bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors cursor-help group"
            >
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-200">Exploration Scoring (v2.1)</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Exploration score uses only active movement signals: distanceTraveled + timeSprinting. timeOutOfCombat is excluded -- it is a passive signal and the arithmetic complement of timeInCombat.</p>
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
