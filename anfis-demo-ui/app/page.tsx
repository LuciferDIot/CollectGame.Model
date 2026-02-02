'use client';

import { DashboardContainer } from '@/components/dashboard/dashboard-container';
import { AnalyticsProvider } from '@/lib/analytics-context';
import { PipelineProvider } from '@/lib/session/pipeline-context';

export default function Home() {
  return (
    <PipelineProvider>
      <AnalyticsProvider>
        <DashboardContainer />
      </AnalyticsProvider>
    </PipelineProvider>
  );
}
