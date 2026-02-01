'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipeline } from '@/lib/pipeline-context';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertCircle, ArrowDown, BrainCircuit, CheckCircle2, ChevronDown, ChevronRight, Cpu, GitBranch, HelpCircle, Layers, ShieldCheck, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { EducationalDrawer } from '../analytics/educational-drawer';

// Step ID to Icon mapping
const stepIcons: Record<string, React.ReactNode> = {
  '1': <ArrowDown className="w-4 h-4" />,
  '2': <Layers className="w-4 h-4" />,
  '3': <GitBranch className="w-4 h-4" />,
  '4': <Activity className="w-4 h-4" />,
  '5': <BrainCircuit className="w-4 h-4" />,
  '6': <Zap className="w-4 h-4" />, // Adaptation Analysis
  '7': <ShieldCheck className="w-4 h-4" />,
  '8': <CheckCircle2 className="w-4 h-4" />,
};

// Map step IDs to educational content keys
const stepContentKeys: Record<string, string> = {
    '1': 'telemetry_health',
    '2': 'input_normalization',
    '3': 'fuzzy_partition',
    '4': 'rule_firing_strength',
    '5': 'rule_firing_strength',
    '6': 'adaptive_parameter_tuning',
    '7': 'clamp_usage',
    '8': 'multiplier_mean',
  };

