# Deployment reliability experiments

Post-deployment operational reliability of the ANFIS/MLP pipeline: does the
`target_multiplier` safety envelope hold, and does session state (deltas)
survive instance recycling. Distinct from experiments A-G, which validate
the offline model-design decisions (clustering, target formula, model
selection) rather than deployed-instance behaviour.

The five TypeScript scripts live in
`anfis-demo-ui/research/icac-reliability/` rather than here, because they
import `ANFISPipeline` from `anfis-demo-ui/lib/engine` via relative paths
and must stay under `anfis-demo-ui/` to resolve. They all write their
output into `outputs/` in this folder.

| Script | Purpose | Output |
|---|---|---|
| `fault-injection.ts` | Drifting-profile sessions, pipeline instance discarded mid-session at windows 5/10/15 vs. an uninterrupted control | `outputs/fault-injection-results.csv` |
| `fault-injection-stationary.ts` | Same as above, but the behavioural profile is held constant instead of drifting -- isolates drift vs. injection depth | `outputs/fault-injection-stationary-results.csv` |
| `envelope-sweep.ts` | Uniform random sampling of telemetry across each feature's declared scaler range | `outputs/envelope-sweep-results.csv` |
| `envelope-adversarial.ts` | Adversarial sampling (archetype corners, global extremes, out-of-distribution values, oscillating sessions) to try to reach the declared clamp bounds | `outputs/envelope-adversarial-results.csv` |
| `envelope-direct.ts` | Bypasses telemetry entirely -- sweeps the MLP surrogate's actual (soft_membership, delta) input domain directly through the pipeline's own inference + clamp code | `outputs/envelope-direct-results.csv` |

`aura_probe.py` (in this folder) is the live-production counterpart to
`fault-injection.ts` -- it probes the deployed `/api/pipeline/adapt`
endpoint directly instead of simulating the pipeline offline. Run from
this folder; writes to `outputs/latency_*.csv` / `outputs/continuity_*.csv`.

All CSVs are raw, one row per trial/window -- no aggregation performed by
the scripts themselves.

## Reproducing

From `anfis-demo-ui/`:

```
pnpm dlx tsx research/icac-reliability/fault-injection.ts
pnpm dlx tsx research/icac-reliability/fault-injection-stationary.ts
pnpm dlx tsx research/icac-reliability/envelope-sweep.ts
pnpm dlx tsx research/icac-reliability/envelope-adversarial.ts
pnpm dlx tsx research/icac-reliability/envelope-direct.ts
```

All five are seeded (`SEED = 1337`) and deterministic -- rerunning
reproduces the same CSVs byte-for-byte.
