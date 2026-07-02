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
import { useTutorial } from '@/lib/analytics/tutorial-context';
import { BookOpen, Calculator, HelpCircle, Info, Lightbulb } from 'lucide-react';
import { ReactNode } from 'react';

interface EducationalDrawerProps {
  contentKey: string;
  trigger?: ReactNode;
}

export function EducationalDrawer({ contentKey, trigger }: EducationalDrawerProps) {
  const { tutorialMode } = useTutorial();
  const content = METRIC_EXPLANATIONS[contentKey];

  // When tutorial mode is off, render the trigger passively (no sheet wrapper)
  if (!tutorialMode) {
    return trigger ? <>{trigger}</> : null;
  }

  if (!content) {
    return <>{trigger}</>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted/50">
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-background/98 backdrop-blur-xl border-l border-border text-foreground overflow-hidden shadow-2xl flex flex-col">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="p-6 pb-4 border-b border-border/50 relative z-10 bg-muted/30">
            <SheetHeader>
            <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded bg-primary/10 border border-primary/20">
                    <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <span>
                    {content.title}
                </span>
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm leading-relaxed mt-2 font-light">
                {content.what}
            </SheetDescription>
            </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-10">
           
           {/* 2. WHY */}
           <section className="space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
                 <Lightbulb className="w-4 h-4" />
                 Strategic Value
              </h4>
              <p className="text-sm text-foreground/80 leading-relaxed bg-amber-500/5 dark:bg-amber-950/10 p-4 rounded-lg border-l-2 border-amber-500/40 font-light">
                 {content.why}
              </p>
           </section>

           {/* 3. COMPUTED */}
           <section className="space-y-4">
              <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-500">
                    <Calculator className="w-4 h-4" />
                    Computation
                  </h4>
                  <div className="text-xs font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-500/5 dark:bg-cyan-950/20 p-3 rounded border border-cyan-500/20 shadow-inner">
                     {content.computed}
                  </div>
              </div>

              <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                     <Info className="w-4 h-4" />
                     Interpretation
                  </h4>
                  <div className="pl-4 border-l border-emerald-500/30 space-y-1">
                      <p className="text-xs text-emerald-700 dark:text-emerald-200/80 italic leading-relaxed">
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
