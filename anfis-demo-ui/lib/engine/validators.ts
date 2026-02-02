import { Deltas, SoftMembership } from './types';

export const DEMO_MIN_SECONDS = 20;
export const DEMO_MAX_SECONDS = 300; // 5 minutes

export function validateDuration(seconds: number): void {
  if (seconds < DEMO_MIN_SECONDS || seconds > DEMO_MAX_SECONDS) {
    console.warn(
      `Duration ${seconds}s outside demo range [${DEMO_MIN_SECONDS}s, ${DEMO_MAX_SECONDS}s]`
    );
  }
}

export function validatePipelineResult(
    softMembership: SoftMembership,
    deltas: Deltas,
    adaptedParams: any,
    multiplierClamped: boolean
  ) {
    const membershipSum = softMembership.soft_combat + softMembership.soft_collect + softMembership.soft_explore;
    
    // Check if deltas are continuously within valid range [-1, 1]
    const deltaRangeOk = 
      Math.abs(deltas.delta_combat) <= 1.05 && // permissive buffer
      Math.abs(deltas.delta_collect) <= 1.05 &&
      Math.abs(deltas.delta_explore) <= 1.05;
    
    // Check if any parameter hit the hard safety clamp
    const allParamsInBounds = Object.values(adaptedParams).every((param: any) => !param.clamped);

    return {
      membership_sum: membershipSum,
      delta_range_ok: deltaRangeOk,
      multiplier_clamped: multiplierClamped,
      all_params_in_bounds: allParamsInBounds,
    };
}
