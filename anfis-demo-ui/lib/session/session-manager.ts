/**
 * ============================================================================
 * SESSION MANAGER - The "Memory Bank" for Player Behavior Over Time
 * ============================================================================
 * 
 * === WHAT IS THIS FILE? ===
 * This manages "temporal tracking" - remembering each player's previous state
 * so we can calculate how their behavior is CHANGING over time.
 * 
 * === WHY DO WE NEED THIS? ===
 * 
 * Problem Without Memory:
 * ```
 * Session 1: Player is 70% Combat
 * Session 2: Player is 70% Combat
 * 
 * AI thinks: static player, no change, same recommendation
 * ```
 * 
 * Problem With Memory:
 * ```
 * Session 1: Player was 50% Combat
 * Session 2: Player is 70% Combat
 * 
 * AI sees: +20% increase in combat! Player is getting more aggressive!
 * AI adapts: Increase difficulty proactively!
 * ```
 * 
 * === THE "VARIANCE COLLAPSE" PROBLEM ===
 * 
 * This solves a critical issue from the thesis (Section 5.3):
 * - Without deltas, ANFIS sees only current state
 * - Can't distinguish between stable vs changing players
 * - Recommendations become static and repetitive
 * 
 * With deltas:
 * - AI sees VELOCITY (rate of change)
 * - Can predict trends
 * - Makes dynamic, adaptive recommendations
 * 
 * === WHAT WE TRACK ===
 * 
 * For each player:
 * ```json
 * {
 *   "user_123": {
 *     "lastSoftMembership": {
 *       "soft_combat": 0.70,
 *       "soft_collect": 0.20,
 *       "soft_explore": 0.10
 *     },
 *     "lastTimestamp": 1704067200000
 *   }
 * }
 * ```
 * 
 * ============================================================================
 */

import { Deltas, SoftMembership } from '@/lib/engine/types';
import { calculateDeltaVector, hasSessionTimedOut } from '@/lib/engine/utils';

/**
 * === DATA STRUCTURE: UserSessionState ===
 * 
 * Stores what we remember about a player's last interaction.
 * 
 * @property lastSoftMembership - Their fuzzy membership from previous session
 *   Example: { soft_combat: 0.7, soft_collect: 0.2, soft_explore: 0.1 }
 * 
 * @property lastTimestamp - When they last played (milliseconds since epoch)
 *   Example: 1704067200000 (January 1, 2024, 00:00:00 UTC)
 *   Used to detect if session is "stale" (player took long break)
 */
interface UserSessionState {
    lastSoftMembership: SoftMembership;
    lastTimestamp: number;
}

/**
 * ============================================================================
 * CLASS: PipelineSessionManager
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Maintains a "memory bank" of player states over time and calculates
 * behavioral deltas (changes).
 * 
 * === THE THREE SCENARIOS ===
 * 
 * 1. **NEW USER** (First Time Playing)
 *    - No previous state exists
 *    - Return delta = 0 (no change to measure)
 *    - Save current state for next time
 * 
 * 2. **RETURNING USER** (Continuing Session)
 *    - Has previous state
 *    - Within timeout window
 *    - Calculate delta = current - previous
 *    - Update state
 * 
 * 3. **STALE SESSION** (Long Break)
 *    - Has previous state BUT it's too old (> 90 seconds)
 *    - Treat as new session (delta = 0)
 *    - Reset state
 * 
 * === EXAMPLE FLOW ===
 * 
 * Player "Alice" Plays Over Time:
 * 
 * ```
 * Time 0:00 - First session
 *   Current: Combat 50%
 *   Memory: None (new user)
 *   Delta: 0 (nothing to compare to)
 *   → Save: Combat 50%
 * 
 * Time 0:05 - Second session
 *   Current: Combat 70%
 *   Memory: Combat 50%
 *   Delta: +20% (getting more aggressive!)
 *   → Save: Combat 70%
 * 
 * Time 0:10 - Third session
 *   Current: Combat 75%
 *   Memory: Combat 70%
 *   Delta: +5% (still increasing, but slower)
 *   → Save: Combat 75%
 * 
 * Time 1:00 - Fourth session (50 min later - TIMEOUT!)
 *   Current: Combat 60%
 *   Memory: Combat 75% (but timestamp is 50 min ago)
 *   Delta: 0 (too old, treat as new session)
 *   → Save: Combat 60%
 * ```
 * 
 * ============================================================================
 */
