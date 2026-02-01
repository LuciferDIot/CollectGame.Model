import { Archetype, RoundAnalytics, SoftMembership } from '../types';

/**
 * Determine dominant archetype from soft membership
 */
export function getDominantArchetype(soft: SoftMembership): Archetype {
  // console.log('[Behavior] Soft Membership:', soft);
  if (soft.combat >= soft.collect && soft.combat >= soft.explore) {
    return 'combat';
  }
  if (soft.collect >= soft.explore) {
    return 'collect';
  }
  return 'explore';
}

/**
 * Validate soft membership sums to 1.0
 */
export function validateMembershipSum(
  soft: SoftMembership,
  tolerance: number = 0.01
): number {
  const sum = soft.combat + soft.collect + soft.explore;
  return sum;
}

/**
 * Check for archetype starvation (any archetype < threshold for N rounds)
 */
export function checkArchetypeStarvation(
  rounds: RoundAnalytics[],
  threshold: number,
  minRounds: number
): boolean {
  if (rounds.length < minRounds) return false;
  
  const recentRounds = rounds.slice(-minRounds);
  
  // Check if any archetype is consistently below threshold
  const combatStarved = recentRounds.every(r => r.softMembership.combat < threshold);
  const collectStarved = recentRounds.every(r => r.softMembership.collect < threshold);
  const exploreStarved = recentRounds.every(r => r.softMembership.explore < threshold);
  
  return combatStarved || collectStarved || exploreStarved;
}

/**
 * Check for behavior stagnation (same archetype dominant for too long)
 */
export function checkBehaviorStagnation(
  rounds: RoundAnalytics[],
  threshold: number
): boolean {
  if (rounds.length < 5) return false;
  
  const archetypes = rounds.map(r => r.dominantArchetype);
  const counts: Record<Archetype, number> = { combat: 0, collect: 0, explore: 0 };
  
  archetypes.forEach(arch => counts[arch]++);
  
  const maxPercentage = Math.max(...Object.values(counts)) / rounds.length;
  return maxPercentage > threshold;
}

/**
 * Compute archetype distribution percentages
 */
export function computeArchetypeDistribution(
  rounds: RoundAnalytics[]
): Record<Archetype, number> {
  if (rounds.length === 0) {
    return { combat: 0, collect: 0, explore: 0 };
  }
  
  const counts: Record<Archetype, number> = { combat: 0, collect: 0, explore: 0 };
  rounds.forEach(r => counts[r.dominantArchetype]++);
  
  return {
    combat: (counts.combat / rounds.length) * 100,
    collect: (counts.collect / rounds.length) * 100,
    explore: (counts.explore / rounds.length) * 100,
  };
}
