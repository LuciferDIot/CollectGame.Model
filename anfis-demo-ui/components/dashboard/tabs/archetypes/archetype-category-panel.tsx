import { Card } from "@/components/ui/card";
import { BehaviorCategory } from "@/lib/types";
import { cn, getTextColor } from "@/lib/utils";

interface ArchetypeCategoryPanelProps {
  categories: BehaviorCategory[];
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

export function ArchetypeCategoryPanel({ categories, onMetricSelect }: ArchetypeCategoryPanelProps) {

  return (
    <div className="grid grid-cols-3 gap-4" >
      {categories.map((cat) => (
        <Card 
          key={cat.category}
          onClick={() => onMetricSelect?.(`archetype_${cat.category.toLowerCase()}`)}
          className="bg-red-950/20 border-red-900/30 cursor-pointer hover:bg-red-950/30 transition-all group"
        >
          <div className="p-4">
            <h4 className="text-sm font-semibold text-red-300 mb-3 group-hover:text-red-200 transition-colors">{cat.category}</h4>
            <p className="text-xs text-slate-400 mb-3">{getCategoryText(cat.category)}</p>
            <div className="space-y-2 pointer-events-none">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Combat % </span>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  getTextColor(cat.category)
                )}>{cat.softMembership.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Collection %</span>
                <span className="text-slate-500 font-mono">{cat.softMembership.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Exploration %</span>
                <span className="text-slate-500 font-mono">{cat.softMembership.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
    
  );
}