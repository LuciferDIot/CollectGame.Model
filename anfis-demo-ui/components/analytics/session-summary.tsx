'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SessionAnalytics } from '@/lib/analytics';
import { Activity, Brain, Calculator, TrendingUp } from 'lucide-react';
import { HelpfulTooltip } from './helpful-tooltip';

interface SessionSummaryProps {
  session: SessionAnalytics | null;
}

export function SessionSummary({ session }: SessionSummaryProps) {
  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
          <CardDescription>Waiting for session data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { avgMultiplier, stdMultiplier, dominantArchetypeDistribution } = session;

  // Find dominant archetype
  const dominant = Object.entries(dominantArchetypeDistribution).reduce((a, b) => 
    a[1] > b[1] ? a : b
  );
  
  const dominantName = dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1);
  const dominantPct = dominant[1].toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Session Summary
          <HelpfulTooltip 
            title="Session Aggregates" 
            description="Key statistics averaged over the entire gameplay session." 
          />
        </CardTitle>
        <CardDescription>Aggregate statistics and overall health</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="flex flex-col space-y-1.5 p-3 bg-slate-900/40 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
               <Calculator className="h-3.5 w-3.5" />
               <span>Avg Multiplier</span>
               <HelpfulTooltip 
                 title="Average Difficulty (Session)" 
                 description="The mean difficulty multiplier applied across the entire game session so far." 
                 calculation="SUM(all_multipliers) / count(rounds)"
                 interpretation="If this is >> 1.0, the game is generally too hard for you. If << 1.0, it's too easy."
               />
             </div>
             <HelpfulTooltip
               trigger={<span className="text-2xl font-bold font-mono cursor-pointer hover:underline block">{avgMultiplier.toFixed(3)}x</span>}
               title="Mean Multiplier Value"
               description="The exact average of every difficulty decision made by the AI."
               calculation="Arithmetic Mean (μ)"
             />
             <p className="text-[10px] text-green-500">Target: 1.0</p>
          </div>

          <div className="flex flex-col space-y-1.5 p-3 bg-slate-900/40 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
               <Activity className="h-3.5 w-3.5" />
               <span>Variance (σ)</span>
                <HelpfulTooltip 
                  title="Adaptation Variance (Standard Deviation)" 
                  description="Standard deviation of the multiplier history. Measures how dynamic the difficulty is." 
                  calculation="SQRT( SUM( (x - μ)² ) / N )"
                  interpretation="High variance means the AI is actively searching for your skill ceiling. Low variance implies a stable but potentially boring experience."
                />
             </div>
             <HelpfulTooltip
               trigger={<span className="text-2xl font-bold font-mono text-blue-300 cursor-pointer hover:underline block">{stdMultiplier.toFixed(3)}</span>}
               title="Variance Value"
               description="The statistical spread of difficulty adjustments."
               calculation="Standard Deviation (σ)"
             />
             <p className="text-[10px] text-blue-400">Target: &gt; 0.05</p>
          </div>

          <div className="flex flex-col space-y-1.5 p-3 bg-slate-900/40 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
               <Brain className="h-3.5 w-3.5" />
               <span>Dominant Style</span>
               <HelpfulTooltip title="Dominant Archetype" description="The player style most frequently detected during the session." />
             </div>
             <div className="text-xl font-bold">{dominantName}</div>
             <p className="text-[10px] text-slate-400">{dominantPct}% of rounds</p>
          </div>

          <div className="flex flex-col space-y-1.5 p-3 bg-slate-900/40 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
               <TrendingUp className="h-3.5 w-3.5" />
               <span>Stability</span>
               <HelpfulTooltip title="Overall Stability" description="General health check of the adaptive loop." />
             </div>
             <div className="text-xl font-bold text-emerald-400">Optimal</div>
             <p className="text-[10px] text-emerald-600">No oscillation</p>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
