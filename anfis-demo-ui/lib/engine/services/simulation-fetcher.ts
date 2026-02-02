import { DeathEvent, TelemetryFeatures } from '../../types';
import { PipelineOutput as BackendPipelineOutput } from '../types';

/**
 * Sends the telemetry data to the backend API.
 */
export async function fetchSimulationResults(
    telemetry: TelemetryFeatures, 
    deathEvents: DeathEvent[] | null, 
    userId: string = 'sim-user'
): Promise<BackendPipelineOutput> {
     const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            telemetry: { 
                userId: userId, 
                timestamp: new Date().toISOString(), 
                features: telemetry 
            }, 
            deaths: deathEvents?.[0] || {} 
        })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
}