export class PipelineSessionManager {
    // === INTERNAL STATE ===

    /**
     * The memory bank: stores each player's last known state
     * 
     * Structure: Map<userId, sessionState>
     * 
     * Example:
     * ```
     * Map {
     *   "player_123" => { lastSoftMembership: {...}, lastTimestamp: 1704067200000 },
     *   "player_456" => { lastSoftMembership: {...}, lastTimestamp: 1704067300000 },
     *   ...
     * }
     * ```
     * 
     * Why use Map instead of Object?
     * - Faster lookups for large numbers of users
     * - Better memory management
     * - Easier to check if user exists
     */
    private userStates: Map<string, UserSessionState> = new Map();

    /**
     * Session timeout duration (milliseconds)
     *
     * If player hasn't played in 90 seconds, we consider it a "new" session
     * and reset deltas to zero.
     *
     * Why 90 seconds? (changed from 40s in v2.2)
     * - Window cadence is 30s. A 40s timeout was only 1.33 windows of buffer.
     * - 90s = 3× the window cadence, tolerating:
     *     • Network delays and retries
     *     • In-game loading screens and cutscenes
     *     • Short pauses (phone, bathroom, etc.)
     * - Prevents valid sessions from losing delta history mid-play.
     */
    private readonly STATE_TIMEOUT_MS = 90000; // 90 seconds

    /**
     * ==========================================================================
     * MAIN METHOD: computeDeltasAndUpdate()
     * ==========================================================================
     * 
     * === WHAT IT DOES ===
     * Calculates how much a player's behavior has changed since last time,
     * then updates our memory with their current state.
     * 
     * === THE THREE CASES ===
     * 
     * **CASE 1: NEW USER**
     * - Player has never been seen before
     * - No previous state to compare against
     * - Return zero deltas
     * - Save current state for next time
     * 
     * **CASE 2: STALE SESSION (TIMEOUT)**
     * - Player hasn't played in > 90 seconds
     * - Previous state is too old to be relevant
     * - Maybe they took a break, changed mindset
     * - Return zero deltas (fresh start)
     * - Overwrite old state with current
     * 
     * **CASE 3: ACTIVE SESSION**
     * - Player recently played (< 90 seconds ago)
     * - Previous state is still relevant
     * - Calculate deltas = current - previous
     * - Update state with current values
     * 
     * === DETAILED EXAMPLE ===
     * 
     * Input:
     * ```typescript
     * userId = "player_123"
     * currentSoft = {
     *   soft_combat: 0.75,
     *   soft_collect: 0.15,
     *   soft_explore: 0.10
     * }
     * ```
     * 
     * Scenario A: New User
     * ```typescript
     * // Memory: undefined (no record of this player)
     * 
     * Result: {
  *   delta_combat: 0,
     *   delta_collect: 0,
     *   delta_explore: 0
     * }
     * 
     * // Memory updated to: { soft: {0.75, 0.15, 0.10}, timestamp: now }
     * ```
     * 
     * Scenario B: Returning User (Recent)
     * ```typescript
     * // Memory: { soft: {0.60, 0.25, 0.15}, timestamp: 5_seconds_ago }
     * 
     * Calculation:
     *   delta_combat  = 0.75 - 0.60 = +0.15  // More aggressive!
     *   delta_collect = 0.15 - 0.25 = -0.10  // Less collection
     *   delta_explore = 0.10 - 0.15 = -0.05  // Less exploration
     * 
     * Result: {
     *   delta_combat: +0.15,
     *   delta_collect: -0.10,
     *   delta_explore: -0.05
     * }
     * 
     * // Memory updated to: { soft: {0.75, 0.15, 0.10}, timestamp: now }
     * ```
     * 
     * Scenario C: Stale Session (Timeout)
     * ```typescript
     * // Memory: { soft: {0.60, 0.25, 0.15}, timestamp: 100_seconds_ago }
     *
     * Result: {
     *   delta_combat: 0,    // Reset — session > 90s = fresh start
     *   delta_collect: 0,
     *   delta_explore: 0
     * }
     * 
     * // Memory reset to: { soft: {0.75, 0.15, 0.10}, timestamp: now }
     * ```
     * 
     * @param userId - Unique identifier for the player
     * @param currentSoft - Player's current fuzzy membership values
     * @returns Deltas showing how behavior changed since last session
     * 
     * ==========================================================================
     */
    public computeDeltasAndUpdate(userId: string, currentSoft: SoftMembership): Deltas {
        // ========================================
        // STEP 0: SETUP
        // ========================================
        const userState = this.userStates.get(userId);  // Get saved state
        const now = Date.now();                          // Current timestamp
        const emptyDeltas = {                            // Zero-change deltas
            delta_combat: 0,
            delta_collect: 0,
            delta_explore: 0
        };

        // ========================================
        // CASE 1: NEW USER
        // ========================================
        // If we've never seen this player before
        if (!userState) {
            // Save their current state for next time
            this.updateState(userId, currentSoft, now);

            // Return zero deltas (no previous state to compare)
            return emptyDeltas;
        }

        // ========================================
        // CASE 2: STALE SESSION (TIMEOUT)
        // ========================================
        // If player hasn't been active recently
        if (hasSessionTimedOut(userState.lastTimestamp, this.STATE_TIMEOUT_MS)) {
            // Log for debugging/monitoring
            console.log(`[SessionManager] Timeout for ${userId}. Resetting Deltas.`);

            // Reset their state (treat as new session)
            this.updateState(userId, currentSoft, now);

            // Return zero deltas (session break = fresh start)
            return emptyDeltas;
        }

        // ========================================
        // CASE 3: ACTIVE SESSION (CALCULATE DELTAS)
        // ========================================
        // Player is actively playing - calculate behavioral changes

        /**
         * calculateDeltaVector() computes:
         *   delta = current - previous
         * 
         * For each dimension (combat, collect, explore):
         *   delta_X = current.soft_X - previous.soft_X
         * 
         * Example:
         *   current_combat = 0.75
         *   previous_combat = 0.60
         *   delta_combat = 0.75 - 0.60 = +0.15
         */
        const deltas = calculateDeltaVector(currentSoft, userState.lastSoftMembership);

        // Update memory with current state for next time
        this.updateState(userId, currentSoft, now);

        // Return the calculated changes
        return deltas;
    }

