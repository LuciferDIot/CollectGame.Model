'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { AlertCircle } from 'lucide-react';
import { HelpfulTooltip } from './helpful-tooltip';

interface DeltaMonitorProps {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
}

export function DeltaMonitor({ session, currentRound }: DeltaMonitorProps) {
  if (!session || !currentRound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delta Effectiveness Monitor</CardTitle>
          <CardDescription>Behavioral change drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Run pipeline to see metrics</p>
        </CardContent>
      </Card>
    );
  }

  const { deltas } = currentRound;
  const { avgDeltaMagnitude } = session;

  const currentMagnitude = Math.abs(deltas.combat) + Math.abs(deltas.collect) + Math.abs(deltas.explore);
  
  // Warning if deltas are consistently near zero
  const deltaLow = avgDeltaMagnitude < 0.05;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Delta Effectiveness Monitor
          {deltaLow && <AlertCircle className="h-4 w-4 text-yellow-500" />}
          <HelpfulTooltip 
            title="Deltas (Δ)"
            description="The instantaneous rate of change in player behavior (derivative of the input signals)."
            interpretation="In Option B, Deltas are the primary driver of difficulty. High deltas mean the player is changing strategy, prompting adaptation."
          />
        </CardTitle>
        <CardDescription>
          Behavioral changes driving variance (Option B Core Mechanism)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Round Deltas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <h4 className="text-sm font-semibold">Current Round Deltas</h4>
             <HelpfulTooltip 
               title="Instantaneous Change"
               description="How much the player's behavior changed in the last 5 seconds."
             />
          </div>
          
          {/* Combat Delta */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                Δ Combat
                <HelpfulTooltip title="Combat Delta" description="Change in Kill/Death Ratio and Combat Frequency." />
              </span>
              <span className="font-mono">{deltas.combat.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${deltas.combat >= 0 ? 'bg-red-500' : 'bg-red-300'}`}
                  style={{
                    width: `${Math.min(100, Math.abs(deltas.combat) * 200)}%`,
                    marginLeft: deltas.combat < 0 ? 'auto' : '0',
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8">
                {deltas.combat >= 0 ? '+' : '-'}
              </span>
            </div>
          </div>

          {/* Collect Delta */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                Δ Collect
                 <HelpfulTooltip title="Collect Delta" description="Change in Items Collected per Minute." />
              </span>
              <span className="font-mono">{deltas.collect.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${deltas.collect >= 0 ? 'bg-blue-500' : 'bg-blue-300'}`}
                  style={{
                    width: `${Math.min(100, Math.abs(deltas.collect) * 200)}%`,
                    marginLeft: deltas.collect < 0 ? 'auto' : '0',
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8">
                {deltas.collect >= 0 ? '+' : '-'}
              </span>
            </div>
          </div>

          {/* Explore Delta */}
          <div>
            <div className="flex justify-between text-sm mb-1">
               <span className="flex items-center gap-1">
                Δ Explore
                 <HelpfulTooltip title="Explore Delta" description="Change in Map Coverage and Movement Variance." />
              </span>
              <span className="font-mono">{deltas.explore.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${deltas.explore >= 0 ? 'bg-green-500' : 'bg-green-300'}`}
                  style={{
                    width: `${Math.min(100, Math.abs(deltas.explore) * 200)}%`,
                    marginLeft: deltas.explore < 0 ? 'auto' : '0',
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8">
                {deltas.explore >= 0 ? '+' : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Magnitude Metrics */}
        <div className="border-t pt-4 space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Current Magnitude
                 <HelpfulTooltip title="Total Delta Magnitude" description="Sum of absolute changes. |ΔCmb| + |ΔCol| + |ΔExp|. Higher = More Adaptation." />
              </p>
              <p className="text-lg font-semibold">{currentMagnitude.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Session Avg
                 <HelpfulTooltip title="Average Magnitude" description="Long-term average of adaptation intensity. If < 0.05, the model is stagnating." />
              </p>
              <p className={`text-lg font-semibold ${deltaLow ? 'text-yellow-600' : ''}`}>
                {avgDeltaMagnitude.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* Health Warning */}
        {deltaLow && (
          <div className="border-t pt-4 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-500">
                <strong>Low Delta Activity:</strong> Behavioral changes are minimal. Model may be
                reverting to state-only predictions (soft membership only). This reduces Option B's
                variance advantage.
              </p>
            </div>
          </div>
        )}

        {/* Tooltip */}
        <div className="border-t pt-4">
          <p className="text-xs italic text-muted-foreground">
            <strong>Option B Design:</strong> Deltas have the highest coefficients (0.55, 0.40, 0.35) to maximize variance while soft membership provides contextual bias (0.22, 0.18, 0.15).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
