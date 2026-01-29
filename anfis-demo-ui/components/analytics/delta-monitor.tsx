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
          <HelpfulTooltip 
            trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Delta Effectiveness Monitor</span>}
            title="Delta Effectiveness (Input Sensitivity)"
            description="The instantaneous rate of change in player behavior (derivative of the input signals)."
            interpretation="In Option B, Deltas are the primary driver of difficulty. High deltas mean the player is changing strategy, prompting adaptation."
          />
          {deltaLow && <AlertCircle className="h-4 w-4 text-yellow-500" />}
        </CardTitle>
        <CardDescription>
          Behavioral changes driving variance (Option B Core Mechanism)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Round Deltas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <h4 className="text-sm font-semibold">
               <HelpfulTooltip 
                 trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Current Round Deltas</span>}
                 title="Instantaneous Change Vector"
                 description="How much the player's behavior changed in the last 5 seconds."
               />
             </h4>
          </div>
          
            {/* Combat Delta */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <HelpfulTooltip 
                  trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Δ Combat</span>}
                  title="Combat Delta (Rate of Change)" 
                  description="Measures how quickly your combat performance is changing." 
                  calculation="ΔCombat = (Current_Kills/Time - Avg_Kills/Time) + (Current_Damage/Time - Avg_Damage/Time)"
                  interpretation="Positive (+) means you are fighting more intensely than usual. Negative (-) means you are slowing down."
                />
              </span>
              <HelpfulTooltip
                trigger={<span className="font-mono cursor-pointer hover:underline decoration-dotted underline-offset-4">{deltas.combat.toFixed(4)}</span>}
                title="Combat Delta Value"
                description="The raw numerical value representing combat change intensity."
                calculation="Raw_Delta_Value normalized between -1.0 and 1.0"
                interpretation="High magnitude (>0.5) triggers strong adaptation responses."
              />
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
                <HelpfulTooltip 
                  trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Δ Collect</span>}
                  title="Collect Delta (Rate of Change)" 
                  description="Measures change in item collection efficiency." 
                  calculation="ΔCollect = (Items_Collected_Last_Window) - (Running_Average_Collection)"
                  interpretation="Positive means a sudden burst of collecting. Negative means a lull in gathering."
                />
              </span>
              <HelpfulTooltip
                trigger={<span className="font-mono cursor-pointer hover:underline decoration-dotted underline-offset-4">{deltas.collect.toFixed(4)}</span>}
                title="Collect Delta Value"
                description="The raw numerical value representing collection surge."
                calculation="Raw_Delta_Value normalized to standard deviation unit"
                interpretation="Used to detect 'Item Hoarding' or 'Speed Running' behavior."
              />
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
                 <HelpfulTooltip 
                   trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Δ Explore</span>}
                   title="Explore Delta (Movement Variance)" 
                   description="Measures changes in how you move across the map." 
                   calculation="ΔExplore = (Distance_Traveled_In_Window / Duration) - Avg_Speed"
                   interpretation="High positive values mean sudden sprinting or fleeing. Negative values mean camping or standing still."
                 />
              </span>
              <HelpfulTooltip
                trigger={<span className="font-mono cursor-pointer hover:underline decoration-dotted underline-offset-4">{deltas.explore.toFixed(4)}</span>}
                title="Explore Delta Value"
                description="The raw numerical value representing movement variability."
                calculation="Normalized Movement Variance Vector Magnitude"
                interpretation="Critical for detecting 'Rusher' vs 'Turtle' strategies."
              />
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
                 <HelpfulTooltip 
                   trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Current Magnitude</span>}
                   title="Total Delta Magnitude" 
                   description="Sum of absolute changes. |ΔCmb| + |ΔCol| + |ΔExp|. Higher = More Adaptation." 
                 />
              </p>
              <p className="text-lg font-semibold">{currentMagnitude.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                 <HelpfulTooltip 
                   trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Session Avg</span>}
                   title="Average Magnitude" 
                   description="Long-term average of adaptation intensity. If < 0.05, the model is stagnating." 
                 />
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
