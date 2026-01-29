'use client';

import { EducationalDrawer } from '@/components/analytics/educational-drawer';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Database } from 'lucide-react';

interface TelemetryPanelProps {
  features: { name: string; value: number }[];
}

export function TelemetryPanel({ features }: TelemetryPanelProps) {
  return (
    <div className="xl:col-span-3 flex flex-col gap-3 min-h-[300px]">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <Database className="w-3.5 h-3.5" />
        <EducationalDrawer
          contentKey="input_normalization"
          trigger={
            <span className="text-xs font-bold uppercase tracking-wider font-mono cursor-help hover:text-blue-400 transition-colors border-b border-dotted border-slate-600">
              01. Normalized Telemetry
            </span>
          }
        />
      </div>
      <Card className="flex-1 bg-slate-950/50 border-slate-800 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="bg-slate-900/80 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="text-xs font-mono h-8 text-slate-500">Feature Variable</TableHead>
                <TableHead className="text-xs font-mono h-8 text-right text-slate-500">Norm. Val</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-8">
                    Waiting for input...
                  </TableCell>
                </TableRow>
              ) : (
                features.map((f, i) => (
                  <TableRow key={i} className="hover:bg-slate-900/40 border-slate-800/50">
                    <TableCell className="py-2 text-xs font-medium text-slate-300 font-mono">
                      {f.name.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="py-2 text-xs font-mono text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500/70"
                            style={{ width: `${Math.min(f.value * 100, 100)}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs",
                          f.value > 0.8 ? "text-amber-400" :
                          f.value < 0.2 ? "text-slate-500" : "text-blue-300"
                        )}>
                          {f.value.toFixed(3)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
