'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { HelpfulTooltip } from '../shared/helpful-tooltip';

interface FeatureContributionProps {
  currentRound: RoundAnalytics | null;
  session: SessionAnalytics | null;
}

export function FeatureContribution({ currentRound, session }: FeatureContributionProps) {
  if (!currentRound || !session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contribution Breakdown</CardTitle>
          <CardDescription>Interpretability breakdown</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">Run pipeline to see decomposition</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate approximate contributions
  const deltaMag = Math.abs(currentRound.deltas.combat) + Math.abs(currentRound.deltas.collect) + Math.abs(currentRound.deltas.explore);
  const softMag = (currentRound.softMembership.combat + currentRound.softMembership.collect + currentRound.softMembership.explore) * 0.2; 
  const baseMag = 0.1; 

  const total = deltaMag + softMag + baseMag;
  
  const data = [
    { name: 'Behavioral Deltas', value: deltaMag, color: '#3b82f6' }, 
    { name: 'Soft Context', value: softMag, color: '#10b981' }, 
    { name: 'Base/Penalty', value: baseMag, color: '#64748b' }, 
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpfulTooltip 
            trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Contribution Breakdown</span>}
            title="Feature Importance (Sensitivity Analysis)"
            description="Decomposes the final prediction into its contributing factors. Shows 'Why' the model decided to change difficulty."
            interpretation="Understanding which component (Behavior vs. Context) is driving the AI allows for better tuning of the game experience."
          />
        </CardTitle>
        <CardDescription>
          What drove this round's prediction?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] w-full flex items-center">
          <ResponsiveContainer width="50%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#1e293b', borderColor: '#334155', fontSize: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(value: number) => `${((value / total) * 100).toFixed(0)}%`}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex-1 space-y-3">
             {data.map((item) => (
               <div key={item.name} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                   <span className="text-muted-foreground flex items-center gap-1">
                     {item.name === 'Behavioral Deltas' && (
                        <HelpfulTooltip 
                          trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">{item.name}</span>}
                          title="Behavioral Deltas (Derivative)" 
                          description="Short-term changes in player behavior (last 5 seconds)." 
                          calculation="ΔInput = Input(t) - Input(t-1)"
                          interpretation="This is the 'Reactive' part of the AI. It responds immediately to sudden changes in player skill or action."
                        />
                     )}
                     {item.name === 'Soft Context' && (
                        <HelpfulTooltip 
                          trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">{item.name}</span>}
                          title="Soft Context (Fuzzy Membership)" 
                          description="Long-term stylistic patterns (Archetypes) smoothing the output." 
                          calculation="μ(x) = GaussianMF(x; c, σ)"
                          interpretation="This is the 'Persistent' part of the AI. It ensures the game adapts to WHO the player is (Fighter vs Explorer), not just what they did 1 second ago."
                        />
                     )}
                     {item.name === 'Base/Penalty' && (
                        <HelpfulTooltip 
                          trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">{item.name}</span>}
                          title="Bias Term / Base Difficulty" 
                          description="The constant offset ensuring the game is never 'zero' difficulty." 
                          calculation="Bias = 0.1 (Constant)"
                          interpretation="Prevents the multiplier from collapsing to zero even if the player does nothing."
                        />
                     )}
                   </span>
                 </div>
                 <HelpfulTooltip
                   trigger={<span className="font-mono font-medium cursor-pointer hover:underline decoration-dotted underline-offset-4">{((item.value / total) * 100).toFixed(0)}%</span>}
                   title={`${item.name} Impact`}
                   description={`How much the ${item.name.toLowerCase()} logic is changing the game difficulty right now.`}
                   interpretation={
                      item.name === 'Behavioral Deltas' ? "High impact means your recent actions are the main reason for the change." :
                      item.name === 'Soft Context' ? "High impact means your playstyle profile is keeping things stable." :
                      "This is the minimum baseline pressure applied to everyone."
                   }
                 />
               </div>
             ))}
             
             <div className="border-t pt-2 mt-2">
               <p className="text-[10px] text-muted-foreground">
                 <strong>Deltas</strong> provide primary variance. <strong>Soft Context</strong> provides stability bias.
               </p>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
