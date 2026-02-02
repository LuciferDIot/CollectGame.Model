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
 *    - Time out of combat
 * 
 * === HOW IT WORKS ===
 * 
 * 1. Add up relevant features for each category
 * 2. Calculate total across all categories
 * 3. Convert to percentages (must sum to 100%)
 * 
 * Example:
 *   Combat score: 0.8
 *   Collection score: 0.3
 *   Exploration score: 0.4
 *   Total: 1.5
 *   
 *   Percentages:
 *   - Combat: 0.8/1.5 = 53%
 *   - Collection: 0.3/1.5 = 20%
 *   - Exploration: 0.4/1.5 = 27%
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
 * === THE FORMULA (FROM DEPLOYMENT MANIFEST) ===
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
 *   - timeOutOfCombat (seconds exploring)
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
 * - Time out of combat confirms peaceful exploration
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
 *   timeOutOfCombat: 0.3         // 30% of max peaceful time
 * }
 * 
 * Step-by-Step Calculation:
 * 
 * 1. Combat Score:
 *    (0.8 + 0.9 + 0.7 + 0.6) / 4 = 0.75
 * 
 * 2. Collection Score:
 *    (0.2 + 0.3 + 0.1) / 3 = 0.20
 * 
 * 3. Exploration Score:
 *    (0.4 + 0.5 + 0.3) / 3 = 0.40
 * 
 * 4. Total Score:
 *    0.75 + 0.20 + 0.40 = 1.35
 * 
 * 5. Convert to Percentages:
 *    - Combat: 0.75/1.35 = 55.6%      → Main focus!
 *    - Collection: 0.20/1.35 = 14.8%  → Minor activity
 *    - Exploration: 0.40/1.35 = 29.6% → Secondary focus
 * 
 * Output:
 * {
 *   pct_combat: 0.556,
 *   pct_collect: 0.148,
 *   pct_explore: 0.296
 * }
 * 
 * Interpretation:
 * "This is primarily a **combat-focused** player (55.6%) who does some
 *  exploration (29.6%) and minimal collection (14.8%)."
 * 
 * @param normalized - Game features already normalized to 0-1 scale
 * @returns Activity percentages (must sum to 1.0 = 100%)
 * 
 * ============================================================================
 */
export function calculateActivityScores(normalized: NormalizedFeatures): ActivityScores {
  // ==========================================================================
  // STEP 1: CALCULATE RAW COMPONENT SCORES
  // ==========================================================================
  // For each category, we sum up the relevant features
  // This gives us the "raw score" before converting to percentages
  
  /**
   * === COMBAT SCORE ===
   * 
   * Sums four combat-related features:
   * 1. enemiesHit - Accuracy/engagement (did they land shots?)
   * 2. damageDone - Effectiveness (how much hurt did they inflict?)
   * 3. timeInCombat - Commitment (how long were they fighting?)
   * 4. kills - Success (did they actually defeat enemies?)
   * 
   * Why sum instead of average?
   * - We want total "combat activity", not per-feature average
   * - Will convert to percentage later anyway
   * - Higher sum = more combat emphasis
   */
  const score_combat = calculateComponentSum([
    normalized.enemiesHit as number,
    normalized.damageDone as number,
    normalized.timeInCombat as number,
    normalized.kills as number
  ]);

  /**
   * === COLLECTION SCORE ===
   * 
   * Sums three collection-related features:
   * 1. itemsCollected - Success (did they actually get items?)
   * 2. pickupAttempts - Intent (were they trying to collect?)
   * 3. timeNearInteractables - Seeking (did they hang around loot?)
   * 
   * Why these three?
   * - Together they show intentional resource-gathering behavior
   * - Not just accidental pickups
   * - Demonstrates collection as a playstyle choice
   */
  const score_collect = calculateComponentSum([
    normalized.itemsCollected as number,
    normalized.pickupAttempts as number,
    normalized.timeNearInteractables as number
  ]);

  /**
   * === EXPLORATION SCORE ===
   * 
   * Sums three exploration-related features:
   * 1. distanceTraveled - Coverage (how much of map did they see?)
   * 2. timeSprinting - Movement style (actively exploring vs camping?)
   * 3. timeOutOfCombat - Peaceful time (exploring vs fighting?)
   * 
   * Why these three?
   * - Distance shows map coverage
   * - Sprint shows intentional movement (not standing still)
   * - Time out of combat confirms exploration vs combat focus
   */
  const score_explore = calculateComponentSum([
    normalized.distanceTraveled as number,
    normalized.timeSprinting as number,
    normalized.timeOutOfCombat as number
  ]);

  // ==========================================================================
  // STEP 2: CALCULATE TOTAL SCORE
  // ==========================================================================
  // Add all three scores together
  // This becomes our denominator for percentage calculation
  // 
  // Example:
  //   score_combat = 2.5
  //   score_collect = 0.8
  //   score_explore = 1.2
  //   score_total = 4.5
  const score_total = score_combat + score_collect + score_explore;

  // ==========================================================================
  // STEP 3: NORMALIZE TO PERCENTAGES
  // ==========================================================================
  // Convert raw scores to percentages that sum to 100%
  // 
  // Formula: percentage = (category_score / total_score)
  // 
  // Why percentages?
  // - Easier to interpret (70% combat vs score of 2.5)
  // - Guaranteed to sum to 100% (no ambiguity)
  // - Directly comparable across different sessions
  // 
  // Safety:
  // - calculatePercentage() handles division by zero
  // - If total is 0 (no activity), returns 0 for all
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
