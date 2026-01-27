# CHANGELOG

**Project**: ANFIS Adaptive Difficulty System  
**Repository**: CollectGame.Model

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
