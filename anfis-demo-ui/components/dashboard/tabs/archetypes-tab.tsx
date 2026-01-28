
import { Card } from '@/components/ui/card';
import { usePipeline } from '@/lib/pipeline-context';
import { RadarChart } from '../radar-chart';

export function ArchetypesTab() {
  const { pipelineState } = usePipeline();

  return (
    <div className="m-0 p-6 space-y-6">
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
    </div>
  );
}
