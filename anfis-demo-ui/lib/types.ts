// Core types for ANFIS Telemetry Pipeline

export interface TelemetryFeatures {
  [key: string]: number;
}

export interface DeathEvent {
  timestamp: number;
  location?: string;
  [key: string]: any;
}

export interface NormalizedFeatures {
  [key: string]: number[];
}

export interface SoftMembership {
  combat: number;
  collect: number;
  explore: number;
}

export interface BehaviorCategory {
  category: 'Combat' | 'Collection' | 'Exploration';
  softMembership: number;
  activityPercentage: number;
  confidence: number;
}

export interface AdaptationDelta {
  field: string;
  before: number;
  after: number;
  category: 'Combat' | 'Collection' | 'Exploration';
  intensity: 'low' | 'medium' | 'high';
}

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  input: any;
  output: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

export interface RuleFired {
  ruleName: string;
  strength: number;
}

export interface PipelineState {
  steps: PipelineStep[];
  normalizedFeatures: NormalizedFeatures | null;
  softMembership: SoftMembership | null;
  behaviorCategories: BehaviorCategory[];
  adaptationDeltas: AdaptationDelta[];
  validationChecks: ValidationCheck[];
  rulesFired: RuleFired[];
  modelMetrics?: {
    r2Score: number;
    maeTest: number;
    mseTest: number;
    rmseTest: number;
  };
  isRunning: boolean;
  executionTime: number;
  // Added for Analytics compatibility
  output?: {
    adjustedMultiplier: number;
    ruleActivations: any[]; // Using any to avoid circular dependency
    confidence: number;
  } | null;
  metadata?: {
    deltas?: {
      combat: number;
      collect: number;
      explore: number;
    };
  };
  error?: string | null;
}

export interface DashboardInputState {
  telemetryJson: string;
  deathEventsJson: string;
  telemetryError: string | null;
  deathEventsError: string | null;
}

export interface SchemaExpectation {
  field: string;
  type: string;
  required: boolean;
}
