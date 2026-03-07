# ANFIS Adaptive Difficulty System — Final Status

**Project**: CollectGame.Model
**Version**: 2.2.1
**Date**: March 7, 2026

---

## System Architecture

### Pipeline (8 steps)
1. Raw telemetry → 30s windows
2. Derived feature computation (`damagePerHit`, `pickupAttemptRate`)
3. Uniform MinMaxScaler normalization (12 features → [0,1])
4. K-Means clustering (K=3) → soft membership
5. Delta computation → temporal signals
6. MLP surrogate inference (6-16-8-1)
7. Neutral-centred calibration → display multiplier
8. Per-parameter adaptation cascade

### Configuration
- **Features**: 12 total (10 raw telemetry + 2 derived)
- **Activity Scoring**: per-archetype average (÷5 Combat, ÷4 Collect, ÷2 Explore)
- **Clustering**: K=3, soft membership via inverse-distance weighting
- **ANFIS Inputs**: [soft_combat, soft_collect, soft_explore, Δcombat, Δcollect, Δexplore]
- **Target formula**: `1.0 + 0.22×(soft_combat−0.5) + 0.18×(soft_collect−0.5) + 0.15×(soft_explore−0.5) + 0.55×Δcombat + 0.40×Δcollect + 0.35×Δexplore − 0.25×death_rate`, clipped [0.6, 1.4]
- **Calibration**: `display = clamp(1.0 + (raw − 0.932006) × 2.0, 0.6, 1.4)`
- **Session timeout**: 90s

### v2.1 Activity Scoring Change

The v2.0 Exploration score included `timeOutOfCombat`:
```
score_explore = distanceTraveled + timeSprinting + timeOutOfCombat  (sums)
```

Two problems:
1. `timeOutOfCombat` accumulates passively — a combat-intent player on a sparse-spawn map accumulates a high Exploration score simply by waiting for enemies to spawn.
2. `timeOutOfCombat + timeInCombat = session_duration` — they are arithmetic complements, introducing inverse correlation.

Additionally, using raw sums gave Combat (4 features) a 4× raw ceiling over a 1-feature category.

Fix:
```
score_combat  = avg(enemiesHit, damageDone, timeInCombat, kills)            → [0,1]
score_collect = avg(itemsCollected, pickupAttempts, timeNearInteractables)   → [0,1]
score_explore = avg(distanceTraveled, timeSprinting)                         → [0,1]
```

Rerun sequence: notebooks 04 → 05 → 06 → 07.

---

## Experimental Validation

| Phase | Approach | Result |
|-------|----------|--------|
| A/B Testing | Baseline vs Feature-aware | Baseline wins 5/8 metrics |
| Grid Search | 108 configurations | Baseline near-optimal (Silhouette=0.3752) |
| Delta analysis | Δexplore correlation | r=0.808 — deltas approved |
| Feature weighting | Exploration down-weighting | No improvement — rejected |
| Activity scoring | Remove `timeOutOfCombat`, use averages | Applied in v2.1 |

### Known Limitations (v2.1 audit)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | `timeOutOfCombat` passive exploration inflation | Critical | Fixed (v2.1) |
| 2 | Sum vs average asymmetry | High | Fixed (v2.1) |
| 3 | `timeSprinting` ambiguous (attacker AND explorer signal) | High | Acknowledged; no fix without new telemetry |
| 4 | `timeNearInteractables` correlated with `distanceTraveled` | High | Acknowledged |
| 5 | Collection centroid only 12.3% pct_collect — weak separation | High | Improved after v2.1 rerun |
| 6 | Zero-activity fallback returns 33/33/33 — idle session bias | Medium | Accepted design |
| 7 | Session timeout 40s — delta reset on slow networks | Medium | Fixed in v2.2 (→ 90s) |
| 8 | Uniform parameter sensitivity 0.3 | Low | Fixed in v2.2 (per-parameter registry) |

