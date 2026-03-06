# ANFIS Adaptive Difficulty System - PRODUCTION

**Status**: ✅ PRODUCTION (v2.2 — Derived Features & Sensitivity Update)  
**Version**: 2.2  
**Last Updated**: March 6, 2026

---

## 🎯 System Overview

This is the **final, frozen production architecture** for the ANFIS-based adaptive difficulty system. All experimental validation complete, all decisions locked.

---

## 📊 Final Configuration (v2.2)

### Preprocessing
- **Scaler**: Uniform MinMaxScaler [0, 1]
- **Features**: 12 features (10 raw telemetry + 2 derived: `damage_per_hit`, `pickup_attempt_rate`)
- **Derived Features**: Computed before normalization from raw values
- **Outlier Handling**: None

### Clustering
- **Algorithm**: K-Means
- **K**: 3 (Combat, Collection, Exploration archetypes)
- **Random State**: 42
- **Soft Membership**: Inverse distance to centroids

### ANFIS Inputs (6 Features)
1. `soft_combat` - Fuzzy membership to combat archetype
2. `soft_collect` - Fuzzy membership to collection archetype
3. `soft_explore` - Fuzzy membership to exploration archetype
4. `delta_combat` - Δ soft_combat (window-to-window change)
5. `delta_collect` - Δ soft_collect
6. `delta_explore` - Δ soft_explore

### Target Generation
- **Formula**: `1.0 - (0.1 × deaths) + (0.05 × normalized_activity)`
- **Range**: Clipped to [0.5, 1.5]

---

## 🔬 Experimental Validation Summary

### A/B Testing
- **Experiment A** (Baseline - Uniform MinMax): **WINNER** ✅
- **Experiment B** (Feature-aware preprocessing): Rejected
- **Decision Basis**: A won 5/8 metrics (Silhouette, DB Index, CH Score, Target CV, Collection %)

### Grid Search Optimization


- **Configurations Tested**: 108 (4 K values × 3 outlier levels × 3 normalizations × 3 feature sets)
- **Best Overall**: K=2, Silhouette=0.4166 (+11%) - **REJECTED** (incompatible with 3-archetype system)
- **Best K=3**: Silhouette=0.3764 (+0.4%) - **NOT SIGNIFICANT**
- **Conclusion**: Baseline already near-optimal

### Signal Interpretation Refinement
- **Δexplore ↔ Δtarget**: r = **0.839** (very strong correlation — v2.2)
- **Δcombat ↔ Δtarget**: r = -0.471
- **Feature Weighting**: No improvement (rejected)
- **Decision**: Add deltas to ANFIS inputs ✅

---

## 📁 Production Pipeline Structure

```
core/
├── notebooks/
│   ├── 01_Data_Loading_and_Merging.ipynb
│   ├── 02_Gameplay_Summary.ipynb
│   ├── 03_Normalization.ipynb
│   ├── 04_Activity_Contributions.ipynb
│   ├── 05_Clustering.ipynb              ← Includes soft membership + deltas
│   ├── 06_ANFIS_Preparation.ipynb       ← 6-feature input
│   ├── 07_ANFIS_Training.ipynb
│   └── 08_Evaluation_Visualizations.ipynb
├── utils.py
├── pipeline_config.yaml                  ← All settings locked
├── README.md
└── DELTA_IMPLEMENTATION_GUIDE.md
```

---

## 🚀 Quick Start

### Run Production Pipeline
```bash
cd core/notebooks
jupyter notebook
# Execute notebooks 01-08 sequentially
```

### Expected Outputs
- `data/processed/5_clustered_telemetry.csv` - With soft membership + deltas
- `data/processed/6_anfis_dataset.csv` - 6-feature input vectors
- `data/models/anfis_params.json` - Trained model parameters
- `data/processed/viz_*.png` - Evaluation visualizations

---

## 📈 Final Metrics (Baseline with Deltas)

### Clustering Quality
- **Silhouette Score**: 0.3752 (acceptable, >0.3 threshold)
- **Davies-Bouldin Index**: 0.9768 (good, <1.5 threshold)
- **Calinski-Harabasz Score**: 2109.3 (strong separation)

### Behavioral Modeling
- **Soft Membership Distribution**:
  - Combat: 29.5%
  - Collection: 38.8%
  - Exploration: 31.7%
- **Mean Entropy**: 1.4053 (high diversity, near-max 1.585)

### ANFIS Stability
- **Target CV**: 0.022 (very low variance)
- **Target Range**: [1.01, 1.19] (safe adaptation zone)

### Responsiveness (NEW with Deltas)
- **Δexplore → Δtarget**: r = 0.808 ✅
- **Reaction Latency**: Improved (temporal context added)

---

## 📌 Architecture Principles

**Stable** (evidence-based decisions, retain unless new data suggests otherwise):
- Preprocessing: Uniform MinMaxScaler
- Clustering: K=3 (Combat, Collection, Exploration)
- ANFIS input: 6D soft+delta space
- Target formula structure

**Open to tuning**:
- Derived feature formulas (empirically validated in v2.2)
- Per-parameter sensitivity weights (0.20–0.35 range)
- Session timeout (currently 90s)

---

## 📚 Documentation

### For Development
- `core/pipeline_config.yaml` - Technical configuration
- `core/DELTA_IMPLEMENTATION_GUIDE.md` - Implementation steps
- `CHANGELOG.md` - Version history

### For Thesis
- `thesis_documentation/01_COMPLETE_WALKTHROUGH.md` - Full development timeline
- `thesis_documentation/02-03_AB_TEST_*.md` - Experimental methodology
- `thesis_documentation/04_GRID_SEARCH_OPTIMIZATION.md` - 108-config analysis
- `thesis_documentation/05_SIGNAL_INTERPRETATION_REFINEMENT.md` - Delta validation
- `thesis_documentation/06_FINAL_STATUS.md` - System summary

### Archived Experiments
- `experiments/` - Read-only, preserved for reference

---

## ✅ System Status

**Experimentation Phase**: ✅ COMPLETE  
**Architecture**: ✅ Production (v2.2)  
**Derived Features**: ✅ Integrated (damage_per_hit, pickup_attempt_rate)  
**Sensitivity Registry**: ✅ Non-uniform (0.20–0.35)  
**Documentation**: ✅ COMPLETE  
**Production Ready**: ✅ YES

---

## 🎓 Thesis-Ready Summary

**What was built**: ANFIS-based adaptive difficulty system using K-Means clustering and soft membership

**How it was validated**:
1. A/B testing (2 approaches)
2. Grid search (108 configurations)
3. Signal interpretation analysis (deltas)

**What was learned**: Simple baseline preprocessing + temporal deltas = optimal

**Final innovation**: Temporal context via deltas (r=0.808 correlation) improves responsiveness without destabilizing clustering

**Status**: Production-ready, experimentally validated, thesis-defensible ✅
