// ------------------------------------------------------------------
// API GATEWAY (The Front Door)
// ------------------------------------------------------------------
// This file acts as the "Receptionist" for our system.
// 1. It receives data from the Game (Unreal Engine or Web Demo).
// 2. It checks if the data looks correct (Validation).
// 3. It wakes up the AI Brain (Pipeline) to process the data.
// 4. It sends the answer (Adaptation) back to the Game.
// ------------------------------------------------------------------

import { ANFISPipeline } from '@/lib/engine';
import type { TelemetryWindow } from '@/lib/engine/types';
import { NextRequest, NextResponse } from 'next/server';

// Load Standard Model Artifacts (The "Knowledge" learned during training)
import mlpWeights from '@/models/anfis_mlp_weights.json';
import centroids from '@/models/cluster_centroids.json';
import manifest from '@/models/deployment_manifest.json';
import scalerParams from '@/models/scaler_params.json';

// ------------------------------------------------------------------
// PATTERN: SINGLETON (Ensure we only have ONE Brain)
// ------------------------------------------------------------------
// Concept: Loading the AI brain takes memory and time. We don't want to
// create a new brain for every single message.
// Solution: We create it ONCE and keep it alive in this variable.
// ------------------------------------------------------------------
let pipelineInstance: ANFISPipeline | null = null;

function getPipeline() {
  // If we already have a focused brain, use it!
  if (pipelineInstance) return pipelineInstance;

  try {
    console.log('Initializing ANFIS Pipeline System... (Waking up the Brain)');
    // Create the Brain for the first time
    pipelineInstance = new ANFISPipeline(
      scalerParams,
      centroids,
      mlpWeights,
      manifest
    );
    console.log('Pipeline Brain Online.');
    return pipelineInstance;
  } catch (error) {
    console.error('CRITICAL: Pipeline Initialization Failed', error);
    throw error;
  }
}

// ------------------------------------------------------------------
// API HANDLER (The "POST" Method)
// ------------------------------------------------------------------
// This function runs every time the Game sends us data.
// ------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // 1. Wake up the Brain
    const pipeline = getPipeline();
    
    // 2. Read the Message
    const body = await request.json();
    // NEW SCHEMA: userId is at root, telemetry contains the features directly
    const { userId, telemetry, reset } = body;

    console.log('\n🔵 [API] Incoming Pipeline Request:');
    console.log(JSON.stringify({ userId, telemetry, reset }, null, 2));

    // 3. Check the Rules (Validation)
    const validationError = validatePayload(telemetry, userId);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // 4. Reset Memory (Optional)
    if (reset) {
      pipeline.reset();
    }

    // 5. Think! (Execution)
    // Construct internal TelemetryWindow from the new flattened API schema
    const internalTelemetry: TelemetryWindow = {
        userId: userId,
        timestamp: new Date().toISOString(), // Generate server-side timestamp
        features: telemetry, // The 'telemetry' in body IS the features object now
        duration: 30 // Default to trained window duration
    };

    const result = pipeline.process(internalTelemetry);

    console.log('🟢 [API] Outgoing Pipeline Response:');
    console.log(JSON.stringify(result, null, 2));

    // 6. Reply (Response)
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Runtime Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown Internal Error',
      },
      { status: 500 }
    );
  }
}

// ... existing GET ...

// ------------------------------------------------------------------
// HELPER: VALIDATOR (The Bouncer)
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
  'deathCount'
];

function validatePayload(features: any, userId: any): string | null {
  if (!userId) return 'Invalid Contract: Missing userId (Who are you?)';
  if (!features) return 'Missing telemetry object (Empty envelope)';
  
  // Strict check for every required field
  for (const field of REQUIRED_TELEMETRY_FIELDS) {
    if (features[field] === undefined || features[field] === null) {
      return `Invalid Contract: Missing required telemetry field '${field}'`;
    }
  }

  return null;
}
