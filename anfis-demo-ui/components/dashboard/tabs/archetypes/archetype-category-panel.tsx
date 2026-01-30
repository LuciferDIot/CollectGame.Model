import { Card } from "@/components/ui/card";
import { Category, Delta, PipelineState } from "@/lib/types";
import { cn, getBgColor, getTextColor } from "@/lib/utils";

interface ArchetypeCategoryPanelProps {
  maxSoftCatString: Category;
  pipelineState: PipelineState;
  onMetricSelect?: (key: string) => void;
}

const getCategoryText = (category: string) => {
  switch (category) {
    case 'Combat':
      return 'High combat engagement, aggressive playstyle';
    case 'Collection':
      return 'Resource-focused, strategic gathering';
    case 'Exploration':
      return 'Discovery-oriented, passive gameplay';
    default:
      return '';
  }
} 

const getCategoryInstruction = (category: string) => {
  switch (category) {
    case 'Combat':
      return 'stronger combat alignment';
    case 'Collection':
      return 'stronger collection alignment';
    case 'Exploration':
      return 'stronger exploration alignment';
    default:
      return '';
  }
} 


const getCategoryDelta = (category: string, deltas: Delta
) => deltas[category.toLowerCase() as keyof Delta];

export function ArchetypeCategoryPanel({ pipelineState, onMetricSelect, maxSoftCatString }: ArchetypeCategoryPanelProps) {

  return (
    <>
      <div className="grid grid-cols-3 gap-4" >
        {pipelineState.behaviorCategories.map((cat) => (
          <Card 
            key={cat.category}
            onClick={() => onMetricSelect?.(`archetype_${cat.category.toLowerCase()}`)}
            className="bg-red-950/20 border-red-900/30 cursor-pointer hover:bg-red-950/30 transition-all group"
          >
            <div className="p-4 flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-red-300 mb-3 group-hover:text-red-200 transition-colors">{cat.category}</h4>
              <p className="text-xs text-slate-400">{getCategoryText(cat.category)}</p>
              <div className="space-y-2 pointer-events-none">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{cat.category} % </span>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    getTextColor(cat.category)
                  )}>{(cat.softMembership * 100).toFixed(0)}%</span>
                </div>
                {
                pipelineState.metadata?.deltas && 
                <div>
                  <span className="text-slate-400">Delta</span>
                  <span className="text-slate-500 font-mono">{getCategoryDelta(cat.category, pipelineState.metadata?.deltas)}</span>
                </div>
                }
              </div>
              {maxSoftCatString===cat.category && 
              <p className={cn(
                    "h-full text-xs tracking-wider opacity-50 rounded-md text-center p-1",
                    getTextColor(cat.category),
                    getBgColor(cat.category)
                  )}>{getCategoryInstruction(cat.category)}</p>}
            </div>
          </Card>
          ))}
      </div>
    </>
    
  );
}