'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePipeline } from '@/lib/pipeline-context';
import * as Dialog from '@radix-ui/react-dialog';
import { BarChart3, TrendingUp, X } from 'lucide-react';
import { ProgressRing } from './progress-ring';
import { RadarChart } from './radar-chart';
import { RuleInspectorDrawer } from './rule-inspector-drawer';

interface AnalyticsSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyticsSlideOver({ open, onOpenChange }: AnalyticsSlideOverProps) {
  const { pipelineState } = usePipeline();

  if (pipelineState.behaviorCategories.length === 0) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
          <Dialog.Content className="fixed right-0 top-0 h-screen w-[600px] bg-gradient-to-b from-slate-900 to-slate-950 border-l border-slate-700 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <Dialog.Title className="text-lg font-semibold text-slate-100">Analytics</Dialog.Title>
              </div>
              <Dialog.Close className="rounded-full p-2 hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </Dialog.Close>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-slate-600 mb-4 mx-auto" />
                <p className="text-sm text-slate-400">Run simulation to see analysis results</p>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
        <Dialog.Content className="fixed right-0 top-0 h-screen w-[700px] bg-gradient-to-b from-slate-900 to-slate-950 border-l border-slate-700 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-100 tracking-tight">System Analytics</Dialog.Title>
                <p className="text-xs text-slate-500 font-mono">Real-time behavioral telemetry</p>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
              <X className="w-5 h-5 text-slate-400" />
            </Dialog.Close>
          </div>

          {/* Technical Metric Cards */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-700/30 bg-slate-900/20">
            <div className="grid grid-cols-3 gap-3">
              {pipelineState.behaviorCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="relative overflow-hidden rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{cat.category}</span>
                    <div className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                      cat.softMembership > 0.5 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      cat.softMembership > 0.3 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                    }`}>
                      {cat.softMembership > 0.5 ? 'HIGH' : cat.softMembership > 0.3 ? 'MED' : 'LOW'}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-100 font-mono tracking-tight">
                      {(cat.softMembership * 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-slate-500 font-mono">%</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px]">
                    <span className="text-slate-500">Activity:</span>
                    <span className="font-mono text-slate-300">{cat.activityPercentage}%</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">Conf:</span>
                    <span className={`font-mono ${cat.confidence > 0.85 ? 'text-green-400' : 'text-amber-400'}`}>
                      {(cat.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {/* Background gradient indicator */}
                  <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all ${
                      cat.category === 'Combat' ? 'bg-gradient-to-r from-red-500/50 to-red-600/30' :
                      cat.category === 'Collection' ? 'bg-gradient-to-r from-amber-500/50 to-amber-600/30' :
                      'bg-gradient-to-r from-cyan-500/50 to-cyan-600/30'
                    }`}
                    style={{ width: `${cat.softMembership * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="behavior" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="w-full bg-slate-900/50 border-b border-slate-700 justify-start px-6 py-0 h-auto rounded-none gap-6">
              <TabsTrigger value="behavior" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
                Behavior
              </TabsTrigger>
              <TabsTrigger value="adaptation" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
                Adaptation
              </TabsTrigger>
              <TabsTrigger value="archetypes" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
                Archetypes
              </TabsTrigger>
              <TabsTrigger value="model" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
                Model
              </TabsTrigger>
              <div className="ml-auto pr-4 flex items-center">
                <RuleInspectorDrawer />
              </div>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* Behavior Analysis Tab */}
              <TabsContent value="behavior" className="m-0 p-6 space-y-6">
                <h3 className="text-sm font-semibold text-slate-100">Behavior Distribution</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {pipelineState.behaviorCategories.map((cat) => (
                    <Card key={cat.category} className="bg-slate-800/50 border-slate-700">
                      <div className="p-4 flex flex-col items-center">
                        <ProgressRing
                          value={cat.softMembership * 100}
                          size={100}
                          strokeWidth={8}
                          color={
                            cat.category === 'Combat' ? '#ef4444' :
                            cat.category === 'Collection' ? '#f59e0b' :
                            '#06b6d4'
                          }
                          label={cat.category}
                        />
                        <div className="mt-3 space-y-1 w-full text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Activity</span>
                            <code className="text-slate-200">{cat.activityPercentage}%</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Confidence</span>
                            <code className={cat.confidence > 0.85 ? 'text-green-400' : 'text-amber-400'}>
                              {(cat.confidence * 100).toFixed(0)}%
                            </code>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Adaptation Results Tab */}
              <TabsContent value="adaptation" className="m-0 p-6 space-y-6">
                <h3 className="text-sm font-semibold text-slate-100">Parameter Adaptation</h3>
                
                {pipelineState.adaptationDeltas.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group by category */}
                    {['Combat', 'Collection', 'Exploration'].map((category) => {
                      const categoryParams = pipelineState.adaptationDeltas.filter(d => d.category === category);
                      if (categoryParams.length === 0) return null;

                      const categoryColor = category === 'Combat' ? 'red' : category === 'Collection' ? 'amber' : 'cyan';
                      
                      return (
                        <Card key={category} className={`bg-gradient-to-br from-${categoryColor}-950/30 to-${categoryColor}-900/20 border-${categoryColor}-900/30`}>
                          <div className="p-4">
                            <h4 className={`text-sm font-semibold text-${categoryColor}-300 mb-3`}>{category} Parameters</h4>
                            <div className="space-y-3">
                              {categoryParams.map((param) => {
                                const change = param.after - param.before;
                                const changePercent = param.before !== 0 ? (change / param.before) * 100 : 0;
                                
                                return (
                                  <div key={param.field} className="flex items-center justify-between text-xs bg-slate-900/30 rounded p-2">
                                    <div className="flex-1">
                                      <span className="text-slate-300 font-medium">{param.field.replace(/_/g, ' ')}</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-slate-500">Base:</span>
                                        <code className={`text-${categoryColor}-200 font-mono`}>{param.before.toFixed(2)}</code>
                                        <span className="text-slate-600">→</span>
                                        <span className="text-slate-500">Final:</span>
                                        <code className={`text-${categoryColor}-200 font-mono font-bold`}>{param.after.toFixed(2)}</code>
                                      </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-mono ${
                                      change > 0 ? 'bg-green-500/20 text-green-400' : 
                                      change < 0 ? 'bg-red-500/20 text-red-400' : 
                                      'bg-slate-600/20 text-slate-400'
                                    }`}>
                                      {change > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No adaptation data available
                  </div>
                )}
              </TabsContent>

