'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { METRIC_EXPLANATIONS } from '@/lib/analytics/educational-content';
import { useTutorial } from '@/lib/analytics/tutorial-context';
import { cn } from '@/lib/utils';
import { BookOpen, Calculator, Eye, FlaskConical, Lightbulb, Wrench } from 'lucide-react';

interface MetricDetailModalProps {
  metricKey: string;
  isOpen: boolean;
  onClose: () => void;
  currentValue?: string | number | null;
  status?: 'success' | 'warning' | 'error' | 'neutral';
}

export function MetricDetailModal({
  metricKey,
  isOpen,
  onClose,
  currentValue,
  status = 'neutral',
}: MetricDetailModalProps) {
  const { tutorialMode } = useTutorial();
  const content = METRIC_EXPLANATIONS[metricKey];
  if (!tutorialMode || !content) return null;

  // Only show live value if it's a meaningful data value (not a placeholder string)
  const meaninglessValues = ['Dynamic', 'Active', 'Definition', 'Info'];
  const showLiveValue =
    currentValue !== undefined &&
    currentValue !== null &&
    !meaninglessValues.includes(String(currentValue));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[480px] sm:w-[560px] p-0 bg-[#0b0d14]/98 backdrop-blur-xl border-l border-cyan-900/40 text-slate-200 overflow-hidden flex flex-col"
      >
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-slate-800/60 bg-slate-900/40 shrink-0 relative z-10">
          <SheetHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/20 shrink-0 mt-0.5">
                <Calculator className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base font-bold text-slate-100 tracking-tight leading-snug pr-8">
                  {content.title}
                </SheetTitle>
                <SheetDescription className="text-[10px] font-mono text-slate-600 mt-0.5 uppercase tracking-widest">
                  {metricKey}
                </SheetDescription>
              </div>
            </div>

            {/* Live value badge */}
            {showLiveValue && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/40">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Live value</span>
                <div className={cn(
                  'text-xl font-mono font-bold px-3 py-1 rounded-lg border',
                  status === 'success' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' :
                  status === 'warning' ? 'bg-amber-950/40  text-amber-400  border-amber-500/30'  :
                  status === 'error'   ? 'bg-rose-950/40   text-rose-400   border-rose-500/30'   :
                                        'bg-slate-800/40  text-slate-200   border-slate-700/50'
                )}>
                  {currentValue}
                </div>
              </div>
            )}
          </SheetHeader>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto relative z-10 divide-y divide-slate-800/40">

          {/* A — What is this */}
          <section className="px-6 py-5 space-y-2">
            <SectionLabel icon={<BookOpen className="w-3.5 h-3.5" />} label="What is this?" color="text-slate-400" />
            <p className="text-sm text-slate-300 leading-relaxed">{content.what}</p>
          </section>

          {/* B — Why it matters */}
          <section className="px-6 py-5 space-y-2">
            <SectionLabel icon={<Lightbulb className="w-3.5 h-3.5" />} label="Why it matters" color="text-amber-500" />
            <p className="text-sm text-amber-100/80 bg-amber-950/10 p-4 rounded-lg border-l-2 border-amber-500/40 leading-relaxed">
              {content.why}
            </p>
          </section>

          {/* C — How it's computed */}
          <section className="px-6 py-5 space-y-2">
            <SectionLabel icon={<Calculator className="w-3.5 h-3.5" />} label="How it's computed" color="text-cyan-500" />
            <pre className="text-xs text-cyan-300 font-mono bg-cyan-950/20 p-4 rounded-lg border border-cyan-900/30 whitespace-pre-wrap wrap-break-word leading-relaxed">
              {content.computed}
            </pre>
          </section>

          {/* D — How to read it */}
          <section className="px-6 py-5 space-y-2">
            <SectionLabel icon={<Eye className="w-3.5 h-3.5" />} label="How to read it" color="text-emerald-500" />
            <pre className="text-xs text-emerald-200/80 bg-emerald-950/10 p-4 rounded-lg border border-emerald-900/20 whitespace-pre-wrap wrap-break-word leading-relaxed italic">
              {content.reading}
            </pre>
          </section>

          {/* E — Design decisions (only shown when present) */}
          {content.designDecisions && (
            <section className="px-6 py-5 space-y-3">
              <SectionLabel icon={<Wrench className="w-3.5 h-3.5" />} label="Design decisions" color="text-violet-400" />
              <p className="text-[10px] text-slate-600 italic">
                Why this approach was chosen over alternatives
              </p>
              <DesignDecisionsList text={content.designDecisions} />
            </section>
          )}

          <div className="h-8" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <h4 className={cn('flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]', color)}>
      {icon}
      {label}
    </h4>
  );
}

function DesignDecisionsList({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const [firstLine, ...rest] = block.split('\n');
        return (
          <div key={i} className="rounded-lg border border-violet-800/30 bg-violet-950/10 overflow-hidden">
            <div className="flex items-start gap-2 px-4 py-3 border-b border-violet-800/20">
              <FlaskConical className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-violet-300 leading-snug">{firstLine}</p>
            </div>
            {rest.length > 0 && (
              <p className="px-4 py-3 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                {rest.join('\n')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
