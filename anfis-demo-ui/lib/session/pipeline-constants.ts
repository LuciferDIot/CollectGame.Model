import { PipelineStep } from '@/lib/types';

export const INITIAL_PIPELINE_STEPS: PipelineStep[] = [
    { id: '1', name: 'Load Input Data', description: 'Parse and validate telemetry JSON', input: null, output: null, status: 'pending' },
    { id: '2', name: 'Normalize Features', description: 'Scale features to [0, 1] range', input: null, output: null, status: 'pending' },
    { id: '3', name: 'Activity Scoring', description: 'Average active features → archetype scores (v2.1)', input: null, output: null, status: 'pending' },
    { id: '4', name: 'Soft Membership', description: 'K-Means IDW clustering (3 archetypes)', input: null, output: null, status: 'pending' },
    { id: '5', name: 'Adaptation Analysis', description: 'Compare before/after values', input: null, output: null, status: 'pending' },
    { id: '6', name: 'Confidence Calculation', description: 'Compute confidence metrics', input: null, output: null, status: 'pending' },
    { id: '7', name: 'Validation Checks', description: 'Run sanity checks', input: null, output: null, status: 'pending' },
    { id: '8', name: 'Results Aggregation', description: 'Compile final outputs', input: null, output: null, status: 'pending' },
];
