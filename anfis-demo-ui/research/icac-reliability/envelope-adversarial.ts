// ------------------------------------------------------------------
// Reliability experiment: adversarial envelope sweep
// ------------------------------------------------------------------
// envelope-sweep.ts sampled each telemetry feature independently and
// uniformly, and across 5,000 trials target_multiplier only reached
// [0.828, 1.092] -- it never approached the declared [0.6, 1.4] bounds.
// That tested the interior of the input space, not the envelope.
//
// This script samples adversarially instead: pure-archetype corners (and
// their inverse), global min/max extremes, deliberately out-of-distribution
// values, and oscillating multi-window sessions designed to maximise delta
// magnitude (the signal most likely to push the MLP output away from its
// neutral point). It exercises the real, deployed ANFISPipeline class
// against the real trained artifacts in /models -- no pipeline logic is
// reimplemented here.
//
// Output: one raw CSV row per (trial, window) observation. No aggregation
// is performed here -- analysis happens downstream of this file.
// ------------------------------------------------------------------

import { ANFISPipeline } from '../../lib/engine';
import type { TelemetryFeatures, TelemetryWindow } from '../../lib/engine/types';

import mlpWeights from '../../models/anfis_mlp_weights.json';
import centroids from '../../models/cluster_centroids.json';
import manifest from '../../models/deployment_manifest.json';
import scalerParams from '../../models/scaler_params.json';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, 'envelope-adversarial-results.csv');

const SEED = 1337;

// ------------------------------------------------------------------
// Seeded PRNG (mulberry32) -- deterministic, reproducible generation.
// ------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function (): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Archetype = 'combat' | 'collect' | 'explore';

const ARCHETYPE_FEATURES: Record<Archetype, string[]> = {
  combat: ['enemiesHit', 'damageDone', 'timeInCombat', 'kills'],
  collect: ['itemsCollected', 'pickupAttempts', 'timeNearInteractables'],
  explore: ['distanceTraveled', 'timeSprinting'],
};

const RAW_FEATURES = [
  'enemiesHit',
  'damageDone',
  'timeInCombat',
  'kills',
  'itemsCollected',
  'pickupAttempts',
  'timeNearInteractables',
  'distanceTraveled',
  'timeSprinting',
  'timeOutOfCombat',
] as const;

function rangeOf(featureName: string): [number, number] {
  const idx = scalerParams.features.indexOf(featureName);
  if (idx === -1) throw new Error(`Feature '${featureName}' not found in scaler_params.json`);
  return [scalerParams.data_min[idx], scalerParams.data_max[idx]];
}

function jitterFraction(rng: () => number, fraction: number): number {
  return (rng() * 2 - 1) * fraction;
}

// ------------------------------------------------------------------
// Strategy (a): pure-archetype corners and their inverse.
// `target` at its data_max (or data_min when targetHigh is false) while
// the other two archetypes sit at the opposite extreme. jitterFrac==0
// reproduces the exact literal corner; small jitterFrac probes the
// neighbourhood right around it without leaving the declared range.
// ------------------------------------------------------------------
function archetypeCornerFeatures(
  rng: () => number,
  target: Archetype,
  targetHigh: boolean,
  jitterFrac: number
): TelemetryFeatures {
  const values: Record<string, number> = {};
  const archetypes: Archetype[] = ['combat', 'collect', 'explore'];

  for (const arch of archetypes) {
    const isHigh = arch === target ? targetHigh : !targetHigh;
    for (const feat of ARCHETYPE_FEATURES[arch]) {
      const [min, max] = rangeOf(feat);
      const base = isHigh ? max : min;
      const noise = jitterFrac > 0 ? jitterFraction(rng, jitterFrac) * (max - min) : 0;
      values[feat] = Math.max(min, Math.min(max, base + noise));
    }
  }

  // timeOutOfCombat is the natural inverse of combat activity (see
  // lib/engine/activity.ts) -- low when combat is high, and vice versa.
  const combatIsHigh = target === 'combat' ? targetHigh : !targetHigh;
  const [tocMin, tocMax] = rangeOf('timeOutOfCombat');
  const tocBase = combatIsHigh ? tocMin : tocMax;
  const tocNoise = jitterFrac > 0 ? jitterFraction(rng, jitterFrac) * (tocMax - tocMin) : 0;
  values.timeOutOfCombat = Math.max(tocMin, Math.min(tocMax, tocBase + tocNoise));

  values.deathCount = 0;
  return values as unknown as TelemetryFeatures;
}

