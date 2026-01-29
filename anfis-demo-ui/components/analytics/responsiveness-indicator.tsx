'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { Activity, AlertCircle, Zap } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { HelpfulTooltip } from './helpful-tooltip';

interface ResponsivenessIndicatorProps {
  currentRound: RoundAnalytics | null;
  session: SessionAnalytics | null;
}

export function ResponsivenessIndicator({ currentRound, session }: ResponsivenessIndicatorProps) {
  if (!currentRound || !session) {
    return (
      <Card>
        <CardHeader>
           <CardTitle>Responsiveness Accuracy</CardTitle>
           <CardDescription>Waiting for data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Use the new rigorous correlation metric
  const correlation = session.responsivenessCorrelation;
  
  // Interpretation
  let status = 'Weak';
  let color = 'text-red-500';
  let bg = 'bg-red-500/10';
  let borderColor = 'border-red-500/20';
  let Icon = AlertCircle;

  if (correlation >= 0.6) {
    status = 'Strong';
    color = 'text-emerald-500';
    bg = 'bg-emerald-500/10';
    borderColor = 'border-emerald-500/20';
    Icon = Zap;
  } else if (correlation >= 0.3) {
    status = 'Moderate';
    color = 'text-amber-500';
    bg = 'bg-amber-500/10';
    borderColor = 'border-amber-500/20';
    Icon = Activity;
  }

  // Visualization data: recent deltas
  const data = session.history.slice(-20).map(r => ({
    round: r.roundNumber,
    behavior: Math.abs(r.deltas.combat) + Math.abs(r.deltas.collect) + Math.abs(r.deltas.explore),
    multiplier: r.deltaFromPrevious ? Math.abs(r.deltaFromPrevious) * 5 : 0 // Scale for visibility
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <HelpfulTooltip 
                trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Behavior-Response Alignment</span>}
                title="Responsiveness"
                description="Measures the statistical correlation between 'Player Action Intensity' (inputs) and 'Difficulty Adjustment' (outputs)."
                interpretation="A high value (>0.6) proves the model is actively 'listening' to the player, not just drifting randomly."
                calculation="Pearson_Correlation(Input_History, Output_History)"
              />
            </CardTitle>
          </div>
          <Badge variant="outline" className={`${color} ${bg} ${borderColor} flex gap-1 items-center`}>
            <Icon className="h-3 w-3" /> {status}
          </Badge>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-2xl font-bold font-mono ${color}`}>
            {correlation.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
             Rolling Correlation (Pearson)
             <HelpfulTooltip 
               title="Pearson Correlation Coefficient"
               formula="r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)²Σ(y - ȳ)²)"
               description="Calculated over a rolling widow of the last 20 rounds."
             />
          </span>
        </div>
        <CardDescription className="text-xs">
          Measures how accurately output changes ($\Delta M$) map to input changes ($\Delta B$).
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="h-[100px] w-full mt-2">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data}>
               <Tooltip 
                 cursor={{fill: 'rgba(255,255,255,0.05)'}}
                 contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                 labelStyle={{ display: 'none' }}
               />
               <Bar dataKey="behavior" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Δ Behavior" />
               <Bar dataKey="multiplier" fill="#10b981" radius={[2, 2, 0, 0]} name="Δ Multiplier (scaled)" />
             </BarChart>
           </ResponsiveContainer>
         </div>
         <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
           <div className="flex items-center gap-1">
             <div className="w-2 h-2 bg-blue-500 rounded-sm"></div> Behavior Change
           </div>
           <div className="flex items-center gap-1">
             <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Response Magnitude
           </div>
         </div>
      </CardContent>
    </Card>
  );
}
