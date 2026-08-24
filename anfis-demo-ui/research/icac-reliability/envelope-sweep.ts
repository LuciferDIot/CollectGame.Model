// ------------------------------------------------------------------
// Reliability experiment: safety envelope sweep
// ------------------------------------------------------------------
// Verifies target_multiplier and adapted_parameters never leave the bounds
// declared in models/deployment_manifest.json, across a wide sweep of the
// input space. Treats hard_constraints as a testable invariant rather than
// a description.
//
// This exercises the real, deployed ANFISPipeline class against the real
// trained artifacts in /models -- no pipeline logic is reimplemented here.
//
// Bound checking is data-driven: for each adapted_parameters key, this
// script looks for a manifest hard_constraints entry named `${key}_range`.
// deployment_manifest.json currently only declares target_multiplier_range
// and archetype_modifier_range, neither of which matches any adapted
// parameter's key by name (archetype_modifier is an internal scaling
// factor, not itself exposed in adapted_parameters). So every parameter
// is expected to come back "unbounded" under the current manifest -- that
// is the finding this script is designed to surface, not an assumption
// baked into the check.
//
// Output: one raw CSV row per trial. No aggregation is performed here --
// analysis happens downstream of this file.
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
const OUTPUT_PATH = path.join(__dirname, 'envelope-sweep-results.csv');

const SEED = 1337;
const NUM_TRIALS = 5000;

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

// ------------------------------------------------------------------
// Sweep input: raw telemetry fields drawn uniformly from their declared
// [data_min, data_max] range in scaler_params.json. damage_per_hit and
// pickup_attempt_rate are derived by the pipeline itself from these raw
// fields (see lib/engine/index.ts step2_NormalizeFeatures) so they are
// not set directly here -- setting them independently would require
// reimplementing that derivation.
// ------------------------------------------------------------------
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

function generateTelemetryFeatures(rng: () => number): TelemetryFeatures {
  const features: Record<string, number> = {};
  for (const name of RAW_FEATURES) {
    const [min, max] = rangeOf(name);
    features[name] = min + rng() * (max - min);
  }
  // deathCount is a required telemetry field but has no declared scaler
  // range (it does not feed normalization or activity scoring at all --
  // see lib/engine/activity.ts). Sampled from a plausible small range.
  features.deathCount = Math.round(rng() * 10);
  return features as unknown as TelemetryFeatures;
}

// ------------------------------------------------------------------
// Manifest-driven bound checking
// ------------------------------------------------------------------
function declaredRanges(): Record<string, [number, number]> {
  const hc = manifest.hard_constraints as Record<string, unknown>;
  const out: Record<string, [number, number]> = {};
  for (const key of Object.keys(hc)) {
    const val = hc[key];
    if (Array.isArray(val) && val.length === 2 && typeof val[0] === 'number' && typeof val[1] === 'number') {
      out[key] = [val[0], val[1]];
    }
  }
  return out;
}

const DECLARED_RANGES = declaredRanges();

function checkParamBound(paramKey: string, value: number): 'unbounded' | 'within_bound' | 'OUT_OF_BOUND' {
  const bound = DECLARED_RANGES[`${paramKey}_range`];
  if (!bound) return 'unbounded';
  const [lo, hi] = bound;
  return value >= lo && value <= hi ? 'within_bound' : 'OUT_OF_BOUND';
}

// ------------------------------------------------------------------
// Sweep execution
// ------------------------------------------------------------------
function main(): void {
  console.log(`[envelope-sweep] seed=${SEED}`);

  const rng = mulberry32(SEED);
  const baseTime = Date.UTC(2026, 0, 1);
  const rows: string[] = [];
  let paramKeysOrder: string[] = [];

  for (let trial = 0; trial < NUM_TRIALS; trial++) {
    const pipeline = new ANFISPipeline(scalerParams, centroids, mlpWeights, manifest);

    const window: TelemetryWindow = {
      userId: `sweep-${trial}`,
      timestamp: new Date(baseTime + trial * 1000).toISOString(),
      duration: 30,
      features: generateTelemetryFeatures(rng),
    };

    const result = pipeline.process(window);

    if (trial === 0) {
      paramKeysOrder = Object.keys(result.adapted_parameters);
      const header = [
        'trial_id',
        'target_multiplier',
        'multiplier_clamped',
        ...paramKeysOrder.flatMap((k) => [`${k}_value`, `${k}_bound_check`]),
      ];
      rows.push(header.join(','));
    }

    const fields: Array<string | number | boolean> = [
      trial,
      result.target_multiplier,
      result.validation.multiplier_clamped,
    ];

    for (const key of paramKeysOrder) {
      const value = result.adapted_parameters[key].final;
      fields.push(value, checkParamBound(key, value));
    }

    rows.push(fields.join(','));
  }

  fs.writeFileSync(OUTPUT_PATH, rows.join('\n') + '\n', 'utf-8');

  console.log(`[envelope-sweep] trials=${NUM_TRIALS} rows=${NUM_TRIALS} -> ${OUTPUT_PATH}`);
}

main();
