// ------------------------------------------------------------------
// POST /api/pipeline/adapt  -- Runtime Inference Endpoint
// ------------------------------------------------------------------
// Contract:
//   Request  -> { userId, telemetry: TelemetryFeatures, reset?: boolean }
//   Response -> { target_multiplier, adapted_parameters, ... PipelineOutput }
//
// Distinct from the telemetry ingestion backend (POST /api/unreal/telemetry),
// which only stores raw gameplay data.  This endpoint runs the full ANFIS
// pipeline and returns the adapted PCG parameters for the current window.
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
  var _anfisAdaptPipeline: ANFISPipeline | undefined;
}

function getPipeline() {
  if (globalThis._anfisAdaptPipeline) return globalThis._anfisAdaptPipeline;

  try {
    console.log('[/api/pipeline/adapt] Initializing ANFIS Pipeline...');
    globalThis._anfisAdaptPipeline = new ANFISPipeline(scalerParams, centroids, mlpWeights, manifest);
    console.log('[/api/pipeline/adapt] Pipeline online.');
    return globalThis._anfisAdaptPipeline;
  } catch (error) {
    console.error('[/api/pipeline/adapt] CRITICAL: Initialization failed', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const pipeline = getPipeline();
    const body = await request.json();
    const { userId, telemetry, reset } = body;

    console.log('[/api/pipeline/adapt] Incoming request for user:', userId);

    const validationError = validatePayload(telemetry, userId);
    if (validationError) {
      console.error('[/api/pipeline/adapt] Validation failed:', validationError);
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

    console.log('[/api/pipeline/adapt] target_multiplier:', result.target_multiplier,
      '| clamped:', result.validation?.multiplier_clamped);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[/api/pipeline/adapt] Runtime error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown internal error' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// HELPER: Payload validation
// ------------------------------------------------------------------
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
