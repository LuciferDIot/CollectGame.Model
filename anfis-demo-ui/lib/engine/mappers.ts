import { inferCategoryFromKey } from '@/lib/analytics/utils';
import {
    validateMembershipSum
} from '../analytics/computations/behavior';
import type { AdaptationDelta, BehaviorCategory, Category, ValidationCheck } from '../types';
import type { PipelineOutput as BackendPipelineOutput } from './types';

const validateCrispLogic = (behaviors: string[]): ValidationCheck => {
    return {
        name: 'Crisp Logic Validation',
        status: behaviors.length > 0 ? 'pass' : 'warning',
        message: behaviors.length > 0 ? 'Behaviors identified' : 'No behaviors identified'
    };
};

// --- Mapping Helpers ---

export const mapBehaviorCategories = (backendResult: BackendPipelineOutput): BehaviorCategory[] => {
    // 1. Get dictionary of soft memberships (handle multiple potential root keys)
    const soft = backendResult.soft_membership || 
                 (backendResult as any).fuzzification?.soft_membership || 
                 { soft_combat: 0, soft_collect: 0, soft_explore: 0 };
                 
    const scores = backendResult.activity_scores || { pct_combat: 0, pct_collect: 0, pct_explore: 0 };
    
    // Helper to reduce repetition
    const createCategory = (name: Category, softVal: number, pctVal: number): BehaviorCategory => ({
        category: name,
        softMembership: softVal || 0,
        activityPercentage: Math.round((pctVal || 0) * 100),
        confidence: 0.9
    });

    return [
        createCategory('Combat', soft.soft_combat, scores.pct_combat),
        createCategory('Collection', soft.soft_collect, scores.pct_collect),
        createCategory('Exploration', soft.soft_explore, scores.pct_explore)
    ];
};

export const mapValidationChecks = (backendResult: BackendPipelineOutput): ValidationCheck[] => {
    const soft = backendResult.soft_membership || 
                 (backendResult as any).fuzzification?.soft_membership || 
                 { soft_combat: 0, soft_collect: 0, soft_explore: 0 };
    
    // Convert to format expected by validator (UI types)
    const uiSoft = {
        combat: soft.soft_combat,
        collect: soft.soft_collect,
        explore: soft.soft_explore
    };

    const sum = validateMembershipSum(uiSoft);
    
    return [
        {
            name: 'Membership Sum',
            status: Math.abs(sum - 1.0) < 0.01 ? 'pass' : 'warning',
            message: `Sum: ${sum.toFixed(2)} (Expected 1.0)`
        },
        validateCrispLogic(backendResult.behavior_analysis?.classification?.active_behaviors || [])
    ];
};

// --- Adaptation Specific Helpers ---

const getAdjustmentValues = (val: any) => {
    const isObject = typeof val === 'object' && val !== null;
    return {
        final: isObject ? Number((val as any).final) : Number(val),
        base: isObject ? Number((val as any).base) : 1.0
    };
};

const calculateDeltaPercent = (base: number, final: number): number => {
    if (base === 0) return 0;
    return ((final / base) - 1) * 100;
};

export const mapAdaptationDeltas = (backendResult: BackendPipelineOutput): AdaptationDelta[] => {
    const adjustments = (backendResult as any).adaptation?.parameter_adjustments || 
                    backendResult.adapted_parameters || {};
    
    return Object.entries(adjustments).map(([key, val]) => {
        const { final, base } = getAdjustmentValues(val);
        const change = calculateDeltaPercent(base, final);

        return {
           field: key,
           before: base,
           after: final,
           change: change,
           category: inferCategoryFromKey(key),
           intensity: Math.abs(change) > 10 ? 'high' : 'low'
        } as AdaptationDelta;
    });
};
