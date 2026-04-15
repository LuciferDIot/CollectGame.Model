# ANFIS Adaptive Difficulty System

**Version**: 2.2.1
**Status**: Production
**Last Updated**: March 7, 2026

---

## System Overview

ANFIS-based adaptive difficulty system using K-Means clustering, fuzzy soft membership, and an MLP surrogate model. It classifies player behavior into three archetypes (Combat, Collection, Exploration) and adjusts game difficulty in real time based on behavioral telemetry and temporal trends.

---

## Final Configuration (v2.2.1)

### Preprocessing
- **Scaler**: Uniform MinMaxScaler [0, 1]
- **Features**: 12 (10 raw telemetry + 2 derived: `damage_per_hit`, `pickup_attempt_rate`)
- **Derived features**: Computed from raw values before normalization
- **Outlier handling**: None

### Clustering
- **Algorithm**: K-Means, K=3 (Combat, Collection, Exploration)
- **Soft Membership**: Inverse-distance weighting to centroids

### ANFIS Inputs (6 features)
1. `soft_combat` - fuzzy membership to combat archetype
2. `soft_collect` - fuzzy membership to collection archetype
3. `soft_explore` - fuzzy membership to exploration archetype
4. `delta_combat` - change in soft_combat (window-to-window)
5. `delta_collect` - change in soft_collect
6. `delta_explore` - change in soft_explore

### Target Generation (Option B, v2.2.1)
- **Formula**: `T = 1.0 + 0.22*(soft_combat-0.5) + 0.18*(soft_collect-0.5) + 0.15*(soft_explore-0.5) + 0.55*delta_combat + 0.40*delta_collect + 0.35*delta_explore - 0.25*death_rate`
- **Clipped to**: [0.6, 1.4]
- **Display calibration**: `display = clamp(1.0 + (raw - mlp_neutral) * 2.0, 0.6, 1.4)` where `mlp_neutral = 0.932006`

---

## Experimental Validation

### A/B Testing
- **Experiment A** (Uniform MinMax): Selected - won 5/8 metrics (Silhouette, DB Index, CH Score, Target CV, Collection %)
- **Experiment B** (Feature-aware preprocessing): Rejected

### Grid Search Optimization
- **Configurations tested**: 108 (4 K values x 3 outlier levels x 3 normalizations x 3 feature sets)
- **Best overall**: K=2, Silhouette=0.4166 - rejected (incompatible with 3-archetype design)
- **Best K=3**: Silhouette=0.3764 - not a significant improvement over baseline
- **Conclusion**: Baseline already near-optimal; no configuration change warranted

### Delta Signal Analysis
- **delta_explore to delta_target**: r = 0.808
- **delta_combat to delta_target**: r = -0.471
- **Feature weighting**: No improvement (rejected)
- **Decision**: Add delta signals as ANFIS inputs

---

## Pipeline Structure

```
core/
├── notebooks/
│   ├── 01_Data_Loading_and_Merging.ipynb
│   ├── 02_Gameplay_Summary.ipynb
│   ├── 03_Normalization.ipynb
│   ├── 04_Activity_Contributions.ipynb
│   ├── 05_Clustering.ipynb
│   ├── 06_ANFIS_Preparation.ipynb
│   ├── 07_ANFIS_Training.ipynb
│   └── 08_Evaluation_Visualizations.ipynb
├── utils.py
├── pipeline_config.yaml
└── README.md
```

---

## Quick Start

```bash
cd core/notebooks
jupyter notebook
# Run notebooks 01-08 in order
```

Expected outputs:
- `data/processed/5_clustered_telemetry.csv` - soft membership + deltas
- `data/processed/6_anfis_dataset.csv` - 6-feature input vectors
- `anfis-demo-ui/models/anfis_mlp_weights.json` - trained weights + mlp_neutral

---

## Final Metrics

### Clustering Quality
- Silhouette: 0.3752 (threshold >0.3)
- Davies-Bouldin Index: 0.9768 (threshold <1.5)
- Calinski-Harabasz Score: 2109.3

### Behavioral Modeling
- Soft membership distribution: Combat 29.5% / Collection 38.8% / Exploration 31.7%
- Mean Entropy: 1.4053

### MLP Surrogate (v2.2.1)
- Architecture: 6->16->8->1 (ReLU hidden, Linear output)
- Test R^2: 0.9264 | Test MAE: 0.0127
- Convergence: 21 iterations (LBFGS, max_iter=500)
- mlp_neutral: 0.932006 | AMPLIFICATION: 2.0

### Target Distribution (post-retrain)
- Range: [0.60, 1.107] | Mean: 0.902 | Std: 0.074

### Responsiveness
- delta_explore to delta_target: r = 0.808

---

## Architecture Decisions (Frozen)

| Component | Choice | Reason |
|-----------|--------|--------|
| Preprocessing | Uniform MinMaxScaler | A/B test: wins 5/8 metrics |
| Clustering | K=3, K-Means, soft IDW | Grid search: near-optimal; K=4 collapses |
| ANFIS input | 6D (3 soft + 3 delta) | Delta r=0.808 correlation with target |
| MLP architecture | 6->16->8->1 | 5-fold CV: smallest with R^2>0.90 |
| Output calibration | Neutral-centred | Balanced player guaranteed -> display=1.0 |
| Safety clamp | [0.6, 1.4] | Calibration study: M=1.5 felt unfair |
| Session timeout | 90s | Tolerates loading screens (3x window cadence) |

**Open to tuning**: derived feature formulas, per-parameter sensitivity weights (0.20-0.35), session timeout.

---

## Documentation

- `CHANGELOG.md` - version history with rationale per change
- `thesis_documentation/11_Complete_Development_Journey.md` - full decisions and challenges log
- `thesis_documentation/10_Training_Bias_Fix_and_Calibration.md` - calibration design decision
- `thesis_documentation/FINAL_EVALUATION_REPORT.md` - model evaluation with addenda
