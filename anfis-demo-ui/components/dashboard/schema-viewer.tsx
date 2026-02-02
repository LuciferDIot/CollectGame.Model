'use client';

import { Card } from '@/components/ui/card';
import { MODEL_FEATURES } from '@/lib/config/models';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const TELEMETRY_SCHEMA = [
  ...MODEL_FEATURES.map(feature => ({
    field: feature,
    type: 'number',
    required: true,
    description: `Model feature: ${feature}`
  })),
  { field: 'deathCount', type: 'number', required: false, description: 'Total deaths in this window (Optional)' },
];

export function SchemaViewer() {
  const [showSchema, setShowSchema] = useState(false);

  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <button
        onClick={() => setShowSchema(!showSchema)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/20 transition-colors"
      >
        <span className="text-xs font-semibold text-slate-200">Schema Expectations</span>
        <ChevronDown 
          size={16} 
          className="text-slate-400 transition-transform"
          style={{ transform: showSchema ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {showSchema && (
        <div className="border-t border-slate-700/50 p-3 space-y-2">
          <p className="text-xs font-medium text-slate-300 mb-2">Expected Telemetry Fields:</p>
          <ul className="space-y-2">
            {TELEMETRY_SCHEMA.map((field) => (
              <li key={field.field} className="text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <code className="text-blue-300 font-mono text-xs">{field.field}</code>
                    <span className="text-slate-500 ml-1">({field.type})</span>
                    <p className="text-slate-400 mt-0.5 text-[10px] leading-relaxed">{field.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