---

## Final Metrics

### Clustering
- Silhouette: 0.3752 (threshold >0.3)
- DB Index: 0.9768 (threshold <1.5)
- CH Score: 2109.3

### Behavioral Modeling
- Soft membership: 29.5% / 38.8% / 31.7% (Combat/Collection/Exploration)
- Mean Entropy: 1.4053
- Dominant windows (>0.6): 32%

### MLP Surrogate (v2.2.1)
- Train R²: 0.860 | Test R²: 0.9264
- Train MAE: 0.0139 | Test MAE: 0.0127
- Convergence: 21 iterations (LBFGS)
- mlp_neutral: 0.932006

### Target Distribution
- Range: [0.60, 1.107] | Mean: 0.902 | Std: 0.074

### Responsiveness
- Δexplore → Δtarget: r = 0.808

---

## File Structure

```
CollectGame.Model/
├── _research_archive/
│   ├── core/notebooks/ (01-10)
│   ├── data/processed/
│   ├── data/models/
│   └── thesis_documentation/
├── anfis-demo-ui/
│   ├── lib/engine/          ← TypeScript pipeline
│   ├── models/              ← deployed artifacts
│   └── __tests__/           ← 19 Vitest tests
├── README.md
├── CHANGELOG.md
└── FINAL_SYSTEM_STATUS.md
```

---

## Testing & Verification

### ANFIS Engine Tests (Next.js)

| Test File | Tests | Status |
|-----------|-------|--------|
| `activity.test.ts` | 4 | Pass |
| `adaptation.test.ts` | 2 | Pass |
| `normalization.test.ts` | 4 | Pass |
| `mlp.test.ts` | 4 | Pass |
| `clustering.test.ts` | 3 | Pass |
| `pipeline.test.ts` | 2 | Pass |
| **Total** | **19** | **Pass** |

### Backend Unit Tests

| Test Suite | Tests | Status |
|------------|-------|--------|
| TelemetryService | 30 | Pass |
| NotificationService | 22 | Pass |
| Domain Value Objects | 73 | Pass |
| Timezone utilities | 6 | Pass |
| **Total** | **131** | **Pass** |

### Notebook 09 — MLP Surrogate Evaluation

| Section | Test | Result |
|---------|------|--------|
| 2 | Test R² reproduced | 0.9264 |
| 2 | Test MAE reproduced | 0.0127 |
| 3 | Balanced (⅓,⅓,⅓) neutral | display = 1.000 |
| 3 | First window delta=0 | equals neutral |
| 3 | Extreme combat + delta | display = 1.127 ∈ [0.6, 1.4] |
| 3 | Extreme explore + delta | display = 0.829 ∈ [0.6, 1.4] |
| 4 | Residual analysis | within bounds |
| 5 | Bootstrap 95% CI | stored R² inside CI |

### Notebook 10 — Pipeline Integration

| Step | Assertion | Result |
|------|-----------|--------|
| 1 | CSV shape | 3240 rows × 36 cols |
| 2 | MinMaxScaler ∈ [0, 1] | min=0.0, max=1.0 |
| 3 | Soft membership sums = 1 | max deviation = 2.22e-16 |
| 4 | First window deltas = 0 | max_abs=0.00e+00 |
| 5 | Target in valid range | [0.60, 1.107] |
| 6 | MLP predictions finite | raw [0.486, 1.123]; display [0.6, 1.4] |
| 7 | Pearson r(Δexplore, target) ≥ 0.7 | r ≥ 0.7 |
| 8 | No NaN in ANFIS matrix | NaN count = 0 |
| 9 | All 3 cluster labels present | [0, 1, 2] |

---

## Status

**Version**: 2.2.1
**Architecture**: frozen
**Experimentation**: closed
**Documentation**: complete

No further changes to architecture, preprocessing, or clustering. All artifacts regenerated post v2.2.1 retrain (March 7, 2026).
