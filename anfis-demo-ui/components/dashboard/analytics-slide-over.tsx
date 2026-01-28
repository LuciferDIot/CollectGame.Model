'use client';

import { Tabs, TabsContent } from '@/components/ui/tabs';
import { usePipeline } from '@/lib/pipeline-context';
import * as Dialog from '@radix-ui/react-dialog';
import { BarChart3, TrendingUp, X } from 'lucide-react';
import { AnalyticsMetricsCards } from './analytics-metrics-cards';
import { AnalyticsTabsList } from './analytics-tabs-list';
import { AdaptationTab } from './tabs/adaptation-tab';
import { ArchetypesTab } from './tabs/archetypes-tab';
import { BehaviorTab } from './tabs/behavior-tab';
import { ModelTab } from './tabs/model-tab';

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
          <AnalyticsMetricsCards />

          {/* Tabs Content */}
          <Tabs defaultValue="behavior" className="flex flex-col flex-1 overflow-hidden">
            <AnalyticsTabsList />

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="behavior">
                <BehaviorTab />
              </TabsContent>

              <TabsContent value="adaptation">
                <AdaptationTab />
              </TabsContent>

              <TabsContent value="archetypes">
                <ArchetypesTab />
              </TabsContent>

              <TabsContent value="model">
                <ModelTab />
              </TabsContent>
            </div>
          </Tabs>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
