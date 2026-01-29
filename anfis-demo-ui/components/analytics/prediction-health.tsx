'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { TRAINING_DISTRIBUTION } from '@/lib/analytics/compute';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HelpfulTooltip } from './helpful-tooltip';

interface PredictionHealthProps {
  currentRound: RoundAnalytics | null;
  session: SessionAnalytics | null;
}

export function PredictionHealth({ currentRound, session }: PredictionHealthProps) {
  if (!currentRound || !session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Health</CardTitle>
          <CardDescription>Waiting for pipeline data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { targetMultiplier } = currentRound;
  const { mean, std, min, max } = TRAINING_DISTRIBUTION;
  const upperBand = mean + (std * 2);
  const lowerBand = mean - (std * 2);
  
  // Determine consistency status
  const isConsistent = targetMultiplier >= lowerBand && targetMultiplier <= upperBand;
  const isOOD = targetMultiplier < min || targetMultiplier > max;

  const getStabilityColor = (val: number) => {
    if (Math.abs(val - mean) < std) return 'text-green-500';
    if (Math.abs(val - mean) < std * 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <HelpfulTooltip 
                trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Prediction Distribution Consistency</span>}
                title="Distribution Check"
                description="Verifies if the current prediction falls within the statistical envelope of the original training data."
                interpretation="Consistent (Green) means the model is operating exactly as it was trained. Out-of-Distribution (Red) implies novel unstable behavior."
              />
            </CardTitle>
          </div>
          {isOOD ? (
             <Badge variant="destructive" className="flex gap-1 items-center">
               <AlertTriangle className="h-3 w-3" /> Out of Distribution
             </Badge>
          ) : isConsistent ? (
             <Badge variant="outline" className="text-green-400 border-green-900 bg-green-950/20 flex gap-1 items-center">
               <CheckCircle2 className="h-3 w-3" /> Consistent
             </Badge>
          ) : (
             <Badge variant="outline" className="text-yellow-400 border-yellow-900 bg-yellow-950/20 flex gap-1 items-center">
               <Activity className="h-3 w-3" /> Edge Behavior
             </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
           <HelpfulTooltip
             trigger={
               <span className={`text-2xl font-bold font-mono ${getStabilityColor(targetMultiplier)} cursor-pointer hover:underline decoration-dotted underline-offset-4`}>
                 {targetMultiplier.toFixed(4)}
               </span>
             }
             title="Current Difficulty Multiplier (Output)"
             description="The final value computed by the ANFIS pipeline that adjusts the game difficulty."
             calculation="Output = Multiplier_Combat(x) * Multiplier_Collect(y) * Multiplier_Explore(z) * Bias"
             interpretation="1.0 is the baseline. Values > 1.0 increase difficulty (more enemies, faster speeds). Values < 1.0 decrease difficulty."
           />
           <span className="text-xs text-muted-foreground flex items-center gap-1">
              <HelpfulTooltip
                trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Multiplier (Expected)</span>}
                title="Multiplier Target"
                description="The exact difficulty level the AI wants to set based on your gameplay."
              />
           </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={session.history.slice(-50)}>
              <defs>
                <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="roundNumber" hide />
              <YAxis domain={[0.4, 1.6]} hide />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                itemStyle={{ color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              
              {/* Training Distribution Bands */}
              <ReferenceLine y={mean} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Train μ', fill: '#10b981', fontSize: 10 }} />
              <ReferenceLine y={upperBand} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '+2σ', fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine y={lowerBand} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '-2σ', fill: '#f59e0b', fontSize: 10 }} />
              
              <Area 
                type="monotone" 
                dataKey="targetMultiplier" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorM)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-4 border-t border-slate-800">
           <div className="flex items-center gap-2">
             <div className="w-2 h-0.5 bg-green-500"></div>
             <HelpfulTooltip 
               trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Training Mean ({mean.toFixed(2)})</span>}
               title="Training Distribution Mean (μ)" 
               description="The average difficulty multiplier observed during the supervised training phase." 
               calculation="μ = Σ(x) / N"
             />
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-0.5 bg-amber-500 border-dashed border-t"></div>
             <HelpfulTooltip 
               trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Distribution Bands (±2σ)</span>}
               title="Standard Deviation Bands (σ)" 
               description="Statistical boundaries covering 95% of expected values." 
               calculation="Range = [μ - 2σ, μ + 2σ]"
               interpretation="Values outside these bands are statistically rare and may indicate the model is encountering unseen player behavior."
             />
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
