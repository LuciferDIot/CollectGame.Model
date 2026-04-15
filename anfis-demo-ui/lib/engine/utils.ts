/**
 * ============================================================================
 * ENGINE UTILITIES - Helper Functions for Pipeline Operations
 * ============================================================================
 * 
 * === WHAT IS THIS FILE? ===
 * Collection of utility functions specifically for the ANFIS pipeline.
 * These handle data transformations, mappings, and common operations.
 * 
 * === WHY SEPARATE FILE? ===
 * - **Reusability**: Used across multiple pipeline modules
 * - **Testability**: Easy to unit test transformations
 * - **Maintainability**: Centralized helper logic
 * - **Clarity**: Keeps pipeline classes focused on their main job
 * 
 * === CATEGORIES ===
 * 1. **Mapping Helpers**: Transform data formats
 * 2. **Delta Math**: Calculate behavioral changes
 * 3. **Session Logic**: Timeout and state management
 * 4. **Inference Helpers**: Rule extraction
 * 5. **Aggregation Helpers**: Status determination
 * 
 * ============================================================================
 */

import { Deltas, PipelineOutput, SoftMembership } from './types';

/**
 * ============================================================================
 * CATEGORY 1: MAPPING HELPERS
 * ============================================================================
 * These convert between different data format conventions used across
 * the pipeline (snake_case backend ↔ camelCase frontend).
 * ============================================================================
 */

/**
 * === FUNCTION: mapSoftMembership() ===
 * 
 * Converts backend soft membership format to frontend format.
 * 
 * **Why needed?**
 * - Backend uses: `soft_combat`, `soft_collect`, `soft_explore` (snake_case)
 * - Frontend uses: `combat`, `collect`, `explore` (short names)
 * - Different parts of UI expect different formats
 * 
 * **Example**:
 * ```typescript
 * // Backend format:
 * const backend = {
 *   soft_combat: 0.7,
 *   soft_collect: 0.2,
 *   soft_explore: 0.1
 * };
 * 
 * // Frontend format:
 * mapSoftMembership(backend)
 * // Returns: { combat: 0.7, collect: 0.2, explore: 0.1 }
 * ```
 * 
 * @param soft - Backend-format soft membership
 * @returns Frontend-format membership (shorter property names)
 */
export function mapSoftMembership(soft: { soft_combat: number; soft_collect: number; soft_explore: number }) {
    return {
        combat: soft.soft_combat,
        collect: soft.soft_collect,
        explore: soft.soft_explore
    };
}

/**
 * === FUNCTION: mapDeltasToArchetypes() ===
 * 
 * Converts backend delta format to archetype-named format.
 * 
 * **Why needed?**
 * - Backend uses: `delta_combat`, `delta_collect`, `delta_explore`
 * - UI components expect: `Combat`, `Collection`, `Exploration` (capitalized)
 * - Matches archetype naming convention in UI
 * 
 * **Example**:
 * ```typescript
 * // Backend format:
 * const deltas = {
 *   delta_combat: +0.15,
 *   delta_collect: -0.05,
 *   delta_explore: -0.10
 * };
 * 
 * // Archetype format:
 * mapDeltasToArchetypes(deltas)
 * // Returns: {
 * //   Combat: +0.15,
 * //   Collection: -0.05,
 * //   Exploration: -0.10
 * // }
 * ```
 * 
 * @param deltas - Backend-format deltas
 * @returns Archetype-named deltas (capitalized keys)
 */
export function mapDeltasToArchetypes(deltas: { delta_combat: number; delta_collect: number; delta_explore: number }) {
    return {
        Combat: deltas.delta_combat,
        Collection: deltas.delta_collect,
        Exploration: deltas.delta_explore
    };
}

/**
 * ============================================================================
 * CATEGORY 2: TELEMETRY HELPERS
 * ============================================================================
 * Format telemetry data for display and logging.
 * ============================================================================
 */

/**
 * === FUNCTION: formatTelemetryOutput() ===
 * 
 * Formats filtering/validation output for UI display.
 * 
 * **What it does**:
 * - Extracts key validation info
 * - Formats duration nicely
 * - Provides event count
 * 
 * **Example**:
 * ```typescript
 * const filtering = {
 *   passed: true,
 *   duration_seconds: 5.2,
 *   // ... other fields
 * };
 * 
 * formatTelemetryOutput(filtering)
 * // Returns: {
 * //   valid: true,
 * //   duration: "5.2s",
 * //   events: 10
 * // }
 * ```
 * 
 * @param filtering - Raw filtering/validation result from pipeline
 * @returns Formatted telemetry summary for UI
 * 
 * **Note**: Event count is currently mocked (10) - would be actual count in production
 */
