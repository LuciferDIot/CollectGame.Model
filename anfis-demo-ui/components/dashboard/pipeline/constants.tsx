import { Activity, ArrowDown, BrainCircuit, CheckCircle2, GitBranch, Layers, ShieldCheck, Zap } from 'lucide-react';
import React from 'react';

// Step ID to Icon mapping
export const STEP_ICONS: Record<string, React.ReactNode> = {
  '1': <ArrowDown className="w-4 h-4" />,
  '2': <Layers className="w-4 h-4" />,
  '3': <GitBranch className="w-4 h-4" />,
  '4': <Activity className="w-4 h-4" />,
  '5': <BrainCircuit className="w-4 h-4" />,
  '6': <Zap className="w-4 h-4" />, // Adaptation Analysis
  '7': <ShieldCheck className="w-4 h-4" />,
  '8': <CheckCircle2 className="w-4 h-4" />,
};

// Map step IDs to educational content keys
export const STEP_CONTENT_KEYS: Record<string, string> = {
  '1': 'telemetry_health',
  '2': 'input_normalization',
  '3': 'fuzzy_partition',
  '4': 'rule_firing_strength',
  '5': 'rule_firing_strength',
  '6': 'adaptive_parameter_tuning',
  '7': 'clamp_usage',
  '8': 'multiplier_mean',
};