// ------------------------------------------------------------------
// Strategy (b): all-features-at-data_min / all-features-at-data_max.
// ------------------------------------------------------------------
function globalExtremeFeatures(rng: () => number, extreme: 'min' | 'max', jitterFrac: number): TelemetryFeatures {
  const values: Record<string, number> = {};
  for (const name of RAW_FEATURES) {
    const [min, max] = rangeOf(name);
    const base = extreme === 'min' ? min : max;
    const noise = jitterFrac > 0 ? jitterFraction(rng, jitterFrac) * (max - min) : 0;
    values[name] = Math.max(min, Math.min(max, base + noise));
  }
  values.deathCount = 0;
  return values as unknown as TelemetryFeatures;
}

// ------------------------------------------------------------------
// Strategy (c): deliberately out-of-distribution values (2x data_max,
// and negative values). Not clamped to the declared range -- that is
// the point of this strategy. Record what happens; don't guard against it.
// ------------------------------------------------------------------
function outOfDistributionFeatures(rng: () => number, multiplierOfMax: number, jitterFrac: number): TelemetryFeatures {
  const values: Record<string, number> = {};
  for (const name of RAW_FEATURES) {
    const [, max] = rangeOf(name);
    const base = max * multiplierOfMax;
    const noise = jitterFrac > 0 ? jitterFraction(rng, jitterFrac) * Math.abs(max) : 0;
    values[name] = base + noise;
  }
  values.deathCount = 0;
  return values as unknown as TelemetryFeatures;
}

// ------------------------------------------------------------------
// Strategy (d): sequential multi-window sessions on a single pipeline
// instance, oscillating between opposing archetype corners window to
// window, to maximise delta magnitude (session state persists throughout).
// ------------------------------------------------------------------
const OPPOSING_PAIRS: Array<[Archetype, Archetype]> = [
  ['combat', 'explore'],
  ['combat', 'collect'],
  ['collect', 'explore'],
];

function generateOscillatingWindowFeatures(
  rng: () => number,
  pair: [Archetype, Archetype],
  windowIndex: number
): TelemetryFeatures {
  const active = pair[windowIndex % 2];
  return archetypeCornerFeatures(rng, active, true, 0.01);
}

// ------------------------------------------------------------------
// Shared pipeline / row plumbing
// ------------------------------------------------------------------
function newPipeline(): ANFISPipeline {
  return new ANFISPipeline(scalerParams, centroids, mlpWeights, manifest);
}

function windowFrom(features: TelemetryFeatures, userId: string, windowIndex: number): TelemetryWindow {
  return {
    userId,
    timestamp: new Date(Date.UTC(2026, 0, 1) + windowIndex * 30_000).toISOString(),
    duration: 30,
    features,
  };
}

interface AdversarialRow {
  trial_id: number;
  strategy: string;
  window_index: number;
  target_multiplier: number;
  multiplier_clamped: boolean;
  mlp_output: number;
  soft_combat: number;
  soft_collect: number;
  soft_explore: number;
  delta_combat: number;
  delta_collect: number;
  delta_explore: number;
}

function buildRow(
  trialId: number,
  strategy: string,
  windowIndex: number,
  result: ReturnType<ANFISPipeline['process']>
): AdversarialRow {
  return {
    trial_id: trialId,
    strategy,
    window_index: windowIndex,
    target_multiplier: result.target_multiplier,
    multiplier_clamped: result.validation.multiplier_clamped,
    mlp_output: result.mlp_output,
    soft_combat: result.soft_membership.soft_combat,
    soft_collect: result.soft_membership.soft_collect,
    soft_explore: result.soft_membership.soft_explore,
    delta_combat: result.deltas.delta_combat,
    delta_collect: result.deltas.delta_collect,
    delta_explore: result.deltas.delta_explore,
  };
}

