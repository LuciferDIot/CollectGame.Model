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
    // 1. Get dictionary of soft memberships
    const soft = backendResult.fuzzification?.soft_membership || { soft_combat: 0, soft_collect: 0, soft_explore: 0 };
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
    const soft = backendResult.fuzzification?.soft_membership || { soft_combat: 0, soft_collect: 0, soft_explore: 0 };
    
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

export const mapAdaptationDeltas = (backendResult: BackendPipelineOutput): AdaptationDelta[] => {
    // 1. Get adjustments
    const adjustments = (backendResult as any).adaptation?.parameter_adjustments || {};
    
    // 2. Map Key -> Delta
    return Object.entries(adjustments).map(([key, value]) => {
        const category = inferCategoryFromKey(key);
        // We calculate % change if we had previous value.
        return {
           field: key,
           before: 1.0, // We'd need state history to know real old value
           after: Number(value),
           change: (Number(value) - 1.0) * 100, // Assuming baseline 1.0
           category: category,
           intensity: Math.abs((Number(value) - 1.0) * 100) > 10 ? 'high' : 'low' // logic
        } as AdaptationDelta; // Force cast if partial match or strict
    });
};
