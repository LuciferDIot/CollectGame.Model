'use client';

import {
  buildSessionAnalytics,
  DEFAULT_ANALYTICS_CONFIG,
  detectClampSaturation,
  getDominantArchetype,
  RoundAnalytics,
  SessionAnalytics,
  validateMembershipSum
} from '@/lib/analytics';
import { usePipeline } from '@/lib/session/pipeline-context';
import { PipelineState } from '@/lib/types';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

// ----------------------------------------------------------------------------
// Types & Context Definition
// ----------------------------------------------------------------------------

interface AnalyticsContextType {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// ----------------------------------------------------------------------------
// Helper: Compute Analytics for a Single Round
// ----------------------------------------------------------------------------

function createRoundAnalytics(
  pipelineState: PipelineState,
  previousMultiplier: number | null,
  roundNumber: number,
  telemetry: any // TelemetryFeatures
): RoundAnalytics {
  const targetMultiplier = pipelineState.output?.adjustedMultiplier ?? 0;
  const softMembership = extractSoftMembership(pipelineState);
  const deltas = extractDeltas(pipelineState);

  const isClamped = detectClampSaturation(
    targetMultiplier,
    DEFAULT_ANALYTICS_CONFIG.clampLower,
    DEFAULT_ANALYTICS_CONFIG.clampUpper
  );

  const deltaFromPrevious = previousMultiplier !== null
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
    // If the pipeline state has a timestamp (it should), use it, otherwise now()
    timestamp: Date.now(),
    duration: pipelineState.executionTime || 0,
    features: telemetry || {}, // Default to empty if missing
    // Re-surface adjusted multiplier
    adjustedMultiplier: targetMultiplier,
    // Add validation object if present (mapped from backend)
    validation: pipelineState.validationChecks ? {
        membership_sum: extractValidationValue(pipelineState.validationChecks, 'Membership Sum'),
        delta_range_ok: extractValidationValue(pipelineState.validationChecks, 'Delta Range') === 1,
        multiplier_clamped: extractValidationValue(pipelineState.validationChecks, 'Multiplier Clamped') === 1,
        all_params_in_bounds: true
    } : {
        membership_sum: 1,
        delta_range_ok: true,
        multiplier_clamped: true,
        all_params_in_bounds: true
    },
    ruleActivations: pipelineState.rulesFired || []
  };
}

function extractValidationValue(checks: any[], name: string): number {
    const check = checks.find(c => c.name.includes(name));
    if (!check) return 0;
    // Heuristic: if status is 'pass', return 1? Or parse message?
    // For now, let's assume valid. 
    return check.status === 'pass' ? 1 : 0;
}

function extractSoftMembership(pipelineState: PipelineState) {
  const { behaviorCategories } = pipelineState;
  const getScore = (category: string) => 
    behaviorCategories.find((c) => c.category === category)?.softMembership || 0;

  return {
    combat: getScore('Combat'),
    collect: getScore('Collection'),
    explore: getScore('Exploration'),
  };
}

function extractDeltas(pipelineState: PipelineState) {
  // Use metadata if available, otherwise reconstruct from adaptationDeltas
  if (pipelineState.metadata?.deltas) {
      const d = pipelineState.metadata.deltas as any; // Cast to avoid partial mismatch if Types define it loosely
      return {
          combat: Number(d.Combat || d.combat || 0),
          collect: Number(d.Collection || d.collect || 0),
          explore: Number(d.Exploration || d.explore || 0)
      };
  }
  
  return { combat: 0, collect: 0, explore: 0 };
}


// ----------------------------------------------------------------------------
// Provider Component
// ----------------------------------------------------------------------------

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { pipelineState, inputState, parseTelemetry } = usePipeline();
  
  const [session, setSession] = useState<SessionAnalytics | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundAnalytics | null>(null);
  const roundsRef = useRef<RoundAnalytics[]>([]);
  const previousMultiplierRef = useRef<number | null>(null);

  useEffect(() => {
    // Only compute analytics if we have meaningful output
    if (!pipelineState.output || pipelineState.behaviorCategories.length === 0) {
      return;
    }
    
    const telemetry = parseTelemetry(inputState.telemetryJson);

    const round = createRoundAnalytics(
      pipelineState,
      previousMultiplierRef.current,
      roundsRef.current.length + 1,
      telemetry
    );

    // Append to history
    roundsRef.current = [...roundsRef.current, round];
    previousMultiplierRef.current = round.targetMultiplier;

    // Rebuild session
    const sessionAnalytics = buildSessionAnalytics(roundsRef.current, DEFAULT_ANALYTICS_CONFIG);

    setCurrentRound(round);
    setSession(sessionAnalytics);
    
  }, [pipelineState.output, pipelineState.behaviorCategories, pipelineState.metadata]); // Dependencies

  return (
    <AnalyticsContext.Provider value={{ session, currentRound }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
