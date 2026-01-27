# CollectGame.Model - ANFIS Adaptive Difficulty System

## 📁 Clean Directory Structure

```
CollectGame.Model/
├── data/                              # Data files
│   ├── *.csv                          # Raw telemetry data
│   ├── processed/
│   │   ├── experiment_A/              # Experiment A outputs (baseline - WINNER)
│   │   └── experiment_B/              # Experiment B outputs (feature-aware)
│   └── models/                        # Trained models
│       └── anfis_params.json
│
├── experiments/                       # Experimental validation
│   ├── experiment_A_baseline/         # ✅ WINNING CONFIGURATION
│   │   ├── 01-08_*.ipynb             # Pipeline notebooks
│   │   ├── utils.py                   # Utility functions
│   │   └── results_baseline.json
│   ├── experiment_B_feature_aware/    # Alternative tested
│   │   ├── 01-08_*.ipynb
│   │   ├── utils.py
│   │   └── results_feature_aware.json
│   ├── EXPERIMENT_FRAMEWORK.md        # A/B test methodology
│   ├── EXPERIMENTAL_SUMMARY.md        # Results summary
│   ├── OPTIMIZATION_FINAL_REPORT.md   # Grid search results (108 configs)
│   ├── comparison_table.csv           # Metrics comparison
│   ├── recommendation.md              # Final decision
│   └── optimization_results.csv       # All tested configurations
│
├── utils.py                           # Shared utility functions
├── README.md                          # Project documentation
├── WALKTHROUGH.md                     # Complete thesis documentation
└── .gitignore                         # Git ignore rules

```

## 🎯 Final Configuration (Experiment A - Baseline)

**Pipeline**: `experiments/experiment_A_baseline/01-08_*.ipynb`  
**Outputs**: `data/processed/experiment_A/`

**Configuration**:
- K=3 clusters (Combat/Collection/Exploration)
- Uniform MinMaxScaler normalization
- All 10 telemetry features
- No outlier capping

**Metrics**:
- Silhouette: 0.3752 ✅
- DB Index: 0.9768 ✅
- Soft Membership: 29.5% / 38.8% / 31.7%

## 🚀 Quick Start

```bash
# Navigate to winning experiment
cd experiments/experiment_A_baseline

# Run pipeline
jupyter nbconvert --execute 01_Data_Loading_and_Merging.ipynb
jupyter nbconvert --execute 02_Gameplay_Summary.ipynb
# ... continue through 08

# Outputs will be in ../../data/processed/experiment_A/
```

## 📊 Experimental Validation

**Tested**: 108 configurations via grid search  
**A/B Test**: Baseline vs Feature-aware preprocessing  
**Winner**: Baseline (5/8 metrics, simpler, thesis-friendly)

See `experiments/OPTIMIZATION_FINAL_REPORT.md` for complete analysis.

## 📚 For Thesis

- **Methodology**: Reference `experiments/EXPERIMENT_FRAMEWORK.md`
- **Results**: Use `WALKTHROUGH.md` and `experiments/EXPERIMENTAL_SUMMARY.md`
- **Visualizations**: Located in `data/processed/experiment_A/viz_*.png`

## ✅ Status

**Production Ready** - Fully optimized, validated, documented.
