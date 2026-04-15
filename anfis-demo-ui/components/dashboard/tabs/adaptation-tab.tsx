'use client';

import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
import { MetricDetailModal } from '@/components/analytics/shared/metric-detail-modal';
import { useTutorial } from '@/lib/analytics/tutorial-context';
import { usePipeline } from '@/lib/session/pipeline-context';
import { BehaviorCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowRight, ArrowUp, History, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

export function AdaptationTab() {
  const { pipelineState } = usePipeline();
  const { behaviorCategories, output } = pipelineState;
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { tutorialMode } = useTutorial();

  // Helper to get category specific multiplier
  const getCategoryFactor = (catName: string): number => {
    const cat = behaviorCategories.find(c => c.category === catName);
    const membership = cat?.softMembership ?? 0;
    const globalMult = output?.adjustedMultiplier ?? 1.0;

    // REFINED LOGIC:
    // Always apply at least 50% of the global adaptation (Global Baseline).
    // Add membership influence on top (Archetype Specificity).
    const weight = 0.5 + (membership * 1.5);
    const delta = globalMult - 1.0;

    return 1.0 + (delta * weight);
  };

  const combatFactor = getCategoryFactor('Combat');
  const collectionFactor = getCategoryFactor('Collection');
  const explorationFactor = getCategoryFactor('Exploration');

  const openMetric = (key: string) => setSelectedMetric(key);

  return (
    <div className="m-0 p-4 sm:p-5 space-y-6 w-full">
      {/* Beginner Intro Banner */}
      {tutorialMode && (
        <div className="p-3 rounded-lg border border-amber-800/30 bg-amber-950/20 flex items-start gap-2.5">
          <History className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-300 mb-0.5">What is this tab?</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This shows <span className="text-slate-300">the game settings the AI adjusted</span> based on the player's detected behaviour.
              Each row shows the original (base) value and the new (final) value. A positive % means the parameter was increased; negative means decreased.
            </p>
          </div>
        </div>
      )}

      {/* Window-to-Window Comparison */}
      <WindowComparison
        currentCategories={behaviorCategories}
        previousCategories={pipelineState.previousCategories}
        currentMultiplier={output?.adjustedMultiplier}
        previousMultiplier={pipelineState.previousOutput?.adjustedMultiplier}
      />

      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Adaptation calculation
            <EducationalDrawer
              contentKey="anfis_pipeline_overview"
              trigger={<span className="ml-2 px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-300 cursor-help hover:bg-blue-500/20 transition-colors uppercase tracking-widest font-mono">Info</span>}
            />
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase">
            REAL-TIME Adaptation Computation • CYCLE TICK: {pipelineState.executionTime.toFixed(2)}ms
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLLECTION PARAMETERS */}
        <ParameterCard
          title="Collection Parameters"
          color="collection"
        >
          <ParameterRow
            name="collectible count"
            base={120.0}
            final={120.0 * collectionFactor}
            format="0.00"
            onClick={() => openMetric('resource_density')}
            dark
          />
          <ParameterRow
            name="collectible spawn interval"
            base={40.0}
            final={40.0 * (2 - collectionFactor)}
            format="0.00"
            onClick={() => openMetric('resource_respawn_rate')}
            dark
          />
          <ParameterRow
            name="collectible lifetime"
            base={30.0}
            final={30.0 * collectionFactor}
            format="0.00"
            onClick={() => openMetric('resource_availability_window')}
            dark
          />
        </ParameterCard>

        {/* EXPLORATION PARAMETERS */}
        <ParameterCard
          title="Exploration Parameters"
          color="exploration"
        >
          <ParameterRow
            name="stamina regen"
            base={12.0}
            final={12.0 * (1 / explorationFactor)}
            format="0.00"
            onClick={() => openMetric('stamina_recovery_dynamics')}
            dark
          />
          <ParameterRow
            name="dash cooldown"
            base={3.0}
            final={3.0 * (2 - explorationFactor)}
            format="0.00"
            onClick={() => openMetric('movement_fluidity')}
            dark
          />
        </ParameterCard>

        {/* COMBAT PARAMETERS - spans 2 cols on large to give it more room */}
        <div className="lg:col-span-2">
          <ParameterCard
            title="Combat Parameters"
            color="combat"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="space-y-5">
                <ParameterRow
                  name="enemy spawn interval"
                  base={40.0}
                  final={40.0 * (2 - combatFactor)}
                  format="0.00"
                  onClick={() => openMetric('combat_parameter_adaptation')}
                  dark
                />
                <ParameterRow
                  name="global enemy cap"
                  base={35.0}
                  final={35.0 * combatFactor}
                  format="0.00"
                  onClick={() => openMetric('global_cap_adaptation')}
                  dark
                />
                <ParameterRow
                  name="enemy damage intensity"
                  base={10.0}
                  final={10.0 * combatFactor}
                  format="0.00"
                  onClick={() => openMetric('combat_intensity')}
                  dark
                />
                <ParameterRow
                  name="enemy max health"
                  base={100.0}
                  final={100.0 * combatFactor}
                  format="0.00"
                  onClick={() => openMetric('combat_health_scaling')}
                  dark
                />
              </div>
              <div className="space-y-5">
                <ParameterRow
                  name="stamina damage"
                  base={5.0}
                  final={5.0 * combatFactor}
                  format="0.00"
                  onClick={() => openMetric('stamina_penalty')}
                  dark
                />
                <ParameterRow
                  name="player damage intensity"
                  base={16.0}
                  final={16.0 * (1 / combatFactor)}
                  format="0.00"
                  onClick={() => openMetric('player_power_scaling')}
                  dark
                />
                <ParameterRow
                  name="player max health"
                  base={180.0}
                  final={180.0 * (1 / combatFactor)}
                  format="0.00"
                  onClick={() => openMetric('player_resilience')}
                  dark
                />
              </div>
            </div>
          </ParameterCard>
        </div>
      </div>
      {/* How Adaptation Works -- Tutorial only */}
      {tutorialMode && (
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">How adaptation works -- the full chain</p>
          </div>
          <div className="px-4 py-4 space-y-4 text-[11px] text-slate-400 leading-relaxed">
            <p>
              The AI follows a 4-step chain each window to decide how to adjust the game:
            </p>
            <ol className="space-y-3 list-none">
              <AdaptStepRow n="1" title="Measure behavior" color="text-cyan-400"
                body="Raw game stats (hits, damage, distance, etc.) are collected over a 30-second window and normalised to [0-1] so they are comparable." />
              <AdaptStepRow n="2" title="Classify play style" color="text-violet-400"
                body="The AI scores your play style as a blend of three archetypes -- Combat, Collection, Exploration -- each getting a percentage (they always sum to 100%)." />
              <AdaptStepRow n="3" title="Compute a global multiplier" color="text-amber-400"
                body={`The ANFIS surrogate model predicts a single difficulty multiplier (range 0.6x - 1.4x). Above 1.0 means harder; below 1.0 means easier. Current: ${(output?.adjustedMultiplier ?? 1.0).toFixed(3)}x`} />
              <AdaptStepRow n="4" title="Scale each parameter by archetype weight" color="text-emerald-400"
                body="Each category parameter is scaled by its own category factor: factor = 1.0 + (globalMult − 1.0) x (0.5 + membership x 1.5). Combat players get harder combat settings; collectors get richer item economies; explorers get better movement." />
            </ol>
            <div className="pt-2 border-t border-slate-700/30">
              <p className="text-slate-500">
                <span className="text-slate-400 font-medium">Why the 0.5 baseline in the formula?</span>{' '}
                Every player gets at least 50% of the global adaptation applied -- no archetype is completely ignored.
                The remaining 50% is driven by how strongly you match that archetype (your soft membership value).
                A 100% Combat player gets 200% weight on combat parameters; a 0% Combat player still gets 50%.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-4 opacity-20">
        <SlidersHorizontal className="w-5 h-5 text-slate-600" />
      </div>

      {/* Shared Metric Modal for Deep Dives */}
      <MetricDetailModal
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || 'adaptive_parameter_tuning'}
        currentValue="Dynamic"
        status="neutral"
      />
    </div>
  );
}

function ParameterCard({ title, children, color }: { title: string, children: React.ReactNode, color: 'combat' | 'collection' | 'exploration' }) {
  const borderColor = color === 'combat' ? 'border-rose-500/20' : color === 'collection' ? 'border-amber-500/20' : 'border-sky-500/20';
  const bgGradient = 'bg-gradient-to-b from-[#161b2c] to-[#0f111a]'; // Subtle gradient for depth
  const titleColor = color === 'combat' ? 'text-rose-400' : color === 'collection' ? 'text-amber-400' : 'text-sky-400';
  const glowColor = color === 'combat' ? 'shadow-rose-900/10' : color === 'collection' ? 'shadow-amber-900/10' : 'shadow-sky-900/10';
  const bulletColor = color === 'combat' ? 'text-rose-500' : color === 'collection' ? 'text-amber-500' : 'text-sky-500';

  return (
    <div className={cn("rounded-xl border p-6 shadow-xl backdrop-blur-sm", bgGradient, borderColor, glowColor)}>
      <h4 className={cn("text-base font-bold mb-6 tracking-tight flex items-center gap-2", titleColor)}>
        <span className={cn("text-xl leading-none", bulletColor)}>•</span>
        {title}
      </h4>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  )
}

function ParameterRow({ name, base, final, format = "0.00", dark, onClick }: any) {
  const percentChange = ((final - base) / base) * 100;
  const isGain = percentChange > 0;
  const isNeutral = Math.abs(percentChange) < 0.01;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between group py-1 cursor-pointer hover:bg-white/5 rounded pl-2 pr-1 transition-colors -ml-2"
    >
      <div className="space-y-1.5 point-events-none">
        <div className="text-[13px] font-medium text-slate-300 group-hover:text-blue-200 transition-colors tracking-wide underline-offset-2 group-hover:underline decoration-dotted decoration-slate-600">
          {name}
        </div>
        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
          <span className="opacity-60">Base:</span>
          <span className="text-slate-400">{base.toFixed(2)}</span>
          <span className="text-slate-600">{"->"}</span>
          <span className="opacity-60">Final:</span>
          <span className="text-slate-200 font-bold bg-white/5 px-1.5 rounded">{final.toFixed(2)}</span>
        </div>
      </div>

      {!isNeutral && (
        <div className={cn(
          "px-2.5 py-1 rounded-md text-[11px] font-bold font-mono min-w-14 text-center shadow-sm border border-transparent",
          isGain ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        )}>
          {isGain ? '+' : ''}{percentChange.toFixed(1)}%
        </div>
      )}
      {isNeutral && (
        <div className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono min-w-14 text-center shadow-sm border border-slate-700/50 bg-slate-800/40 text-slate-500">
          0.0%
        </div>
      )}
    </div>
  )
}

