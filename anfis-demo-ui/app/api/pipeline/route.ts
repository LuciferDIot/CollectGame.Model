// ------------------------------------------------------------------
// POST /api/pipeline  -- Legacy compatibility shim
// ------------------------------------------------------------------
// The canonical inference endpoint is now POST /api/pipeline/adapt.
// This file forwards requests there to avoid breaking existing callers
// during the transition period.
// New integrations should target /api/pipeline/adapt directly.
// ------------------------------------------------------------------

import { ANFISPipeline } from '@/lib/engine';
import type { TelemetryWindow } from '@/lib/engine/types';
import { NextRequest, NextResponse } from 'next/server';

import mlpWeights from '@/models/anfis_mlp_weights.json';
import centroids from '@/models/cluster_centroids.json';
import manifest from '@/models/deployment_manifest.json';
import scalerParams from '@/models/scaler_params.json';

// globalThis keeps the instance alive across HMR module reloads in Next.js dev mode.
// A plain module-level variable gets wiped every time the file is re-evaluated,
// which resets the session manager and breaks sequential delta tracking.
declare global {
  // eslint-disable-next-line no-var
  var _anfisLegacyPipeline: ANFISPipeline | undefined;
}

function getPipeline() {
  if (globalThis._anfisLegacyPipeline) return globalThis._anfisLegacyPipeline;

  try {
    console.log('[/api/pipeline] Initializing ANFIS pipeline...');
    globalThis._anfisLegacyPipeline = new ANFISPipeline(scalerParams, centroids, mlpWeights, manifest);
    console.log('[/api/pipeline] Pipeline ready.');
    return globalThis._anfisLegacyPipeline;
  } catch (error) {
    console.error('[/api/pipeline] Initialization failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const pipeline = getPipeline();
    const body = await request.json();
    const { userId, telemetry, reset } = body;

    console.log('[/api/pipeline] Incoming request for user:', userId);

    const validationError = validatePayload(telemetry, userId);
    if (validationError) {
      console.error('[/api/pipeline] Validation error:', validationError);
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (reset) {
      pipeline.reset();
    }

    const internalTelemetry: TelemetryWindow = {
      userId,
      timestamp: new Date().toISOString(),
      features: telemetry,
      duration: 30,
    };

    const result = pipeline.process(internalTelemetry);

    console.log('[/api/pipeline] target_multiplier:', result.target_multiplier);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[/api/pipeline] Runtime error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

const REQUIRED_TELEMETRY_FIELDS = [
  'enemiesHit',
  'damageDone',
  'timeInCombat',
  'kills',
  'itemsCollected',
  'pickupAttempts',
  'timeNearInteractables',
  'distanceTraveled',
  'timeSprinting',
  'timeOutOfCombat',
  'deathCount',
];

function validatePayload(features: any, userId: any): string | null {
  if (!userId) return 'Missing userId';
  if (!features) return 'Missing telemetry object';

  for (const field of REQUIRED_TELEMETRY_FIELDS) {
    if (features[field] === undefined || features[field] === null) {
      return `Missing required telemetry field '${field}'`;
    }
  }

  return null;
}
