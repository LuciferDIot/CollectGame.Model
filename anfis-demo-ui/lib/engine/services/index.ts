/**
 * ============================================================================
 * SIMULATION RUNNER SERVICE - THE BACKEND API ORCHESTRATOR
 * ============================================================================
 */

import { reconstructPipelineSteps } from './pipeline-reconstructor';
import { fetchSimulationResults } from './simulation-fetcher';
import { mapBackendToRoundAnalytics, mapBackendToUI } from './simulation-mapper';

export const runSimulationService = {
    fetchSimulationResults,
    mapBackendToUI,
    mapBackendToRoundAnalytics,
    reconstructPipelineSteps
};
