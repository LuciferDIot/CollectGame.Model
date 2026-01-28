'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { HelpfulTooltip } from './helpful-tooltip';

interface ClampMonitorProps {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
  config?: { lower: number; upper: number };
}

export function ClampMonitor({
  session,
  currentRound,
  config = { lower: 0.6, upper: 1.4 },
}: ClampMonitorProps) {
  if (!session || !currentRound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clamp & Saturation Monitor</CardTitle>
          <CardDescription>Safety bounds verification</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Run pipeline to see metrics</p>
        </CardContent>
      </Card>
    );
  }

  const { isClamped } = currentRound;
  const { clampPercentage } = session;

  // Determine color coding for percentages
  const getClampColor = (percentage: number): string => {
    if (percentage === 0) return 'text-green-600';
    if (percentage <= 5) return 'text-green-500';
    if (percentage <= 15) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getClampBgColor = (percentage: number): string => {
    if (percentage === 0) return 'bg-green-100 dark:bg-green-950';
    if (percentage <= 5) return 'bg-green-50 dark:bg-green-950/50';
    if (percentage <= 15) return 'bg-yellow-50 dark:bg-yellow-950/50';
    return 'bg-red-50 dark:bg-red-950/50';
  };

  const getHealthIcon = (percentage: number) => {
    if (percentage === 0) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (percentage <= 5) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (percentage <= 15) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  const getHealthMessage = () => {
    const total = clampPercentage.total;
    if (total === 0)
      return '✓ Perfect: No clamp saturation detected - Option B variance is sufficient';
    if (total <= 5)
      return '✓ Healthy: Minimal clamping within acceptable bounds';
    if (total <= 15)
      return '⚠ Warning: Moderate clamping detected - monitor for trends';
    return '⚠ Critical: High clamp saturation - variance may be insufficient';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Clamp & Saturation Monitor
          {getHealthIcon(clampPercentage.total)}
          <HelpfulTooltip 
            title="Clamp Saturation"
            description="Tracks how often the model's output hits the hard safety limits (0.6 or 1.4)."
            interpretation="A healthy adaptive model should operate freely between the limits, only hitting clamps in extreme edge cases (Target < 5%)."
          />
        </CardTitle>
        <CardDescription>
          Proves Option B target variance is within safe bounds [{config.lower}, {config.upper}]
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Round Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Current Round</h4>
            <HelpfulTooltip 
              title="Instantaneous Clamp Status"
              description="Whether the specific multiplier generated in THIS round was clipped."
            />
          </div>
          <div className="flex gap-2">
            {isClamped.lower && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Lower Clamp ({config.lower})
              </Badge>
            )}
            {isClamped.upper && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Upper Clamp ({config.upper})
              </Badge>
            )}
            {!isClamped.lower && !isClamped.upper && (
              <Badge variant="outline" className="gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Within Bounds
              </Badge>
            )}
          </div>
        </div>

        {/* Session Statistics */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold">Session Statistics ({session.currentRound} rounds)</h4>
          
          {/* Lower Clamp */}
          <div className={`p-3 rounded-lg ${getClampBgColor(clampPercentage.lower)}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium flex items-center gap-1">
                Lower Bound Hit
                <HelpfulTooltip 
                  title="Lower Clamp Rate"
                  description="% of rounds where M would have been < 0.6."
                  interpretation="High lower clamp usage means the model wants to make the game easier than allowed."
                />
              </span>
              <span className={`text-lg font-bold ${getClampColor(clampPercentage.lower)}`}>
                {clampPercentage.lower.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  clampPercentage.lower > 15
                    ? 'bg-red-500'
                    : clampPercentage.lower > 5
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, clampPercentage.lower)}%` }}
              />
            </div>
          </div>

          {/* Upper Clamp */}
          <div className={`p-3 rounded-lg ${getClampBgColor(clampPercentage.upper)}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium flex items-center gap-1">
                Upper Bound Hit
                <HelpfulTooltip 
                  title="Upper Clamp Rate"
                  description="% of rounds where M would have been > 1.4."
                  interpretation="High upper clamp usage means the model wants to make the game harder than allowed."
                />
              </span>
              <span className={`text-lg font-bold ${getClampColor(clampPercentage.upper)}`}>
                {clampPercentage.upper.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  clampPercentage.upper > 15
                    ? 'bg-red-500'
                    : clampPercentage.upper > 5
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, clampPercentage.upper)}%` }}
              />
            </div>
          </div>

          {/* Total Clamp */}
          <div className={`p-3 rounded-lg ${getClampBgColor(clampPercentage.total)}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium flex items-center gap-1">
                Total Clamped
                 <HelpfulTooltip 
                  title="Total Saturation Index"
                  description="Combined percentage of rounds where the model hit ANY limit."
                  interpretation="This is the primary 'Stability Score'. If < 5%, the system is well-tuned."
                />
              </span>
              <span className={`text-lg font-bold ${getClampColor(clampPercentage.total)}`}>
                {clampPercentage.total.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  clampPercentage.total > 15
                    ? 'bg-red-500'
                    : clampPercentage.total > 5
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, clampPercentage.total)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Health Message */}
        <div className="border-t pt-4">
          <p className="text-sm italic text-muted-foreground">{getHealthMessage()}</p>
        </div>

        {/* Threshold Legend */}
        <div className="border-t pt-4 space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground">Threshold Guide</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>0-5%: Healthy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>5-15%: Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>&gt;15%: Critical</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