export function formatTelemetryOutput(filtering: PipelineOutput['filtering']) {
    return {
        valid: filtering.passed,
        duration: `${filtering.duration_seconds}s`,
        events: 10 // Mock count - would query real event count in production
    };
}

/**
 * ============================================================================
 * CATEGORY 3: DELTA MATH
 * ============================================================================
 * Calculate behavioral changes between states.
 * ============================================================================
 */

/**
 * === FUNCTION: calculatePreviousState() ===
 * 
 * Works BACKWARD from current state + deltas to find previous state.
 * 
 * **The Math**:
 * ```
 * delta = current - previous
 * Therefore:
 * previous = current - delta
 * ```
 * 
 * **Why needed?**
 * - Display "before and after" comparisons
 * - Reconstruct player history
 * - Verify delta calculations
 * 
 * **Example**:
 * ```typescript
 * // Current state:
 * const current = {
 *   soft_combat: 0.75,
 *   soft_collect: 0.15,
 *   soft_explore: 0.10
 * };
 * 
 * // Changes from last session:
 * const deltas = {
 *   delta_combat: +0.15,   // Increased
 *   delta_collect: -0.10,  // Decreased
 *   delta_explore: -0.05   // Decreased
 * };
 * 
 * // Calculate previous:
 * calculatePreviousState(current, deltas)
 * // Returns: {
 * //   soft_combat: 0.75 - 0.15 = 0.60,
 * //   soft_collect: 0.15 - (-0.10) = 0.25,
 * //   soft_explore: 0.10 - (-0.05) = 0.15
 * // }
 * 
 * // Interpretation:
 * // "Player WAS 60/25/15, NOW is 75/15/10"
 * ```
 * 
 * @param current - Current soft membership values
 * @param deltas - Changes from previous to current
 * @returns Previous soft membership values (reconstructed)
 */
export function calculatePreviousState(current: SoftMembership, deltas: Deltas): SoftMembership {
    return {
        soft_combat: current.soft_combat - deltas.delta_combat,
        soft_collect: current.soft_collect - deltas.delta_collect,
        soft_explore: current.soft_explore - deltas.delta_explore
    };
}

/**
 * === FUNCTION: calculateDeltaVector() ===
 * 
 * Calculates the CHANGE between two states.
 * 
 * **The Math**:
 * ```
 * delta = current - previous
 * ```
 * 
 * **Why needed?**
 * - Track how player behavior is evolving
 * - Detect trends (getting more aggressive? more cautious?)
 * - Input to ANFIS for velocity-aware predictions
 * 
 * **Example**:
 * ```typescript
 * // Last session:
 * const previous = {
 *   soft_combat: 0.60,
 *   soft_collect: 0.25,
 *   soft_explore: 0.15
 * };
 * 
 * // Current session:
 * const current = {
 *   soft_combat: 0.75,
 *   soft_collect: 0.15,
 *   soft_explore: 0.10
 * };
 * 
 * // Calculate change:
 * calculateDeltaVector(current, previous)
 * // Returns: {
 * //   delta_combat: 0.75 - 0.60 = +0.15 (increased  15%)
 * //   delta_collect: 0.15 - 0.25 = -0.10 (decreased 10%)
 * //   delta_explore: 0.10 - 0.15 = -0.05 (decreased 5%)
 * // }
 * 
 * // Interpretation:
 * // "Player is shifting toward Combat (+15%) away from Collection/Exploration"
 * ```
 * 
 * **Positive delta**: Membership is INCREASING (player doing more of this)
 * **Negative delta**: Membership is DECREASING (player doing less of this)
 * **Zero delta**: No change (stable behavior)
 * 
 * @param current - Current soft membership
 * @param previous - Previous soft membership
 * @returns Delta vector showing changes
 */
export function calculateDeltaVector(current: SoftMembership, previous: SoftMembership): Deltas {
    return {
        delta_combat: current.soft_combat - previous.soft_combat,
        delta_collect: current.soft_collect - previous.soft_collect,
        delta_explore: current.soft_explore - previous.soft_explore
    };
}

