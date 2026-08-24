// ------------------------------------------------------------------
// Reliability experiment: direct invariant sweep over the surrogate's
// actual input domain
// ------------------------------------------------------------------
// envelope-sweep.ts and envelope-adversarial.ts both drive the pipeline
// through telemetry, which only ever reaches the MLP surrogate through
// normalization + clustering + session deltas -- a narrow, correlated
// slice of the surrogate's real 6-dimensional input space. This script
// instead constructs (soft_membership, delta) pairs directly and feeds
// them through the same inference and clamping path the pipeline uses,
// covering the 3-simplex (vertices, edges, interior) crossed with the
// full theoretically reachable delta range [-1, 1] per axis.
//
// The neutral-centred calibration + hard-constraint clamp
// (ANFISPipeline.computeTargetMultiplier) has no public equivalent --
// it is a private method with no exported standalone function. Per the
// task, this script must not reimplement that formula. TypeScript's
// `private` is a compile-time-only annotation: the method exists on the
// real instance at runtime, so it is invoked here via a documented cast
// rather than duplicated. This calls the actual production code path,
// not a reimplementation of it.
//
// Output: one raw CSV row per (soft_membership, delta) combination. No
// aggregation is performed here -- analysis happens downstream of this file.
// ------------------------------------------------------------------

import { ANFISPipeline } from '../../lib/engine';
import { MLPInference } from '../../lib/engine/mlp';
import type { ANFISInput } from '../../lib/engine/types';

import mlpWeights from '../../models/anfis_mlp_weights.json';
import centroids from '../../models/cluster_centroids.json';
import manifest from '../../models/deployment_manifest.json';
import scalerParams from '../../models/scaler_params.json';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '../../../_research_archive/reliability/outputs/envelope-direct-results.csv');

// ------------------------------------------------------------------
// Same inference and clamping path the pipeline uses.
// ------------------------------------------------------------------
const mlp = new MLPInference(mlpWeights);
const referencePipeline = new ANFISPipeline(scalerParams, centroids, mlpWeights, manifest);

type ComputeTargetMultiplier = (raw: number) => { targetMultiplier: number; multiplierClamped: boolean };

const computeTargetMultiplier = (
  referencePipeline as unknown as { computeTargetMultiplier: ComputeTargetMultiplier }
).computeTargetMultiplier.bind(referencePipeline);

// ------------------------------------------------------------------
// Soft-membership simplex grid: barycentric coordinates (i/R, j/R, k/R)
// with i+j+k==R. This naturally includes all 3 vertices (one coordinate
// at 1, the others at 0) and every edge (one coordinate at 0) as the
// boundary of the same grid, plus interior coverage.
// ------------------------------------------------------------------
const SIMPLEX_RESOLUTION = 20; // -> (R+1)(R+2)/2 = 231 points

interface SoftPoint {
  soft_combat: number;
  soft_collect: number;
  soft_explore: number;
}

function simplexGrid(resolution: number): SoftPoint[] {
  const points: SoftPoint[] = [];
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution - i; j++) {
      const k = resolution - i - j;
      points.push({
        soft_combat: i / resolution,
        soft_collect: j / resolution,
        soft_explore: k / resolution,
      });
    }
  }
  return points;
}

// ------------------------------------------------------------------
// Delta grid: each axis swept independently across its full theoretically
// reachable range [-1, 1], including both endpoints. Not constrained to
// sum to zero -- the MLP itself imposes no such constraint on its inputs,
// and this script's purpose is to test the domain the surrogate could
// actually receive, not only the realistic subset session deltas produce.
// ------------------------------------------------------------------
const DELTA_STEPS = [-1, -0.5, 0, 0.5, 1] as const; // includes both [-1,1] endpoints ("delta extremes")

interface DeltaPoint {
  delta_combat: number;
  delta_collect: number;
  delta_explore: number;
}

function deltaGrid(): DeltaPoint[] {
  const points: DeltaPoint[] = [];
  for (const dc of DELTA_STEPS) {
    for (const dl of DELTA_STEPS) {
      for (const de of DELTA_STEPS) {
        points.push({ delta_combat: dc, delta_collect: dl, delta_explore: de });
      }
    }
  }
  return points;
}

// ------------------------------------------------------------------
// Sweep execution
// ------------------------------------------------------------------
const CSV_HEADER = [
  'trial_id',
  'soft_combat',
  'soft_collect',
  'soft_explore',
  'delta_combat',
  'delta_collect',
  'delta_explore',
  'mlp_output',
  'target_multiplier',
  'multiplier_clamped',
];

function main(): void {
  const softPoints = simplexGrid(SIMPLEX_RESOLUTION);
  const deltaPoints = deltaGrid();

  console.log(`[envelope-direct] simplex_points=${softPoints.length} delta_points=${deltaPoints.length}`);

  const rows: string[] = [CSV_HEADER.join(',')];
  let trialId = 0;

  for (const soft of softPoints) {
    for (const delta of deltaPoints) {
      const input: ANFISInput = {
        soft_combat: soft.soft_combat,
        soft_collect: soft.soft_collect,
        soft_explore: soft.soft_explore,
        delta_combat: delta.delta_combat,
        delta_collect: delta.delta_collect,
        delta_explore: delta.delta_explore,
      };

      const mlpResult = mlp.predict(input);
      const { targetMultiplier, multiplierClamped } = computeTargetMultiplier(mlpResult.result);

      rows.push(
        [
          trialId,
          input.soft_combat,
          input.soft_collect,
          input.soft_explore,
          input.delta_combat,
          input.delta_collect,
          input.delta_explore,
          mlpResult.result,
          targetMultiplier,
          multiplierClamped,
        ].join(',')
      );

      trialId++;
    }
  }

  fs.writeFileSync(OUTPUT_PATH, rows.join('\n') + '\n', 'utf-8');

  console.log(`[envelope-direct] trials=${trialId} rows=${trialId} -> ${OUTPUT_PATH}`);
}

main();
