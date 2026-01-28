'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface PredictionHealthProps {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
}

export function PredictionHealth({ session, currentRound }: PredictionHealthProps) {
  if (!session || !currentRound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Health</CardTitle>
          <CardDescription>Per-round stability metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Run pipeline to see metrics</p>
        </CardContent>
      </Card>
    );
  }

  const { targetMultiplier, deltaFromPrevious } = currentRound;
  const { rollingMean, rollingStd, avgMultiplier, stdMultiplier } = session;

  // Determine trend icon
  const getTrendIcon = () => {
    if (deltaFromPrevious === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (Math.abs(deltaFromPrevious) < 0.001)
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    return deltaFromPrevious > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  // Color code stability
  const getStabilityColor = (std: number) => {
    if (std < 0.02) return 'text-green-600';
    if (std < 0.05) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Prediction Health
          {getTrendIcon()}
        </CardTitle>
        <CardDescription>
          Inference stability diagnostics (no training metrics)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Round */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current Multiplier</p>
            <p className="text-2xl font-bold">{targetMultiplier.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Δ from Previous</p>
            <p className="text-2xl font-bold">
              {deltaFromPrevious !== null
                ? (deltaFromPrevious >= 0 ? '+' : '') + deltaFromPrevious.toFixed(4)
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Rolling Stats */}
        {rollingMean !== null && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">Rolling Statistics (last 10 rounds)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Rolling Mean</p>
                <p className="text-lg font-semibold">{rollingMean.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rolling Std</p>
                <p className={`text-lg font-semibold ${getStabilityColor(rollingStd!)}`}>
                  {rollingStd!.toFixed(4)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              {rollingStd! < 0.02
                ? '✓ Stable: smooth variation expected for adaptive control'
                : rollingStd! < 0.05
                ? '⚠ Moderate variation: monitor for trends'
                : '⚠ High variation: check for input instability'}
            </p>
          </div>
        )}

        {/* Session Aggregates */}
        <div className="space-y-2 border-t pt-4">
          <h4 className="text-sm font-semibold">Session Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Overall Avg</p>
              <p className="text-lg font-semibold">{avgMultiplier.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overall Std</p>
              <p className={`text-lg font-semibold ${getStabilityColor(stdMultiplier)}`}>
                {stdMultiplier.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* Mini trend visualization */}
        {session.rounds.length > 1 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Recent Trend</h4>
            <div className="flex items-end gap-1 h-16">
              {session.rounds.slice(-15).map((round, idx) => {
                const height = ((round.targetMultiplier - 0.6) / 0.8) * 100; // normalize to [0.6, 1.4]
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-primary rounded-t transition-all"
                    style={{ height: `${Math.max(5, Math.min(100, height))}%` }}
                    title={`Round ${round.roundNumber}: ${round.targetMultiplier.toFixed(3)}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.60</span>
              <span>1.00</span>
              <span>1.40</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
