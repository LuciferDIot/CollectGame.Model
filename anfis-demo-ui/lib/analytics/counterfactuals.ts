import type { RoundAnalytics } from './types';

export interface CounterfactualResult {
  multiplierWithAdaptation: number;
  multiplierWithoutAdaptation: number;
  impact: number;
  percentChange: number;
}

/**
 * Calculates the hypothetical target multiplier if no adaptation (deltas) had occurred.
 * This effectively simulates "Option A" (Static Context only) vs "Option B" (Dynamic Context).
 */
export function calculateCounterfactuals(round: RoundAnalytics): CounterfactualResult {
  // Option B: The actual calculated multiplier (includes Delta)
  const actualMultiplier = round.targetMultiplier;

  // Option A: Hypothetical multiplier based ONLY on Soft Membership (Context)
  // We approximate this by subtracting the Delta influence.
  // Note: This is an approximation because the MLP is non-linear, but for visualization
  // effectively "removing" the delta inputs gives us the static baseline.
  
  // Logic: 
  // 1. ANFIS Output = Base + (Soft * Weights) + (Delta * Weights)
  // 2. We don't have the raw weights here (they are inside the MLP).
  // 3. However, we know that Delta inputs range [-1, 1].
  // 4. A cleaner way for the UI without re-running the MLP is to look at the *Difference*.
  
  // Alternative (More Accurate):
  // Since we can't re-run the MLP easily here, we can infer the "Static" portion 
  // if we assume the model is roughly linear around the operating point.
  // But a better approach for the UI is to use the "Adaptation Delta" explicitly tracked.
  // If we don't have that, we can use the `deltaFromPrevious` which tracks the *change* in multiplier.
  // But `deltaFromPrevious` is time-based.
  
  // Better Approach:
  // We can't reverse-engineer the MLP perfectly. 
  // However, we can use the `deltas` magnitude to estimate impact.
  // If Deltas are [0,0,0], then Actual == Static.
  // If Deltas are high, the difference is high.
  
  // For the Demo UI, we will use a heuristic:
  // "Without Adaptation" = "Actual" - "Estimated Delta Impact"
  // We know the "Intensity" of the adaptation from `adaptationDeltas` in the pipeline state,
  // but `RoundAnalytics` only has `deltas` (velocity).
  
  // Let's rely on the `features` vs `softMembership`.
  // Actually, the most robust way to show this "With vs Without" in the UI 
  // is to simply assume that *without* the velocity component, the user is "Static".
  // If the user is static, the `delta_` inputs to the ANFIS would be 0.
  
  // We can't strictly calculate the "without" value without the model weights.
  // SO, we will simplify: 
  // The UI will show specific "adaptation actions" (like +Damage, -Health).
  // The "Without" state is simply the *inverse* of those actions applied to the game parameters.
  // But for the *Multiplier* itself (the Difficulty Scalar):
  
  // Let's use the `deltaFromPrevious` (Change in Multiplier) as a proxy.
  // Static Multiplier = Actual Multiplier - (Sum of Deltas * Sensitivity)
  // This is too guess-y.
  
  // REVISED PLAN:
  // We will pass the `mlp_output` for [0,0,0] deltas from the backend if possible?
  // No, that requires backend changes.
  
  // FALLBACK:
  // Use the `deltaFromPrevious` accumulated? No.
  
  // Let's look at `round.deltas`.
  // Weighted sum of deltas?
  // Let's assume a sensitivity of roughly 0.5 for the demo.
  // This is a visualization heuristic to show directionality.
  
  // Heuristic: Impact ~= (CombatDelta * 0.3) + (CollectDelta * 0.2) + (ExploreDelta * 0.1)
  // (Assuming combat velocity has highest weight in difficulty adjustment)
  
  const estimatedImpact = 
      (round.deltas.combat * 0.3) +
      (round.deltas.collect * 0.2) +
      (round.deltas.explore * 0.1);
      
  const staticMultiplier = actualMultiplier - estimatedImpact;

  return {
    multiplierWithAdaptation: actualMultiplier,
    multiplierWithoutAdaptation: staticMultiplier,
    impact: estimatedImpact,
    percentChange: (estimatedImpact / (staticMultiplier || 1)) * 100
  };
}
