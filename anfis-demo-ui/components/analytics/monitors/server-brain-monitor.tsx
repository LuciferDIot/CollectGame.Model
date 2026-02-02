'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import { ArrowRight, BrainCircuit, Clock, Database, History } from 'lucide-react';
import { HelpfulTooltip } from '../shared/helpful-tooltip';

interface ServerBrainMonitorProps {
  currentRound: RoundAnalytics | null;
  session: SessionAnalytics | null;
}

export function ServerBrainMonitor({ currentRound, session }: ServerBrainMonitorProps) {
  if (!currentRound) {
    return (
      <Card className="border-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-500" />
            Server State (The Brain)
          </CardTitle>
          <CardDescription>Visualizing the backend memory</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">Waiting for telemetry...</p>
        </CardContent>
      </Card>
    );
  }

  // Determine if this was a "New Session" or "Continuation"
  const isNewSession = !currentRound.deltaFromPrevious; 
  // In our backend logic, if deltas are 0 and it's the first round, it's new. 
  // But strictly, we can check if it's round 1 or if time gap was large.
  
  // We can infer "History" from the current round's deltas mathematically:
  // Previous = Current - Delta
  const prevCombat = Math.max(0, currentRound.softMembership.combat - currentRound.deltas.combat);
  const prevCollect = Math.max(0, currentRound.softMembership.collect - currentRound.deltas.collect);
  const prevExplore = Math.max(0, currentRound.softMembership.explore - currentRound.deltas.explore);

  return (
    <Card className="border-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-5 w-5 text-indigo-500" />
            <HelpfulTooltip 
                trigger={<span className="cursor-pointer hover:underline decoration-dotted underline-offset-4">Server Brain State</span>}
                title="Backend State Memory"
                description="Visualizes exactly what the server 'remembers' about this user to calculate Deltas."
                interpretation="The server stores the Previous State so it can subtract it from the Current State to find Velocity (Delta)."
            />
          </CardTitle>
          {isNewSession ? (
             <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">New Session / Reset</Badge>
          ) : (
             <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Continuously Tracking</Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Pipeline Step 6: Delta Computation Logic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Visual Flow: History -> Delta -> Current */}
        <div className="flex items-center justify-between gap-2 text-center relative">
          
          {/* Node 1: Memory */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center relative">
               <History className="h-5 w-5 text-slate-500" />
               <div className="absolute -bottom-1 -right-1 bg-slate-200 dark:bg-slate-700 text-[10px] px-1 rounded border border-slate-400">t-1</div>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">Server Memory</div>
            <div className="text-[10px] text-slate-500 font-mono">
               Comb: {prevCombat.toFixed(2)}<br/>
               Coll: {prevCollect.toFixed(2)}<br/>
               Expl: {prevExplore.toFixed(2)}
            </div>
          </div>

          {/* Arrow */}
          <div className="text-slate-400 flex flex-col items-center">
            <ArrowRight className="h-4 w-4" />
            <span className="text-[10px] font-mono mt-1 text-indigo-500">+ Δ Delta</span>
          </div>

          {/* Node 2: Calculation (The Delta) */}
          <div className="flex-1 flex flex-col items-center gap-2">
             <div className="w-16 h-16 rounded-lg bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center flex-col shadow-sm">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Δ Calc</span>
             </div>
             <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Velocity</div>
             <div className="text-[10px] text-indigo-500 font-mono">
               {currentRound.deltas.combat > 0 ? '+' : ''}{currentRound.deltas.combat.toFixed(2)}<br/>
               {currentRound.deltas.collect > 0 ? '+' : ''}{currentRound.deltas.collect.toFixed(2)}<br/>
               {currentRound.deltas.explore > 0 ? '+' : ''}{currentRound.deltas.explore.toFixed(2)}
            </div>
          </div>

           {/* Arrow */}
           <div className="text-slate-400 flex flex-col items-center">
            <ArrowRight className="h-4 w-4" />
            <span className="text-[10px] font-mono mt-1">=</span>
          </div>

          {/* Node 3: Current Input */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 flex items-center justify-center relative">
               <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
               <div className="absolute -bottom-1 -right-1 bg-emerald-200 dark:bg-emerald-800 text-[10px] px-1 rounded border border-emerald-500 text-emerald-900 dark:text-emerald-100">t</div>
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Current Input</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
               Comb: {currentRound.softMembership.combat.toFixed(2)}<br/>
               Coll: {currentRound.softMembership.collect.toFixed(2)}<br/>
               Expl: {currentRound.softMembership.explore.toFixed(2)}
            </div>
          </div>

        </div>

        {/* Timeout Explanation */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-3 text-xs border border-slate-200 dark:border-slate-800 flex gap-3">
           <Clock className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
           <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Stale State Timeout: 40s</span>
              <p className="text-muted-foreground">
                If the server doesn't receive data for <strong>40 seconds</strong>, it deletes the "Server Memory" (t-1). 
                The next request is treated as a fresh session (Delta = 0) to prevent calculating "velocity" across a pause.
              </p>
           </div>
        </div>

      </CardContent>
    </Card>
  );
}
