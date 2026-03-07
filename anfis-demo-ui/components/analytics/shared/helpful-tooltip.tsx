'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useTutorial } from '@/lib/analytics/tutorial-context';
import { BookOpen, Calculator, HelpCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface HelpfulTooltipProps {
  trigger?: ReactNode;
  title: string;
  description: string;
  formula?: string;
  calculation?: string;
  interpretation?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function HelpfulTooltip({
  trigger,
  title,
  description,
  formula,
  calculation,
  interpretation,
}: HelpfulTooltipProps) {
  const { tutorialMode } = useTutorial();
  const technicalDetail = calculation || formula;

  // When tutorial mode is off, render the trigger passively (no dialog wrapper)
  if (!tutorialMode) {
    return trigger ? <>{trigger}</> : null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="cursor-pointer inline-flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity decoration-dotted underline-offset-2 hover:underline outline-none focus:ring-2 focus:ring-slate-400 rounded-sm">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-100">
            <BookOpen className="h-5 w-5 text-blue-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {technicalDetail && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                <Calculator className="h-4 w-4 text-emerald-400" />
                How it is calculated
              </h4>
              <div className="bg-slate-950/50 p-3 rounded-md border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {technicalDetail}
              </div>
            </div>
          )}

          {interpretation && (
             <div className="space-y-2">
               <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                 Interpretation
               </h4>
               <p className="text-sm text-emerald-400/90 italic border-l-2 border-emerald-500/50 pl-3">
                 {interpretation}
               </p>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
