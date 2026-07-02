'use client';

import { MembershipDiagnostics } from '@/components/analytics/diagnostics/membership-diagnostics';
import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
import { MetricDetailModal } from '@/components/analytics/shared/metric-detail-modal';
import { Card } from '@/components/ui/card';
import { useTutorial } from '@/lib/analytics/tutorial-context';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import { usePipeline } from '@/lib/session/pipeline-context';
import { BehaviorCategory } from '@/lib/types';
import { GlobeLock, Scan, ScanEye, SeparatorVertical } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RadarChart } from '../radar-chart';
import { ArchetypeCategoryPanel } from './archetypes/archetype-category-panel';

export function ArchetypesTab() {
  const { pipelineState } = usePipeline();
  const { session, currentRound } = useAnalytics();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { tutorialMode } = useTutorial();

  const ClosestArchetype: BehaviorCategory = useMemo(() => {
    let maxSoftValObj: BehaviorCategory = pipelineState.behaviorCategories[0]
    pipelineState.behaviorCategories.map((val: BehaviorCategory) => {
      if (!maxSoftValObj) return;
      if (val.softMembership > maxSoftValObj.softMembership) maxSoftValObj = val
    })
    return maxSoftValObj
  }, [pipelineState])

  return (
    <div className="m-0 p-4 sm:p-5 space-y-6 w-full">
      {/* Beginner Intro Banner */}
      {tutorialMode && (
        <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 flex items-start gap-2.5">
          <GlobeLock className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-0.5">What is this tab?</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This shows <span className="text-foreground">which player archetype the AI matched most</span> -- Combat, Collection, or Exploration.
              The radar chart visualises all three scores at once. A higher percentage means the player more closely fits that archetype.
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <GlobeLock className="w-5 h-5 text-primary" />
            Archetypes Metrics
            <EducationalDrawer
              contentKey="anfis_pipeline_overview"
              trigger={<span className="ml-2 px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-[10px] text-primary cursor-help hover:bg-primary/20 transition-colors uppercase tracking-widest font-mono">Info</span>}
            />
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1 uppercase">
            REAL-TIME Archetype • CYCLE TICK: {pipelineState.executionTime.toFixed(2)}ms
          </p>
        </div>
      </div>

      <div className="items-start h-full">
        <div className="flex flex-col gap-6 w-full min-w-0">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <SeparatorVertical className="w-3.5 h-3.5" />
            <EducationalDrawer
              contentKey="input_normalization"
              trigger={
                <span className="text-xs font-bold uppercase tracking-wider font-mono cursor-help hover:text-primary transition-colors border-b border-dotted border-muted-foreground/40">
                  Behavior Archetypes
                </span>
              }
            />
          </div>

          {/* Radar Chart Container */}
          <Card className="bg-card border-border backdrop-blur-sm relative overflow-hidden group">
            {/* Corner Accents */}
            <div className="absolute top-0 right-0 p-2 opacity-50">
              <Scan className="w-4 h-4 text-cyan-500/50" />
            </div>

            <div className="p-6">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <ScanEye className="w-4 h-4" />
                Vector Projection
              </h4>
              <RadarChart
                data={[
                  { attribute: 'Combat', value: pipelineState.softMembership?.combat ? pipelineState.softMembership.combat * 100 : 0, fullMark: 100 },
                  { attribute: 'Collection', value: pipelineState.softMembership?.collect ? pipelineState.softMembership.collect * 100 : 0, fullMark: 100 },
                  { attribute: 'Exploration', value: pipelineState.softMembership?.explore ? pipelineState.softMembership.explore * 100 : 0, fullMark: 100 },
                ]}
                color="#06b6d4"
                fillOpacity={0.4}
              />
            </div>
          </Card>

          <ArchetypeCategoryPanel onMetricSelect={setSelectedMetric} pipelineState={pipelineState} maxSoftCatString={ClosestArchetype.category} />

          <MembershipDiagnostics session={session} currentRound={currentRound} />

          {
            ClosestArchetype &&
            <Card
              onClick={() => setSelectedMetric('session_classification')}
              className="bg-card border-border backdrop-blur-sm cursor-help hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Current Classification</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {ClosestArchetype.category}
                    </span>
                    <div className="px-2 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-primary">
                      {(ClosestArchetype.softMembership * 100).toFixed(1)}% Match
                    </div>
                  </div>
                </div>

                <div className="w-32 bg-muted h-1.5 rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-primary shadow-[0_0_8px_rgba(6,182,212,0.3)]" style={{ width: `${ClosestArchetype.softMembership ? ClosestArchetype.softMembership * 100 : 0}%` }} />
                </div>
              </div>
            </Card>
          }
        </div>
      </div>

      {/* Archetype Comparison -- tutorial only */}
      {tutorialMode && <ArchetypeComparisonTable />}

      <MetricDetailModal
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || ''}
        currentValue="Definition"
        status="neutral"
      />
    </div>
  );
}

// ─── Archetype Comparison Reference ──────────────────────────────────────────

const ARCHETYPE_DATA = [
  {
    name: 'Combat',
    color: 'border-rose-500/30 bg-rose-500/[0.07] dark:bg-rose-950/10',
    titleColor: 'text-rose-600 dark:text-rose-400',
    dotColor: 'bg-rose-500',
    barColor: 'bg-rose-500',
    emoji: '',
    description: 'Fights enemies. High kills, hits, and damage.',
    signals: ['enemiesHit', 'damageDone', 'timeInCombat', 'kills', 'damagePerHit (derived)'],
    paramEffect: 'More enemies, tougher enemies, lower player HP/damage',
    surrogateNote: 'Closest K-Means centroid: high combat scores, near-zero exploration.',
  },
  {
    name: 'Collection',
    color: 'border-amber-500/30 bg-amber-500/[0.07] dark:bg-amber-950/10',
    titleColor: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    barColor: 'bg-amber-500',
    emoji: '',
    description: 'Gathers items. High pickups and time near loot.',
    signals: ['itemsCollected', 'pickupAttempts', 'timeNearInteractables', 'pickupAttemptRate (derived)'],
    paramEffect: 'More collectibles, faster respawns, longer loot lifetime',
    surrogateNote: 'Closest K-Means centroid: high collection scores, low combat.',
  },
  {
    name: 'Exploration',
    color: 'border-sky-500/30 bg-sky-500/[0.07] dark:bg-sky-950/10',
    titleColor: 'text-sky-600 dark:text-sky-400',
    dotColor: 'bg-sky-500',
    barColor: 'bg-sky-500',
    emoji: '',
    description: 'Covers the map. High distance and sprint time.',
    signals: ['distanceTraveled', 'timeSprinting'],
    paramEffect: 'Better stamina regen, shorter dash cooldown',
    surrogateNote: 'Closest K-Means centroid: high movement scores, low combat/collection.',
  },
];

function ArchetypeComparisonTable() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Archetype reference -- how the AI tells them apart</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Memberships are <span className="text-foreground">not exclusive</span> -- a player can be 60% Combat + 30% Explorer + 10% Collector at the same time.
            All three always sum to 100%. The AI uses <span className="text-foreground">K-Means soft clustering</span>: distance to each pre-trained centroid
            determines how strongly you match each archetype.
          </p>
        </div>
        <EducationalDrawer
          contentKey="how_archetypes_differ"
          trigger={<span className="text-[10px] text-primary hover:text-primary/70 cursor-pointer underline underline-offset-2 decoration-dotted whitespace-nowrap shrink-0 mt-1">deep dive</span>}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/30">
        {ARCHETYPE_DATA.map((a) => (
          <div key={a.name} className={`p-4 space-y-3 ${a.color}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{a.emoji}</span>
              <span className={`text-sm font-bold ${a.titleColor}`}>{a.name}</span>
            </div>
            <p className="text-[11px] text-foreground/80">{a.description}</p>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Signals the AI watches</p>
              <ul className="space-y-0.5">
                {a.signals.map((s) => (
                  <li key={s} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.barColor}`} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Game effect when high</p>
              <p className="text-[11px] text-muted-foreground">{a.paramEffect}</p>
            </div>

            <div className="pt-1 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground/60 italic">{a.surrogateNote}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

