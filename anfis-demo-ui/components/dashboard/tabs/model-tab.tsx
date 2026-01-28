
import { AnfisArchitecture } from './model/anfis-architecture';
import { DeltaMetrics } from './model/delta-metrics';
import { InferenceRules } from './model/inference-rules';
import { PerformanceMetrics } from './model/performance-metrics';
import { PreprocessingInfo } from './model/preprocessing-info';
import { ValidationStatus } from './model/validation-status';

export function ModelTab() {
  return (
    <div className="m-0 p-6 space-y-6">
      <h3 className="text-sm font-semibold text-slate-100 mb-4">ANFIS Pipeline Analytics</h3>
      
      <DeltaMetrics />
      <ValidationStatus />
      <PreprocessingInfo />
      <AnfisArchitecture />
      <InferenceRules />
      <PerformanceMetrics />
    </div>
  );
}