const CSV_HEADER = [
  'trial_id',
  'strategy',
  'window_index',
  'target_multiplier',
  'multiplier_clamped',
  'mlp_output',
  'soft_combat',
  'soft_collect',
  'soft_explore',
  'delta_combat',
  'delta_collect',
  'delta_explore',
];

function rowToCsvLine(row: AdversarialRow): string {
  return [
    row.trial_id,
    row.strategy,
    row.window_index,
    row.target_multiplier,
    row.multiplier_clamped,
    row.mlp_output,
    row.soft_combat,
    row.soft_collect,
    row.soft_explore,
    row.delta_combat,
    row.delta_collect,
    row.delta_explore,
  ].join(',');
}

// ------------------------------------------------------------------
// Experiment execution
// ------------------------------------------------------------------
const CORNER_REPEATS = 50; // repeat 0 is the exact literal corner (no jitter)
const SESSIONS_PER_PAIR = 100;
const WINDOWS_PER_SESSION = 20; // >= 10 per spec

function main(): void {
  console.log(`[envelope-adversarial] seed=${SEED}`);

  const rng = mulberry32(SEED);
  const rows: AdversarialRow[] = [];
  let trialId = 0;
  const archetypes: Archetype[] = ['combat', 'collect', 'explore'];

  // (a) pure-archetype corners + inverse
  for (const target of archetypes) {
    for (const targetHigh of [true, false]) {
      for (let r = 0; r < CORNER_REPEATS; r++) {
        const jitterFrac = r === 0 ? 0 : 0.01;
        const pipeline = newPipeline();
        const userId = `corner-${target}-${targetHigh ? 'high' : 'low'}-${r}`;
        const features = archetypeCornerFeatures(rng, target, targetHigh, jitterFrac);
        const result = pipeline.process(windowFrom(features, userId, 0));
        rows.push(buildRow(trialId++, 'pure_archetype_corner', 0, result));
      }
    }
  }

  // (b) global extremes
  for (const extreme of ['min', 'max'] as const) {
    for (let r = 0; r < CORNER_REPEATS; r++) {
      const jitterFrac = r === 0 ? 0 : 0.01;
      const pipeline = newPipeline();
      const userId = `global-${extreme}-${r}`;
      const features = globalExtremeFeatures(rng, extreme, jitterFrac);
      const result = pipeline.process(windowFrom(features, userId, 0));
      rows.push(buildRow(trialId++, 'global_extreme', 0, result));
    }
  }

  // (c) out-of-distribution: 2x data_max, and negative values
  for (const multiplier of [2, -1]) {
    for (let r = 0; r < CORNER_REPEATS; r++) {
      const jitterFrac = r === 0 ? 0 : 0.01;
      const pipeline = newPipeline();
      const userId = `ood-${multiplier}-${r}`;
      const features = outOfDistributionFeatures(rng, multiplier, jitterFrac);
      const result = pipeline.process(windowFrom(features, userId, 0));
      rows.push(buildRow(trialId++, 'out_of_distribution', 0, result));
    }
  }

  // (d) oscillating multi-window sessions, single persistent pipeline per session
  for (const pair of OPPOSING_PAIRS) {
    for (let s = 0; s < SESSIONS_PER_PAIR; s++) {
      const pipeline = newPipeline();
      const userId = `osc-${pair[0]}-${pair[1]}-${s}`;
      const sessionTrialId = trialId++;

      for (let w = 0; w < WINDOWS_PER_SESSION; w++) {
        const features = generateOscillatingWindowFeatures(rng, pair, w);
        const result = pipeline.process(windowFrom(features, userId, w));
        rows.push(buildRow(sessionTrialId, 'oscillating_session', w, result));
      }
    }
  }

  const lines = [CSV_HEADER.join(','), ...rows.map(rowToCsvLine)];
  fs.writeFileSync(OUTPUT_PATH, lines.join('\n') + '\n', 'utf-8');

  console.log(`[envelope-adversarial] trials=${trialId} rows=${rows.length} -> ${OUTPUT_PATH}`);
}

main();
