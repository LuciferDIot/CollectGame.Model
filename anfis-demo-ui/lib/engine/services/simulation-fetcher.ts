/**
 * ============================================================================
 * SIMULATION FETCHER - THE API REQUEST HANDLER
 * ============================================================================
 * 
 * === WHAT THIS FILE DOES ===
 * This is the "MESSENGER" that carries data between the UI and the AI brain.
 * 
 * Think of it like ordering food delivery:
 * 1. You (UI) tell the messenger what you want
 * 2. Messenger goes to the restaurant (API endpoint)
 * 3. Restaurant (ANFIS Pipeline) prepares your order
 * 4. Messenger brings it back to you
 * 
 * === THE API REQUEST JOURNEY ===
 * 
 * STEP 1: Package the Data
 * ------------------------
 * We take player game data and wrap it in a format the API understands.
 * Like putting items in a shipping box with a label.
 * 
 * STEP 2: Send to API Endpoint
 * ----------------------------
 * We make an HTTP POST request to '/api/pipeline'
 * This is like knocking on the door of the AI brain's office.
 * 
 * STEP 3: Wait for Response
 * -------------------------
 * The AI brain processes the data (takes a few milliseconds)
 * We wait patiently for the answer.
 * 
 * STEP 4: Handle Success or Failure
 * ---------------------------------
 * If successful: We get back difficulty adjustments!
 * If failed: We throw an error so the UI can show a helpful message.
 * 
 * ============================================================================
 */

import { DeathEvent, TelemetryFeatures } from '../../types';
import { PipelineOutput as BackendPipelineOutput } from '../types';

/**
 * ============================================================================
 * MAIN FUNCTION: fetchSimulationResults()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Sends player data to our AI brain (ANFIS Pipeline API) and waits for the
 * difficulty adjustment recommendations to come back.
 * 
 * === FOR NON-PROGRAMMERS ===
 * Imagine you're at a doctor's office:
 * - You describe your symptoms (telemetry data)
 * - Doctor runs tests (AI processes data)
 * - You get a diagnosis and prescription (difficulty adjustments)
 * 
 * === PARAMETERS EXPLAINED ===
 * 
 * @param telemetry - Player's game performance data
 *   Example: 
 *   {
 *     enemiesHit: 25,        // How many shots landed
 *     damageDone: 450,       // Total damage dealt
 *     kills: 8,              // Enemies defeated
 *     itemsCollected: 12,    // Loot picked up
 *     distanceTraveled: 1500 // Meters moved
 *   }
 * 
 * @param deathEvents - When/where the player died (optional)
 *   Example:
 *   [{
 *     userId: "player_123",
 *     timestamp: "2024-01-01T10:30:00Z",
 *     location: "Level 3, Boss Room"
 *   }]
 * 
 * @param userId - Unique identifier for this player
 *   Example: "player_12345" or "sim-user"
 *   Used to track individual player behavior over time
 * 
 * @returns Promise<BackendPipelineOutput>
 *   The AI's recommendations, including:
 *   - Difficulty multiplier (e.g., 1.2 = 20% harder)
 *   - Player behavior analysis (Combat-focused? Explorer?)
 *   - Specific parameter adjustments (enemy health, spawn rates, etc.)
 * 
 * ============================================================================
 */
export async function fetchSimulationResults(
    telemetry: TelemetryFeatures, 
    deathEvents: DeathEvent[] | null, 
    userId: string = 'sim-user'
): Promise<BackendPipelineOutput> {
    
    // ========================================
    // STEP 1: PREPARE THE REQUEST PAYLOAD
    // ========================================
    // Package all the data into a format the API expects
    
    const requestBody = { 
        // Player's game data with metadata
        telemetry: { 
            userId: userId,                        // Who is this?
            timestamp: new Date().toISOString(),   // When did they play?
            features: telemetry                    // What did they do?
        }, 
        
        // Death information (if any)
        // Using the first death event, or empty object if none
        deaths: deathEvents?.[0] || {} 
    };
    
    console.log('📤 Sending request to API:', {
        endpoint: '/api/pipeline',
        player: userId,
        actionsTracked: Object.keys(telemetry).length,
        hasDeaths: !!deathEvents
    });
    
    // ========================================
    // STEP 2: MAKE THE API REQUEST
    // ========================================
    // Send data to the backend and wait for response
    
    const response = await fetch('/api/pipeline', {
        method: 'POST',                          // We're sending data
        headers: { 
            'Content-Type': 'application/json'   // Data format
        },
        body: JSON.stringify(requestBody)       // Convert to JSON string
    });

    // ========================================
    // STEP 3: CHECK FOR ERRORS
    // ========================================
    // Did something go wrong?
    
    if (!response.ok) {
        console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText
        });
        
        throw new Error(`API Error: ${response.statusText}`);
    }

    // ========================================
    // STEP 4: PARSE AND RETURN THE RESPONSE
    // ========================================
    // Convert the JSON response back into JavaScript objects
    
    const result = await response.json();
    
    console.log('✅ Received AI recommendations:', {
        multiplier: result.target_multiplier,
        playerStyle: result.soft_membership,
        processingTime: result.performance_timings?.total
    });

    return result;
}

/**
 * ============================================================================
 * ERROR HANDLING EXPLAINED
 * ============================================================================
 * 
 * === WHAT COULD GO WRONG? ===
 * 
 * 1. NETWORK ERRORS
 *    - No internet connection
 *    - API server is down
 *    - Request timeout
 *    Solution: The error is thrown and caught by the calling function,
 *             which can show a "Try again" message to the user
 * 
 * 2. INVALID DATA
 *    - Missing required fields
 *    - Malformed telemetry data
 *    - Wrong data types
 *    Solution: API returns 400 Bad Request, we throw an error with details
 * 
 * 3. SERVER ERRORS
 *    - Bug in the AI processing code
 *    - Out of memory
 *    - Database issues
 *    Solution: API returns 500 Internal Server Error, we log it for debugging
 * 
 * === HOW WE HANDLE IT ===
 * 
 * ```typescript
 * try {
 *     const result = await fetchSimulationResults(...);
 *     // Success! Use the data
 * } catch (error) {
 *     console.error("Something went wrong:", error);
 *     showErrorToUser("Unable to get AI recommendations. Please try again.");
 * }
 * ```
 * 
 * ============================================================================
 */
