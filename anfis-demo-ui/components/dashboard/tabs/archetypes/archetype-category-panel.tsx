import { Card } from "@/components/ui/card";
import { Category, Delta, PipelineState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Activity, ArrowUpRight, Crosshair, Hexagon, Layers } from "lucide-react";

interface ArchetypeCategoryPanelProps {
  maxSoftCatString: Category;
  pipelineState: PipelineState;
  onMetricSelect?: (key: string) => void;
}

const getCategoryText = (category: string) => {
  switch (category) {
    case 'Combat':
      return 'High engagement, aggressive feedback loops';
    case 'Collection':
      return 'Resource-focused, strategic gatherings';
    case 'Exploration':
      return 'Discovery-oriented, spatial traversal';
    default:
      return '';
  }
} 

const getCategoryDelta = (category: string, deltas: Delta) => deltas[category as keyof Delta];

const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
  switch (category) {
    case 'Combat': return <Crosshair className={className} />;
    case 'Collection': return <Layers className={className} />;
    case 'Exploration': return <Hexagon className={className} />;
    default: return <Activity className={className} />;
  }
}

export function ArchetypeCategoryPanel({ pipelineState, onMetricSelect, maxSoftCatString }: ArchetypeCategoryPanelProps) {

  return (
      <div className="grid grid-cols-3 gap-4" >
        {pipelineState.behaviorCategories.map((cat) => {
          const isSelected = maxSoftCatString === cat.category;
          const delta = getCategoryDelta(cat.category, pipelineState.metadata?.deltas || {} as Delta) || 0;
          const isDeltaPositive = delta > 0;
          
          let colorStyles = "bg-slate-950/40 border-slate-800 hover:bg-slate-900/60";
          let activeBorder = "border-slate-700";
          let titleColor = "text-slate-400";
          let iconColor = "text-slate-600";
          
          switch (cat.category) {
            case 'Combat':
              colorStyles = "bg-red-950/10 hover:bg-red-950/20";
              activeBorder = "border-red-500/30";
              titleColor = "text-red-400";
              iconColor = "text-red-500/80";
              break;
            case 'Collection':
              colorStyles = "bg-cyan-950/10 hover:bg-cyan-950/20";
              activeBorder = "border-cyan-500/30";
              titleColor = "text-cyan-400";
              iconColor = "text-cyan-500/80";
              break;
            case 'Exploration':
              colorStyles = "bg-emerald-950/10 hover:bg-emerald-950/20";
              activeBorder = "border-emerald-500/30";
              titleColor = "text-emerald-400";
              iconColor = "text-emerald-500/80";
              break;
          }

          return (
            <Card 
              key={cat.category}
              onClick={() => onMetricSelect?.(`archetype_${cat.category.toLowerCase()}`)}
              className={cn(
                "relative cursor-pointer transition-all duration-300 group overflow-hidden backdrop-blur-sm",
                isSelected ? `border border-opacity-50 shadow-lg ${activeBorder}` : "border border-slate-800/60 opacity-80 hover:opacity-100",
                colorStyles
              )}
            >
              {isSelected && (
                  <div className={cn("absolute inset-0 opacity-10 pointer-events-none bg-linear-to-b from-transparent to-current", titleColor)} />
              )}
              
              <div className="p-4 flex flex-col h-full justify-between relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-md bg-slate-950/50 border border-white/5", iconColor)}>
                             <CategoryIcon category={cat.category} className="w-3.5 h-3.5" />
                        </div>
                        <h4 className={cn("text-xs font-bold uppercase tracking-wider", titleColor)}>
                        {cat.category}
                        </h4>
                    </div>
                    {isSelected && (
                         <div className="flex items-center gap-1">
                             <span className="relative flex h-1.5 w-1.5">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", iconColor.replace('text-', 'bg-').replace('/80', ''))}></span>
                                <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", iconColor.replace('text-', 'bg-').replace('/80', ''))}></span>
                            </span>
                         </div>
                    )}
                </div>

                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed font-medium min-h-[30px]">
                    {getCategoryText(cat.category)}
                </p>

                <div className="space-y-2 pointer-events-none bg-slate-950/30 p-2 rounded border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Affinity</span>
                    <span className={cn("text-sm font-mono font-bold", titleColor)}>
                        {(cat.softMembership * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  {pipelineState.metadata?.deltas && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Velocity</span>
                      <div className="flex items-center gap-1">
                          {Math.abs(delta) > 0.001 && <ArrowUpRight className={cn("w-2.5 h-2.5", isDeltaPositive ? "text-emerald-400 rotate-0" : "text-red-400 rotate-90")} />}
                          <span className={cn(
                            "text-xs font-mono",
                            isDeltaPositive ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-slate-600"
                          )}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(3)}
                          </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
  );
}