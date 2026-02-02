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
    const { telemetry, reset } = body;

    // 3. Check the Rules (Validation)
    // We make sure the message has the parts we need (UserId, Features).
    const validationError = validatePayload(telemetry);
    if (validationError) {
      // If bad data, reject it nicely.
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // 4. Reset Memory (Optional)
    // If the game says "New Game", we wipe the brain's short-term memory.
    if (reset) {
      pipeline.reset();
    }

    // 5. Think! (Execution)
    // The Brain processes the data and decides on difficulty changes.
    // 5. Think! (Execution)
    // The Brain processes the data and decides on difficulty changes.
    // Construct backward-compatible death event from features

    const result = pipeline.process(
      telemetry as TelemetryWindow
    );

    // 6. Reply (Response)
    // Send the result back to the game.
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

// Simple check to see if the server is running
export async function GET() {
  return NextResponse.json({
    status: 'online',
    version: manifest.version,
    architecture: manifest.pipeline.anfis_architecture,
  });
}

// ------------------------------------------------------------------
// HELPER: VALIDATOR (The Bouncer)
// ------------------------------------------------------------------
// Checks if the incoming data is allowed in.
function validatePayload(telemetry: any): string | null {
  if (!telemetry) return 'Missing telemetry object (Empty envelope)';
  if (!telemetry.features) return 'Invalid Contract: Missing features (No game stats)';
  if (!telemetry.userId) return 'Invalid Contract: Missing userId (Who are you?)';
  return null;
}