    /**
     * ==========================================================================
     * HELPER METHOD: updateState()
     * ==========================================================================
     * 
     * === WHAT IT DOES ===
     * Saves (or updates) a player's current state in memory.
     * 
     * === WHY PRIVATE? ===
     * Internal implementation detail - external code shouldn't call this directly.
     * Only computeDeltasAndUpdate() should manage state updates.
     * 
     * === WHAT IT SAVES ===
     * 1. Player's current fuzzy memberships (copied, not referenced)
     * 2. Current timestamp (when this state was recorded)
     * 
     * === WHY COPY THE SOFT MEMBERSHIP? ===
     * 
     * Wrong way (reference):
     * ```typescript
     * lastSoftMembership: soft  // Danger! Reference to same object
     * ```
     * If the original `soft` object gets modified elsewhere,
     * our saved state would change too!
     * 
     * Right way (copy):
     * ```typescript
     * lastSoftMembership: { ...soft }  // Safe! Independent copy
     * ```
     * Creates a new object with the same values.
     * Original and copy are independent.
     * 
     * @param userId - Player to update
     * @param soft - Their current memberships (will be copied)
     * @param timestamp - When this state was recorded
     */
    private updateState(userId: string, soft: SoftMembership, timestamp: number) {
        this.userStates.set(userId, {
            lastSoftMembership: { ...soft },  // Spread operator creates copy
            lastTimestamp: timestamp
        });
    }

