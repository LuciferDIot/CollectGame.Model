'use client';

import React from 'react';
import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useTutorial } from '@/lib/analytics/tutorial-context';
import { usePipeline } from '@/lib/session/pipeline-context';
import { BehaviorCategory } from '@/lib/types';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDown, ArrowRight, ArrowUp, BarChart3, ChevronDown, ChevronUp, Info, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { AnalyticsMetricsCards } from './analytics-metrics-cards';
import { AnalyticsTabsList } from './analytics-tabs-list';
import { AdaptationTab } from './tabs/adaptation-tab';
import { ArchetypesTab } from './tabs/archetypes-tab';
import { BehaviorTab } from './tabs/behavior-tab';
import { ModelTab } from './tabs/model-tab';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ARCHETYPE_EMOJI: Record<string, string> = { Combat: '⚔️', Collection: '🎒', Exploration: '🗺️' };
const ARCHETYPE_COLOR: Record<string, string> = { Combat: 'text-rose-400', Collection: 'text-amber-400', Exploration: 'text-sky-400' };
const ARCHETYPE_BG: Record<string, string> = { Combat: 'bg-rose-500', Collection: 'bg-amber-500', Exploration: 'bg-sky-500' };
const ARCHETYPE_DESC: Record<string, string> = { Combat: 'fighting enemies', Collection: 'collecting items', Exploration: 'exploring the map' };

