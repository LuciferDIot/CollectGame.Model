'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Archetype, RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { calculateCounterfactuals } from '@/lib/analytics/counterfactuals';
import { ARCHETYPE_DEFINITIONS, ARCHETYPE_ID_MAP } from '@/lib/config/models';
import { Activity, BarChart3, Binary, Cpu, HelpCircle, Layers } from 'lucide-react';
import { EducationalDrawer } from '../shared/educational-drawer';
import { HelpfulTooltip } from '../shared/helpful-tooltip';
import { ArchetypeStat } from './archetype-stat';
import { CounterfactualDisplay } from './counterfactual-display';
import { MembershipValidation } from './membership-validation';

interface MembershipDiagnosticsProps {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
}

// Colors derived from config
const archetypeBarColors = {
  combat: 'bg-red-500',
  collect: 'bg-cyan-500',
  explore: 'bg-emerald-500', 
};

export function MembershipDiagnostics({ session, currentRound }: MembershipDiagnosticsProps) {
  if (!session || !currentRound) {
    return <DiagnosticsEmptyState />;
  }

  const { softMembership, membershipSum, dominantArchetype } = currentRound;
  const { dominantArchetypeDistribution } = session;
  const cf = calculateCounterfactuals(currentRound);

  return (
    <Card className="bg-card border-border/60 backdrop-blur-sm shadow-lg overflow-hidden relative">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-primary/40 to-transparent opacity-50" />
      
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
            <Binary className="w-4 h-4 text-primary" />
            <span>
                Fuzzy Diagnostics
            </span>
            </CardTitle>
            <HelpfulTooltip 
                trigger={<div className="p-1.5 rounded-md hover:bg-muted/60 transition-colors cursor-help"><Cpu className="w-3.5 h-3.5 text-muted-foreground" /></div>}
                title="Soft Membership (Fuzzification)"
                description="The degree to which the player currently fits into each Archetype (0.0 to 1.0). Unlike hard clustering, this is fuzzy and continuous."
                interpretation="Option B uses this for 'Contextual Bias'--smoothing the output but not driving the main variance."
            />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        
        {/* Validation & Status */}
        <div className="grid grid-cols-2 gap-3">
             <MembershipValidation sum={membershipSum} />
             <div className="flex items-center justify-between p-2.5 rounded-md border border-border bg-muted/40">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    Classification
                </span>
                <span className="text-xs font-mono text-primary">
                    FCM-IDW
                </span>
             </div>
        </div>

        {/* Current Round Visual */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3 h-3 text-muted-foreground/60" />
                    Current Vector
                </h4>
                <div className="text-[10px] font-mono text-muted-foreground/60">t_curr</div>
            </div>
            
            <div className="relative h-6 bg-muted/60 rounded-sm overflow-hidden flex border border-border/50">
                 {/* Stacked Bar - Dynamic */}
                 {ARCHETYPE_DEFINITIONS.map((def) => {
                    const key = ARCHETYPE_ID_MAP[def.name];
                    const pct = softMembership[key];
                    const colorClass = archetypeBarColors[key]; 
                    
                    return (
                        <div 
                            key={key}
                            className={`h-full ${colorClass}/80 hover:${colorClass} transition-colors flex items-center justify-center relative group`} 
                            style={{ width: `${pct * 100}%` }}
                        >

                        </div>
                    );
                 })}
            </div>

            {/* Micro Legends - Dynamic */}
            <div className="grid grid-cols-3 gap-2">
                {ARCHETYPE_DEFINITIONS.map((def) => {
                     const key = ARCHETYPE_ID_MAP[def.name];
                     return (
                        <ArchetypeStat 
                            key={key} 
                            type={key} 
                            pct={softMembership[key]} 
                            isDominant={dominantArchetype === key} 
                        />
                     );
                })}
            </div>
        </div>

        {/* Counterfactuals (Tech View) */}
        <CounterfactualDisplay result={cf} />

        {/* Session Stats (Mini) */}
        <div className="pt-2 border-t border-border/50">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-muted-foreground/60" />
                        Session Inertia
                    </h4>
                    <EducationalDrawer 
                        contentKey="session_inertia"
                        trigger={
                            <div className="p-1 rounded hover:bg-muted/60 cursor-pointer group/icon">
                                <HelpCircle className="w-3 h-3 text-muted-foreground/40 group-hover/icon:text-primary transition-colors" />
                            </div>
                        }
                    />
                </div>
             </div>
             <div className="space-y-1.5">
                {(Object.entries(dominantArchetypeDistribution) as [Archetype, number][]).map(([type, pct]) => (
                    <div key={type} className="flex items-center gap-3 group">
                        <div className={`w-1.5 h-1.5 rounded-full ${archetypeBarColors[type]} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${archetypeBarColors[type]} opacity-70`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/60 w-8 text-right group-hover:text-foreground transition-colors">{pct.toFixed(0)}%</span>
                    </div>
                ))}
             </div>
        </div>

      </CardContent>
    </Card>
  );
}

function DiagnosticsEmptyState() {
  return (
    <Card className="bg-card border-border/60 backdrop-blur-sm h-full flex flex-col justify-center items-center text-center p-6 border-dashed">
      <div className="p-3 bg-muted/50 rounded-full mb-3">
        <Binary className="w-5 h-5 text-muted-foreground/40" />
      </div>
      <h3 className="text-sm font-semibold text-foreground/70 mb-1">No Telemetry</h3>
      <p className="text-xs text-muted-foreground/50 max-w-[150px]">Waiting for simulation stream...</p>
    </Card>
  );
}
