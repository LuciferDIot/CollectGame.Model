// ------------------------------------------------------------------
// Reliability experiment: state-loss fault injection
// ------------------------------------------------------------------
// Measures how far target_multiplier jumps when a player's stored session
// state is lost mid-session (pipeline instance recycling), versus an
// uninterrupted control run on the identical telemetry sequence.
//
// This exercises the real, deployed ANFISPipeline class against the real
// trained artifacts in /models -- no pipeline logic is reimplemented here.
// The "state loss" scenario mirrors exactly what getPipeline() does in
// app/api/pipeline/adapt/route.ts: whenever globalThis._anfisAdaptPipeline
// is undefined (e.g. a cold start after redeploy), a brand new ANFISPipeline
// is constructed with an empty session manager, so any userId hitting it
// next is treated as a first-time player regardless of real history.
//
// Output: one raw CSV row per (session, condition, window). No aggregation
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
const OUTPUT_PATH = path.join(__dirname, 'fault-injection-results.csv');

const SEED = 1337;
const WINDOWS_PER_SESSION = 20;
const INJECTION_POINTS = [5, 10, 15] as const;
const SESSIONS_PER_INJECTION_POINT = 200;

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
// Synthetic telemetry generation: smooth archetype drift per session.
// Weights interpolate combat-heavy -> exploration-heavy across the
// 20-window sequence, with small per-window jitter for realism.
// ------------------------------------------------------------------
interface ArchetypeWeights {
  combat: number;
  collect: number;
  explore: number;
}

const START_WEIGHTS: ArchetypeWeights = { combat: 0.7, collect: 0.15, explore: 0.15 };
const END_WEIGHTS: ArchetypeWeights = { combat: 0.15, collect: 0.15, explore: 0.7 };

function lerpWeights(t: number): ArchetypeWeights {
  return {
    combat: START_WEIGHTS.combat + (END_WEIGHTS.combat - START_WEIGHTS.combat) * t,
    collect: START_WEIGHTS.collect + (END_WEIGHTS.collect - START_WEIGHTS.collect) * t,
    explore: START_WEIGHTS.explore + (END_WEIGHTS.explore - START_WEIGHTS.explore) * t,
  };
}

function jitterWeights(rng: () => number, w: ArchetypeWeights): ArchetypeWeights {
  const jitter = () => (rng() - 0.5) * 0.06; // +/- 3%
  const combat = Math.max(0.01, w.combat + jitter());
  const collect = Math.max(0.01, w.collect + jitter());
  const explore = Math.max(0.01, w.explore + jitter());
  const total = combat + collect + explore;
  return { combat: combat / total, collect: collect / total, explore: explore / total };
}

function rangeOf(featureName: string): [number, number] {
  const idx = scalerParams.features.indexOf(featureName);
  if (idx === -1) throw new Error(`Feature '${featureName}' not found in scaler_params.json`);
  return [scalerParams.data_min[idx], scalerParams.data_max[idx]];
}

function scaledRandom(rng: () => number, [min, max]: [number, number], weight: number): number {
  return min + rng() * (max - min) * weight;
}

function generateWindowFeatures(rng: () => number, weights: ArchetypeWeights): TelemetryFeatures {
  return {
    enemiesHit: scaledRandom(rng, rangeOf('enemiesHit'), weights.combat),
    damageDone: scaledRandom(rng, rangeOf('damageDone'), weights.combat),
    timeInCombat: scaledRandom(rng, rangeOf('timeInCombat'), weights.combat),
    kills: Math.round(scaledRandom(rng, rangeOf('kills'), weights.combat)),
    itemsCollected: Math.round(scaledRandom(rng, rangeOf('itemsCollected'), weights.collect)),
    pickupAttempts: Math.round(scaledRandom(rng, rangeOf('pickupAttempts'), weights.collect)),
    timeNearInteractables: scaledRandom(rng, rangeOf('timeNearInteractables'), weights.collect),
    distanceTraveled: scaledRandom(rng, rangeOf('distanceTraveled'), weights.explore),
    timeSprinting: scaledRandom(rng, rangeOf('timeSprinting'), weights.explore),
    timeOutOfCombat: scaledRandom(rng, rangeOf('timeOutOfCombat'), 1 - weights.combat),
    deathCount: Math.round(rng() * 3),
  };
}

