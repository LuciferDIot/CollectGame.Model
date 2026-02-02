import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertCircle, ArrowDown, CheckCircle2, ChevronDown, ChevronRight, Cpu, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { STEP_CONTENT_KEYS, STEP_ICONS } from './constants';
import { PipelineStepDetails } from './step-details';
import {
    getBaseIconClasses,
    getCardBackgroundClasses,
    getHeaderTitleColor,
    getStatusColorClasses
} from './ui-utils';

// --- Sub-components ---

function StepStatusIcon({ status, stepId }: { status: string, stepId: string }) {
    const isCompleted = status === 'completed';
    const isRunning = status === 'running';
    const hasError = status === 'error';

    const baseClasses = getBaseIconClasses();
    const colorClasses = getStatusColorClasses(status);

    return (
        <div className={`${baseClasses} ${colorClasses}`}>
            {isRunning ? <Cpu className="w-4 h-4 animate-spin" /> : 
             isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
             hasError ? <AlertCircle className="w-4 h-4" /> :
             STEP_ICONS[stepId]}
        </div>
    );
}

function StepHeader({ 
    name, 
    status, 
    isExpanded, 
    hasOutput, 
    contentKey, 
    onToggle 
}: { 
    name: string, 
    status: string, 
    isExpanded: boolean, 
    hasOutput: boolean, 
    contentKey?: string, 
    onToggle: () => void 
}) {
    const isRunning = status === 'running';
    
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <h3 className={`text-sm font-medium ${getHeaderTitleColor(isRunning)}`}>
                    {name}
                </h3>
                <div onClick={(e) => e.stopPropagation()}>
                    <EducationalDrawer 
                        contentKey={contentKey || ''}
                        trigger={
                            <div className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-cyan-400 cursor-help">
                                <HelpCircle className="w-3 h-3" />
                            </div>
                        }
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {hasOutput && (
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Data Ready
                    </span>
                )}
                {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
            </div>
        </div>
    );
}

// --- Main Component ---

export function PipelineStepItem({ step, index, isLast }: { step: any, index: number, isLast: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isCompleted = step.status === 'completed';
    const isRunning = step.status === 'running';
    
    // Auto-expand interesting steps when completed
    useEffect(() => {
        if (isCompleted && ['3', '5', '6', '7'].includes(step.id)) {
             setIsExpanded(true);
        }
    }, [isCompleted, step.id]);

    const contentKey = STEP_CONTENT_KEYS[step.id];

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="relative pl-8"
        >
            {!isLast && <div className="absolute left-[15px] top-8 bottom-[-16px] w-0.5 bg-slate-800" />}

            <StepStatusIcon status={step.status} stepId={step.id} />

            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`rounded-lg border p-3 cursor-pointer transition-all duration-200 group/card ${getCardBackgroundClasses(isRunning)}`}>
                <StepHeader 
                    name={step.name} 
                    status={step.status} 
                    isExpanded={isExpanded} 
                    hasOutput={!!step.output} 
                    contentKey={contentKey}
                    onToggle={() => setIsExpanded(!isExpanded)}
                />
                
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
