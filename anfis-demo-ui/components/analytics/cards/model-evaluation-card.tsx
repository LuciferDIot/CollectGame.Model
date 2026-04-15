'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OFFLINE_METRICS } from '@/lib/analytics/compute';
import { BarChart3, Lock, ShieldCheck } from 'lucide-react';
import { HelpfulTooltip } from '../shared/helpful-tooltip';

export function ModelEvaluationCard() {
  const { trainR2, testR2, mae, targetStd, targetSpan } = OFFLINE_METRICS;

  return (
    <Card className="border-blue-700/50 bg-blue-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-400" />
            <CardTitle>
              <HelpfulTooltip 
                trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Model Evaluation (Offline)</span>}
                title="Supervised Learning Validation"
                description="Metrics calculated on a held-out test set (unseen data) after training. These values validate the model's theoretical capability."
                interpretation="We froze 20% of the player data (Test Set) and asked the model to predict it. High R^2 confirms it learned general rules, not just memorized the training data."
              />
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-blue-400 bg-blue-950/30 border-blue-800">
            Validated Truth
          </Badge>
        </div>
        <CardDescription>
          Static validation metrics from model training phase. These values are fixed and prove the base model quality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Predictive Accuracy */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <HelpfulTooltip 
                trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Test R^2 Score</span>}
                title="Coefficient of Determination (R^2)"
                description="Measures how well the model replicates the teacher's variance. 1.0 is perfect, 0.0 is random."
                calculation="R^2 = 1 - (SS_res / SS_tot)"
                interpretation="0.956 means the model captures 95.6% of the target's behavior logic."
              />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-400">{testR2.toFixed(4)}</p>
            <p className="text-xs text-emerald-600/80">Excellent fit (Train: {trainR2.toFixed(4)})</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
               <HelpfulTooltip 
                trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Mean Abs Error</span>}
                title="Mean Absolute Error (MAE)"
                description="The average positive difference between predicted and actual values."
                calculation="MAE = Σ|y_pred - y_true| / n"
                interpretation="On average, the prediction deviates by only 0.013 from the target value."
              />
            </div>
            <p className="text-2xl font-bold font-mono text-blue-300">{mae.toFixed(4)}</p>
            <p className="text-xs text-blue-400/70">Low prediction error</p>
          </div>
        </div>

        <div className="space-y-1 border-t border-blue-800/30 pt-4">
           <div className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
             <HelpfulTooltip 
                trigger={<span>Target Signal Integrity</span>}
                title="Target Integrity"
                description="Measures the dynamic range and variability of the training target. A flat target (low std) learns nothing."
                interpretation="High variance proves 'Option B' solved the signal collapse issue."
              />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800">
               <div className="flex justify-between text-xs mb-1">
                 <span className="text-slate-400 flex items-center gap-1">
                   <HelpfulTooltip 
                    trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Target Std Dev</span>}
                    title="Target Standard Deviation" 
                    description="Spread of the target values."
                    interpretation="0.062 indicates a healthy, dynamic signal, unlike the original 0.011."
                    calculation="std(target_signal)"
                   />
                 </span>
                 <span className="font-mono text-slate-200">{targetStd.toFixed(4)}</span>
               </div>
               <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500" style={{ width: '80%' }} />
               </div>
               <span className="text-[10px] text-green-400 block mt-1">5.5x variance gain</span>
             </div>
             
             <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800">
               <div className="flex justify-between text-xs mb-1">
                 <span className="text-slate-400 flex items-center gap-1">
                    <HelpfulTooltip 
                      trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Target Range</span>}
                      title="Target Span (Max - Min)" 
                      description="The full operating width of the difficulty signal."
                      interpretation="0.41 span allows for deep corrections, compared to the trivial 0.02 of the original."
                      calculation="max(target) - min(target)"
                    />
                 </span>
                 <span className="font-mono text-slate-200">{targetSpan.toFixed(2)}</span>
               </div>
               <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500" style={{ width: '70%' }} />
               </div>
               <span className="text-[10px] text-green-400 block mt-1">18x span gain</span>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
