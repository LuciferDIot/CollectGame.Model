import { PipelineState, PipelineStep } from '@/lib/types';

export interface AnimationConfig {
    initialSteps: PipelineStep[];
    completedSteps: PipelineStep[];
    finalState: PipelineState;
    executionTime: number;
    setPipelineState: React.Dispatch<React.SetStateAction<PipelineState>>;
}

export const animateSimulation = async ({
    initialSteps,
    completedSteps,
    finalState,
    executionTime,
    setPipelineState
}: AnimationConfig) => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Pure helper to calculate next state for a step index
    const getNextStateForStep = (prev: PipelineState, stepIndex: number): PipelineState => {
         const currentStepId = initialSteps[stepIndex].id;
         
         // 1. Mark current step as running
         const stepsProcessing = prev.steps.map((s, i) => i === stepIndex ? { ...s, status: 'running' as const } : s);
         
         // 2. If valid step completed, merge partial state? 
         // Actually, we just show "running..." visual
         
         return {
             ...prev,
             steps: stepsProcessing
         };
    };

    // 1. Start Sequence
    for (let i = 0; i < initialSteps.length; i++) {
        // A. Set Running
        setPipelineState(prev => {
            const steps = prev.steps.map((s, idx) => 
                idx === i ? { ...s, status: 'running' as const, executionTime: Math.random() * 20 + 10 } : s
            );
            return { ...prev, steps };
        });

        await delay(600); // Visual delay

        // B. Set Completed
        setPipelineState(prev => {
             const steps = prev.steps.map((s, idx) => 
                idx === i ? { ...completedSteps[i], status: 'completed' as const } : s
             );
             
             // If this is the last step, enable results
             if (i === initialSteps.length - 1) {
                 return { ...finalState, steps, isRunning: false };
             }
             
             return { ...prev, steps };
        });
        
        await delay(200);
    }
};
