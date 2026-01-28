'use client';

import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import {
    buildSessionAnalytics,
    DEFAULT_ANALYTICS_CONFIG,
    detectClampSaturation,
    getDominantArchetype,
    validateMembershipSum,
} from '@/lib/analytics';
import type { PipelineState } from '@/lib/pipeline/types';
import { useEffect, useRef, useState } from 'react';

/**
 * Hook to track and compute analytics across pipeline executions
 */
export function useAnalytics(pipelineState: PipelineState) {
  const [session, setSession] = useState<SessionAnalytics | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundAnalytics | null>(null);
  const roundsRef = useRef<RoundAnalytics[]>([]);
  const previousMultiplierRef = useRef<number | null>(null);

  useEffect(() => {
    // Only compute analytics if we have output
    if (!pipelineState.output || pipelineState.behaviorCategories.length === 0) {
      return;
    }

    // Extract data from pipeline state
    const targetMultiplier = pipelineState.output.adjustedMultiplier;
    const softMembership = {
      combat: pipelineState.behaviorCategories.find((c) => c.category === 'Combat')?.softMembership || 0,
      collect: pipelineState.behaviorCategories.find((c) => c.category === 'Collection')?.softMembership || 0,
      explore: pipelineState.behaviorCategories.find((c) => c.category === 'Exploration')?.softMembership || 0,
    };

    // Delta metrics (from pipeline metadata if available, otherwise 0)
    const deltas = {
      combat: pipelineState.metadata?.deltas?.combat || 0,
      collect: pipelineState.metadata?.deltas?.collect || 0,
      explore: pipelineState.metadata?.deltas?.explore || 0,
    };

    // Detect clamp status
    const isClamped = detectClampSaturation(
      targetMultiplier,
      DEFAULT_ANALYTICS_CONFIG.clampLower,
      DEFAULT_ANALYTICS_CONFIG.clampUpper
    );

    // Calculate delta from previous
    const deltaFromPrevious =
      previousMultiplierRef.current !== null
        ? targetMultiplier - previousMultiplierRef.current
        : null;

    // Build round analytics
    const round: RoundAnalytics = {
      roundNumber: roundsRef.current.length + 1,
      targetMultiplier,
      deltaFromPrevious,
      softMembership,
      deltas,
      isClamped,
      dominantArchetype: getDominantArchetype(softMembership),
      membershipSum: validateMembershipSum(softMembership),
      timestamp: Date.now(),
    };

    // Add to history
    roundsRef.current = [...roundsRef.current, round];

    // Update previous reference
    previousMultiplierRef.current = targetMultiplier;

    // Build session analytics
    const sessionAnalytics = buildSessionAnalytics(roundsRef.current, DEFAULT_ANALYTICS_CONFIG);

    setCurrentRound(round);
    setSession(sessionAnalytics);
  }, [pipelineState.output, pipelineState.behaviorCategories, pipelineState.metadata]);

  return { session, currentRound };
}
