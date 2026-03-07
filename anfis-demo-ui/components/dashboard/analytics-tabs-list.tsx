
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RuleInspectorDrawer } from './rule-inspector-drawer';

export function AnalyticsTabsList() {
  return (
    <div className="px-2 sm:px-4 py-1.5 sm:py-2">
      <TabsList className="w-full flex items-center bg-slate-950/60 backdrop-blur-md p-1 rounded-lg sm:p-1.5 sm:rounded-xl border border-slate-800/60 shadow-inner overflow-x-auto scrollbar-none">
        <TabsTrigger
          value="behavior"
          className="flex-1 rounded-lg py-2.5 text-[10px] xs:text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-linear-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 whitespace-nowrap"
        >
          Behavior
        </TabsTrigger>
        <TabsTrigger
          value="adaptation"
          className="flex-1 rounded-lg py-2.5 text-[10px] xs:text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-linear-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 whitespace-nowrap"
        >
          Adaptation
        </TabsTrigger>
        <TabsTrigger
          value="archetypes"
          className="flex-1 rounded-lg py-2.5 text-[10px] xs:text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-linear-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          Archetypes
        </TabsTrigger>
        <TabsTrigger
          value="model"
          className="flex-1 rounded-lg py-2.5 text-[10px] xs:text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-linear-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          Model
        </TabsTrigger>

        {/* Separator for Rule Inspector - Hidden on mobile if cramped */}
        <div className="hidden sm:block w-px h-6 bg-slate-800 mx-1.5" />

        <div className="flex items-center px-1 shrink-0">
          <RuleInspectorDrawer />
        </div>
      </TabsList>
    </div>
  );
}
