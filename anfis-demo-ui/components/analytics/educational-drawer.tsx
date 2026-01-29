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
import { AlertCircle, BookOpen, HelpCircle, Info } from 'lucide-react';
import { ReactNode } from 'react';

interface EducationalDrawerProps {
  contentKey: string;
  trigger?: ReactNode;
}

export function EducationalDrawer({ contentKey, trigger }: EducationalDrawerProps) {
  const content = METRIC_EXPLANATIONS[contentKey];

  if (!content) {
    // console.warn(`Missing educational content for key: ${contentKey}`);
    return <>{trigger}</>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="text-slate-500 hover:text-blue-400 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-slate-950 border-l border-slate-800 text-slate-200 overflow-y-auto">
        <SheetHeader className="pb-6 border-b border-slate-800">
          <SheetTitle className="text-2xl font-bold text-slate-100 flex items-center gap-3">
             <BookOpen className="w-6 h-6 text-blue-500" />
             {content.title}
          </SheetTitle>
          <SheetDescription className="text-slate-400 text-base">
            {content.what}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 pt-8">
           {/* 2. WHY */}
           <section className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-500">
                 <AlertCircle className="w-4 h-4" />
                 Why This Matters
              </h4>
              <p className="text-slate-300 leading-relaxed bg-amber-950/20 p-4 rounded-lg border border-amber-900/30">
                 {content.why}
              </p>
           </section>

           {/* 3. COMPUTED */}
           <section className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-500">
                 <Info className="w-4 h-4" />
                 Conceptual & Computation
              </h4>
              <div className="text-slate-300 leading-relaxed space-y-4">
                 <p>{content.computed}</p>
                 <div className="pl-4 border-l-2 border-slate-700 space-y-2">
                     <p className="text-sm text-slate-400 italic">"How to Read"</p>
                     <p>{content.reading}</p>
                 </div>
              </div>
           </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
