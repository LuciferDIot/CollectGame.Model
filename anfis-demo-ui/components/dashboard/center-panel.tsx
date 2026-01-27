'use client';

import { usePipeline } from '@/lib/pipeline-context';
import { AlertCircle, CheckCircle, ChevronDown, Zap } from 'lucide-react';
import { useState } from 'react';

const STEP_NAMES = [
  'Input Validation',
  'Feature Normalization',
  'Membership Calculation',
  'Rule Aggregation',
  'Defuzzification',
  'Behavior Classification',
  'Adaptation Computation',
  'Output Generation',
];

const STEP_EXPLANATIONS = [
  'Checking if your game data is in the correct format and all required fields are present.',
  'Converting raw game stats (like distance traveled) into standard values the AI can understand.',
  'Calculating how much this player matches different playstyles (Combat, Collection, Exploration).',
  'Combining multiple behavior signals to understand the player\'s overall gaming style.',
  'Converting AI predictions into concrete difficulty adjustment values.',
  'Determining if this player is Combat-focused, Collector, or Explorer based on their actions.',
  'Deciding exactly how to adjust game difficulty (spawn rates, enemy health, loot drops, etc.).',
  'Packaging the difficulty adjustments into a format your game can use immediately.',
];

export function CenterPanel() {
  const { pipelineState } = usePipeline();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  if (pipelineState.steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-900 to-slate-950 text-center p-6">
        <Zap className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-sm text-slate-400">Load telemetry data and run simulation to see pipeline execution</p>
      </div>
    );
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
          {pipelineState.steps.map((step, idx) => {
            const isExpanded = expandedStep === idx;
            const stepName = STEP_NAMES[idx] || step.name;
            const statusColors = {
              completed: 'bg-green-950/20 border-green-900/30',
              running: 'bg-blue-950/20 border-blue-900/30',
              error: 'bg-red-950/20 border-red-900/30',
              pending: 'bg-slate-800/20 border-slate-700/30',
            };

            return (
              <button
                key={step.id}
                onClick={() => setExpandedStep(isExpanded ? null : idx)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${statusColors[step.status]} hover:border-slate-600/50`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && <CheckCircle size={18} className="text-green-400" />}
                    {step.status === 'error' && <AlertCircle size={18} className="text-red-400" />}
                    {step.status === 'running' && <Zap size={18} className="text-blue-400 animate-pulse" />}
                    {step.status === 'pending' && <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-600 border-t-blue-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-slate-500">Step {idx + 1}</span>
                      <span className="text-sm font-medium text-slate-100 truncate">{stepName}</span>
                    </div>
                  </div>

                  <ChevronDown
                    size={16}
                    className="flex-shrink-0 text-slate-400 transition-transform"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-3">
                    {/* User-friendly explanation */}
                    <div className="bg-blue-950/20 border border-blue-900/30 rounded p-3">
                      <p className="text-xs font-semibold text-blue-300 mb-1">💡 What this means:</p>
                      <p className="text-xs text-blue-100 leading-relaxed">
                        {STEP_EXPLANATIONS[idx] || 'Processing pipeline step...'}
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
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
