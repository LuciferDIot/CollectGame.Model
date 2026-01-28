'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { AlertCircle } from 'lucide-react';

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
        </CardTitle>
        <CardDescription>
          Deltas drive variance and responsiveness in Option B
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Round Deltas */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Current Round Deltas</h4>
          
          {/* Combat Delta */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Δ Combat</span>
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
              <span>Δ Collect</span>
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
              <span>Δ Explore</span>
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
              <p className="text-xs text-muted-foreground">Current Magnitude</p>
              <p className="text-lg font-semibold">{currentMagnitude.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Session Avg</p>
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
