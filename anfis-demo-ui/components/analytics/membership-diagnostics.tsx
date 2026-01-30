'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Archetype, RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { Compass, Package, Swords } from 'lucide-react';
import { HelpfulTooltip } from './helpful-tooltip';

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
    return <DiagnosticsEmptyState />;
  }

  const { softMembership, membershipSum, dominantArchetype } = currentRound;
  const { dominantArchetypeDistribution } = session;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpfulTooltip 
            trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Soft Membership Diagnostics</span>}
            title="Soft Membership (Fuzzification)"
            description="The degree to which the player currently fits into each Archetype (0.0 to 1.0). Unlike hard clustering, this is fuzzy and continuous."
            interpretation="Option B uses this for 'Contextual Bias'—smoothing the output but not driving the main variance."
          />
        </CardTitle>
        <CardDescription>Fuzzy clustering values</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation */}
        <MembershipValidation membershipSum={membershipSum} />

        {/* Current Round Stacked Bar */}
        <CurrentRoundDistribution softMembership={softMembership} />

        {/* Dominant Archetype */}
        <DominantArchetypeDisplay dominantArchetype={dominantArchetype} softMembership={softMembership} />

        {/* Session Distribution */}
        <SessionDistribution distribution={dominantArchetypeDistribution} />

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

function DiagnosticsEmptyState() {
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

function MembershipValidation({ membershipSum }: { membershipSum: number }) {
  const membershipValid = Math.abs(membershipSum - 1.0) < 0.01;

  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded">
      <span className="text-sm font-medium flex items-center gap-1">
         <HelpfulTooltip 
           trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Membership Sum Check</span>}
           title="Partition of Unity (Correctness Check)" 
           description="Fuzzy logic requirement: The sum of all membership degrees must equal exactly 1.0." 
           calculation="Σ μ(x) = μ_combat + μ_collect + μ_explore = 1.0"
           interpretation="If the sum != 1.0, the fuzzy system is invalid (broken probability space)."
         />
      </span>
      <span
        className={`text-sm font-bold ${
          membershipValid ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {membershipSum.toFixed(4)} {membershipValid ? '✓' : '✗ (must = 1.0)'}
      </span>
    </div>
  );
}

function CurrentRoundDistribution({ softMembership }: { softMembership: RoundAnalytics['softMembership'] }) {
  return (
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
        <HelpfulTooltip
          trigger={
            <div className="flex items-center gap-1 cursor-pointer hover:underline">
              <Swords className="h-3 w-3 text-red-500" />
              <span>Combat: {(softMembership.combat * 100).toFixed(1)}%</span>
            </div>
          }
          title="Combat Membership (μ_combat)"
          description="How much your current behavior matches the 'Aggressive Fighter' archetype."
          calculation="μ_combat(x) = (1 / (1 + d(x, center_combat)^2)) / Σ(all_classes)"
        />
        <HelpfulTooltip
          trigger={
            <div className="flex items-center gap-1 cursor-pointer hover:underline">
              <Package className="h-3 w-3 text-blue-500" />
              <span>Collect: {(softMembership.collect * 100).toFixed(1)}%</span>
            </div>
          }
          title="Collect Membership (μ_collect)"
          description="How much your current behavior matches the 'Resource Gatherer' archetype."
          calculation="μ_collect(x) = (1 / (1 + d(x, center_collect)^2)) / Σ(all_classes)"
        />
        <HelpfulTooltip
          trigger={
            <div className="flex items-center gap-1 cursor-pointer hover:underline">
              <Compass className="h-3 w-3 text-green-500" />
              <span>Explore: {(softMembership.explore * 100).toFixed(1)}%</span>
            </div>
          }
          title="Explore Membership (μ_explore)"
          description="How much your current behavior matches the 'Map Explorer' archetype."
          calculation="μ_explore(x) = (1 / (1 + d(x, center_explore)^2)) / Σ(all_classes)"
        />
      </div>
    </div>
  );
}

function DominantArchetypeDisplay({ dominantArchetype, softMembership }: { dominantArchetype: Archetype, softMembership: RoundAnalytics['softMembership'] }) {
  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold mb-2">Dominant Archetype</h4>
      <div className="flex items-center gap-2 p-3 bg-muted rounded">
        {archetypeIcons[dominantArchetype]}
        <span className="font-semibold capitalize">{dominantArchetype}</span>
        <span className="text-sm text-muted-foreground">
          ({(softMembership[dominantArchetype] * 100).toFixed(1)}%)
        </span>
        <HelpfulTooltip 
          title="Dominant Style" 
          description="The single strongest component of the user's behavior this round."
          interpretation="The archetype with the highest soft membership value (MAX(μ))."
        />
      </div>
    </div>
  );
}

function SessionDistribution({ distribution }: { distribution: SessionAnalytics['dominantArchetypeDistribution'] }) {
  return (
    <div className="border-t pt-4 space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-1">
         <HelpfulTooltip 
           trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Session Distribution</span>}
           title="Long-term Style (Archetype History)" 
           description="Percentage of rounds where each archetype was dominant." 
           calculation="%_Archetype_A = (Count(Rounds where A is Max) / Total_Rounds) * 100"
         />
      </h4>
      <div className="space-y-2">
        {Object.entries(distribution).map(([archetype, percentage]) => (
          <div key={archetype}>
            <div className="flex justify-between text-xs mb-1">
              <span className="capitalize flex items-center gap-1">
                {archetypeIcons[archetype as Archetype]}
                {archetype}
              </span>
              <span className="font-mono">{percentage.toFixed(1)}%</span>
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
  );
}
