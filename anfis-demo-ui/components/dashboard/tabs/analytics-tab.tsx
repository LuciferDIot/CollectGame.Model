'use client';

import {
    ClampMonitor,
    DeltaMonitor,
    MembershipDiagnostics,
    PredictionHealth,
    ResponsivenessIndicator,
    SessionSummary,
} from '@/components/analytics';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RoundAnalytics, SessionAnalytics } from '@/lib/analytics';

interface AnalyticsTabProps {
  session: SessionAnalytics | null;
  currentRound: RoundAnalytics | null;
}

export function AnalyticsTab({ session, currentRound }: AnalyticsTabProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Runtime Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Inference diagnostics for ANFIS v2.2 Option B (frozen model - no training metrics)
          </p>
        </div>

        {/* Two-column layout for main metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prediction Health */}
          <PredictionHealth session={session} currentRound={currentRound} />

          {/* Clamp Monitor */}
          <ClampMonitor session={session} currentRound={currentRound} />
        </div>

        {/* Three-column layout for behavioral insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Membership Diagnostics */}
          <MembershipDiagnostics session={session} currentRound={currentRound} />

          {/* Delta Monitor */}
          <DeltaMonitor session={session} currentRound={currentRound} />

          {/* Responsiveness Indicator */}
          <ResponsivenessIndicator session={session} />
        </div>

        {/* Session Summary - Full Width */}
        <div>
          <SessionSummary session={session} />
        </div>

        {/* Footer Notice */}
        {session && (
          <div className="border-t pt-6 mt-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">About These Metrics</h3>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  <strong>Read-only diagnostics</strong> - computed from inference outputs, no training involved
                </li>
                <li>
                  <strong>No accuracy metrics</strong> - R²/MAE require ground truth (training phase only)
                </li>
                <li>
                  <strong>Stability focus</strong> - detecting drift, saturation, and collapse at runtime
                </li>
                <li>
                  <strong>Option B validation</strong> - confirms delta-driven variance is working as designed
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
