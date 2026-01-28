'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { ClampMonitor } from '../../analytics/clamp-monitor';
import { ComparativePanel } from '../../analytics/comparative-panel';
import { FeatureContribution } from '../../analytics/feature-contribution';
import { ModelEvaluationCard } from '../../analytics/model-evaluation-card';
import { PredictionHealth } from '../../analytics/prediction-health';
import { ResponsivenessIndicator } from '../../analytics/responsiveness-indicator';
import { SessionSummary } from '../../analytics/session-summary';

interface AnalyticsTabProps {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
}

export function AnalyticsTab({ session, currentRound }: AnalyticsTabProps) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-6 space-y-8 w-full max-w-[1600px] mx-auto pb-20">
        
        {/* SECTION 1: OFFLINE TRUST ANCHOR */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-1 bg-blue-500 rounded-full" />
             <div>
               <h3 className="text-sm font-bold text-blue-100 uppercase tracking-widest">
                 Section 1: Model Evaluation
               </h3>
               <p className="text-xs text-blue-400/70">
                 Offline Validation (Held-out Test Set) • <span className="text-blue-300">Static Audit</span>
               </p>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModelEvaluationCard />
            <ComparativePanel />
          </div>
        </div>

        <Separator className="bg-slate-800/60" />

        {/* SECTION 2 & 3: ONLINE RUNTIME VALIDITY */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="h-8 w-1 bg-emerald-500 rounded-full" />
             <div>
               <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-widest">
                 Section 2: Runtime Consistency
               </h3>
               <p className="text-xs text-emerald-400/70">
                 Online Behavioral Checks • <span className="text-emerald-300">Dynamic Monitoring</span>
               </p>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
             {/* Prediction Health takes 7 cols */}
             <div className="lg:col-span-7">
                <PredictionHealth currentRound={currentRound} session={session} />
             </div>
             {/* Clamp & Responsiveness take 5 cols stacked */}
             <div className="lg:col-span-5 space-y-6">
                <ClampMonitor currentRound={currentRound} session={session} />
                <ResponsivenessIndicator currentRound={currentRound} session={session} />
             </div>
          </div>
        </div>

        <Separator className="bg-slate-800/60" />

        {/* SECTION 4: INTERPRETABILITY & SUMMARY */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="h-8 w-1 bg-amber-500 rounded-full" />
             <div>
               <h3 className="text-sm font-bold text-amber-100 uppercase tracking-widest">
                 Section 3: Logic & Attribution
               </h3>
               <p className="text-xs text-amber-400/70">
                 Explainability & Aggregates • <span className="text-amber-300">Inference Inspection</span>
               </p>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <FeatureContribution currentRound={currentRound} session={session} />
             <SessionSummary session={session} />
          </div>
        </div>
        
        <div className="flex justify-center pt-8 opacity-50">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            ANFIS v2.2 Option B • Hash: 7a9f2c • Validated 2026-01-28
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
