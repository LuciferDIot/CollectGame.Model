'use client';

import { HelpfulTooltip } from '@/components/analytics/shared/helpful-tooltip';
import { usePipeline } from '@/lib/session/pipeline-context';
import { BehaviorCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

// ─── Colour helpers ────────────────────────────────────────────────────────────

const BORDER: Record<string, string> = {
  Combat: 'border-rose-500/30 hover:border-rose-500/50',
  Collection: 'border-amber-500/30 hover:border-amber-500/50',
  Exploration: 'border-sky-500/30 hover:border-sky-500/50',
};
const BAR: Record<string, string> = {
  Combat: 'bg-rose-500',
  Collection: 'bg-amber-500',
  Exploration: 'bg-sky-500',
};
const GLOW: Record<string, string> = {
  Combat: 'shadow-rose-900/20',
  Collection: 'shadow-amber-900/20',
  Exploration: 'shadow-sky-900/20',
};
const LABEL_COLOR: Record<string, string> = {
  Combat: 'text-rose-400',
  Collection: 'text-amber-400',
  Exploration: 'text-sky-400',
};

function matchLabel(membership: number): { text: string; cls: string } {
  if (membership > 0.5) return { text: 'HIGH', cls: 'bg-green-500/20 text-green-400 border-green-500/30' };
  if (membership > 0.3) return { text: 'MED', cls: 'bg-blue-500/20  text-blue-400  border-blue-500/30' };
  return { text: 'LOW', cls: 'bg-slate-700/50 text-slate-400 border-slate-600/30' };
}

// ─── Header legend ─────────────────────────────────────────────────────────────

function MetricsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 px-0.5">
      <p className="text-[9px] uppercase tracking-widest font-bold text-slate-600 shrink-0">Archetype match scores</p>
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <LegendItem color="bg-green-500/60" label="HIGH > 50%" />
        <LegendItem color="bg-blue-500/60" label="MED 30–50%" />
        <LegendItem color="bg-slate-600/60" label="LOW < 30%" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[9px] font-mono text-slate-600">{label}</span>
    </span>
  );
}

// ─── Single archetype card ─────────────────────────────────────────────────────

function ArchetypeCard({ cat }: { cat: BehaviorCategory }) {
  const badge = matchLabel(cat.softMembership);
  const confGood = cat.confidence > 0.85;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border bg-linear-to-br from-slate-800/60 to-slate-900/70 p-4 transition-all shadow-md',
      BORDER[cat.category], GLOW[cat.category]
    )}>

      {/* Row 1: name + match badge */}
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-[10px] uppercase tracking-widest font-black', LABEL_COLOR[cat.category])}>
          {cat.category}
        </span>
        <HelpfulTooltip
          trigger={
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-help select-none',
              badge.cls
            )}>
              {badge.text}
            </span>
          }
          title="Match Level (HIGH / MED / LOW)"
          description="Shows how strongly this player's behaviour matches this archetype's pattern this window."
          calculation="HIGH = membership > 50%\nMED  = 30% – 50%\nLOW  = below 30%"
          interpretation="HIGH Combat = player is primarily fighting. LOW does not mean zero combat — just that other styles dominate this window."
        />
      </div>

      {/* Row 2: big membership % */}
      <div className="flex items-baseline gap-0.5 mb-0.5">
        <span className="text-3xl font-black text-slate-100 font-mono tracking-tight tabular-nums leading-none">
          {(cat.softMembership * 100).toFixed(0)}
        </span>
        <span className="text-sm text-slate-500 font-mono leading-none">%</span>
      </div>
      <p className="text-[9px] text-slate-500 mb-3 leading-tight">
        Archetype match — how closely this player fits the {cat.category.toLowerCase()} pattern
      </p>

      {/* Row 3: Activity + Confidence with hover-help */}
      <div className="flex items-center gap-3 text-[10px]">

        {/* Activity */}
        <div className="flex items-center gap-1">
          <HelpfulTooltip
            trigger={
              <span className="flex items-center gap-0.5 text-slate-500 cursor-help hover:text-slate-300 transition-colors">
                Activity
                <HelpCircle className="w-2.5 h-2.5 opacity-60" />
              </span>
            }
            title="Activity Index"
            description="The percentage of this player's raw game actions that fell into this archetype's category during the current 30-second window."
            calculation={
              "Combat:       avg(enemiesHit, damageDone, kills, timeInCombat, damagePerHit)\n" +
              "Collection:   avg(itemsCollected, pickupAttempts, timeNearInteractables, pickupAttemptRate)\n" +
              "Exploration:  avg(distanceTraveled, timeSprinting)\n\n" +
              "Each signal is normalised [0,1] before averaging. Result × 100 = Activity %."
            }
            interpretation="High % = player was busy with these actions. Activity is a raw average — it differs from the Membership % which measures how well the pattern matches the cluster centroid."
          />
          <span className="font-mono text-slate-200 font-bold">{cat.activityPercentage}%</span>
        </div>

        <span className="text-slate-700">|</span>

        {/* Confidence */}
        <div className="flex items-center gap-1">
          <HelpfulTooltip
            trigger={
              <span className="flex items-center gap-0.5 text-slate-500 cursor-help hover:text-slate-300 transition-colors">
                Conf
                <HelpCircle className="w-2.5 h-2.5 opacity-60" />
              </span>
            }
            title="Classification Confidence"
            description="A signal quality score (0–100%) showing how clearly and reliably the AI classified this archetype. This is NOT a probability — it reflects signal strength and separation from other archetypes."
            calculation={
              "confidence = 0.5 × activity_score\n" +
              "           + 0.5 × (this_membership − next_highest_membership)\n" +
              "Clamped to [0, 1]."
            }
            interpretation={"90%+ (green) = strong, unambiguous signal.\n60–89% = moderate — other archetypes also present.\nBelow 60% = mixed signal — player may be transitioning styles."}
          />
          <span className={cn('font-mono font-bold', confGood ? 'text-green-400' : 'text-amber-400')}>
            {(cat.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Bottom membership bar */}
      <div
        className={cn('absolute bottom-0 left-0 h-[3px] transition-all rounded-br-xl opacity-60', BAR[cat.category])}
        style={{ width: `${cat.softMembership * 100}%` }}
      />
    </div>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

export function AnalyticsMetricsCards() {
  const { pipelineState } = usePipeline();

  return (
    <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-700/30 bg-slate-900/20">
      <MetricsLegend />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {pipelineState.behaviorCategories.map(cat => (
          <ArchetypeCard key={cat.category} cat={cat} />
        ))}
      </div>
      <p className="text-[9px] text-slate-700 mt-2 text-center leading-relaxed">
        Large % = archetype match · Activity = raw action share · Conf = classification reliability — click labels for details
      </p>
    </div>
  );
}
