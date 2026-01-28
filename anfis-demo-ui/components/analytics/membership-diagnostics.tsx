'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Archetype, RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { Compass, Package, Swords } from 'lucide-react';

interface MembershipDiagnosticsProps {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
}

const archetypeIcons: Record<Archetype, React.ReactNode> = {
  combat: <Swords className="h-4 w-4" />,
  collect: <Package className="h-4 w-4" />,
  explore: <Compass className="h-4 w-4" />,
};

const archetypeColors: Record<Archetype, string> = {
  combat: 'bg-red-500',
  collect: 'bg-blue-500',
  explore: 'bg-green-500',
};

export function MembershipDiagnostics({ session, currentRound }: MembershipDiagnosticsProps) {
  if (!session || !currentRound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Soft Membership Diagnostics</CardTitle>
          <CardDescription>Fuzzy archetype distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Run pipeline to see metrics</p>
        </CardContent>
      </Card>
    );
  }

  const { softMembership, membershipSum, dominantArchetype } = currentRound;
  const { dominantArchetypeDistribution } = session;

  const membershipValid = Math.abs(membershipSum - 1.0) < 0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soft Membership Diagnostics</CardTitle>
        <CardDescription>Fuzzy clustering membership values (context for Option B)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation */}
        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <span className="text-sm font-medium">Membership Sum Check</span>
          <span
            className={`text-sm font-bold ${
              membershipValid ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {membershipSum.toFixed(4)} {membershipValid ? '✓' : '✗ (must = 1.0)'}
          </span>
        </div>

        {/* Current Round Stacked Bar */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Current Round Distribution</h4>
          <div className="flex h-8 rounded overflow-hidden">
            <div
              className="bg-red-500 flex items-center justify-center text-xs text-white font-semibold"
              style={{ width: `${softMembership.combat * 100}%` }}
            >
              {softMembership.combat > 0.15 && `${(softMembership.combat * 100).toFixed(0)}%`}
            </div>
            <div
              className="bg-blue-500 flex items-center justify-center text-xs text-white font-semibold"
              style={{ width: `${softMembership.collect * 100}%` }}
            >
              {softMembership.collect > 0.15 && `${(softMembership.collect * 100).toFixed(0)}%`}
            </div>
            <div
              className="bg-green-500 flex items-center justify-center text-xs text-white font-semibold"
              style={{ width: `${softMembership.explore * 100}%` }}
            >
              {softMembership.explore > 0.15 && `${(softMembership.explore * 100).toFixed(0)}%`}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Swords className="h-3 w-3 text-red-500" />
              <span>Combat: {(softMembership.combat * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-blue-500" />
              <span>Collect: {(softMembership.collect * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Compass className="h-3 w-3 text-green-500" />
              <span>Explore: {(softMembership.explore * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Dominant Archetype */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Dominant Archetype</h4>
          <div className="flex items-center gap-2 p-3 bg-muted rounded">
            {archetypeIcons[dominantArchetype]}
            <span className="font-semibold capitalize">{dominantArchetype}</span>
            <span className="text-sm text-muted-foreground">
              ({(softMembership[dominantArchetype] * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Session Distribution */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="text-sm font-semibold">Session Distribution</h4>
          <div className="space-y-2">
            {Object.entries(dominantArchetypeDistribution).map(([archetype, percentage]) => (
              <div key={archetype}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize flex items-center gap-1">
                    {archetypeIcons[archetype as Archetype]}
                    {archetype}
                  </span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={archetypeColors[archetype as Archetype]}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        <div className="border-t pt-4">
          <p className="text-xs italic text-muted-foreground">
            Soft membership provides <strong>contextual bias</strong> in Option B. Primary variance
            comes from behavioral <strong>deltas</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
