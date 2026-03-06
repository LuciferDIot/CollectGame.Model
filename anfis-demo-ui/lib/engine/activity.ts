/**
 * ============================================================================
 * ACTIVITY SCORING - The "Rule of Thumb" Classifier
 * ============================================================================
 *
 * === WHAT IS THIS FILE? ===
 * This file implements a simple "heuristic" (rule of thumb) to quickly guess
 * what type of activity the player is doing based on their game actions.
 *
 * === WHY DO WE NEED IT? ===
 *
 * Before running the complex AI, we do a quick sanity check:
 * - Did they fight a lot? → Probably Combat-focused
 * - Did they collect items? → Probably Collection-focused
 * - Did they move around? → Probably Exploration-focused
 *
 * This helps the AI make better decisions later!
 *
 * === THE THREE CATEGORIES ===
 *
 * 1. **COMBAT**
 *    - Hitting enemies
 *    - Dealing damage
 *    - Time spent in combat
 *    - Enemy kills
 *
 * 2. **COLLECTION**
 *    - Items collected
 *    - Pickup attempts
 *    - Time near collectible items
 *
 * 3. **EXPLORATION**
 *    - Distance traveled
 *    - Time spent sprinting
 *
 * === HOW IT WORKS ===
 *
 * 1. Average relevant features for each category (divide by feature count)
 * 2. Calculate total across all categories
 * 3. Convert to percentages (must sum to 100%)
 *
 * === WHY AVERAGES INSTEAD OF SUMS? ===
 *
 * Using sums gives Combat (4 features) a structural advantage over Collection
 * and Exploration (3 and 2 features). A player maxing all features in each
 * category would score 4:3:2 rather than 1:1:1. Averaging normalises this
 * so each archetype has an equal ceiling of 1.0, making the percentages
 * reflect true behavioural emphasis rather than feature count.
 *
 * Example:
 *   Combat avg: 0.75  (all 4 features at 0.75)
 *   Collection avg: 0.30
 *   Exploration avg: 0.40
 *   Total: 1.45
 *
 *   Percentages:
 *   - Combat: 0.75/1.45 = 51.7%
 *   - Collection: 0.30/1.45 = 20.7%
 *   - Exploration: 0.40/1.45 = 27.6%
 *
 * === WHY timeOutOfCombat WAS REMOVED FROM EXPLORATION ===
 *
 * `timeOutOfCombat` was previously included in the Exploration score. However,
 * this feature accumulates PASSIVELY — it increases any time the player is not
 * in combat, regardless of intent. A player actively searching for enemies on
 * a sparse map (clear Combat intent) would accumulate a high Exploration score
 * simply because no enemies were available to fight.
 *
 * `timeOutOfCombat` is also the arithmetic complement of `timeInCombat` — the
 * two features sum to total session time. Including both is redundant and
 * creates an inverse coupling that punishes combat players during low-enemy
 * periods. Exploration is now measured by ACTIVE signals only:
 * distanceTraveled + timeSprinting.
 *
 * ============================================================================
 */

import { calculateComponentSum, calculatePercentage } from '../game/mechanics';
import type { ActivityScores, NormalizedFeatures } from './types';

