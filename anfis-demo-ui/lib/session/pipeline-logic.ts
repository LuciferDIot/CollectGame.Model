/**
 * ============================================================================
 * PIPELINE EXECUTION LOGIC - THE COMPLETE REQUEST-TO-RESPONSE FLOW
 * ============================================================================
 * 
 * === WHAT IS THIS FILE? ===
 * This file orchestrates the entire journey of a player's game data from the
 * moment it arrives to when we send back difficulty adjustments.
 * 
 * Think of it like a restaurant kitchen:
 * 1. Request comes in (customer orders food)
 * 2. We process it through multiple stations (prep, cook, plate)
 * 3. We send back the final result (serve the meal)
 * 
 * === THE BIG PICTURE ===
 * Player Game Data -> Our System -> Adjusted Difficulty Settings
 * 
 * === WHY DO WE NEED THIS? ===
 * Games need to be "just right" - not too hard, not too easy.
 * Our system watches how you play and adjusts the game difficulty in real-time!
 * 
 * ============================================================================
 */

import { runSimulationService } from '@/lib/engine/simulation-runner';
import type { DeathEvent, TelemetryFeatures as EngineFeatures } from '@/lib/engine/types';
import { PipelineState, PipelineStep } from '@/lib/types';
import { INITIAL_PIPELINE_STEPS } from './pipeline-constants';
import { buildFinalStateObject } from './state-builder';

/**
 * === DATA STRUCTURE: What We Return ===
 * 
 * This is like a receipt from our kitchen - it shows everything we did:
 * - backendResult: Raw response from our AI brain
 * - mappedState: Translated data for the UI to display
 * - roundAnalytics: Statistics about this round of gameplay
 * - completedSteps: A step-by-step log of what we processed
 */
export interface SimulationExecutionResult {
    backendResult: any;           // What the AI said
    mappedState: Partial<PipelineState>;  // UI-friendly version
    roundAnalytics: any;          // Performance stats
    completedSteps: PipelineStep[];       // Processing history
}

/**
 * ============================================================================
 * MAIN FUNCTION: executePipelineLogic()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * This is the "HEAD CHEF" that coordinates everything.
 * It takes player data and returns difficulty adjustments.
 * 
 * === THE 4-STEP PROCESS ===
 * 
 * STEP 1: Fetch from Backend (Get AI Recommendations)
 * ------------------------------------------------
 * We send player data to our AI brain (ANFIS Pipeline).
 * The AI analyzes: "Is this player struggling? Bored? Engaged?"
 * Returns: A difficulty multiplier (e.g., 1.2 = make it 20% harder)
 * 
 * STEP 2: Map to UI State (Translate for Humans)
 * ------------------------------------------------
 * The AI speaks in numbers and technical terms.
 * We translate that into something the UI can display nicely:
 * - "Combat-focused player"
 * - "Increasing exploration"
 * - "Adjusted enemy health by +15%"
 * 
 * STEP 3: Round Analytics (Track Progress)
 * ------------------------------------------------
 * We calculate statistics for this gaming session:
 * - How many times they played
 * - How their behavior changed over time
 * - Confidence in our recommendations
 * 
 * STEP 4: History Reconstruction (Show the Journey)
 * ------------------------------------------------
 * We create a visual timeline showing all the steps:
 * 1. [done] Received player data
 * 2. [done] Normalized features
 * 3. [done] Identified play style
 * 4. [done] Calculated adjustments
 * etc.
 * 
 * === PARAMETERS EXPLAINED ===
 * @param userId - Who is playing? (e.g., "player_12345")
 * @param telemetry - What did they do in the game?
 *        Example: { enemiesKilled: 10, itemsCollected: 5, distanceTraveled: 500 }
 * @param deathEvents - Did they die? When? Where?
 *        Example: [{ timestamp: "2024-01-01", location: "Level 3" }]
 * @param lastRound - What happened in their previous session?
 *        Used to track changes over time
 * 
 * @returns SimulationExecutionResult - Everything we learned and decided
 * 
 * ============================================================================
 */
