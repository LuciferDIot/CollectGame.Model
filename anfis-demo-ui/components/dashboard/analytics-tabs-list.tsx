
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RuleInspectorDrawer } from './rule-inspector-drawer';

export function AnalyticsTabsList() {
  return (
    <div className="px-6 pt-2 pb-4">
      <TabsList className="w-full flex items-center bg-slate-950/60 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/60 shadow-inner">
        <TabsTrigger 
          value="behavior" 
          className="flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          Behavior
        </TabsTrigger>
        <TabsTrigger 
          value="adaptation" 
          className="flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          Adaptation
        </TabsTrigger>
        <TabsTrigger 
          value="archetypes" 
          className="flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          Archetypes
        </TabsTrigger>
        <TabsTrigger 
          value="model" 
          className="flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          Model
        </TabsTrigger>
        
        {/* Separator for Rule Inspector */}
        <div className="w-px h-6 bg-slate-800 mx-2" />
        
        <div className="flex items-center px-1">
          <RuleInspectorDrawer />
        </div>
      </TabsList>
    </div>
  );
}
