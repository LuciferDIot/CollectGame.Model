'use client';

import { usePipeline } from '@/lib/pipeline-context';
import { Activity, AlertCircle, BrainCircuit, CheckCircle, ChevronDown, Zap } from 'lucide-react';
import { useState } from 'react';
import { HelpfulTooltip } from '../analytics/helpful-tooltip';

// --- Constants & Data ---

interface StepDetail {
  name: string;
  explanation: string;
  calculation: string;
  interpretation: string;
}

const STEP_DETAILS: StepDetail[] = [
  {
    name: 'Input Validation',
    explanation: 'Checking if your game data is in the correct format and all required fields are present.',
    calculation: 'Schema_Check(Input) && Range_Check(Input)',
    interpretation: "Ensures trash data doesn't crash the engine."
  },
  {
    name: 'Feature Normalization',
    explanation: 'Converting raw game stats (like distance traveled) into standard values the AI can understand.',
    calculation: "x' = (x - min) / (max - min)",
    interpretation: "Squashes all inputs to 0.0-1.0 range for fair comparison."
  },
  {
    name: 'Membership Calculation',
    explanation: 'Calculating how much this player matches different playstyles (Combat, Collection, Exploration).',
    calculation: "μ(x) = 1 / (1 + |(x - c)/σ|²ᵇ)",
    interpretation: "Fuzzification: Determines 'degree of truth' for each rule."
  },
  {
    name: 'Rule Aggregation',
    explanation: "Combining multiple behavior signals to understand the player's overall gaming style.",
    calculation: "w_i = Π(μ_j(x_j))",
    interpretation: "Calculates the 'firing strength' of every If-Then rule."
  },
  {
    name: 'Defuzzification',
    explanation: 'Converting AI predictions into concrete difficulty adjustment values.',
    calculation: "Y = Σ(w_i * f_i) / Σ(w_i)",
    interpretation: "Center of Gravity (Centroid) method to merge rule outputs."
  },
  {
    name: 'Behavior Classification',
    explanation: 'Determining if this player is Combat-focused, Collector, or Explorer based on their actions.',
    calculation: "ArgMax(Soft_Memberships)",
    interpretation: "Identifies the single strongest behavior pattern."
  },
  {
    name: 'Adaptation Computation',
    explanation: 'Deciding exactly how to adjust game difficulty (spawn rates, enemy health, loot drops, etc.).',
    calculation: "Difficulty_Mult = Base + Model_Output_Delta",
    interpretation: "Applies the AI's wisdom to the actual game parameters."
  },
  {
    name: 'Output Generation',
    explanation: 'Packaging the difficulty adjustments into a format your game can use immediately.',
    calculation: "JSON_Serialize(Result)",
    interpretation: "Prepares the packet for the game client."
  }
];

const STATUS_COLORS = {
  completed: 'bg-green-950/20 border-green-900/30',
  running: 'bg-blue-950/20 border-blue-900/30',
  error: 'bg-red-950/20 border-red-900/30',
  pending: 'bg-slate-800/20 border-slate-700/30',
};

// --- Sub-Components ---

function EmptyPipelineView() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-slate-950 overflow-hidden text-center p-6">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none" />
      
      {/* Decorative Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-500/5 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-cyan-500/5 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
          <div className="relative w-16 h-16 bg-slate-900 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
             <BrainCircuit className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-slate-200 mb-2">ANFIS Pipeline Ready</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          System is standing by. Load telemetry data to visualize the neuro-fuzzy inference process.
        </p>
        
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
           <Activity className="w-3 h-3 animate-pulse text-green-400" />
           <span>Waiting for input stream...</span>
        </div>
      </div>
    </div>
  );
}

function PipelineStepItem({ 
  step, 
  index, 
  isExpanded, 
  onToggle 
}: { 
  step: any; 
  index: number; 
  isExpanded: boolean; 
  onToggle: () => void; 
}) {
  // Safe fallback for step details if index is out of bounds (though unlikely)
  const details = STEP_DETAILS[index] || {
    name: step.name,
    explanation: 'Processing pipeline step...',
    calculation: 'N/A',
    interpretation: 'N/A'
  };

  const statusColor = STATUS_COLORS[step.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-3 rounded-lg border transition-all ${statusColor} hover:border-slate-600/50`}
    >
      <div className="flex items-center gap-3">
        <StatusIcon status={step.status} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-mono text-slate-500">Step {index + 1}</span>
            <HelpfulTooltip
              trigger={<span className="text-sm font-medium text-slate-100 truncate cursor-pointer hover:underline hover:text-blue-300 transition-colors">{details.name}</span>}
              title={`Step ${index + 1}: ${details.name}`}
              description={details.explanation}
              calculation={details.calculation}
              interpretation={details.interpretation}
            />
          </div>
        </div>

        <ChevronDown
          size={16}
          className="flex-shrink-0 text-slate-400 transition-transform"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {isExpanded && <PipelineStepDetails step={step} details={details} />}
    </button>
  );
}

function StatusIcon({ status }: { status: string }) {
  return (
    <div className="flex-shrink-0">
      {status === 'completed' && <CheckCircle size={18} className="text-green-400" />}
      {status === 'error' && <AlertCircle size={18} className="text-red-400" />}
      {status === 'running' && <Zap size={18} className="text-blue-400 animate-pulse" />}
      {status === 'pending' && <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-600 border-t-blue-500" />}
    </div>
  );
}

function PipelineStepDetails({ step, details }: { step: any, details: StepDetail }) {
  return (
    <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-3">
      {/* User-friendly explanation */}
      <div className="bg-blue-950/20 border border-blue-900/30 rounded p-3">
        <p className="text-xs font-semibold text-blue-300 mb-1">💡 What this means:</p>
        <p className="text-xs text-blue-100 leading-relaxed">
          {details.explanation}
        </p>
      </div>
      
      {step.input && (
        <div>
          <p className="text-xs font-semibold text-slate-300 mb-2">Input</p>
          <pre className="text-xs bg-slate-900/50 rounded p-2 overflow-x-auto text-slate-300 font-mono">
            {JSON.stringify(step.input, null, 2)}
          </pre>
        </div>
      )}
      {step.output && (
        <div>
          <p className="text-xs font-semibold text-slate-300 mb-2">Output</p>
          <pre className="text-xs bg-slate-900/50 rounded p-2 overflow-x-auto text-slate-300 font-mono">
            {JSON.stringify(step.output, null, 2)}
          </pre>
        </div>
      )}
      {step.error && (
        <div className="bg-red-950/30 border border-red-900/30 rounded p-2">
          <p className="text-xs font-semibold text-red-300 mb-1">Error</p>
          <p className="text-xs text-red-200">{step.error}</p>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

export function CenterPanel() {
  const { pipelineState } = usePipeline();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  if (pipelineState.steps.length === 0) {
    return <EmptyPipelineView />;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Pipeline Execution</h2>
        {pipelineState.executionTime > 0 && (
          <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
            {pipelineState.executionTime.toFixed(0)}ms
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {pipelineState.steps.map((step, idx) => (
            <PipelineStepItem
              key={step.id}
              step={step}
              index={idx}
              isExpanded={expandedStep === idx}
              onToggle={() => setExpandedStep(expandedStep === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
