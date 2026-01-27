# ANFIS Production Pipeline

**Status**: ✅ PRODUCTION READY  
**Version**: 2.0 (With Delta Integration)  
**Last Updated**: January 27, 2026, 2:20 PM IST

---

## Quick Start

```bash
cd core/notebooks
jupyter notebook
# Run notebooks 01-08 in order
```

---

## Pipeline Notebooks

**Sequential execution required**:

1. **01_Data_Loading_and_Merging.ipynb** - Load raw telemetry
2. **02_Gameplay_Summary.ipynb** - Aggregate to 30s windows
3. **03_Normalization.ipynb** - Apply uniform MinMaxScaler
4. **04_Activity_Contributions.ipynb** - Compute activity scores
5. **05_Clustering.ipynb** - K-Means + soft membership + **deltas**
6. **06_ANFIS_Preparation.ipynb** - **6-feature input** + targets
7. **07_ANFIS_Training.ipynb** - Train MLP surrogate
8. **08_Evaluation_Visualizations.ipynb** - Generate outputs

---

## Configuration (LOCKED 🔒)

See `pipeline_config.yaml` for complete settings.

**Key Parameters**:
- K-Means: K=3, random_state=42
- Features: All 10 (no selection)
- Normalization: Uniform MinMaxScaler
- ANFIS Inputs: 6 (3 soft membership + 3 deltas)

---

## Delta Integration (NEW in v2.0)

**Temporal signals added**:
- `delta_combat` = soft_combat(t) - soft_combat(t-1)
- `delta_collect` = soft_collect(t) - soft_collect(t-1)
- `delta_explore` = soft_explore(t) - soft_explore(t-1)

**Rationale**: Δexplore has r=0.808 correlation with target changes (validated in experiments)

**Implementation**: Per-player sequential differencing, first window = 0

---

## Outputs

**Data Files** (in `../../data/processed/`):
- `5_clustered_telemetry.csv` - With soft membership + deltas
- `6_anfis_dataset.csv` - 6-feature ANFIS inputs + targets

**Model** (in `../../data/models/`):
- `anfis_params.json` - Trained MLP parameters

**Visualizations** (in `../../data/processed/`):
- `viz_archetype_distribution.png`
- `viz_soft_membership_heatmap.png`
- `viz_activity_percentages.png`
- `viz_target_multiplier_distribution.png`
- `viz_feature_importance.png`
- `viz_delta_correlation.png` (NEW)

---

## Validation Metrics

**Clustering Quality**: ✅
- Silhouette: 0.3752 (>0.3 threshold)
- DB Index: 0.9768 (<1.5 threshold)

**Behavioral Diversity**: ✅
- Entropy: 1.4053 (near-max 1.585)
- Balanced archetypes: 29.5% / 38.8% / 31.7%

**ANFIS Stability**: ✅
- Target CV: 0.022 (very low variance)

**Responsiveness** (with deltas): ✅
- Δexplore → Δtarget: r=0.808

---

## Utilities

**Shared Functions** (`../utils.py`):
- Data loading helpers
- Normalization utilities
- Visualization functions

---

## Production Ready ✅

This pipeline has been:
- ✅ Experimentally validated (A/B test + 108-config grid search)
- ✅ Architecturally frozen (no further tuning)
- ✅ Delta-enhanced (temporal context added)
- ✅ Thesis-documented (complete methodology)

**Status**: Ready for deployment and thesis inclusion.

---

## Documentation

- **Complete Guide**: `../../README.md`
- **Implementation Steps**: `DELTA_IMPLEMENTATION_GUIDE.md`
- **Configuration**: `pipeline_config.yaml`
- **Thesis Reports**: `../../thesis_documentation/`
