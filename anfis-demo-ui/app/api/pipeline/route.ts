// API Route: POST /api/pipeline
// Processes telemetry through the complete ANFIS pipeline

import { ANFISPipeline } from '@/lib/pipeline';
import type { DeathEvent, TelemetryWindow } from '@/lib/pipeline/types';
import { NextRequest, NextResponse } from 'next/server';

// Load model artifacts
import mlpWeights from '@/models/anfis_mlp_weights.json';
import centroids from '@/models/cluster_centroids.json';
import manifest from '@/models/deployment_manifest.json';
import scalerParams from '@/models/scaler_params.json';

// Initialize pipeline (singleton)
// Lazy initialization of pipeline to catch startup errors
let pipelineInstance: ANFISPipeline | null = null;

function getPipeline() {
  if (pipelineInstance) return pipelineInstance;

  try {
    console.log('Initializing ANFIS Pipeline...');
    pipelineInstance = new ANFISPipeline(
      scalerParams,
      centroids,
      mlpWeights,
      manifest
    );
    console.log('Pipeline initialized successfully.');
    return pipelineInstance;
  } catch (error) {
    console.error('Failed to initialize pipeline:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const pipeline = getPipeline();
    const body = await request.json();
    
    const { telemetry, deaths, reset } = body;

    // Validate input
    if (!telemetry || !telemetry.features) {
      console.warn('Invalid pipeline input: Missing telemetry features');
      return NextResponse.json(
        { error: 'Missing telemetry data' },
        { status: 400 }
      );
    }

    // Reset if requested
    if (reset) {
      pipeline.reset();
    }

    // Process telemetry
    console.log('Processing pipeline request...');
    const result = pipeline.process(
      telemetry as TelemetryWindow,
      deaths as DeathEvent | undefined
    );
    console.log('Pipeline processing complete.');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pipeline API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    version: manifest.version,
    architecture: manifest.pipeline.anfis_architecture,
  });
}
