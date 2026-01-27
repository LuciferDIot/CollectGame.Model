'use client';

import { PipelineProvider } from '@/lib/pipeline-context';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';

export default function Home() {
  return (
    <PipelineProvider>
      <DashboardContainer />
    </PipelineProvider>
  );
}
