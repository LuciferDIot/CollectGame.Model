'use client';

import { usePipeline } from '@/lib/pipeline-context';
import { cn } from '@/lib/utils';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { MetricDetailModal } from '../../analytics/metric-detail-modal'; // Explicit relative path

export function AdaptationTab() {
  const { pipelineState } = usePipeline();
  const { behaviorCategories, output } = pipelineState;
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  // Helper to get category specific multiplier
  const getCategoryFactor = (catName: string): number => {
    const cat = behaviorCategories.find(c => c.category === catName);
    const membership = cat?.softMembership ?? 0;
    const globalMult = output?.adjustedMultiplier ?? 1.0;
    
    // REFINED LOGIC:
    // Always apply at least 50% of the global adaptation (Global Baseline).
    // Add membership influence on top (Archetype Specificity).
    const weight = 0.5 + (membership * 1.5); 
    const delta = globalMult - 1.0;
    
    return 1.0 + (delta * weight);
  };

  const combatFactor = getCategoryFactor('Combat');
  const collectionFactor = getCategoryFactor('Collection');
  const explorationFactor = getCategoryFactor('Exploration');

  const openMetric = (key: string) => setSelectedMetric(key);

  return (
    <div className="m-0 p-6 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-4">
           <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Parameter Adaptation</h3>
        </div>

        {/* COMBAT PARAMETERS */}
        <ParameterCard 
          title="Combat Parameters"
          color="combat"
        >
           <ParameterRow 
             name="enemy spawn interval" 
             base={40.0} 
             final={40.0 * (2 - combatFactor)} 
             format="0.00"
             onClick={() => openMetric('combat_parameter_adaptation')}
             dark
           />
           <ParameterRow 
             name="global enemy cap" 
             base={35.0} 
             final={35.0 * combatFactor} 
             format="0.00"
             onClick={() => openMetric('global_cap_adaptation')}
             dark
           />
           <ParameterRow 
             name="enemy damage intensity" 
             base={10.0} 
             final={10.0 * combatFactor} 
             format="0.00"
             onClick={() => openMetric('combat_intensity')}
             dark
           />
            <ParameterRow 
             name="enemy max health" 
             base={100.0} 
             final={100.0 * combatFactor} 
             format="0.00"
             onClick={() => openMetric('combat_health_scaling')}
             dark
           />
           <ParameterRow 
             name="stamina damage" 
             base={5.0} 
             final={5.0 * combatFactor} 
             format="0.00"
             onClick={() => openMetric('stamina_penalty')}
             dark
           />
            <ParameterRow 
             name="player damage intensity" 
             base={16.0} 
             final={16.0 * (1/combatFactor)} 
             format="0.00"
             onClick={() => openMetric('player_power_scaling')}
             dark
           />
             <ParameterRow 
             name="player max health" 
             base={180.0} 
             final={180.0 * (1/combatFactor)} 
             format="0.00"
             onClick={() => openMetric('player_resilience')}
             dark
           />
        </ParameterCard>

        {/* COLLECTION PARAMETERS */}
        <ParameterCard 
          title="Collection Parameters"
          color="collection"
        >
            <ParameterRow 
             name="collectible count" 
             base={120.0} 
             final={120.0 * collectionFactor} 
             format="0.00"
             onClick={() => openMetric('resource_density')}
             dark
           />
           <ParameterRow 
             name="collectible spawn interval" 
             base={40.0} 
             final={40.0 * (2 - collectionFactor)} 
             format="0.00"
             onClick={() => openMetric('resource_respawn_rate')}
             dark
           />
            <ParameterRow 
             name="collectible lifetime" 
             base={30.0} 
             final={30.0 * collectionFactor} 
             format="0.00"
             onClick={() => openMetric('resource_availability_window')}
             dark
           />
        </ParameterCard>
    
        {/* EXPLORATION PARAMETERS */}
        <ParameterCard 
          title="Exploration Parameters"
          color="exploration"
        >
            <ParameterRow 
             name="stamina regen" 
             base={12.0} 
             final={12.0 * (1/explorationFactor)} 
             format="0.00"
             onClick={() => openMetric('stamina_recovery_dynamics')}
             dark
           />
             <ParameterRow 
             name="dash cooldown" 
             base={3.0} 
             final={3.0 * (2 - explorationFactor)} 
             format="0.00"
             onClick={() => openMetric('movement_fluidity')}
             dark
           />
        </ParameterCard>

      </div>
       <div className="flex justify-center pt-8 opacity-40">
          <SlidersHorizontal className="w-5 h-5 text-slate-600" />
       </div>

      {/* Shared Metric Modal for Deep Dives */}
      <MetricDetailModal 
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        metricKey={selectedMetric || 'adaptive_parameter_tuning'} 
        currentValue="Dynamic" 
        status="neutral"
      />
    </div>
  );
}

function ParameterCard({ title, children, color }: { title: string, children: React.ReactNode, color: 'combat' | 'collection' | 'exploration' }) {
    const borderColor = color === 'combat' ? 'border-rose-500/20' : color === 'collection' ? 'border-amber-500/20' : 'border-sky-500/20';
    const bgGradient = 'bg-gradient-to-b from-[#161b2c] to-[#0f111a]'; // Subtle gradient for depth
    const titleColor = color === 'combat' ? 'text-rose-400' : color === 'collection' ? 'text-amber-400' : 'text-sky-400';
    const glowColor = color === 'combat' ? 'shadow-rose-900/10' : color === 'collection' ? 'shadow-amber-900/10' : 'shadow-sky-900/10';
    const bulletColor = color === 'combat' ? 'text-rose-500' : color === 'collection' ? 'text-amber-500' : 'text-sky-500';

    return (
        <div className={cn("rounded-xl border p-6 shadow-xl backdrop-blur-sm", bgGradient, borderColor, glowColor)}>
            <h4 className={cn("text-base font-bold mb-6 tracking-tight flex items-center gap-2", titleColor)}>
               <span className={cn("text-xl leading-none", bulletColor)}>•</span>
               {title}
            </h4>
            <div className="space-y-5">
                {children}
            </div>
        </div>
    )
}

function ParameterRow({ name, base, final, format="0.00", dark, onClick }: any) {
    const percentChange = ((final - base) / base) * 100;
    const isGain = percentChange > 0;
    const isNeutral = Math.abs(percentChange) < 0.01;

    return (
        <div 
            onClick={onClick}
            className="flex items-center justify-between group py-1 cursor-pointer hover:bg-white/5 rounded pl-2 pr-1 transition-colors -ml-2"
        >
            <div className="space-y-1.5 point-events-none">
                <div className="text-[13px] font-medium text-slate-300 group-hover:text-blue-200 transition-colors tracking-wide underline-offset-2 group-hover:underline decoration-dotted decoration-slate-600">
                    {name}
                </div>
                <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="opacity-60">Base:</span> 
                    <span className="text-slate-400">{base.toFixed(2)}</span> 
                    <span className="text-slate-600">→</span> 
                    <span className="opacity-60">Final:</span>
                    <span className="text-slate-200 font-bold bg-white/5 px-1.5 rounded">{final.toFixed(2)}</span>
                </div>
            </div>
            
            {!isNeutral && (
                <div className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-bold font-mono min-w-[3.5rem] text-center shadow-sm border border-transparent",
                    isGain ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                )}>
                    {isGain ? '+' : ''}{percentChange.toFixed(1)}%
                </div>
            )}
            {isNeutral && (
                <div className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono min-w-[3.5rem] text-center shadow-sm border border-slate-700/50 bg-slate-800/40 text-slate-500">
                    0.0%
                </div>
            )}
        </div>
    )
}
