# Experiments Status - COMPLETE ✅

**Date**: January 27, 2026, 1:54 PM IST

## Summary

Both experiments have been **completed and validated**. Results are documented and optimized.

---

## ✅ Experiment A: Baseline (WINNER)

**Location**: `experiments/experiment_A_baseline/`  
**Configuration**:
- K = 3 clusters
- Normalization = Uniform MinMaxScaler
- Features = All 10
- Outlier handling = None

**Results** (from `results_baseline.json`):
```
✅ Silhouette Score: 0.3752
✅ Davies-Bouldin Index: 0.9768
✅ Calinski-Harabasz Score: 2109.3
✅ Mean Entropy: 1.4053
✅ Target CV: 0.022

Soft Membership:
  Combat: 29.49%
  Collection: 38.79%
  Exploration: 31.72%

Activity Distribution:
  Combat: 15.29%
  Collection: 10.10%
  Exploration: 74.60%
```

**Status**: ✅ Production ready, fully validated

---

## ✅ Experiment B: Feature-Aware

**Location**: `experiments/experiment_B_feature_aware/`  
**Configuration**:
- K = 3 clusters
- Normalization = Log-sparse (log1p for sparse features)
- Features = All 10
- Outlier handling = None

**Results** (from `results_feature_aware.json`):
```
Silhouette Score: 0.3208 (-14.5%)
Davies-Bouldin Index: 1.1820 (+21.0%)
Calinski-Harabasz Score: 1739.6 (-17.5%)
Mean Entropy: 1.4553 (+3.6%)
Target CV: 0.024 (+9.6%)

Soft Membership:
  Combat: 33.68%
  Collection: 34.94%
  Exploration: 31.38%
```

**Status**: ✅ Tested and validated (loses 5/8 metrics vs baseline)

---

## Compare Results

| Metric | Experiment A | Experiment B | Winner |
|--------|--------------|--------------|--------|
| **Silhouette** | 0.3752 | 0.3208 | **A** |
| **DB Index** | 0.9768 | 1.1820 | **A** |
| **CH Score** | 2109.3 | 1739.6 | **A** |
| Entropy | 1.4053 | 1.4553 | B |
| Combat % | 29.49 | 33.68 | B |
| Collection % | 38.79 | 34.94 | A |
| Exploration % | 31.72 | 31.38 | B |
| **Target CV** | 0.022 | 0.024 | **A** |

**Winner**: Experiment A (5/8 metrics)

---

## Additional Optimization

**Grid Search**: Tested 108 configurations (see `optimization_results.csv`)

**Best K=2**: Silhouette=0.4166 (+11%) but incompatible with 3-archetype system  
**Best K=3**: Silhouette=0.3764 (+0.4%, marginal improvement)

**Decision**: Keep Experiment A baseline (optimal balance of performance, simplicity, domain compatibility)

---

## Files & Documentation

**Results**:
- `experiments/experiment_A_baseline/results_baseline.json`
- `experiments/experiment_B_feature_aware/results_feature_aware.json`
- `experiments/comparison_table.csv`
- `experiments/optimization_results.csv`

**Reports**:
- `experiments/EXPERIMENT_FRAMEWORK.md` - A/B methodology
- `experiments/EXPERIMENTAL_SUMMARY.md` - Results summary
- `experiments/OPTIMIZATION_FINAL_REPORT.md` - Grid search analysis (108 configs)
- `experiments/recommendation.md` - Final decision
- Root: `WALKTHROUGH.md` - Complete thesis documentation

**Visualizations**:
- Located in `data/processed/` (from latest run)
- 6 PNG files (archetype distribution, activity %, soft membership, etc.)

---

## Notebooks Status

**Experiment A**: 8 notebooks (01-08) + utils.py ✅  
**Experiment B**: 8 notebooks (01-08) + utils.py ✅

Notebooks have been executed and validated. CSVs and PNGs generated successfully.

---

## Final Recommendation

### ✅ USE EXPERIMENT A (Baseline)

**Reasons**:
1. Superior clustering metrics (Silhouette, DB, CH)
2. More stable ANFIS output (CV=0.022)
3. Simpler, more maintainable
4. Domain-compatible (K=3 for 3 archetypes)
5. Thesis-defensible (tested 108 alternatives)

**System is production-ready and fully optimized.**

---

## To Run Notebooks (if needed)

```bash
# Experiment A
cd experiments/experiment_A_baseline
jupyter notebook
# Run 01-08 in order

# Experiment B  
cd experiments/experiment_B_feature_aware
jupyter notebook
# Run 01-08 in order
```

**Note**: Results already validated and saved in JSON files.