/**
 * ============================================================================
 * MAIN FUNCTION: calculateActivityScores()
 * ============================================================================
 * 
 * === WHAT IT DOES ===
 * Takes normalized game features (values from 0-1) and calculates what
 * percentage of the player's activity falls into each category.
 * 
 * === THE FORMULA ===
 *
 * Combat Score = Average of:
 *   - enemiesHit (how many shots landed)
 *   - damageDone (total damage dealt)
 *   - timeInCombat (seconds fighting)
 *   - kills (enemies defeated)
 *
 * Collection Score = Average of:
 *   - itemsCollected (loot picked up)
 *   - pickupAttempts (times tried to pick up items)
 *   - timeNearInteractables (time near collectibles)
 *
 * Exploration Score = Average of:
 *   - distanceTraveled (meters moved)
 *   - timeSprinting (seconds running)
 *   NOTE: timeOutOfCombat intentionally excluded — see file header.
 *
 * === WHY THESE SPECIFIC FEATURES? ===
 *
 * Combat Features:
 * - If you're hitting enemies and dealing damage, you're clearly fighting!
 * - Time in combat confirms active engagement
 * - Kills prove combat effectiveness
 *
 * Collection Features:
 * - Items collected shows intentional resource gathering
 * - Pickup attempts shows interest in loot (even if inventory full)
 * - Time near items shows seeking behavior
 *
 * Exploration Features:
 * - Distance traveled shows map coverage
 * - Sprinting shows active movement (not camping)
 * - Both are ACTIVE signals that require deliberate player movement
 * 
 * === EXAMPLE WALKTHROUGH ===
 * 
 * Input (Normalized Features):
 * {
 *   enemiesHit: 0.8,      // Hit 80% of max typical shots
 *   damageDone: 0.9,      // Dealt 90% of max typical damage
 *   timeInCombat: 0.7,    // 70% of max typical combat time
 *   kills: 0.6,           // 60% of max typical kills
 *   itemsCollected: 0.2,  // 20% of max typical items
 *   pickupAttempts: 0.3,  // 30% of max typical attempts
 *   timeNearInteractables: 0.1,  // 10% of max time
 *   distanceTraveled: 0.4,       // 40% of max distance
 *   timeSprinting: 0.5,          // 50% of max sprint time
 *   // timeOutOfCombat: excluded — passive, not used
 * }
 *
 * Step-by-Step Calculation:
 *
 * 1. Combat Score (average of 4 features):
 *    (0.8 + 0.9 + 0.7 + 0.6) / 4 = 0.75
 *
 * 2. Collection Score (average of 3 features):
 *    (0.2 + 0.3 + 0.1) / 3 = 0.20
 *
 * 3. Exploration Score (average of 2 active features):
 *    (0.4 + 0.5) / 2 = 0.45
 *
 * 4. Total Score:
 *    0.75 + 0.20 + 0.45 = 1.40
 *
 * 5. Convert to Percentages:
 *    - Combat: 0.75/1.40 = 53.6%      → Main focus!
 *    - Collection: 0.20/1.40 = 14.3%  → Minor activity
 *    - Exploration: 0.45/1.40 = 32.1% → Secondary focus
 *
 * Output:
 * {
 *   pct_combat: 0.536,
 *   pct_collect: 0.143,
 *   pct_explore: 0.321
 * }
 *
 * Interpretation:
 * "This is primarily a **combat-focused** player (53.6%) who does some
 *  exploration (32.1%) and minimal collection (14.3%)."
 * 
 * @param normalized - Game features already normalized to 0-1 scale
 * @returns Activity percentages (must sum to 1.0 = 100%)
 * 
 * ============================================================================
 */
export function calculateActivityScores(normalized: NormalizedFeatures): ActivityScores {
  // ==========================================================================
  // STEP 1: CALCULATE AVERAGE COMPONENT SCORES
  // ==========================================================================
  // For each category, we AVERAGE the relevant features (sum ÷ feature count).
  // This ensures each archetype has an equal ceiling of 1.0 regardless of
  // how many features it uses, preventing structural bias toward archetypes
  // with more features.

  /**
   * === COMBAT SCORE (5 features, avg range [0, 1]) ===
   *
   * 1. enemiesHit       - Accuracy/engagement (did they land shots?)
   * 2. damageDone       - Effectiveness (how much hurt did they inflict?)
   * 3. timeInCombat     - Commitment (how long were they fighting?)
   * 4. kills            - Success (did they actually defeat enemies?)
   * 5. damagePerHit     - Weapon-class intensity (sniper vs spray archetype).
   *    Snipers land few hits but deal heavy damage per hit. Without this feature,
   *    purely hit-count-based scoring underrepresents heavy-weapon combat players.
   *    Formula: damageDone_raw / max(enemiesHit_raw, 1) — pre-computed in step2.
   */
  const score_combat = calculateComponentSum([
    normalized.enemiesHit as number,
    normalized.damageDone as number,
    normalized.timeInCombat as number,
    normalized.kills as number,
    (normalized.damage_per_hit as number) ?? 0,  // derived feature (v2.2)
  ]) / 5;

  /**
   * === COLLECTION SCORE (4 features, avg range [0, 1]) ===
   *
   * 1. itemsCollected        - Success (did they actually get items?)
   * 2. pickupAttempts        - Intent (were they trying to collect?)
   * 3. timeNearInteractables - Seeking (did they hang around loot?)
   * 4. pickupAttemptRate     - Deliberateness of collection intent.
   *    Explorers who pass near items incidentally have low pickupAttemptRate;
   *    true collectors who actively attempt pickups have high rate.
   *    Formula: pickupAttempts_raw / max(timeNearInteractables_raw, 1) — pre-computed in step2.
   */
  const score_collect = calculateComponentSum([
    normalized.itemsCollected as number,
    normalized.pickupAttempts as number,
    normalized.timeNearInteractables as number,
    (normalized.pickup_attempt_rate as number) ?? 0,  // derived feature (v2.2)
  ]) / 4;

  /**
   * === EXPLORATION SCORE (2 active features, avg range [0, 1]) ===
   *
   * 1. distanceTraveled - Coverage (how much of the map did they see?)
   * 2. timeSprinting    - Movement style (actively moving vs camping?)
   *
   * NOTE: timeOutOfCombat was intentionally removed. It accumulated passively
   * for any player not in combat — including combat-intent players waiting for
   * enemies to spawn. It is also the arithmetic complement of timeInCombat,
   * making the two features redundant and inversely correlated. Only active
   * movement signals are used here.
   */
  const score_explore = calculateComponentSum([
    (normalized.distanceTraveled as number) ?? 0,
    (normalized.timeSprinting as number) ?? 0,
  ]) / 2;

  // ==========================================================================
  // STEP 2: CALCULATE TOTAL SCORE
  // ==========================================================================
  // Each score is now in [0, 1]. Sum becomes the denominator for percentages.
  //
  // Example:
  //   score_combat  = 0.75
  //   score_collect = 0.20
  //   score_explore = 0.45
  //   score_total   = 1.40
  const score_total = score_combat + score_collect + score_explore;

  // ==========================================================================
  // STEP 3: NORMALIZE TO PERCENTAGES
  // ==========================================================================
  // Convert averaged scores to percentages that sum to 100%.
  //
  // Formula: percentage = (category_avg / total_avg_sum)
  //
  // Safety: calculatePercentage() handles division by zero (returns 0.3333
  // as equal-weight default when the player has no recorded activity).
  return {
    pct_combat: calculatePercentage(score_combat, score_total),
    pct_collect: calculatePercentage(score_collect, score_total),
    pct_explore: calculatePercentage(score_explore, score_total),
  };
}

