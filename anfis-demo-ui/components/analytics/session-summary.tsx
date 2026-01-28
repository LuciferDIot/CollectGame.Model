'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SessionAnalytics } from '@/lib/analytics';
import { Activity, BarChart3, Shield, TrendingUp } from 'lucide-react';

interface SessionSummaryProps {
  session: SessionAnalytics | null;
}

export function SessionSummary({ session }: SessionSummaryProps) {
  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
          <CardDescription>Aggregate inference diagnostics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Run pipeline to see metrics</p>
        </CardContent>
      </Card>
    );
  }

  const {
    currentRound,
    avgMultiplier,
    stdMultiplier,
    clampPercentage,
    dominantArchetypeDistribution,
    avgDeltaMagnitude,
  } = session;

  // Find dominant archetype overall
  const maxArchetype = Object.entries(dominantArchetypeDistribution).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Summary</CardTitle>
        <CardDescription>
          Aggregate metrics across {currentRound} round{currentRound !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Average Multiplier */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              <span>Avg Multiplier</span>
            </div>
            <p className="text-2xl font-bold">{avgMultiplier.toFixed(3)}</p>
          </div>

          {/* Std Multiplier */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Std Deviation</span>
            </div>
            <p className="text-2xl font-bold">{stdMultiplier.toFixed(3)}</p>
          </div>

          {/* Clamp Percentage */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Clamp %</span>
            </div>
            <p
              className={`text-2xl font-bold ${
                clampPercentage.total === 0
                  ? 'text-green-600'
                  : clampPercentage.total > 15
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}
            >
              {clampPercentage.total.toFixed(1)}%
            </p>
          </div>

          {/* Delta Magnitude */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Avg Δ Mag</span>
            </div>
            <p className="text-2xl font-bold">{avgDeltaMagnitude.toFixed(3)}</p>
          </div>
        </div>

        {/* Dominant Archetype */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Dominant Behavioral Archetype</h4>
          <div className="flex items-center justify-between p-3 bg-muted rounded">
            <span className="font-semibold capitalize">{maxArchetype}</span>
            <span className="text-2xl font-bold">
              {dominantArchetypeDistribution[maxArchetype as keyof typeof dominantArchetypeDistribution].toFixed(
                1
              )}
              %
            </span>
          </div>
        </div>

        {/* Delta vs Soft Contribution */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="text-sm font-semibold">Feature Contribution Insight</h4>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded space-y-1">
            <div className="flex justify-between text-sm">
              <span>Avg Delta Magnitude:</span>
              <span className="font-mono font-semibold">{avgDeltaMagnitude.toFixed(4)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {avgDeltaMagnitude > 0.1
                ? 'Strong delta activity - Option B working as designed ✓'
                : avgDeltaMagnitude > 0.05
                ? 'Moderate delta activity - acceptable variance'
                : 'Low delta activity - model may be relying on soft membership only ⚠'}
            </p>
          </div>
        </div>

        {/* System Health */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Overall Health</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Clamp Safety</span>
              <span
                className={`font-semibold ${
                  clampPercentage.total === 0
                    ? 'text-green-600'
                    : clampPercentage.total <= 5
                    ? 'text-green-500'
                    : clampPercentage.total <= 15
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}
              >
                {clampPercentage.total === 0
                  ? 'Perfect'
                  : clampPercentage.total <= 5
                  ? 'Healthy'
                  : clampPercentage.total <= 15
                  ? 'Warning'
                  : 'Critical'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Variance Adequacy</span>
              <span
                className={`font-semibold ${
                  stdMultiplier >= 0.05 ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {stdMultiplier >= 0.05 ? 'Sufficient' : 'Low'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delta Activity</span>
              <span
                className={`font-semibold ${
                  avgDeltaMagnitude > 0.1
                    ? 'text-green-600'
                    : avgDeltaMagnitude > 0.05
                    ? 'text-yellow-600'
                    : 'text-orange-600'
                }`}
              >
                {avgDeltaMagnitude > 0.1
                  ? 'Strong'
                  : avgDeltaMagnitude > 0.05
                  ? 'Moderate'
                  : 'Weak'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