/**
 * === FUNCTION: computeDelta() ===
 *
 * Safe scalar delta with explicit fallback for missing previous state.
 *
 * **Why needed?**
 * When a session resets or a user is seen for the first time, `previous`
 * may be `undefined` or `NaN`.  Returning 0 in those cases ensures the
 * MLP receives a valid (no-change) signal rather than NaN, which would
 * silently corrupt all downstream computations.
 *
 * **Example — first window (no prior state)**:
 * ```typescript
 * computeDelta(0.75, undefined)  // → 0  (safe default)
 * computeDelta(0.75, NaN)        // → 0  (safe default)
 * ```
 *
 * **Example — active session**:
 * ```typescript
 * computeDelta(0.75, 0.60)       // → 0.15
 * computeDelta(0.15, 0.25)       // → -0.10
 * ```
 *
 * Used internally by `calculateDeltaVector` and wherever a single-axis
 * delta must be computed with guarded access to previous state.
 *
 * @param current  - Current membership value for one axis
 * @param previous - Previous membership value (may be undefined / NaN)
 * @returns current − previous, or 0 when previous is absent/invalid
 */
export function computeDelta(current: number, previous?: number): number {
    if (previous === undefined || Number.isNaN(previous)) return 0;
    return current - previous;
}

/**
 * ============================================================================
 * CATEGORY 4: SESSION LOGIC
 * ============================================================================
 * Manage session state and timeouts.
 * ============================================================================
 */

/**
 * === FUNCTION: hasSessionTimedOut() ===
 * 
 * Checks if too much time has passed since last player activity.
 * 
 * **Why needed?**
 * - Stale state can give bad recommendations
 * - Player might have changed mindset after long break
 * - Prevents "old data" from affecting new sessions
 * 
 * **The Logic**:
 * ```
 * timeElapsed = now - lastTimestamp
 * hasTimedOut = timeElapsed > timeout
 * ```
 * 
 * **Example 1: Active session**
 * ```typescript
 * const lastTimestamp = Date.now() - 10000;  // 10 seconds ago
 * const timeoutMs = 40000;                    // 40 second timeout
 * 
 * hasSessionTimedOut(lastTimestamp, timeoutMs)
 * // timeElapsed = 10,000 ms (10 seconds)
 * // timeout = 40,000 ms (40 seconds)
 * // 10,000 > 40,000? NO
 * // Returns: false (session still active)
 * ```
 * 
 * **Example 2: Timed out session**
 * ```typescript
 * const lastTimestamp = Date.now() - 60000;  // 60 seconds ago (1 minute)
 * const timeoutMs = 40000;                    // 40 second timeout
 * 
 * hasSessionTimedOut(lastTimestamp, timeoutMs)
 * // timeElapsed = 60,000 ms (60 seconds)
 * // timeout = 40,000 ms (40 seconds)
 * // 60,000 > 40,000? YES
 * // Returns: true (session has timed out)
 * ```
 * 
 * **What happens on timeout?**
 * - Deltas are reset to zero
 * - Player treated as "new" session
 * - Fresh start for behavior tracking
 * 
 * @param lastTimestamp - When player was last active (milliseconds since epoch)
 * @param timeoutMs - How long to wait before considering session stale (milliseconds)
 * @returns true if session has timed out, false if still active
 */
export function hasSessionTimedOut(lastTimestamp: number, timeoutMs: number): boolean {
    return (Date.now() - lastTimestamp) > timeoutMs;
}

/**
 * ============================================================================
 * CATEGORY 5: INFERENCE HELPERS
 * ============================================================================
 * Extract and format inference rule results.
 * ============================================================================
 */

/**
 * === FUNCTION: getTopRules() ===
 * 
 * Extracts the top N most activated fuzzy rules.
 * 
 * **Why needed?**
 * - Display only most relevant rules (UX)
 * - Reduce information overload
 * - Show "why" AI made its decision
 * 
 * **Example**:
 * ```typescript
 * const rulesFired = [
 *   { rule: 1, activation: 0.95, contribution: 0.15 },
 *   { rule: 5, activation: 0.80, contribution: 0.12 },
 *   { rule: 12, activation: 0.65, contribution: 0.08 },
 *   { rule: 3, activation: 0.45, contribution: 0.05 },
 *   { rule: 9, activation: 0.30, contribution: 0.03 }
 * ];
 * 
 * getTopRules(rulesFired, 3)
 * // Returns first 3 rules (assumed already sorted by importance)
 * // [
 * //   { rule: 1, activation: 0.95, ... },
 * //   { rule: 5, activation: 0.80, ... },
 * //   { rule: 12, activation: 0.65, ... }
 * // ]
 * ```
 * 
 * **Note**: Assumes rules are already sorted by activation/importance
 * from the pipeline. If not, would need to sort first.
 * 
 * @param rulesFired - All fired rules from inference step
 * @param count - How many top rules to return (default: 3)
 * @returns Top N most significant rules
 */