export const executePipelineLogic = async (
    userId: string,
    telemetry: EngineFeatures, 
    deathEvents: DeathEvent[], 
    lastRound: any
): Promise<SimulationExecutionResult> => {
      
      // ========================================
      // STEP 1: FETCH FROM BACKEND
      // ========================================
      // Like asking a doctor for a diagnosis
      // We give them: symptoms (player behavior)
      // They give us: prescription (difficulty adjustments)
      
      console.log(' STEP 1: Sending data to AI Brain...');
      const backendResult = await runSimulationService.fetchSimulationResults(
          telemetry as any, 
          deathEvents as any, 
          userId
      );
      console.log('[done] STEP 1 Complete: AI analyzed player behavior');
      
      // ========================================
      // STEP 2: MAP TO UI STATE
      // ========================================
      // Like translating a doctor's prescription into plain English
      // "Take 2 pills" instead of "500mg BID"
      
      console.log(' STEP 2: Translating AI response for display...');
      const mappedState = runSimulationService.mapBackendToUI(backendResult);
      console.log('[done] STEP 2 Complete: Data ready for UI visualization');

      // ========================================
      // STEP 3: ROUND ANALYTICS
      // ========================================
      // Like keeping a score card of the game
      // Track: Round number, performance, trends
      
      console.log(' STEP 3: Calculating session statistics...');
      const nextRoundNumber = (lastRound?.roundNumber || 0) + 1;
      const roundAnalytics = runSimulationService.mapBackendToRoundAnalytics(
          backendResult, 
          telemetry as any, 
          nextRoundNumber
      );
      console.log(`[done] STEP 3 Complete: Round ${nextRoundNumber} analytics calculated`);

      // ========================================
      // STEP 4: HISTORY RECONSTRUCTION
      // ========================================
      // Like creating a timeline of events
      // Shows each step we took and what we found
      
      console.log(' STEP 4: Building processing timeline...');
      const initialSteps = INITIAL_PIPELINE_STEPS; 
      const completedSteps = runSimulationService.reconstructPipelineSteps(
          initialSteps, 
          telemetry as any, 
          mappedState, 
          lastRound
      );
      console.log('[done] STEP 4 Complete: Timeline ready for display');

      // ========================================
      // RETURN: THE COMPLETE PACKAGE
      // ========================================
      // Everything wrapped up in a nice bow 
      
      return { 
          backendResult,    // Raw AI output
          mappedState,      // Translated data
          roundAnalytics,   // Session stats
          completedSteps    // Processing history
      };
};

/**
 * ============================================================================
 * HELPER FUNCTION: constructFinalState()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Takes all our processing results and packages them into the final format
 * that the UI needs to display everything beautifully.
 * 
 * Think of it like gift wrapping:
 * - We have all the parts
 * - Now we arrange them nicely
 * - Add execution time (how long it took)
 * - Present it to the UI
 * 
 * === PARAMETERS ===
 * @param prevState - The current state of the UI
 * @param result - All our processing results
 * @param executionTime - How many milliseconds the whole thing took
 * 
 * @returns PipelineState - The complete state ready for the UI
 * 
 * ============================================================================
 */
export const constructFinalState = (
    prevState: PipelineState,
    result: SimulationExecutionResult,
    executionTime: number
): PipelineState => {
    const { mappedState, completedSteps, backendResult } = result;
    const pipelineProcessTime = backendResult?.performance_timings?.total ?? 0;

    console.log(` Total execution time: ${executionTime.toFixed(2)}ms (pipeline: ${pipelineProcessTime.toFixed(3)}ms)`);

    return buildFinalStateObject(
        prevState,
        mappedState,
        completedSteps,
        executionTime,
        pipelineProcessTime
    );
}

/**
 * ============================================================================
 * SUMMARY: THE COMPLETE FLOW
 * ============================================================================
 * 
 * 1. USER PLAYS GAME
 *    v
 * 2. GAME SENDS DATA TO US (telemetry, deaths, userId)
 *    v
 * 3. executePipelineLogic() PROCESSES:
 *    a. Send to AI Brain -> Get recommendations
 *    b. Translate to UI-friendly format
 *    c. Calculate statistics
 *    d. Build timeline
 *    v
 * 4. constructFinalState() PACKAGES EVERYTHING
 *    v
 * 5. UI DISPLAYS RESULTS TO DEVELOPER/PLAYER
 *    v
 * 6. GAME APPLIES DIFFICULTY ADJUSTMENTS
 *    v
 * 7. PLAYER ENJOYS PERFECTLY-TUNED EXPERIENCE! 
 * 
 * ============================================================================
 */