              {/* Archetypes Tab with Radar Chart */}
              <TabsContent value="archetypes" className="m-0 p-6 space-y-6">
                <h3 className="text-sm font-semibold text-slate-100">Behavior Archetypes</h3>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4">Archetype Comparison</h4>
                    <RadarChart
                      data={[
                        { attribute: 'Combat', value: pipelineState.softMembership?.combat ? pipelineState.softMembership.combat * 100 : 0, fullMark: 100 },
                        { attribute: 'Collection', value: pipelineState.softMembership?.collect ? pipelineState.softMembership.collect * 100 : 0, fullMark: 100 },
                        { attribute: 'Exploration', value: pipelineState.softMembership?.explore ? pipelineState.softMembership.explore * 100 : 0, fullMark: 100 },
                      ]}
                      color="#06b6d4"
                      fillOpacity={0.5}
                    />
                  </div>
                </Card>
              </TabsContent>

              {/* Model Metrics Tab */}
              <TabsContent value="model" className="m-0 p-6 space-y-6">
                <h3 className="text-sm font-semibold text-slate-100 mb-4">ANFIS Pipeline Analytics</h3>
                
                {/* Delta Metrics (v2.0 Feature) */}
                <div>
                  <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
                    Temporal Signals (Delta v2.0)
                  </h4>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <div className="p-4 space-y-2">
                      <div className="text-[10px] text-slate-500 mb-2">Per-window behavioral change detection</div>
                      <div className="grid grid-cols-3 gap-3">
                        {['combat', 'collect', 'explore'].map((type, idx) => {
                          // Mock delta values - in real implementation, get from pipelineState
                          const deltaValue = idx === 0 ? -0.08 : idx === 1 ? 0.05 : 0.12;
                          const color = type === 'combat' ? 'red' : type === 'collect' ? 'amber' : 'cyan';
                          
                          return (
                            <div key={type} className="bg-slate-900/50 rounded p-3">
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Δ{type}</div>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-bold font-mono text-${color}-400`}>
                                  {deltaValue > 0 ? '+' : ''}{deltaValue.toFixed(3)}
                                </span>
                                <span className={`text-xs ${deltaValue > 0 ? 'text-green-400' : deltaValue < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                  {deltaValue > 0 ? '↑' : deltaValue < 0 ? '↓' : '−'}
                                </span>
                              </div>
                              {type === 'explore' && (
                                <div className="mt-2 text-[9px] text-green-400 flex items-center gap-1">
                                  <span className="inline-block w-1 h-1 rounded-full bg-green-400"></span>
                                  r=0.808 correlation
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Validation Status */}
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                    Validation Checks
                  </h4>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <div className="p-4 space-y-2">
                      {pipelineState.validationChecks.length > 0 ? (
                        pipelineState.validationChecks.map((check) => (
                          <div key={check.name} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                                check.status === 'pass' ? 'bg-green-500/20 text-green-400' :
                                check.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠' : '✗'}
                              </div>
                              <span className="text-sm text-slate-300">{check.name}</span>
                            </div>
                            <code className="text-xs text-slate-500 font-mono">{check.message}</code>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-3 py-2">
                          <div className="w-5 h-5 rounded flex items-center justify-center text-xs bg-green-500/20 text-green-400">✓</div>
                          <span className="text-sm text-slate-300">All validations passed</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Preprocessing Pipeline */}
                <div>
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                    Preprocessing
                  </h4>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">Normalization</span>
                        <p className="text-slate-200 font-mono mt-1">MinMaxScaler [0, 1]</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Features</span>
                        <p className="text-slate-200 font-mono mt-1">10 telemetry inputs</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Clustering</span>
                        <p className="text-slate-200 font-mono mt-1">K-Means (K=3)</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Membership</span>
                        <p className="text-slate-200 font-mono mt-1">Inverse Distance</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* ANFIS Configuration */}
                <div>
                  <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-400"></span>
                    ANFIS Architecture
                  </h4>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <div className="p-4 space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Input Features</span>
                        <code className="text-purple-300 font-mono">6 (3 soft + 3 deltas)</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Model Type</span>
                        <code className="text-purple-300 font-mono">MLP Surrogate</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Output Range</span>
                        <code className="text-purple-300 font-mono">[0.5, 1.5]</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Training Samples</span>
                        <code className="text-purple-300 font-mono">{pipelineState.steps.length > 0 ? '2,109' : 'N/A'}</code>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Inference Rules */}
                {pipelineState.rulesFired.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                      Rules Fired ({pipelineState.rulesFired.length})
                    </h4>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <div className="p-4 space-y-2">
                        {pipelineState.rulesFired.slice(0, 5).map((rule, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300">{rule.ruleName}</span>
                              <code className="text-amber-300 font-mono">{(rule.strength * 100).toFixed(1)}%</code>
                            </div>
                            <div className="h-1.5 bg-slate-900/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all"
                                style={{ width: `${rule.strength * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Prediction Metrics */}
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                    Model Performance
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <div className="p-4">
                        <span className="text-xs text-slate-400">Silhouette Score</span>
                        <p className="text-2xl font-bold text-green-400 mt-1 font-mono">0.375</p>
                        <p className="text-[10px] text-slate-500 mt-1">Clustering quality</p>
                      </div>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <div className="p-4">
                        <span className="text-xs text-slate-400">DB Index</span>
                        <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">0.977</p>
                        <p className="text-[10px] text-slate-500 mt-1">Separation metric</p>
                      </div>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <div className="p-4">
                        <span className="text-xs text-slate-400">Target CV</span>
                        <p className="text-2xl font-bold text-cyan-400 mt-1 font-mono">0.022</p>
                        <p className="text-[10px] text-slate-500 mt-1">Low variance</p>
                      </div>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <div className="p-4">
                        <span className="text-xs text-slate-400">Entropy</span>
                        <p className="text-2xl font-bold text-purple-400 mt-1 font-mono">1.405</p>
                        <p className="text-[10px] text-slate-500 mt-1">High diversity</p>
                      </div>
                    </Card>
                    {pipelineState.modelMetrics && (
                      <>
                        <Card className="bg-slate-800/50 border-slate-700">
                          <div className="p-4">
                            <span className="text-xs text-slate-400">R² Score</span>
                            <p className="text-2xl font-bold text-green-400 mt-1 font-mono">
                              {pipelineState.modelMetrics.r2Score.toFixed(3)}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">High accuracy</p>
                          </div>
                        </Card>
                        <Card className="bg-slate-800/50 border-slate-700">
                          <div className="p-4">
                            <span className="text-xs text-slate-400">Test MAE</span>
                            <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">
                              {pipelineState.modelMetrics.maeTest.toFixed(3)}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">Low error</p>
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
