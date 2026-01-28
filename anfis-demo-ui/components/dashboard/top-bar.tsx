'use client';

import { Button } from '@/components/ui/button';
import { usePipeline } from '@/lib/pipeline-context';
import { BarChart3, Download, PlayCircle, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import { AnalyticsSlideOver } from './analytics-slide-over';

const EXAMPLE_TELEMETRY = {
  "_id": { "$oid": "6974894b48d53c4152cf142a" },
  "userId": { "$oid": "6974892348d53c4152cf1421" },
  "timestamp": { "$date": "2026-01-24T14:26:43.613Z" },
  "sessionId": "unreal_1769245003613",
  "itemsCollected": 12,
  "pickupAttempts": 15,
  "timeNearInteractables": 45,
  "enemiesHit": 8,
  "damageDone": 1240,
  "timeInCombat": 120,
  "distanceTraveled": 1944.99,
  "timeOutOfCombat": 1680,
  "timeSprinting": 340,
  "kills": 3,
  "died": false,
  "rawJson": {
    "user_id": "6974892348d53c4152cf1421",
    "session_id": "unreal_1769245003613",
    "timestamp": { "$date": "2026-01-24T14:26:43.613Z" },
    "items_collected": 12,
    "pickup_attempts": 15,
    "time_near_interactables": 45,
    "enemies_hit": 8,
    "damage_done": 1240,
    "time_in_combat": 120,
    "distance_traveled": 1944.99,
    "time_out_of_combat": 1680,
    "time_sprinting": 340,
    "kills": 3,
    "deaths": 0
  },
  "__v": 0
};

const EXAMPLE_DEATH_EVENTS = [
  {
    "_id": { "$oid": "69748b5b48d53c4152cf18cb" },
    "userId": { "$oid": "6974892348d53c4152cf1421" },
    "timestamp": { "$date": "2026-01-24T14:35:31.981Z" },
    "sessionId": "unreal_death_1769245531981",
    "location": "Forest_Zone_3",
    "cause": "Enemy_Attack",
    "__v": 0
  },
  {
    "_id": { "$oid": "69748b5c48d53c4152cf18cc" },
    "userId": { "$oid": "6974892348d53c4152cf1421" },
    "timestamp": { "$date": "2026-01-24T14:40:15.234Z" },
    "sessionId": "unreal_death_1769245815234",
    "location": "Cave_Zone_5",
    "cause": "Fall_Damage",
    "__v": 0
  }
];

export function TopBar() {
  const { runSimulation, resetDashboard } = usePipeline();
  const [stepByStep, setStepByStep] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleLoadExample = () => {
    window.dispatchEvent(new CustomEvent('loadExample', {
      detail: {
        telemetry: JSON.stringify(EXAMPLE_TELEMETRY, null, 2),
        deathEvents: JSON.stringify(EXAMPLE_DEATH_EVENTS, null, 2),
      },
    }));
  };

  const handleRun = async () => {
    setIsRunning(true);
    await runSimulation(stepByStep);
    setIsRunning(false);
  };

  const handleExport = () => {
    const state = { telemetry: EXAMPLE_TELEMETRY, deathEvents: EXAMPLE_DEATH_EVENTS };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telemetry-results.json';
    a.click();
  };

  return (
    <>
      <div className="h-20 border-b border-blue-500/10 bg-slate-950/50 backdrop-blur-sm flex items-center px-6 gap-6">
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold text-slate-100">Adaptive Telemetry Dashboard</h1>
            <p className="text-xs text-slate-400">ANFIS pipeline validation & analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/30 rounded-md cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={stepByStep} 
              onChange={(e) => setStepByStep(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span>Step-by-Step</span>
          </label>

          <div className="w-px h-6 bg-slate-700/50" />

          <Button 
            variant="outline"
            size="sm"
            onClick={handleLoadExample}
            title="Load example data"
            className="gap-2 h-9 bg-transparent"
          >
            <Upload size={16} />
            Example
          </Button>
          
          <Button 
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            title="Run simulation"
            className="gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            <PlayCircle size={16} />
            {isRunning ? 'Running...' : 'Run'}
          </Button>

          <Button 
            size="sm"
            onClick={() => setAnalyticsOpen(true)}
            title="Open analytics dashboard"
            className="gap-2 h-9 bg-cyan-600 hover:bg-cyan-500 text-white border-0"
          >
            <BarChart3 size={16} />
            Analytics
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={handleExport}
            title="Export results"
            className="gap-2 h-9 bg-transparent"
          >
            <Download size={16} />
            Export
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              resetDashboard();
              setIsRunning(false);
            }}
            title="Reset dashboard"
            className="gap-2 h-9"
          >
            <XCircle size={16} />
            Reset
          </Button>
        </div>
      </div>
      
      <AnalyticsSlideOver open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
    </>
  );
}
