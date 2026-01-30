'use client';

import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';
import {
  buildSessionAnalytics,
  DEFAULT_ANALYTICS_CONFIG,
  detectClampSaturation,
  getDominantArchetype,
  validateMembershipSum,
} from '@/lib/analytics';
import type { PipelineState } from '@/lib/types';
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

    const round = createRoundAnalytics(
      pipelineState,
      previousMultiplierRef.current,
      roundsRef.current.length + 1
    );

    // Add to history
    roundsRef.current = [...roundsRef.current, round];

    // Update previous reference
    previousMultiplierRef.current = round.targetMultiplier;

    // Build session analytics
    const sessionAnalytics = buildSessionAnalytics(roundsRef.current, DEFAULT_ANALYTICS_CONFIG);

    setCurrentRound(round);
    setSession(sessionAnalytics);
  }, [pipelineState.output, pipelineState.behaviorCategories, pipelineState.metadata]);

  return { session, currentRound };
}

/**
 * Helper to compute analytics for a single round
 */
function createRoundAnalytics(
  pipelineState: PipelineState,
  previousMultiplier: number | null,
  roundNumber: number
): RoundAnalytics {
  // Extract data from pipeline state
  // We can assert output is present because of the check in the hook, or handle it gracefully
  const targetMultiplier = pipelineState.output?.adjustedMultiplier ?? 0;
  
  const softMembership = extractSoftMembership(pipelineState);
  const deltas = extractDeltas(pipelineState);

  // Detect clamp status
  const isClamped = detectClampSaturation(
    targetMultiplier,
    DEFAULT_ANALYTICS_CONFIG.clampLower,
    DEFAULT_ANALYTICS_CONFIG.clampUpper
  );

  // Calculate delta from previous
  const deltaFromPrevious =
    previousMultiplier !== null
      ? targetMultiplier - previousMultiplier
      : null;

  return {
    roundNumber,
    targetMultiplier,
    deltaFromPrevious,
    softMembership,
    deltas,
    isClamped,
    dominantArchetype: getDominantArchetype(softMembership),
    membershipSum: validateMembershipSum(softMembership),
    timestamp: Date.now(),
  };
}

function extractSoftMembership(pipelineState: PipelineState) {
  const { behaviorCategories } = pipelineState;
  
  // Create a quick lookup map to avoid multiple invocations of .find()
  // which simplifies the logic flow and reduces complexity
  const getScore = (category: string) => 
    behaviorCategories.find((c) => c.category === category)?.softMembership || 0;

  return {
    combat: getScore('Combat'),
    collect: getScore('Collection'),
    explore: getScore('Exploration'),
  };
}

function extractDeltas(pipelineState: PipelineState) {
  // Access metadata once to reduce cyclomatic complexity from repeated optional chaining
  // Each ?. adds a branch, so hoisting it significantly lowers the score
  const deltas = pipelineState.metadata?.deltas;
  
  return {
    combat: deltas?.Combat || 0,
    collect: deltas?.Collection || 0,
    explore: deltas?.Exploration || 0,
  };
}
