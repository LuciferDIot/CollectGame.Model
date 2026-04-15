'use client';

import { EducationalDrawer } from '@/components/analytics/shared/educational-drawer';
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
import { useTutorial } from '@/lib/analytics/tutorial-context';
import { cn } from '@/lib/utils';
import { Database, HelpCircle } from 'lucide-react';

interface TelemetryPanelProps {
  features: { name: string; value: number }[];
  onMetricSelect?: (key: string) => void;
}

export function TelemetryPanel({ features, onMetricSelect }: TelemetryPanelProps) {
  const { tutorialMode } = useTutorial();

  return (
    <div className="xl:col-span-3 flex flex-col gap-3">
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

      {/* Normalization explainer -- tutorial mode only */}
      {tutorialMode && (
        <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-900/20 space-y-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">How to read these numbers</p>
            <EducationalDrawer
              contentKey="how_normalization_works"
              trigger={<span className="ml-1 text-[10px] text-cyan-600 hover:text-cyan-400 cursor-pointer underline underline-offset-2 decoration-dotted">deep dive</span>}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All values are <span className="text-slate-300 font-medium">normalised to a 0 - 1 scale</span> so the AI can compare them fairly.
            Raw game stats (meters, damage points, seconds) have completely different magnitudes -- you cannot compare 1,500 meters with 450 damage directly.
            By scaling each to [0, 1] they become comparable:
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <NormLegendBadge value="0.0" label="Minimum ever seen in training data" color="text-slate-500" barColor="bg-slate-700" />
            <NormLegendBadge value="0.5" label="About average for this feature" color="text-blue-400" barColor="bg-blue-500/70" />
            <NormLegendBadge value="1.0" label="Maximum ever seen in training data" color="text-amber-400" barColor="bg-amber-500/70" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            <span className="text-slate-400 font-medium">Formula:</span> normalized = (raw − min) / (max − min).
            Example: 10 kills with a range of 0 - 50 {"->"} (10 − 0) / 50 = <span className="text-blue-400 font-mono">0.200</span>.
            Click any row to learn what that feature means.
          </p>
        </div>
      )}

      <Card className="flex-1 bg-slate-950/50 border-slate-800 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="bg-slate-900/80 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="text-xs font-mono h-8 text-slate-500">Feature Variable</TableHead>
                <TableHead className="text-xs font-mono h-8 text-right text-slate-500">Norm. Val (0-1)</TableHead>
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
                features.map((f, i) => f.value > 0.001 && (
                  <TableRow
                    key={i}
                    onClick={() => tutorialMode && onMetricSelect?.(`feature_${f.name}`)}
                    className={cn("border-slate-800/50 transition-colors", tutorialMode ? "hover:bg-slate-900/40 cursor-pointer group" : "")}
                  >
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

function NormLegendBadge({ value, label, color, barColor }: { value: string; label: string; color: string; barColor: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded border border-slate-800/60 bg-slate-900/30">
      <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
      <div className={`w-full h-1 rounded-full ${barColor}`} />
      <p className="text-[10px] text-slate-500 text-center leading-tight">{label}</p>
    </div>
  );
}