export function CenterPanel() {
  const { pipelineState } = usePipeline();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new steps are added
  useEffect(() => {
    if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }
  }, [pipelineState.steps.length, pipelineState.executionTime]);

  return (
    <div className="h-full flex flex-col bg-slate-900/50 border-r border-slate-800 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[size:40px_40px] opacity-20 pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)' }} 
      />
      
      {/* Header */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm flex items-center px-4 justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-semibold text-slate-200">Pipeline Execution</span>
        </div>
        <div className="text-xs font-mono text-slate-500">
             {pipelineState.isRunning ? (
                 <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    RUNNING
                 </span>
             ) : (
                 <span className="text-slate-600">IDLE</span>
             )}
             {pipelineState.executionTime > 0 && (
                 <span className="ml-3 text-cyan-600 border-l border-slate-800 pl-3">
                     {pipelineState.executionTime.toFixed(1)}ms
                 </span>
             )}
        </div>
      </div>

      {/* Steps List */}
      <ScrollArea className="flex-1 w-full relative" ref={scrollRef} type="always">
          <div className="p-6 space-y-4 min-h-full pb-20 relative z-10">
            {/* Decorative Connection Line */}
            <div className="absolute left-[29px] top-6 bottom-20 w-px bg-slate-800/50 -z-10" />

            <AnimatePresence mode='popLayout'>
                {pipelineState.steps.map((step, index) => (
                    <PipelineStepItem 
                        key={step.id} 
                        step={step} 
                        index={index} 
                        isLast={index === pipelineState.steps.length - 1} 
                    />
                ))}
            </AnimatePresence>
            
            {pipelineState.steps.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-40 mt-20 select-none pointer-events-none">
                    <div className="w-32 h-32 rounded-full border border-slate-800 flex items-center justify-center relative">
                        <div className="absolute inset-0 border border-slate-800 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-2 border border-slate-800/60 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]" />
                        <BrainCircuit className="w-12 h-12 text-slate-800" />
                    </div>
                    <p className="text-xs text-slate-700 uppercase tracking-[0.2em] mt-6 font-bold">System Online</p>
                    <p className="text-[10px] text-slate-800 font-mono mt-2">Awaiting Telemetry Stream</p>
                </div>
            )}
          </div>
      </ScrollArea>
      
      {/* Decorative HUD Corners */}
      <div className="absolute top-12 left-0 w-4 h-4 border-l border-t border-cyan-900/50" />
      <div className="absolute top-12 right-0 w-4 h-4 border-r border-t border-cyan-900/50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-cyan-900/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-cyan-900/50" />

      {/* Scanning Line Animation (Overlay) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none translate-y-[-100%] animate-[scan_8s_ease-in-out_infinite]" />

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#050a14] via-[#050a14]/80 to-transparent pointer-events-none" />
    </div>
  );
}

function PipelineStepItem({ step, index, isLast }: { step: any, index: number, isLast: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isCompleted = step.status === 'completed';
    const isRunning = step.status === 'running';
    const hasError = step.status === 'error';

    // Auto-expand interesting steps when completed
    useEffect(() => {
        if (isCompleted && ['3', '5', '6', '7'].includes(step.id)) {
             setIsExpanded(true);
        }
    }, [isCompleted, step.id]);

    const contentKey = stepContentKeys[step.id];

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="relative pl-8"
        >
            {/* Timeline Line */}
            {!isLast && (
                <div className="absolute left-[15px] top-8 bottom-[-16px] w-0.5 bg-slate-800" />
            )}

            {/* Icon Node */}
            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 bg-slate-950 transition-colors duration-300 ${
                isCompleted ? 'border-emerald-500/50 text-emerald-500' :
                isRunning ? 'border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' :
                hasError ? 'border-red-500 text-red-500' :
                'border-slate-700 text-slate-600'
            }`}>
                {isRunning ? <Cpu className="w-4 h-4 animate-spin" /> : 
                 isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
                 hasError ? <AlertCircle className="w-4 h-4" /> :
                 stepIcons[step.id]}
            </div>

            {/* Content Card */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`rounded-lg border p-3 cursor-pointer transition-all duration-200 group/card ${
                isRunning ? 'bg-slate-900/80 border-cyan-500/50 shadow-lg' :
                'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-medium ${isRunning ? 'text-cyan-400' : 'text-slate-200'}`}>
                            {step.name}
                        </h3>
                        {/* Interactive Educational Trigger */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <EducationalDrawer 
                                contentKey={contentKey}
                                trigger={
                                    <div className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-cyan-400 cursor-help">
                                        <HelpCircle className="w-3 h-3" />
                                    </div>
                                }
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {step.output && (
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                Data Ready
                            </span>
                        )}
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                    </div>
                </div>
                
                {/* Collapsible Details */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-3">
                                <p className="text-xs text-slate-400 italic mb-2">{step.description}</p>
                                
                                {/* INPUT SECTION (Newly Restored) */}
                                {step.input && (
                                    <div className="mb-4">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <ArrowDown className="w-3 h-3" /> Input Data
                                        </div>
                                        <div className="bg-slate-950/50 rounded border border-slate-800/50 p-2">
                                           <PipelineStepDetails step={step} details={step.input} isInput={true} />
                                        </div>
                                    </div>
                                )}

                                {/* OUTPUT SECTION */}
                                {step.output && (
                                    <div>
                                        <div className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Activity className="w-3 h-3" /> Output Result
                                        </div>
                                        <PipelineStepDetails step={step} details={step.output} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

// Helper to render complex outputs safely
type StepDetail = Record<string, any>;

function PipelineStepDetails({ step, details, isInput = false }: { step: any, details: StepDetail, isInput?: boolean }) {
  // Check if this is the "Adaptation Analysis" step
  const isAdaptation = !isInput && (step.name === 'Adaptation Analysis' || step.name === 'Defuzzification');
  const isResult = !isInput && step.name === 'Results Aggregation';
  
  // Custom Render for Adaptation Step
  if (isAdaptation) {
     return <AdaptationDetails details={details} />;
  }

  // Custom Render for Final Result Step
  if (isResult) {
     return <ResultDetails details={details} />;
  }

  // Generic Key-Value Render with improved Grid Layout
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {Object.entries(details).map(([key, value]) => {
            if (key === 'valid' || key === 'methodConfidence') return null;
            
            // Format labels
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            const isLongValue = String(value).length > 20;

            // Render primitive values
            if (typeof value !== 'object' || value === null) {
                return (
                    <div 
                        key={key} 
                        className={`flex items-baseline justify-between py-1 border-b border-slate-800/40 ${isLongValue ? 'col-span-2' : ''}`}
                    >
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">{label}</span>
                        <span className="font-mono text-xs text-slate-300 break-all text-right">
                           {String(value)}
                        </span>
                    </div>
                );
            }
            
            // Allow recursing for small objects (e.g. metadata)
            if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length < 5) {
                 return (
                    <div key={key} className="col-span-2 mt-2">
                        <div className="text-[9px] text-cyan-600/70 uppercase tracking-widest mb-1 pl-1 border-l-2 border-cyan-800/30">
                            {label}
                        </div>
                        <div className="pl-2 border-l border-slate-800 bg-slate-900/30 p-2 rounded">
                            <PipelineStepDetails step={step} details={value} isInput={isInput} />
                        </div>
                    </div>
                 )
            }
            
            // Fallback for complex objects arrays
            return (
                 <div key={key} className="col-span-2 flex justify-between py-1 border-b border-slate-800/40">
                     <span className="text-[10px] text-slate-500 uppercase">{label}</span>
                     <span className="text-[10px] text-slate-600 italic">Complex Data</span>
                 </div>
            );
        })}
    </div>
  );
}

function AdaptationDetails({ details }: { details: any }) {
    return (
        <div className="bg-slate-950 rounded p-3 border border-slate-800">
            <div className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                State Evolution
            </div>
            
            {/* Previous State Vector */}
            {details.previousState && (
                <div className="mb-3">
                        <div className="text-[10px] text-slate-500 uppercase mb-1">Previous State (t-1)</div>
                        <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1">
                            <span className="block text-[9px] text-slate-600">CMB</span>
                            <span className="text-xs text-slate-400 font-mono">{details.previousState.softMembership?.combat.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1">
                            <span className="block text-[9px] text-slate-600">COL</span>
                            <span className="text-xs text-slate-400 font-mono">{details.previousState.softMembership?.collect.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1">
                            <span className="block text-[9px] text-slate-600">EXP</span>
                            <span className="text-xs text-slate-400 font-mono">{details.previousState.softMembership?.explore.toFixed(2)}</span>
                        </div>
                        </div>
                </div>
            )}
            
            {/* Calculated Velocity */}
            <div>
                    <div className="text-[10px] text-emerald-600 uppercase mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Calculated Velocity
                    </div>
                    {details.behavioralDeltas ? (
                        <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded px-2 py-1">
                            <span className="block text-[9px] text-emerald-700">Δ Combat</span>
                            <span className="text-xs text-emerald-400 font-mono font-bold">{Number(details.behavioralDeltas.Combat).toFixed(4)}</span>
                        </div>
                        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded px-2 py-1">
                            <span className="block text-[9px] text-emerald-700">Δ Collect</span>
                            <span className="text-xs text-emerald-400 font-mono font-bold">{Number(details.behavioralDeltas.Collection).toFixed(4)}</span>
                        </div>
                        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded px-2 py-1">
                            <span className="block text-[9px] text-emerald-700">Δ Explore</span>
                            <span className="text-xs text-emerald-400 font-mono font-bold">{Number(details.behavioralDeltas.Exploration).toFixed(4)}</span>
                        </div>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-600 italic">No delta history available</div>
                    )}
            </div>
        </div>
    )
}

function ResultDetails({ details }: { details: any }) {
    const adaptedParams = details.adaptedParameters || {};

    return (
        <div className="space-y-3">
             <div className="bg-emerald-950/10 rounded p-3 border border-emerald-900/30">
                 <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Optimization Status</span>
                     <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                         {details.status}
                     </span>
                 </div>
                 <div className="flex items-baseline justify-between">
                     <span className="text-xs text-slate-400">Global Multiplier</span>
                     <span className="text-xl font-bold text-white font-mono">{Number(details.finalMultiplier).toFixed(2)}x</span>
                 </div>
             </div>

             <div className="space-y-2">
                 <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider flex items-center gap-2">
                     <Layers className="w-3 h-3" />
                     Adapted Parameters
                 </div>
                 
                 {Object.keys(adaptedParams).length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                          {Object.entries(adaptedParams).map(([key, value]) => (
                               <div key={key} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-800/50">
                                   <span className="text-xs text-slate-300">{key}</span>
                                   <div className="flex items-center gap-2">
                                       <span className="text-xs font-mono text-cyan-300">{String(value)}</span>
                                   </div>
                               </div>
                          ))}
                      </div>
                 ) : (
                     <div className="text-xs text-slate-500 italic p-2 border border-dashed border-slate-800 rounded">
                         Waiting for parameters...
                     </div>
                 )}
             </div>
        </div>
    );
}