export function getTopRules(rulesFired: PipelineOutput['inference']['rulesFired'], count: number = 3) {
    return rulesFired.slice(0, count);
}

/**
 * ============================================================================
 * CATEGORY 6: AGGREGATION HELPERS
 * ============================================================================
 * Determine system states from validation results.
 * ============================================================================
 */

/**
 * === FUNCTION: determineOptimizationStatus() ===
 * 
 * Determines if adaptation is optimal or had to be clamped.
 * 
 * ** Why needed?**
 * - Show user if recommendations are ideal or constrained
 * - Indicate when hitting safety limits
 * - Help debug boundary cases
 * 
 * **The Logic**:
 * ```
 * if all_params_in_bounds:
 *   status = OPTIMAL (AI's recommended values are all safe)
 * else:
 *   status = CLAMPED (some values hit min/max limits)
 * ```
 * 
 * **Example 1: Optimal adaptation**
 * ```typescript
 * const validation = {
 *   all_params_in_bounds: true,
 *   membership_sum: 1.0,
 *   delta_range_ok: true,
 *   multiplier_clamped: false
 * };
 * 
 * determineOptimizationStatus(validation)
 * // Returns: 'OPTIMAL'
 * 
 * // Interpretation:
 * // "All AI recommendations are within safe bounds.
 * //  System is working perfectly!"
 * ```
 * 
 * **Example 2: Clamped adaptation**
 * ```typescript
 * const validation = {
 *   all_params_in_bounds: false,  // Some param hit limit!
 *   membership_sum: 1.0,
 *   delta_range_ok: true,
 *   multiplier_clamped: true       // Multiplier was clamped
 * };
 * 
 * determineOptimizationStatus(validation)
 * // Returns: 'CLAMPED'
 * 
 * // Interpretation:
 * // "AI wanted more extreme difficulty, but we limited it
 * //  to safe maximum for player safety."
 * ```
 * 
 * **When does clamping happen?**
 * - AI suggests 2.0x difficulty → clamped to 1.4x maximum
 * - AI suggests negative health → clamped to minimum
 * - AI suggests 1000 enemies → clamped to capacity limit
 * 
 * @param validation - Validation results from pipeline
 * @returns 'OPTIMAL' if perfect, 'CLAMPED' if constrained
 */
export function determineOptimizationStatus(validation: PipelineOutput['validation']): 'OPTIMAL' | 'CLAMPED' {
    return validation.all_params_in_bounds ? 'OPTIMAL' : 'CLAMPED';
}

/**
 * ============================================================================
 * DESIGN PATTERNS & BEST PRACTICES
 * ============================================================================
 * 
 * === Why These Utilities? ===
 * 
 * 1. **Single Responsibility**
 *    - Each function does ONE thing well
 *    - Easy to test independently
 *    - Clear naming shows intent
 * 
 * 2. **Type Safety**
 *    - All functions properly typed
 *    - TypeScript catches errors at compile-time
 *    - IDE autocomplete works perfectly
 * 
 * 3. **Immutability**
 *    - Functions don't modify inputs
 *    - Return new objects instead
 *    - Prevents side effects and bugs
 * 
 * 4. **Reusability**
 *    - Used across multiple modules
 *    - Consistent behavior everywhere
 *    - Fix once, works everywhere
 * 
 * === Testing Strategy ===
 * 
 * Each function is pure (same input → same output):
 * ```typescript
 * test('calculateDeltaVector', () => {
 *   const current = { soft_combat: 0.7, ... };
 *   const previous = { soft_combat: 0.5, ... };
 *   const result = calculateDeltaVector(current, previous);
 *   expect(result.delta_combat).toBe(0.2);
 * });
 * ```
 * 
 * ============================================================================
 */
