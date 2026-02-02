'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OFFLINE_METRICS } from '@/lib/analytics/compute';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { HelpfulTooltip } from '../shared/helpful-tooltip';

export function ComparativePanel() {
  const { 
    targetStd, targetSpan, testR2,
    originalStd, originalSpan, originalR2
  } = OFFLINE_METRICS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Comparative Evidence
          <HelpfulTooltip 
            title="A/B Comparison"
            description="Side-by-side performance audit of the 'Original' baseline system vs. the new 'Option B' deployment."
            interpretation="Green values indicate statistically significant improvements in signal quality."
          />
        </CardTitle>
        <CardDescription>
          Quantifiable improvements: Original Baseline vs. Option B
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[120px]">Metric</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Original</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground w-8"></th>
                <th className="h-10 px-4 text-left font-medium text-primary">Option B</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Gain</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-medium flex items-center gap-2">
                   <HelpfulTooltip 
                    trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Target Std Dev</span>}
                    title="Target Standard Deviation"
                    description="Measure of signal variance. Low std means the game feels 'flat' and unresponsive."
                    interpretation="Option B's 0.062 proves it creates a dynamic experience, unlike the flat 0.011 of the original."
                    calculation="std(target_signal)"
                   />
                </td>
                <td className="p-4 font-mono text-muted-foreground">{originalStd.toFixed(4)}</td>
                <td className="p-4 text-muted-foreground"><ArrowRight className="h-4 w-4" /></td>
                <td className="p-4 font-mono font-bold text-primary">{targetStd.toFixed(4)}</td>
                <td className="p-4 text-right text-green-600 font-mono">+453%</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium flex items-center gap-2">
                   <HelpfulTooltip 
                    trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Target Span</span>}
                    title="Effective Signal Span"
                    description="The difference between the maximum and minimum difficulty multipliers generated."
                    interpretation="A huge 1711% increase means the AI can now make the game significantly harder OR easier, not just slightly tweak it."
                    calculation="max(target) - min(target)"
                   />
                </td>
                <td className="p-4 font-mono text-muted-foreground">{originalSpan.toFixed(3)}</td>
                <td className="p-4 text-muted-foreground"><ArrowRight className="h-4 w-4" /></td>
                <td className="p-4 font-mono font-bold text-primary">{targetSpan.toFixed(3)}</td>
                <td className="p-4 text-right text-green-600 font-mono">+1711%</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium flex items-center gap-2">
                  <HelpfulTooltip 
                    trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Test R² Score</span>}
                    title="Model Fit Accuracy"
                    description="The ability of the ANFIS model to replicate the target logic."
                    interpretation="Option B maintains professional-grade accuracy (>0.95) despite the vastly more complex target curve."
                    calculation="1 - (SSR / SST)"
                   />
                </td>
                <td className="p-4 font-mono text-red-500">{originalR2.toFixed(2)}</td>
                <td className="p-4 text-muted-foreground"><ArrowRight className="h-4 w-4" /></td>
                <td className="p-4 font-mono font-bold text-primary">{testR2.toFixed(3)}</td>
                <td className="p-4 text-right">
                  <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs bg-green-950/10 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Solved
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium flex items-center gap-2">
                  <HelpfulTooltip 
                    trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Clamp Saturation</span>}
                    title="Safety Clamp Usage"
                    description="Percentage of time the model hits the hard safety limits."
                    interpretation="0% means Option B is naturally safe and stable, whereas the original system failed 100% of the time (hitting the limits)."
                    calculation="count(clamped_outputs) / total_outputs"
                   />
                </td>
                <td className="p-4 font-mono text-red-500">100%</td>
                <td className="p-4 text-muted-foreground"><ArrowRight className="h-4 w-4" /></td>
                <td className="p-4 font-mono font-bold text-primary">0%</td>
                <td className="p-4 text-right">
                   <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs bg-green-950/10 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Safe
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
