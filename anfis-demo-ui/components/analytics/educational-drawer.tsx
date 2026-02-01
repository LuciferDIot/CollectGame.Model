'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { METRIC_EXPLANATIONS } from '@/lib/analytics/educational-content';
import { BookOpen, Calculator, HelpCircle, Info, Lightbulb } from 'lucide-react';
import { ReactNode } from 'react';

interface EducationalDrawerProps {
  contentKey: string;
  trigger?: ReactNode;
}

export function EducationalDrawer({ contentKey, trigger }: EducationalDrawerProps) {
  const content = METRIC_EXPLANATIONS[contentKey];

  if (!content) {
    return <>{trigger}</>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="text-slate-500 hover:text-cyan-400 transition-colors p-1 rounded hover:bg-slate-800/50">
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-[#0b0d14]/95 backdrop-blur-xl border-l border-slate-800 text-slate-200 overflow-hidden shadow-2xl flex flex-col">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="p-6 pb-4 border-b border-slate-800/50 relative z-10 bg-slate-900/40">
            <SheetHeader>
            <SheetTitle className="text-xl font-bold text-slate-100 flex items-center gap-3">
                <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                    {content.title}
                </span>
            </SheetTitle>
            <SheetDescription className="text-slate-400 text-sm leading-relaxed mt-2 font-light">
                {content.what}
            </SheetDescription>
            </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
           
           {/* 2. WHY */}
           <section className="space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-500">
                 <Lightbulb className="w-4 h-4" />
                 Strategic Value
              </h4>
              <p className="text-sm text-amber-100/90 leading-relaxed bg-amber-950/10 p-4 rounded-lg border-l-2 border-amber-500/40 font-light">
                 {content.why}
              </p>
           </section>

           {/* 3. COMPUTED */}
           <section className="space-y-4">
              <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500">
                    <Calculator className="w-4 h-4" />
                    Computation
                  </h4>
                  <div className="text-xs font-mono text-cyan-300 bg-cyan-950/20 p-3 rounded border border-cyan-900/50 shadow-inner">
                     {content.computed}
                  </div>
              </div>

              <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
                     <Info className="w-4 h-4" />
                     Interpretation
                  </h4>
                  <div className="pl-4 border-l border-emerald-500/20 space-y-1">
                      <p className="text-xs text-emerald-200/80 italic leading-relaxed">
                        {content.reading}
                      </p>
                  </div>
              </div>
           </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
