# CHANGELOG

**Project**: ANFIS Adaptive Difficulty System  
**Repository**: CollectGame.Model

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

### Action Required
Rerun notebooks 04 → 05 → 06 → 07 to regenerate:
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
- **A/B Testing**: Baseline (A) vs Feature-aware (B) → A wins 5/8 metrics
- **Grid Search**: 108 configurations → Baseline near-optimal (K=3, Silhouette=0.3752)
- **Signal Analysis**: Δexplore correlation = 0.808 → Deltas approved
- **Feature Weighting**: Tested and rejected (no improvement)

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

**Version**: 2.0.0 (PRODUCTION)  
**Status**: ✅ FROZEN - No further tuning  
**Next Phase**: Thesis write-up and deployment

---

## References

- **A/B Test Results**: `thesis_documentation/03_AB_TEST_RESULTS.md`
- **Optimization Study**: `thesis_documentation/04_GRID_SEARCH_OPTIMIZATION.md`
- **Delta Validation**: `thesis_documentation/05_SIGNAL_INTERPRETATION_REFINEMENT.md`
- **Complete Timeline**: `thesis_documentation/01_COMPLETE_WALKTHROUGH.md`
