// Runtime Analytics Types for ANFIS v2.2 Inference Diagnostics
// Read-only metrics - no model training or modification

export interface SoftMembership {
  combat: number;
  collect: number;
  explore: number;
}

export interface DeltaMetrics {
  combat: number;
  collect: number;
  explore: number;
}

export interface ClampStatus {
  lower: boolean;
  upper: boolean;
}

export type Archetype = 'combat' | 'collect' | 'explore';
export type ResponsivenessLevel = 'responsive' | 'under-responsive' | 'noisy';

export interface RoundAnalytics {
  roundNumber: number;
  targetMultiplier: number;
  deltaFromPrevious: number | null; // null for first round
  softMembership: SoftMembership;
  deltas: DeltaMetrics;
  isClamped: ClampStatus;
  dominantArchetype: Archetype;
  membershipSum: number;
  timestamp: number;
}

export interface RollingStats {
  mean: number;
  std: number;
  window: number;
}

export interface ClampStatistics {
  lower: number; // percentage
  upper: number; // percentage
  total: number; // percentage
}

export interface SessionAnalytics {
  rounds: RoundAnalytics[];
  currentRound: number;
  
  // Rolling statistics (last N rounds)
  rollingMean: number | null;
  rollingStd: number | null;
  
  // Session-level aggregates
  avgMultiplier: number;
  stdMultiplier: number;
  clampPercentage: ClampStatistics;
  
  // Behavioral insights
  dominantArchetypeDistribution: Record<Archetype, number>; // percentages
  avgDeltaMagnitude: number;
  responsivenessScore: ResponsivenessLevel;
  responsivenessCorrelation: number;
  history: RoundAnalytics[]; // Alias for rounds, used by UI components
}

export interface AnalyticsConfig {
  rollingWindow: number; // default 10
  clampLower: number; // 0.6
  clampUpper: number; // 1.4
  starvationThreshold: number; // 0.05
  starvationRounds: number; // 5
  stagnationThreshold: number; // 0.80
  deltaNoiseThreshold: number; // 0.01
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  rollingWindow: 10,
  clampLower: 0.6,
  clampUpper: 1.4,
  starvationThreshold: 0.05,
  starvationRounds: 5,
  stagnationThreshold: 0.80,
  deltaNoiseThreshold: 0.01,
};