function deltaBadge(delta: number) {
  const abs = Math.abs(delta);
  const pct = Math.round(abs * 100);
  if (abs < 0.01) return <span className="text-[10px] font-mono text-slate-600 px-1">=</span>;
  if (delta > 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-emerald-400"><ArrowUp className="w-2.5 h-2.5" />+{pct}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-rose-400"><ArrowDown className="w-2.5 h-2.5" />-{pct}%</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PlainEnglishSummary({
  categories,
  multiplier,
  previousCategories,
  previousMultiplier,
}: {
  categories: BehaviorCategory[];
  multiplier?: number;
  previousCategories?: BehaviorCategory[];
  previousMultiplier?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { tutorialMode } = useTutorial();

  if (categories.length === 0) return null;

  const dominant = categories.reduce((a, b) => a.softMembership > b.softMembership ? a : b);
  const mult = multiplier ?? 1.0;
  const multPct = Math.round(Math.abs(mult - 1.0) * 100);
  const multDir = mult > 1.02 ? 'harder' : mult < 0.98 ? 'easier' : 'unchanged';
  const multColor = mult > 1.02 ? 'text-rose-400' : mult < 0.98 ? 'text-emerald-400' : 'text-slate-400';

  const prevMult = previousMultiplier ?? null;
  const prevDominant = previousCategories?.reduce((a, b) => a.softMembership > b.softMembership ? a : b) ?? null;
  const hasPrev = !!previousCategories && previousCategories.length > 0;
  const dominantDelta = hasPrev
    ? (dominant.softMembership - (previousCategories!.find(c => c.category === dominant.category)?.softMembership ?? dominant.softMembership))
    : null;
  const multDeltaVal = hasPrev && prevMult != null ? mult - prevMult : null;

  // Plain-English sentence about vs. previous
  const sessionChangeText = (() => {
    if (!hasPrev || !prevDominant) return null;
    if (prevDominant.category !== dominant.category) {
      return `Changed from ${ARCHETYPE_EMOJI[prevDominant.category]} ${prevDominant.category} last window — the AI detected a shift in play style.`;
    }
    if (dominantDelta != null && Math.abs(dominantDelta) >= 0.05) {
      return dominantDelta > 0
        ? `${dominant.category} tendency increased by ${Math.round(dominantDelta * 100)}% from last window — AI is intensifying the response.`
        : `${dominant.category} tendency dropped by ${Math.round(Math.abs(dominantDelta) * 100)}% from last window — AI is easing off.`;
    }
    return 'Play style was consistent with last window — the AI made a minor adjustment.';
  })();

  return (
    <div className="mx-2 sm:mx-4 mt-4 mb-1 rounded-xl border border-slate-700/60 bg-slate-800/30 overflow-hidden">
      {/* ── Main summary row ── */}
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">What just happened?</p>
        <p className="text-sm text-slate-200 leading-relaxed">
          The AI identified this player as mainly a{' '}
          <span className={`font-bold ${ARCHETYPE_COLOR[dominant.category]}`}>
            {ARCHETYPE_EMOJI[dominant.category]} {dominant.category}
          </span>
          {' '}player ({Math.round(dominant.softMembership * 100)}% match
          {dominantDelta != null && Math.abs(dominantDelta) >= 0.01 && <>, {deltaBadge(dominantDelta)} vs last</>}
          ), spending most time{' '}
          <span className="text-slate-300">{ARCHETYPE_DESC[dominant.category]}</span>.
          {' '}Difficulty set to{' '}
          <span className={`font-bold ${multColor}`}>
            {multDir === 'unchanged' ? 'stay the same' : `${multDir} by ${multPct}%`}
          </span>
          {' '}
          <span className="font-mono text-slate-400">({mult.toFixed(3)}×</span>
          {multDeltaVal != null && Math.abs(multDeltaVal) >= 0.001 && (
            <span className="font-mono"> {deltaBadge(multDeltaVal)}</span>
          )}
          <span className="font-mono text-slate-400">)</span>.
        </p>

        {/* vs previous session inline note */}
        {sessionChangeText && (
          <div className="mt-2 flex items-start gap-1.5">
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">{sessionChangeText}</p>
          </div>
        )}
        {!hasPrev && (
          <p className="text-[11px] text-slate-600 mt-2 italic">Run a second simulation to see how this window compares to the previous one.</p>
        )}
      </div>

      {/* ── Archetype breakdown bar ── */}
      <div className="px-4 pb-3 flex max-sm:flex-col sm:gap-5 md:gap-10 items-center">
        {categories.map(cat => (
          <div key={cat.category} className="w-full sm:flex-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold ${ARCHETYPE_COLOR[cat.category]}`}>{cat.category}</span>
              <span className="text-[10px] font-mono text-slate-500">{Math.round(cat.softMembership * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className={`h-full ${ARCHETYPE_BG[cat.category]} transition-all`} style={{ width: `${cat.softMembership * 100}%` }} />
            </div>
            {hasPrev && previousCategories && (() => {
              const prev = previousCategories.find(p => p.category === cat.category);
              const d = prev ? cat.softMembership - prev.softMembership : 0;
              return Math.abs(d) >= 0.01 ? <div className="flex justify-end">{deltaBadge(d)}</div> : null;
            })()}
          </div>
        ))}
      </div>

      {/* ── Expandable calculation details (tutorial mode only) ── */}
      {tutorialMode && (
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-slate-700/40 hover:bg-slate-800/30 transition-colors group"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400">
          How was this calculated?
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>
      )}

      {tutorialMode && expanded && (
        <div className="px-4 py-4 border-t border-slate-700/30 bg-slate-900/20 space-y-4 text-[11px] text-slate-400 leading-relaxed">

          {/* Step 1: Activity scoring */}
          <CalcSection step="1" title="Activity scoring" color="text-cyan-400">
            Raw telemetry stats (kills, damage, distance, etc.) are grouped per archetype and averaged to produce
            an activity score between 0 and 1 per category. Each stat is first <span className="text-slate-300">normalised</span> using
            training-set min/max so they are on the same scale.
          </CalcSection>

          {/* Step 2: Soft clustering */}
          <CalcSection step="2" title="Soft membership via K-Means" color="text-violet-400">
            Three pre-trained cluster centroids (one per archetype) represent the "ideal" Combat, Collection, and
            Exploration player in feature space. The Euclidean distance from this player's activity vector to each
            centroid is computed. <span className="text-slate-300">Inverse-distance weighting</span> converts those distances
            into three memberships that always sum to 1.0.
            {hasPrev && previousCategories && (
              <span className="block mt-1 text-slate-500">
                Previous window memberships: {previousCategories.map(c =>
                  `${c.category} ${Math.round(c.softMembership * 100)}%`).join(' · ')}.
                Change this window: {categories.map(c => {
                  const p = previousCategories.find(x => x.category === c.category);
                  const d = p ? Math.round((c.softMembership - p.softMembership) * 100) : 0;
                  return `${c.category} ${d >= 0 ? '+' : ''}${d}%`;
                }).join(' · ')}.
              </span>
            )}
          </CalcSection>

          {/* Step 3: Delta computation */}
          {hasPrev ? (
            <CalcSection step="3" title="Behavioural deltas" color="text-amber-400">
              Delta = current membership − previous membership. These deltas are fed into the surrogate model
              alongside current memberships so the AI can detect <span className="text-slate-300">trends</span>, not just current state.
              <span className="block mt-1 text-slate-500 font-mono">
                Δ {categories.map(c => {
                  const p = previousCategories!.find(x => x.category === c.category);
                  const d = p ? (c.softMembership - p.softMembership) : 0;
                  return `${c.category.substring(0, 3)}=${d >= 0 ? '+' : ''}${d.toFixed(3)}`;
                }).join('  ')}
              </span>
            </CalcSection>
          ) : (
            <CalcSection step="3" title="Behavioural deltas" color="text-amber-400">
              No previous window yet — deltas are all 0 for this run. The AI feeds Δ=0 into the surrogate,
              meaning only the current memberships drive the output. Run again to get real deltas.
            </CalcSection>
          )}

          {/* Step 4: Surrogate model output */}
          <CalcSection step="4" title="Surrogate model (MLP) output" color="text-emerald-400">
            Inputs: [combat={categories.find(c => c.category === 'Combat')?.softMembership.toFixed(3) ?? '—'},
            collect={categories.find(c => c.category === 'Collection')?.softMembership.toFixed(3) ?? '—'},
            explore={categories.find(c => c.category === 'Exploration')?.softMembership.toFixed(3) ?? '—'}{hasPrev ? ', Δcombat, Δcollect, Δexplore' : ', Δ×3=0'}] →
            MLP forward pass → raw output → clamped to [0.6, 1.4] →{' '}
            <span className={`font-mono font-bold ${multColor}`}>{mult.toFixed(3)}×</span>.
            {prevMult != null && <span className="block mt-1 text-slate-500">Previous multiplier was {prevMult.toFixed(3)}×. Change: {mult > prevMult ? '+' : ''}{((mult - prevMult) * 100).toFixed(1)} percentage points.</span>}
          </CalcSection>

          {/* Step 5: Parameter cascade */}
          <CalcSection step="5" title="Parameter cascade" color="text-rose-400">
            Each archetype group's parameters are scaled by a category factor:
            <span className="block font-mono text-cyan-400 mt-1 text-[10px]">
              factor = 1.0 + ({mult.toFixed(3)} − 1.0) × (0.5 + membership × 1.5)
            </span>
            <span className="block mt-1 text-slate-500">
              {categories.map(c => {
                const w = 0.5 + c.softMembership * 1.5;
                const delta = mult - 1.0;
                const factor = 1.0 + delta * w;
                return `${c.category}: factor=${factor.toFixed(3)}`;
              }).join(' · ')}
            </span>
            Parameters scale directly (<span className="font-mono text-slate-300">base × factor</span>) or inversely
            (<span className="font-mono text-slate-300">base ÷ factor</span>) depending on whether they should increase or decrease with difficulty.
          </CalcSection>

          <div className="pt-1 border-t border-slate-700/30">
            <div className="flex items-center gap-2">
              <EducationalDrawer
                contentKey="how_surrogate_model_works"
                trigger={<span className="text-[10px] text-cyan-600 hover:text-cyan-400 cursor-pointer underline underline-offset-2 decoration-dotted">Surrogate model deep dive</span>}
              />
              <span className="text-slate-700">·</span>
              <EducationalDrawer
                contentKey="how_deltas_work"
                trigger={<span className="text-[10px] text-cyan-600 hover:text-cyan-400 cursor-pointer underline underline-offset-2 decoration-dotted">How deltas work</span>}
              />
              <span className="text-slate-700">·</span>
              <EducationalDrawer
                contentKey="how_normalization_works"
                trigger={<span className="text-[10px] text-cyan-600 hover:text-cyan-400 cursor-pointer underline underline-offset-2 decoration-dotted">Normalization</span>}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalcSection({ step, title, color, children }: { step: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className={`font-mono font-bold text-sm shrink-0 w-4 leading-tight ${color}`}>{step}.</span>
      <div>
        <span className={`font-semibold ${color}`}>{title}. </span>
        <span>{children}</span>
      </div>
    </div>
  );
}

interface AnalyticsSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyticsSlideOver({ open, onOpenChange }: AnalyticsSlideOverProps) {
  const { pipelineState } = usePipeline();
  const { tutorialMode, toggleTutorialMode } = useTutorial();

  if (pipelineState.behaviorCategories.length === 0) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
          <Dialog.Content className="fixed right-0 top-0 h-screen w-[600px] bg-linear-to-b from-slate-900 to-slate-950 border-l border-slate-700 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <Dialog.Title className="text-lg font-semibold text-slate-100">Analytics</Dialog.Title>
              </div>
              <Dialog.Close className="rounded-full p-2 hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </Dialog.Close>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-slate-600 mb-4 mx-auto" />
                <p className="text-sm text-slate-400">Run simulation to see analysis results</p>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
        <Dialog.Content className="fixed inset-y-0 right-0 h-full w-full sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-3xl bg-linear-to-b from-slate-900 to-slate-950 border-l border-slate-700 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-slate-900/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <Dialog.Title className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                  System Analytics
                  <EducationalDrawer
                    contentKey="anfis_pipeline_overview"
                    trigger={<Info className="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors" />}
                  />
                </Dialog.Title>
                <p className="text-xs text-slate-500 font-mono">Real-time behavioral telemetry</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTutorialMode}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  tutorialMode
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-700 bg-transparent text-slate-600 hover:text-slate-400 hover:border-slate-600'
                }`}
              >
                <Info className="w-3 h-3" />
                Tutorial
              </button>
              <Dialog.Close className="rounded-lg p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                <X className="w-5 h-5 text-slate-400" />
              </Dialog.Close>
            </div>
          </div>

          {/* Main Scrollable Content Area */}
          <Tabs defaultValue="behavior" className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth pb-8">
              {/* Plain-English Summary (Inside scrollable) */}
              <PlainEnglishSummary
                categories={pipelineState.behaviorCategories}
                multiplier={pipelineState.output?.adjustedMultiplier}
                previousCategories={pipelineState.previousCategories}
                previousMultiplier={pipelineState.previousOutput?.adjustedMultiplier}
              />

              {/* Technical Metric Cards (Inside scrollable) */}
              <AnalyticsMetricsCards />

              {/* Sticky Tabs List */}
              <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/40">
                <AnalyticsTabsList />
              </div>

              {/* Tab Contents */}
              <TabsContent value="behavior" className="m-0 border-0 focus-visible:outline-none">
                <BehaviorTab />
              </TabsContent>

              <TabsContent value="adaptation" className="m-0 border-0 focus-visible:outline-none">
                <AdaptationTab />
              </TabsContent>

              <TabsContent value="archetypes" className="m-0 border-0 focus-visible:outline-none">
                <ArchetypesTab />
              </TabsContent>

              <TabsContent value="model" className="m-0 border-0 focus-visible:outline-none">
                <ModelTab />
              </TabsContent>
            </div>
          </Tabs>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
