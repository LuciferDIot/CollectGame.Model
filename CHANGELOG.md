# CHANGELOG

**Project**: ANFIS Adaptive Difficulty System  
**Repository**: CollectGame.Model

---

## [2.2.1] - 2026-03-07 - TRAINING BIAS FIX & NEUTRAL-CENTRED CALIBRATION

### Problem Discovered
After deploying v2.2, analytics showed the pipeline almost exclusively outputting "easier by X%"
regardless of player archetype. Investigation revealed two root causes:

1. **Training target formula had `base=0.9`** (should be 1.0). Because soft memberships sum to 1.0
   and are centered at 0.5, a balanced player (⅓,⅓,⅓) contributed ≈ −0.09 to the target,
   pushing the entire training distribution below 1.0. The MLP therefore learned that all
   realistic inputs map to sub-neutral outputs — making it impossible to ever predict "harder".

2. **Min-max rescaling used unrealistic extreme inputs** to compute output_range [0.49, 1.12].
   This pulled the min far below any realistic player input, making every real session appear
   "above midpoint" → always HARDER after the first attempted fix.

### Fix
- **Retrained notebooks 06–10** with `base=1.0` in target formula (Option B canonical)
- **Replaced min-max rescaling** with neutral-centred calibration:
  `display = clamp(1.0 + (raw − mlp_neutral) × 2.0, 0.6, 1.4)`
  where `mlp_neutral` = MLP output for balanced (⅓,⅓,⅓,0,0,0) input = 0.932006
- **Self-updating**: notebook 07 auto-computes and saves `mlp_neutral` after each retrain

### Changed
- **`06_ANFIS_Preparation.ipynb`**: `base=0.9` → `base=1.0` in target formula
- **`07_ANFIS_Training.ipynb`**: Added `mlp_neutral` computation + export; replaced output_range sweep with clean deploy cell that saves `training_stats.json`
- **`lib/engine/index.ts`**: `computeTargetMultiplier()` now uses neutral-centred formula; reads `mlp_neutral` from `anfis_mlp_weights.json` with fallback 0.932
- **`anfis_mlp_weights.json`**: Added `mlp_neutral: 0.932006`; `output_range` kept as documentation only
- **`training_stats.json`**: Updated with correct post-retrain distribution (min=0.60, max=1.107, mean=0.902, std=0.074)

### New Training Metrics (post-retrain)
| Metric | Before (biased) | After (corrected) |
|--------|-----------------|-------------------|
| Test R² | 0.9391 | **0.9264** |
| Test MAE | 0.0112 | **0.0127** |
| Target min | 0.609 | **0.600** |
| Target max | 1.021 | **1.107** |
| Target mean | 0.801 | **0.902** |

### Verification
Balanced (⅓,⅓,⅓) → display **1.000** (exact neutral) ✅
High combat + Δ=+0.3 → display **1.127** (HARDER by 13%) ✅
High explore + Δ=+0.3 → display **0.829** (easier by 17%) ✅

---

## [2.2.0] - 2026-03-06 - DERIVED FEATURES & SENSITIVITY UPDATE

### Summary
Introduced two derived features to improve archetype discrimination, replaced the global uniform
sensitivity constant with a principled per-parameter registry, and extended the session timeout
to tolerate network latency and loading screens between telemetry windows.

### Added
- **`damage_per_hit`** derived feature: `damageDone_raw / max(enemiesHit_raw, 1)`
  - Captures weapon-class-agnostic combat intensity (sniper vs spray-fire archetypes)
  - Computed before MinMaxScaler and normalized as the 11th feature
  - Added to `pct_combat` average: ÷5 instead of ÷4
- **`pickup_attempt_rate`** derived feature: `pickupAttempts_raw / max(timeNearInteractables_raw, 1)`
  - Disambiguates deliberate collectors (high rate) from incidental explorers (low rate)
  - Normalized as the 12th feature
  - Added to `pct_collect` average: ÷4 instead of ÷3
- **Per-parameter sensitivity registry** in `adaptation.ts`:
  - `ENEMY_HEALTH: 0.20`, `ENEMY_DAMAGE: 0.25`, `SPAWN_RATE: 0.35`, `SPAWN_DELAY: 0.30`
  - Replaces the previous uniform `0.3` constant for all parameters

### Changed
- **`session-manager.ts`**: `STATE_TIMEOUT_MS` increased `40000 → 90000` (3× window cadence)
- **`scaler_params.json`**: Updated from 10 → 12 features including derived features
- **`deployment_manifest.json`**: Version → 2.2, status → PRODUCTION, feature_calculations updated
- **`03_Normalization.ipynb`**: Added scaler export cell; derived features computed before scaling
- **`04_Activity_Contributions.ipynb`**: Updated formulae for both combat (÷5) and collect (÷4)
- **`educational-content.ts`**: Added tooltip entries for `damagePerHit` and `pickupAttemptRate`
- **`pipeline-constants.ts`**: Updated step descriptions to reference v2.2

### Artifacts Regenerated (Notebooks 03 → 07)
- `data/processed/3_normalized_telemetry.csv`
- `data/processed/4_activity_contributions.csv`
- `data/processed/5_clustered_telemetry.csv`
- `data/processed/6_anfis_dataset.csv`
- `data/models/scaler_params.json` (12 features)
- `data/models/anfis_mlp_weights.json` (Test R²: 0.9264, MAE: 0.0127 — post training-bias fix)
- `anfis-demo-ui/models/` (all synced including `mlp_neutral: 0.932006`)

### Engine Fix
- Fixed `camelCase` → `snake_case` mismatch in `lib/engine/index.ts` for derived feature keys

---