// ─── Window-to-Window Comparison Panel ───────────────────────────────────────

const CATEGORY_REASONS: Record<string, { up: string; down: string }> = {
  Combat: { up: 'More fighting detected -> combat difficulty increased.', down: 'Less fighting detected -> combat difficulty eased.' },
  Collection: { up: 'More collecting detected -> item availability increased.', down: 'Less collecting detected -> item spawns reduced.' },
  Exploration: { up: 'More exploration detected -> movement rewards boosted.', down: 'Less exploration detected -> movement bonuses reduced.' },
};

function WindowComparison({
  currentCategories,
  previousCategories,
  currentMultiplier,
  previousMultiplier,
}: {
  currentCategories: BehaviorCategory[];
  previousCategories?: BehaviorCategory[];
  currentMultiplier?: number;
  previousMultiplier?: number;
}) {
  const { tutorialMode } = useTutorial();
  if (!previousCategories || previousCategories.length === 0) {
    return (
      <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-900/20 flex items-center gap-2 text-slate-500">
        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        <p className="text-[11px]">Run the simulation a second time to see a <span className="text-slate-400">window-to-window comparison</span> showing what changed and why.</p>
      </div>
    );
  }

  const multNow = currentMultiplier ?? 1.0;
  const multPrev = previousMultiplier ?? 1.0;
  const multDelta = multNow - multPrev;
  const multDeltaPct = Math.round(Math.abs(multDelta) * 100);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/40 flex items-center gap-2">
        <History className="w-3.5 h-3.5 text-slate-500" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">vs. Previous Window</p>
        <EducationalDrawer
          contentKey="how_deltas_work"
          trigger={<span className="ml-auto text-[10px] text-cyan-600 hover:text-cyan-400 cursor-pointer underline underline-offset-2 decoration-dotted">what is a delta?</span>}
        />
      </div>

      {/* Global multiplier delta */}
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-300 mb-0.5">Overall difficulty multiplier</p>
          <p className="text-[11px] text-slate-500">
            {Math.abs(multDelta) < 0.001
              ? 'No change from last window -- play style was consistent.'
              : multDelta > 0
                ? `Increased by ${multDeltaPct}% -- the AI is making the game harder this window.`
                : `Decreased by ${multDeltaPct}% -- the AI is easing difficulty this window.`}
          </p>
        </div>
        <MultiplierDeltaBadge prev={multPrev} curr={multNow} />
      </div>

      {/* Per-archetype deltas */}
      <div className="divide-y divide-slate-700/20">
        {currentCategories.map((cat) => {
          const prev = previousCategories.find(p => p.category === cat.category);
          const delta = prev ? cat.softMembership - prev.softMembership : 0;
          const absDelta = Math.abs(delta);
          const reason = CATEGORY_REASONS[cat.category];
          const label = absDelta < 0.01 ? 'No change' : delta > 0 ? reason?.up : reason?.down;

          return (
            <div key={cat.category} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn('text-xs font-bold',
                    cat.category === 'Combat' ? 'text-rose-400' :
                      cat.category === 'Collection' ? 'text-amber-400' : 'text-sky-400'
                  )}>{cat.category}</span>
                  <DeltaChip delta={delta} />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug truncate">{label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-600 font-mono">{prev ? (prev.softMembership * 100).toFixed(0) : '--'}% {"->"} {(cat.softMembership * 100).toFixed(0)}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delta -> Parameter cascade explainer -- tutorial only */}
      {tutorialMode && (
        <div className="px-4 py-4 border-t border-slate-700/30 bg-slate-900/20 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">How these deltas cascade to parameters</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Each archetype percentage feeds into a <span className="text-slate-300 font-medium">category factor</span> (a multiplier close to 1.0).
            The factor is computed as: <span className="font-mono text-cyan-400">factor = 1.0 + (globalMult − 1.0) x (0.5 + membership x 1.5)</span>.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            When that factor goes <span className="text-emerald-400">above 1.0</span>: parameters tied to that archetype get harder/more intense
            (e.g., more enemies, less items timeout). When it goes <span className="text-rose-400">below 1.0</span>: those parameters ease off.
            Some parameters scale directly (<span className="font-mono text-slate-300">base x factor</span>) and some inversely
            (<span className="font-mono text-slate-300">base / factor</span>) to balance challenge against player power.
          </p>
          <div className="grid grid-cols-1 gap-1.5 mt-2">
            <CascadeRow category="Combat ^" effect="enemy spawn v, enemy cap ^, enemy health ^, enemy damage ^, player health v, player damage v" color="text-rose-400" />
            <CascadeRow category="Collection ^" effect="collectible count ^, spawn interval v, collectible lifetime ^" color="text-amber-400" />
            <CascadeRow category="Exploration ^" effect="stamina regen ^, dash cooldown v" color="text-sky-400" />
          </div>
        </div>
      )}
    </div>
  );
}

function AdaptStepRow({ n, title, body, color }: { n: string; title: string; body: string; color: string }) {
  return (
    <li className="flex gap-3">
      <span className={`font-mono font-bold text-base leading-tight shrink-0 w-5 ${color}`}>{n}.</span>
      <div>
        <span className={`font-semibold ${color}`}>{title}. </span>
        <span className="text-slate-500">{body}</span>
      </div>
    </li>
  );
}

function CascadeRow({ category, effect, color }: { category: string; effect: string; color: string }) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className={`font-mono font-bold shrink-0 w-28 ${color}`}>{category}</span>
      <span className="text-slate-500">{effect}</span>
    </div>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  const abs = Math.abs(delta);
  if (abs < 0.01) return <span className="text-[10px] font-mono text-slate-600 bg-slate-800/40 px-1.5 rounded border border-slate-700/40">+/-0%</span>;
  const pct = Math.round(abs * 100);
  if (delta > 0) return (
    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
      <ArrowUp className="w-2.5 h-2.5" />+{pct}%
    </span>
  );
  return (
    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 rounded border border-rose-500/20 flex items-center gap-0.5">
      <ArrowDown className="w-2.5 h-2.5" />-{pct}%
    </span>
  );
}

function MultiplierDeltaBadge({ prev, curr }: { prev: number; curr: number }) {
  const delta = curr - prev;
  const abs = Math.abs(delta);
  if (abs < 0.001) return (
    <span className="text-xs font-mono text-slate-500 bg-slate-800/40 border border-slate-700/40 px-2 py-1 rounded-md whitespace-nowrap">= {curr.toFixed(3)}x</span>
  );
  if (delta > 0) return (
    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md whitespace-nowrap flex items-center gap-1">
      <ArrowUp className="w-3 h-3" />{curr.toFixed(3)}x
    </span>
  );
  return (
    <span className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md whitespace-nowrap flex items-center gap-1">
      <ArrowDown className="w-3 h-3" />{curr.toFixed(3)}x
    </span>
  );
}
