'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResponsivenessLevel, SessionAnalytics } from '@/lib/analytics';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ResponsivenessIndicatorProps {
  session: SessionAnalytics | null;
}

const responsivenessConfig: Record<
  ResponsivenessLevel,
  {
    icon: React.ReactNode;
    color: string;
    title: string;
    description: string;
  }
> = {
  responsive: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-green-600',
    title: 'Responsive',
    description:
      'Behavioral changes correlate with multiplier changes. Model is mapping inputs to outputs effectively.',
  },
  'under-responsive': {
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-yellow-600',
    title: 'Under-Responsive',
    description:
      'Behavioral changes detected but multiplier remains stable. Model may be saturating or underfitting the relationship.',
  },
  noisy: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-orange-600',
    title: 'Noisy',
    description:
      'Multiplier changes despite minimal behavioral changes. May indicate noise sensitivity or input instability.',
  },
};

export function ResponsivenessIndicator({ session }: ResponsivenessIndicatorProps) {
  if (!session || session.currentRound < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Behavioral Responsiveness</CardTitle>
          <CardDescription>Mapping quality heuristic</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {!session
              ? 'Run pipeline to see metrics'
              : 'Need at least 3 rounds for responsiveness analysis'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const config = responsivenessConfig[session.responsivenessScore];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Behavioral Responsiveness
          {config.icon}
        </CardTitle>
        <CardDescription>
          Heuristic indicator of mapping quality (not accuracy)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
          <div className="text-center space-y-2">
            <div className={`flex items-center justify-center gap-2 ${config.color}`}>
              {config.icon}
              <span className="text-2xl font-bold">{config.title}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">{config.description}</p>
          </div>
        </div>

        {/* Heuristic Logic */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="text-sm font-semibold">Detection Logic</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                ✓ Responsive
              </Badge>
              <span>|Δ behavior| ↑ AND |ΔM| ↑</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                ⚠ Under-Responsive
              </Badge>
              <span>|Δ behavior| ↑ AND |ΔM| ≈ 0</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                ⚠ Noisy
              </Badge>
              <span>|Δ behavior| ≈ 0 AND |ΔM| ↑</span>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="border-t pt-4 bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <strong>Note:</strong> This is a <strong>heuristic diagnostic</strong>, not a measure
            of prediction correctness. It helps identify mapping quality issues during runtime
            inference without requiring ground truth labels.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