/**
 * ============================================================================
 * HELPER FUNCTIONS (IMPORTED FROM game/mechanics.ts)
 * ============================================================================
 * 
 * === calculateComponentSum(values: number[]) ===
 * 
 * Adds up an array of numbers safely.
 * 
 * What it does:
 * ```typescript
 * calculateComponentSum([0.8, 0.9, 0.7, 0.6])
 * // Returns: 3.0
 * ```
 * 
 * Why we need it:
 * - Handles null/undefined values gracefully
 * - Filters out NaN (not a number)
 * - Returns 0 if array is empty
 * 
 * === calculatePercentage(value: number, total: number) ===
 * 
 * Safely divides value by total to get percentage.
 * 
 * What it does:
 * ```typescript
 * calculatePercentage(0.75, 1.35)
 * // Returns: 0.556 (55.6%)
 * 
 * calculatePercentage(5, 0)
 * // Returns: 0 (safely handles division by zero!)
 * ```
 * 
 * Why we need it:
 * - Prevents division by zero crashes
 * - Returns 0 if total is 0 (player did nothing)
 * - Ensures result is always valid
 * 
 * ============================================================================
 */

/**
 * ============================================================================
 * REAL-WORLD EXAMPLES
 * ============================================================================
 * 
 * === EXAMPLE 1: AGGRESSIVE FIGHTER ===
 * 
 * Player constantly in combat, ignoring items:
 * 
 * Features:
 *   enemiesHit: 0.9, damageDone: 0.95, timeInCombat: 0.85, kills: 0.8
 *   itemsCollected: 0.1, pickupAttempts: 0.05, timeNearInteractables: 0.0
 *   distanceTraveled: 0.3, timeSprinting: 0.4, timeOutOfCombat: 0.2
 * 
 * Result:
 *   pct_combat: ~75%    → Clearly combat-focused
 *   pct_collect: ~3%    → Ignoring loot
 *   pct_explore: ~22%   → Some movement but mainly for combat
 * 
 * === EXAMPLE 2: CAUTIOUS COLLECTOR ===
 * 
 * Player avoiding combat, gathering resources:
 * 
 * Features:
 *   enemiesHit: 0.1, damageDone: 0.05, timeInCombat: 0.1, kills: 0.0
 *   itemsCollected: 0.9, pickupAttempts: 0.95, timeNearInteractables: 0.8
 *   distanceTraveled: 0.6, timeSprinting: 0.7, timeOutOfCombat: 0.9
 * 
 * Result:
 *   pct_combat: ~5%     → Avoiding fights
 *   pct_collect: ~50%   → Main focus is loot
 *   pct_explore: ~45%   → Exploring to find items
 * 
 * === EXAMPLE 3: BALANCED PLAYER ===
 * 
 * Player doing a mix of everything:
 * 
 * Features:
 *   All features around 0.4-0.6 (moderate activity in all areas)
 * 
 * Result:
 *   pct_combat: ~33%    → Balanced
 *   pct_collect: ~33%   → Balanced
 *   pct_explore: ~34%   → Balanced
 * 
 * ============================================================================
 */
