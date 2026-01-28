'use client';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface HelpfulTooltipProps {
  trigger?: ReactNode;
  title: string;
  description: string;
  formula?: string;
  interpretation?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

// Removed local TooltipProvider here to rely on global or component-specific context if needed, 
// but actually, Radix TooltipProvider IS needed if not at root.
// We will keep it but add high z-index and ensure portal usage.
export function HelpfulTooltip({
  trigger,
  title,
  description,
  formula,
  interpretation,
  side = 'top'
}: HelpfulTooltipProps) {
  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help inline-flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity decoration-dotted underline-offset-2 hover:underline">
            {trigger || <HelpCircle className="h-4 w-4 text-muted-foreground" />}
          </span>
        </TooltipTrigger>
        <TooltipContent 
            side={side} 
            className="z-[9999] max-w-[320px] bg-slate-900 border-slate-700 p-4 shadow-2xl text-left"
            sideOffset={5}
            avoidCollisions={true}
        >
          <div className="space-y-3">
            <div>
              <h5 className="font-semibold text-sm text-slate-100 mb-1">{title}</h5>
              <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>
            
            {formula && (
              <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50">
                <p className="text-[10px] font-mono text-slate-300">{formula}</p>
              </div>
            )}
            
            {interpretation && (
              <div className="border-t border-slate-800 pt-2">
                 <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Interpretation</p>
                 <p className="text-xs text-emerald-400/90 italic">{interpretation}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
