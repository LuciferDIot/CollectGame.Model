
import { Card } from '@/components/ui/card';

export function PreprocessingInfo() {
  return (
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
  );
}