function generateSessionWindows(seed: number, userId: string, numWindows: number): TelemetryWindow[] {
  const rng = mulberry32(seed);
  const baseTime = Date.UTC(2026, 0, 1);
  const windows: TelemetryWindow[] = [];

  for (let i = 0; i < numWindows; i++) {
    const t = numWindows > 1 ? i / (numWindows - 1) : 0;
    const weights = jitterWeights(rng, lerpWeights(t));
    windows.push({
      userId,
      timestamp: new Date(baseTime + i * 30_000).toISOString(),
      duration: 30,
      features: generateWindowFeatures(rng, weights),
    });
  }

  return windows;
}

// ------------------------------------------------------------------
// Experiment execution
// ------------------------------------------------------------------
interface ResultRow {
  session_id: string;
  injection_point: number;
  condition: 'control' | 'injected';
  window_index: number;
  target_multiplier: number;
  multiplier_clamped: boolean;
  delta_combat: number;
  delta_collect: number;
  delta_explore: number;
  soft_combat: number;
  soft_collect: number;
  soft_explore: number;
}

function newPipeline(): ANFISPipeline {
  return new ANFISPipeline(scalerParams, centroids, mlpWeights, manifest);
}

function buildRow(
  sessionId: string,
  injectionPoint: number,
  condition: 'control' | 'injected',
  windowIndex: number,
  result: ReturnType<ANFISPipeline['process']>
): ResultRow {
  return {
    session_id: sessionId,
    injection_point: injectionPoint,
    condition,
    window_index: windowIndex,
    target_multiplier: result.target_multiplier,
    multiplier_clamped: result.validation.multiplier_clamped,
    delta_combat: result.deltas.delta_combat,
    delta_collect: result.deltas.delta_collect,
    delta_explore: result.deltas.delta_explore,
    soft_combat: result.soft_membership.soft_combat,
    soft_collect: result.soft_membership.soft_collect,
    soft_explore: result.soft_membership.soft_explore,
  };
}

function runControl(windows: TelemetryWindow[], sessionId: string, injectionPoint: number): ResultRow[] {
  const pipeline = newPipeline();
  return windows.map((window, idx) =>
    buildRow(sessionId, injectionPoint, 'control', idx, pipeline.process(window))
  );
}

function runInjected(windows: TelemetryWindow[], sessionId: string, injectionPoint: number): ResultRow[] {
  let pipeline = newPipeline();
  const rows: ResultRow[] = [];

  windows.forEach((window, idx) => {
    if (idx === injectionPoint) {
      // Simulate instance recycling / state loss: discard the pipeline and
      // construct a fresh one, exactly as getPipeline() does when
      // globalThis._anfisAdaptPipeline is undefined.
      pipeline = newPipeline();
    }
    rows.push(buildRow(sessionId, injectionPoint, 'injected', idx, pipeline.process(window)));
  });

  return rows;
}

const CSV_HEADER = [
  'session_id',
  'injection_point',
  'condition',
  'window_index',
  'target_multiplier',
  'multiplier_clamped',
  'delta_combat',
  'delta_collect',
  'delta_explore',
  'soft_combat',
  'soft_collect',
  'soft_explore',
];

function rowToCsvLine(row: ResultRow): string {
  return [
    row.session_id,
    row.injection_point,
    row.condition,
    row.window_index,
    row.target_multiplier,
    row.multiplier_clamped,
    row.delta_combat,
    row.delta_collect,
    row.delta_explore,
    row.soft_combat,
    row.soft_collect,
    row.soft_explore,
  ].join(',');
}

function main(): void {
  console.log(`[fault-injection] seed=${SEED}`);

  const rows: ResultRow[] = [];
  let sessionCount = 0;

  for (const injectionPoint of INJECTION_POINTS) {
    for (let s = 0; s < SESSIONS_PER_INJECTION_POINT; s++) {
      const sessionId = `ip${injectionPoint}-s${s}`;
      const sessionSeed = SEED + injectionPoint * 1_000_000 + s;
      const windows = generateSessionWindows(sessionSeed, sessionId, WINDOWS_PER_SESSION);

      rows.push(...runControl(windows, sessionId, injectionPoint));
      rows.push(...runInjected(windows, sessionId, injectionPoint));

      sessionCount++;
    }
  }

  const lines = [CSV_HEADER.join(','), ...rows.map(rowToCsvLine)];
  fs.writeFileSync(OUTPUT_PATH, lines.join('\n') + '\n', 'utf-8');

  console.log(`[fault-injection] sessions=${sessionCount} rows=${rows.length} -> ${OUTPUT_PATH}`);
}

main();