    /**
     * ==========================================================================
     * MAINTENANCE METHOD: reset()
     * ==========================================================================
     * 
     * === WHAT IT DOES ===
     * Clears session memory - either for one player or everyone.
     * 
     * === WHEN TO USE ===
     * 
     * 1. **Single User Reset**
     *    - Player logs out
     *    - Reset difficulty settings
     *    - Start fresh for testing
     * 
     * 2. **Full Reset**
     *    - Server restart
     *    - Clear all state
     *    - Fresh start for demo
     * 
     * === EXAMPLES ===
     * 
     * Reset one player:
     * ```typescript
     * sessionManager.reset("player_123");
     * // Only player_123's memory is cleared
     * // Other players unaffected
     * ```
     * 
     * Reset everyone:
     * ```typescript
     * sessionManager.reset();
     * // All player memories cleared
     * // Everyone treated as new on next request
     * ```
     * 
     * === WHY OPTIONAL PARAMETER? ===
     * Two common use cases with one method:
     * - Specific reset: reset(userId)
     * - Global reset: reset()
     * 
     * Alternative would be two methods:
     * - resetUser(userId)
     * - resetAll()
     * 
     * But optional parameter is cleaner and more flexible.
     * 
     * @param userId - Optional: specific player to reset (omit to reset all)
     */
    public reset(userId?: string) {
        if (userId) {
            // Reset specific user
            this.userStates.delete(userId);
        } else {
            // Reset everyone
            this.userStates.clear();
        }
    }
}

/**
 * ============================================================================
 * HELPER FUNCTIONS (IMPORTED)
 * ============================================================================
 * 
 * === calculateDeltaVector(current, previous) ===
 * 
 * Calculates behavioral changes between two states.
 * 
 * Formula:
 * ```
 * delta_X = current.soft_X - previous.soft_X
 * ```
 * 
 * Example:
 * ```typescript
 * calculateDeltaVector(
 *   { soft_combat: 0.75, soft_collect: 0.15, soft_explore: 0.10 },
 *   { soft_combat: 0.60, soft_collect: 0.25, soft_explore: 0.15 }
 * );
 * // Returns: {
 * //   delta_combat: +0.15,   // Increased
 * //   delta_collect: -0.10,  // Decreased
 * //   delta_explore: -0.05   // Decreased
 * // }
 * ```
 * 
 * Location: `lib/engine/utils.ts`
 * 
 * === hasSessionTimedOut(lastTimestamp, timeoutMs) ===
 * 
 * Checks if too much time has passed since last session.
 * 
 * Formula:
 * ```
 * (now - lastTimestamp) > timeoutMs
 * ```
 * 
 * Example:
 * ```typescript
 * hasSessionTimedOut(
 *   Date.now() - 100000,  // 100 seconds ago
 *   90000                 // 90 second timeout (v2.2)
 * );
 * // Returns: true (100s > 90s threshold)
 * ```
 * 
 * Location: `lib/engine/utils.ts`
 * 
 * ============================================================================
 */

/**
 * ============================================================================
 * DESIGN DECISIONS
 * ============================================================================
 * 
 * === WHY MAP INSTEAD OF OBJECT? ===
 * 
 * Map Advantages:
 * - O(1) average lookup time
 * - Can use any type as key (not just strings)
 * - Built-in size property
 * - Better memory management
 * - Cleaner API (get/set/delete/has)
 * 
 * Object Disadvantages:
 * - Inherits from prototype (potential conflicts)
 * - Only string/symbol keys
 * - No built-in size
 * - Harder to iterate
 * 
 * === WHY 90 SECOND TIMEOUT? ===
 *
 * Updated from 40s → 90s in v2.2 based on the following rationale:
 * - Window cadence is 30s. A 40s timeout = only 1.33 windows of buffer.
 * - 90s = 3× the window cadence, tolerating:
 *     • Network delays and retries
 *     • In-game loading screens and cutscenes
 *     • Short pauses (phone calls, AFK moments)
 *
 * 90 seconds chosen because:
 * - Prevents valid sessions from losing delta history mid-play
 * - Still short enough to reset after a genuine break (> 1.5 min)
 * - Aligns with the deployment manifest session.timeout_ms = 90000
 * 
 * === THREAD SAFETY ===
 * 
 * This is client-side JavaScript (single-threaded):
 * - No race conditions
 * - No need for locks/mutexes
 * - Simple implementation
 * 
 * For server-side use:
 * - Would need synchronization
 * - Consider Redis for distributed state
 * - Implement TTL-based cleanup
 * 
 * ============================================================================
 */
