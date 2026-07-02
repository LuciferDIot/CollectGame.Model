'use client';

import { Card } from '@/components/ui/card';

interface InputStatusProps {
    json: string;
}

export function InputStatus({ json }: InputStatusProps) {
    let telemetryFieldCount = 0;
    try {
      if (json) {
        const parsed = JSON.parse(json);
        telemetryFieldCount = Object.keys(parsed).length;
      }
    } catch (e) {
      // Invalid JSON
    }
    
    if (telemetryFieldCount > 0) {
      return (
        <Card className="bg-blue-500/10 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/50">
          <div className="p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Telemetry:</span> {telemetryFieldCount} field{telemetryFieldCount !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>
      );
    }
    return null;
}