## [2.1.0] - 2026-03-06 - ACTIVITY SCORING REVISION

### Summary
Corrected structural bias in the activity scoring formula that caused combat-intent players
to be misclassified as Explorers when enemy spawns were sparse. No new telemetry required;
fix works entirely within the existing 10-feature dataset.

### Problem
The v2.0 Exploration score included `timeOutOfCombat`:
```
score_explore = distanceTraveled + timeSprinting + timeOutOfCombat   (v2.0)
```
This feature accumulated **passively** for any player not in combat — including players
actively seeking enemies on a large map with low initial spawn density. `timeOutOfCombat`
is also the arithmetic inverse of `timeInCombat` (they sum to session time), making them
redundant and inversely correlated. The result was systematic overcounting of the Exploration
archetype, suppressing Combat classification for attacker-intent players.

Additionally, scores were computed as raw sums, giving Combat (4 features) a structural
ceiling advantage over Collection (3) and Exploration (previously 3, now 2 after fix).

### Changed
- **`activity.ts`**: Activity scores now use per-archetype averages (÷ feature count)
  so each archetype has an equal ceiling of 1.0. `timeOutOfCombat` removed from
  Exploration score; Exploration now uses only `distanceTraveled` and `timeSprinting`.
- **`deployment_manifest.json`**: `feature_calculations` updated to reflect new formula.
  `scoring_notes` section added documenting the rationale.
- **`04_Activity_Contributions.ipynb`**: Score cell updated to use `mean(axis=1)` with
  correct feature lists. Old `sum(axis=1)` approach replaced.
- **`05_Clustering.ipynb`**: New cell added to export `cluster_centroids.json` directly
  to both `data/processed/` and `anfis-demo-ui/models/` after clustering.

### Action Completed
Notebooks 04 → 05 → 06 → 07 have been rerun and all artifacts regenerated:
- `data/processed/4_activity_contributions.csv`
- `data/processed/5_clustered_telemetry.csv`
- `anfis-demo-ui/models/cluster_centroids.json`
- `data/processed/6_anfis_dataset.csv`
- `anfis-demo-ui/models/anfis_mlp_weights.json`

### Expected Improvements After Rerun
- Combat archetype centroid `pct_explore` will decrease (was inflated by `timeOutOfCombat`)
- Exploration centroid will require more deliberate movement to achieve (more accurate)
- Players on sparse-enemy maps who are actively seeking combat will score closer to Combat
- All three archetype ceilings become equal (prevents structural bias)

---

## [2.0.0] - 2026-01-27 - FINAL PRODUCTION RELEASE ✅

### Summary
Complete system with delta integration. All experimental validation finished, architecture frozen, production-ready.

### Added
- **Delta Signals** (Δcombat, Δcollect, Δexplore) as ANFIS inputs
- **Temporal Context**: Window-to-window soft membership changes
- **6-Feature Input Vector**: 3 soft membership + 3 deltas
- **Production Pipeline**: `core/` folder with finalized notebooks
- **Configuration Lock**: `pipeline_config.yaml` freezing all decisions
- **Comprehensive Documentation**: `thesis_documentation/` with 6 chronological reports
- **Implementation Guide**: `core/DELTA_IMPLEMENTATION_GUIDE.md`

### Changed
- ANFIS input extended from 3 to 6 features
- `06_ANFIS_Preparation.ipynb` uses soft membership instead of activity percentages
- Documentation structure reorganized (all .md files in `thesis_documentation/`)

### Validated
- A/B Testing: Baseline wins 5/8 metrics over Feature-aware
- Grid Search: 108 configurations — baseline near-optimal (K=3, Silhouette=0.3752)
- Delta signal analysis: Δexplore r=0.808 — deltas approved
- Feature weighting: tested and rejected

### Locked 🔒
- **Preprocessing**: Uniform MinMaxScaler (frozen)
- **Features**: All 10 telemetry features (frozen)
- **Clustering**: K=3, K-Means, soft  membership (frozen)
- **Outlier Handling**: None (frozen)
- **Target Formula**: `1.0 - 0.1×deaths + 0.05×activity` (frozen)

### Metrics (Final)
- Silhouette: 0.3752 ✅
- DB Index: 0.9768 ✅
- Mean Entropy: 1.4053 ✅
- Target CV: 0.022 ✅
- Δexplore → Δtarget: r=0.808 ✅

### Removed
- All temporary .py analysis scripts
- Duplicate .md files (consolidated)
- Experiment-specific folders (archived in `experiments/`)

---

## [1.0.0] - 2026-01-26 - BASELINE SYSTEM

### Added
- Complete 8-notebook pipeline (01-08)
- K-Means clustering (K=3)
- Soft membership via inverse distance
- ANFIS target generation
- MLP surrogate model
- Comprehensive visualizations

### Fixed
- Normalization bugs (raw vs normalized features)
- Clustering soft membership calculation
- Activity score computation (rawJson columns removed)
- Target generation stability

### Metrics (Baseline)
- Silhouette: 0.3752
- Soft Membership: 29.5% / 38.8% / 31.7% (Combat/Collection/Exploration)
- Target range: [1.01, 1.19]

---

## Status

**Version**: 2.2.1
**Last updated**: 2026-03-07 — training bias fix, neutral-centred calibration

---

## References

- **A/B Test Results**: `thesis_documentation/03_AB_TEST_RESULTS.md`
- **Optimization Study**: `thesis_documentation/04_GRID_SEARCH_OPTIMIZATION.md`
- **Delta Validation**: `thesis_documentation/05_SIGNAL_INTERPRETATION_REFINEMENT.md`
- **Complete Timeline**: `thesis_documentation/01_COMPLETE_WALKTHROUGH.md`
