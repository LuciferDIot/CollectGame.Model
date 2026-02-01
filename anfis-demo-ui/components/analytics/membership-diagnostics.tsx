'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Archetype, RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { calculateCounterfactuals, CounterfactualResult } from '@/lib/analytics/counterfactuals';
import { Activity, ArrowRight, BarChart3, Binary, Compass, Cpu, HelpCircle, Layers, Package, Swords, Zap } from 'lucide-react';
import { EducationalDrawer } from './educational-drawer';
import { HelpfulTooltip } from './helpful-tooltip';

interface MembershipDiagnosticsProps {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
}

const archetypeIcons: Record<Archetype, React.ReactNode> = {
  combat: <Swords className="h-3.5 w-3.5" />,
  collect: <Package className="h-3.5 w-3.5" />,
  explore: <Compass className="h-3.5 w-3.5" />,
};

const archetypeColors: Record<Archetype, string> = {
  combat: 'text-red-400 bg-red-500/10 border-red-500/20',
  collect: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  explore: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const archetypeBarColors: Record<Archetype, string> = {
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
    <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-sm shadow-xl overflow-hidden relative">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
      
      <CardHeader className="pb-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-100">
            <Binary className="w-4 h-4 text-cyan-400" />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-slate-100 to-slate-400">
                Fuzzy Diagnostics
            </span>
            </CardTitle>
            <HelpfulTooltip 
                trigger={<div className="p-1.5 rounded-md hover:bg-slate-800/50 transition-colors cursor-help"><Cpu className="w-3.5 h-3.5 text-slate-500" /></div>}
                title="Soft Membership (Fuzzification)"
                description="The degree to which the player currently fits into each Archetype (0.0 to 1.0). Unlike hard clustering, this is fuzzy and continuous."
                interpretation="Option B uses this for 'Contextual Bias'—smoothing the output but not driving the main variance."
            />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        
        {/* Validation & Status */}
        <div className="grid grid-cols-2 gap-3">
             <MembershipValidation membershipSum={membershipSum} />
             <div className="flex items-center justify-between p-2.5 rounded-md border border-slate-800 bg-slate-900/40">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    Classification
                </span>
                <span className="text-xs font-mono text-cyan-300">
                    FCM-IDW
                </span>
             </div>
        </div>

        {/* Current Round Visual */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3 h-3 text-slate-500" />
                    Current Vector
                </h4>
                <div className="text-[10px] font-mono text-slate-500">t_curr</div>
            </div>
            
            <div className="relative h-6 bg-slate-900/60 rounded-sm overflow-hidden flex border border-slate-800/50">
                 {/* Stacked Bar */}
                 <div className="h-full bg-red-500/80 hover:bg-red-500 transition-colors flex items-center justify-center relative group" style={{ width: `${softMembership.combat * 100}%` }}>
                    <div className="absolute inset-0 bg-[url('/scanline.png')] opacity-10" />
                 </div>
                 <div className="h-full bg-cyan-500/80 hover:bg-cyan-500 transition-colors flex items-center justify-center relative group" style={{ width: `${softMembership.collect * 100}%` }}>
                    <div className="absolute inset-0 bg-[url('/scanline.png')] opacity-10" />
                 </div>
                 <div className="h-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors flex items-center justify-center relative group" style={{ width: `${softMembership.explore * 100}%` }}>
                    <div className="absolute inset-0 bg-[url('/scanline.png')] opacity-10" />
                 </div>
            </div>

            {/* Micro Legends */}
            <div className="grid grid-cols-3 gap-2">
                <ArchetypeStat type="combat" value={softMembership.combat} active={dominantArchetype === 'combat'} />
                <ArchetypeStat type="collect" value={softMembership.collect} active={dominantArchetype === 'collect'} />
                <ArchetypeStat type="explore" value={softMembership.explore} active={dominantArchetype === 'explore'} />
            </div>
        </div>

        {/* Counterfactuals (Tech View) */}
        <CounterfactualDisplay cf={cf} />

        {/* Session Stats (Mini) */}
        <div className="pt-2 border-t border-slate-800/50">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-slate-500" />
                        Session Inertia
                    </h4>
                    <EducationalDrawer 
                        contentKey="session_inertia"
                        trigger={
                            <div className="p-1 rounded hover:bg-slate-800/50 cursor-pointer group/icon">
                                <HelpCircle className="w-3 h-3 text-slate-600 group-hover/icon:text-cyan-400 transition-colors" />
                            </div>
                        }
                    />
                </div>
             </div>
             <div className="space-y-1.5">
                {(Object.entries(dominantArchetypeDistribution) as [Archetype, number][]).map(([type, pct]) => (
                    <div key={type} className="flex items-center gap-3 group">
                        <div className={`w-1.5 h-1.5 rounded-full ${archetypeBarColors[type]} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${archetypeBarColors[type]} opacity-70`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 w-8 text-right group-hover:text-slate-300 transition-colors">{pct.toFixed(0)}%</span>
                    </div>
                ))}
             </div>
        </div>

      </CardContent>
    </Card>
  );
}

function ArchetypeStat({ type, value, active }: { type: Archetype, value: number, active: boolean }) {
    return (
        <div className={`flex flex-col p-1.5 rounded border transition-all duration-300 ${active ? archetypeColors[type] + ' bg-opacity-10' : 'border-transparent bg-slate-900/20 text-slate-500'}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
               <span className={active ? 'opacity-100' : 'opacity-50'}>{archetypeIcons[type]}</span>
               <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">{type}</span>
            </div>
            <span className={`text-xs font-mono font-bold ${active ? '' : 'text-slate-600'}`}>
                {(value * 100).toFixed(1)}%
            </span>
        </div>
    )
}

function MembershipValidation({ membershipSum }: { membershipSum: number }) {
  const membershipValid = Math.abs(membershipSum - 1.0) < 0.01;

  return (
    <div className={`flex flex-col justify-between p-2.5 rounded-md border ${membershipValid ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Partition Check</span>
      <div className="flex items-center justify-between">
          <span className={`text-xs font-mono font-bold ${membershipValid ? 'text-emerald-400' : 'text-red-400'}`}>
            Σ = {membershipSum.toFixed(4)}
          </span>
          {membershipValid && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />}
      </div>
    </div>
  );
}


function CounterfactualDisplay({ cf }: { cf: CounterfactualResult }) {
  const isPositive = cf.impact > 0;
  
  return (
    <div className="space-y-3 bg-slate-900/30 rounded-lg p-3 border border-slate-800">
      <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500/80" />
            Adaptation Delta
          </h4>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${isPositive ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              {isPositive ? 'Active' : 'Static'}
          </span>
      </div>

      <div className="flex items-center gap-4 relative">
          {/* Static */}
          <div className="flex-1 opacity-60">
             <div className="text-[9px] text-slate-500 uppercase mb-0.5">Baseline</div>
             <div className="text-sm font-mono text-slate-400">
                x{cf.multiplierWithoutAdaptation.toFixed(2)}
             </div>
          </div>

          {/* Arrow */}
          <div className="text-slate-700">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          {/* Dynamic */}
          <div className="flex-1 relative">
             <div className="text-[9px] text-indigo-400 uppercase mb-0.5">Velocity Adjusted</div>
             <div className="text-sm font-mono text-indigo-300 font-bold flex items-center gap-2 shadow-indigo-500/20 drop-shadow-sm">
                x{cf.multiplierWithAdaptation.toFixed(2)}
             </div>
             {Math.abs(cf.impact) > 0.01 && (
                <span className={`absolute -right-2 top-0 text-[9px] font-mono ${cf.impact > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {cf.impact > 0 ? '+' : ''}{cf.percentChange.toFixed(1)}%
                </span>
             )}
          </div>
      </div>
    </div>
  )
}

function DiagnosticsEmptyState() {
  return (
    <Card className="bg-slate-950/40 border-slate-800/60 backdrop-blur-sm h-full flex flex-col justify-center items-center text-center p-6 border-dashed">
      <div className="p-3 bg-slate-900/50 rounded-full mb-3">
        <Binary className="w-5 h-5 text-slate-600" />
      </div>
      <h3 className="text-sm font-semibold text-slate-400 mb-1">No Telemetry</h3>
      <p className="text-xs text-slate-600 max-w-[150px]">Waiting for simulation stream...</p>
    </Card>
  );
}
