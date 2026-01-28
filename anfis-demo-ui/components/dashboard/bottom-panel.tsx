'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import { usePipeline } from '@/lib/pipeline-context';
import { AlertCircle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { MetricCard } from './metric-card';
import { RuleInspectorDrawer } from './rule-inspector-drawer';
import { AnalyticsTab } from './tabs/analytics-tab';



export function BottomPanel() {
  const { pipelineState } = usePipeline();
  const { session, currentRound } = useAnalytics(pipelineState);

  if (pipelineState.behaviorCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-900 to-slate-950 text-center p-6">
        <TrendingUp className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-sm text-slate-400">Run simulation to see analysis results</p>
      </div>
    );
  }

  return (
    <div data-analytics-panel className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      <Tabs defaultValue="behavior" className="flex flex-col h-full">
        <TabsList className="w-full bg-slate-900/50 border-b border-slate-700 justify-start px-6 py-0 h-auto rounded-none gap-6">
          <TabsTrigger value="behavior" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Behavior Analysis
          </TabsTrigger>
          <TabsTrigger value="adaptation" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Adaptation Results
          </TabsTrigger>
          <TabsTrigger value="validation" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Validation
          </TabsTrigger>
          <TabsTrigger value="model" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Model Metrics
          </TabsTrigger>
          <TabsTrigger value="archetypes" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Archetypes
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-none px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500">
            Analytics
          </TabsTrigger>
          <div className="ml-auto pr-4 flex items-center">
             <RuleInspectorDrawer />
          </div>
        </TabsList>

        {/* Metric Summary Cards */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-700/30">
          <div className="grid grid-cols-4 gap-3">
            {pipelineState.behaviorCategories.map((cat) => (
              <MetricCard
                key={cat.category}
                label={cat.category}
                value={(cat.softMembership * 100).toFixed(1)}
                suffix="%"
                color={
                  cat.category === 'Combat' ? 'combat' :
                  cat.category === 'Collection' ? 'collection' :
                  'exploration'
                }
                trend={cat.softMembership > 0.33 ? 'up' : 'down'}
                trendValue={`${cat.activityPercentage}% activity`}
              />
            ))}
            <MetricCard
              label="Confidence"
              value="94.5"
              suffix="%"
              color="neutral"
              trend="up"
              trendValue="High"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="behavior" className="m-0 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Soft Membership Distribution</h3>
            <div className="grid grid-cols-1 gap-3">
              {pipelineState.behaviorCategories.map((cat) => (
                <Card key={cat.category} className="bg-slate-800/50 border-slate-700">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-100">{cat.category}</h4>
                      <span className="text-xs bg-blue-950/60 text-blue-300 px-2.5 py-1 rounded-full font-medium">
                        {Math.round(cat.confidence * 100)}%
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Soft Membership</span>
                        <code className="text-slate-200 font-mono">{(cat.softMembership * 100).toFixed(1)}%</code>
                      </div>
                      <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                          style={{ width: `${cat.softMembership * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Activity</span>
                        <code className="text-slate-200 font-mono">{cat.activityPercentage}%</code>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="adaptation" className="m-0 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Adaptation Results</h3>
            <div className="grid grid-cols-1 gap-3">
              {pipelineState.behaviorCategories.map((cat) => (
                <Card key={`adapt-${cat.category}`} className="bg-slate-800/50 border-slate-700">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-100">{cat.category}</h4>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        cat.softMembership > 0.3
                          ? 'bg-green-950/60 text-green-300'
                          : 'bg-amber-950/60 text-amber-300'
                      }`}>
                        {cat.softMembership > 0.3 ? '+' : '-'}
                        {Math.abs(cat.softMembership * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      {cat.category === 'Combat'
                        ? 'Reduced combat frequency based on player profile'
                        : cat.category === 'Collection'
                          ? 'Increased collection efficiency through adaptive mechanics'
                          : 'Enhanced exploration mechanics to encourage discovery'}
                    </p>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Impact Intensity</span>
                        <span className="text-xs text-slate-300 font-mono">{(cat.softMembership * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            cat.softMembership > 0.5
                              ? 'bg-red-500'
                              : cat.softMembership > 0.3
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${cat.softMembership * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="validation" className="m-0 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-3">Validation Checks</h3>
              <div className="space-y-2">
                {pipelineState.validationChecks.map((check, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border flex items-start gap-3 ${
                      check.status === 'pass'
                        ? 'bg-green-950/20 border-green-900/30'
                        : 'bg-amber-950/20 border-amber-900/30'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {check.status === 'pass' ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-semibold text-slate-100">{check.name}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">{check.message}</p>
                    </div>
                    <span className={`text-xs font-mono px-2 py-1 rounded flex-shrink-0 ${
                      check.status === 'pass'
                        ? 'bg-green-950/50 text-green-300'
                        : 'bg-amber-950/50 text-amber-300'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <h4 className="text-xs font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <Info size={14} />
                Informational Notes
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/30">
                  <p className="text-xs font-medium text-blue-300 mb-1">Exploration Dominance</p>
                  <p className="text-xs text-blue-200/70">High exploration soft membership is expected and indicates healthy gameplay dynamics.</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/30">
                  <p className="text-xs font-medium text-blue-300 mb-1">Zero Combat Windows</p>
                  <p className="text-xs text-blue-200/70">Passive gameplay patterns detected. System has adapted accordingly.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="model" className="m-0 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">ANFIS Model Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-slate-300 mb-3">Training Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">MAE (Train)</span>
                      <code className="text-emerald-300 font-mono">0.0234</code>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">MAE (Test)</span>
                      <code className="text-emerald-300 font-mono">0.0267</code>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">R² Score</span>
                      <code className="text-blue-300 font-mono">0.9847</code>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-slate-300 mb-3">Model Architecture</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Hidden Layers</span>
                      <code className="text-slate-300 font-mono">[16, 8]</code>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Activation</span>
                      <code className="text-slate-300 font-mono">ReLU</code>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Training Samples</span>
                      <code className="text-slate-300 font-mono">2,847</code>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <Card className="bg-blue-950/20 border-blue-900/30">
              <div className="p-4">
                <p className="text-xs text-blue-300 mb-2">
                  <span className="font-semibold">Model Version:</span> v2.0-production
                </p>
                <p className="text-xs text-blue-200/70">
                  Trained on player telemetry spanning 30-minute sessions with balanced archetype representation.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="archetypes" className="m-0 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Behavior Archetypes</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-red-950/20 border-red-900/30">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-red-300 mb-3">Combat</h4>
                  <p className="text-xs text-slate-400 mb-3">High combat engagement, aggressive playstyle</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Combat %</span>
                      <span className="text-red-300 font-mono">~65%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Collection %</span>
                      <span className="text-slate-500 font-mono">~15%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Exploration %</span>
                      <span className="text-slate-500 font-mono">~20%</span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="bg-amber-950/20 border-amber-900/30">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-amber-300 mb-3">Collection</h4>
                  <p className="text-xs text-slate-400 mb-3">Resource-focused, strategic gathering</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Combat %</span>
                      <span className="text-slate-500 font-mono">~20%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Collection %</span>
                      <span className="text-amber-300 font-mono">~60%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Exploration %</span>
                      <span className="text-slate-500 font-mono">~20%</span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="bg-cyan-950/20 border-cyan-900/30">
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-cyan-300 mb-3">Exploration</h4>
                  <p className="text-xs text-slate-400 mb-3">Discovery-oriented, passive gameplay</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Combat %</span>
                      <span className="text-slate-500 font-mono">~10%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Collection %</span>
                      <span className="text-slate-500 font-mono">~15%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Exploration %</span>
                      <span className="text-cyan-300 font-mono">~75%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <Card className="bg-slate-800/50 border-slate-700">
              <div className="p-4">
                <h4 className="text-xs font-semibold text-slate-300 mb-3">Current Session Classification</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Closest Archetype</span>
                      <span className="text-cyan-300 font-semibold">Exploration</span>
                    </div>
                    <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${pipelineState.softMembership?.explore ? pipelineState.softMembership.explore * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 font-mono">
                    {pipelineState.softMembership?.explore ? (pipelineState.softMembership.explore * 100).toFixed(1) : '0'}% match
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="m-0 h-full">
            <AnalyticsTab session={session} currentRound={currentRound} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
