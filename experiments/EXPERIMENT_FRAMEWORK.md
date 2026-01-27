# A/B Experiment Framework: Baseline vs Feature-Aware Preprocessing

**Created**: January 27, 2026, 1:24 PM IST  
**Objective**: Quantitatively compare uniform vs feature-specific normalization strategies

---

## Experimental Design

### Core Principle
- **Same dataset** (data/processed/2_cleaned_telemetry_for_modelling.csv)
- **Same features** (10 telemetry features)
- **Same algorithms** (K-Means K=3, soft membership, MLP)
- **Different preprocessing** (uniform vs per-feature)

### Independent Variables
- **Experiment A**: Uniform MinMaxScaler on all features
- **Experiment B**: Feature-specific transformations (log/sqrt/robust)

### Dependent Variables (Metrics)
1. **Clustering Quality**:
   - Silhouette Score (higher = better separation, target: >0.5)
   - Davies-Bouldin Index (lower = better compactness, target: <1.0)
   - Calinski-Harabasz Score (higher = better definition)

2. **Behavioral Representation**:
   - Mean soft membership per archetype
   - Soft membership variance (σ²)
   - % windows with dominant archetype (any > 0.6)
   - Membership entropy (H = -Σ p*log(p))

3. **ANFIS Adaptation**:
   - Target multiplier range [min, max]
   - Target multiplier variance
   - Coefficient of variation (CV = σ/μ)
   - Responsiveness to combat bursts (qualitative)

4. **Activity Distribution**:
   - Combat %
   - Collection %
   - Exploration %

---

## Experiment A: Baseline (Uniform Preprocessing)

### Hypothesis
Uniform MinMaxScaler is sufficient when features are already within reasonable ranges after cleaning.

### Pipeline
```
01. Load cleaned data
02. Apply MinMaxScaler to ALL 10 features uniformly
03. Calculate activity contributions (normalized scores)
04. K-Means clustering (K=3) on normalized features
05. Compute soft membership via inverse distance
06. Map clusters to archetypes
07. Generate archetype-aware difficulty targets
08. Train MLP surrogate
09. Evaluate with metrics
```

### Expected Outcomes
- Exploration may still dominate activity % (temporal occupancy)
- Soft membership should be relatively balanced
- Clustering metrics should be acceptable (silhouette >0.3)
- ANFIS outputs should be stable

### Success Criteria
- Silhouette score: >0.3
- DB Index: <2.0
- Soft membership: no archetype <10% or >50%
- Target CV: <0.3

---

## Experiment B: Feature-Aware Preprocessing

### Hypothesis
Per-feature transformations improve clustering by handling skewness, sparsity, and outliers appropriately.

### Feature-Specific Strategy

Based on `feature_analysis_report.csv`:

| Feature | Data Type | Transform | Justification |
|---------|-----------|-----------|---------------|
| enemiesHit | SPARSE_COUNT | log1p + MinMax | 52% zeros, skew=5.68 |
| damageDone | SPARSE_COUNT | log1p + MinMax | 52% zeros, skew=4.86 |
| timeInCombat | TIME_BOUNDED | MinMax | Bounded [0,30.5], skew=1.06 |
| kills | SPARSE_COUNT | log1p + MinMax | 66% zeros, skew=5.79 |
| itemsCollected | COUNT | log1p + MinMax | 47% zeros, skew=2.05 |
| pickupAttempts | COUNT | log1p + MinMax | 37% zeros, skew=3.04 |
| timeNearInteractables | TIME_BOUNDED | log1p + MinMax | 37% zeros, skew=2.49 |
| distanceTraveled | CONTINUOUS_UNBOUNDED | MinMax | Near-normal distribution (skew=-0.01) |
| timeSprinting | TIME_BOUNDED | MinMax | Bounded [0,30.5], skew=1.26 |
| timeOutOfCombat | TIME_BOUNDED | MinMax | Bounded [0,30.5], skew=-1.06 |

**Key Insight**: 
- 6/10 features are sparse/skewed → require log transform
- 4/10 features are time-bounded/normal → MinMax sufficient

### Pipeline
```
01. Load cleaned data
02. For each feature:
    IF sparse_count OR high_skew:
        Apply log1p transform
    Apply MinMaxScaler
03. Calculate activity contributions (transformed + normalized)
04. K-Means clustering (K=3) on transformed features
05. Compute soft membership via inverse distance
06. Map clusters to archetypes
07. Generate archetype-aware difficulty targets
08. Train MLP surrogate
09. Evaluate with SAME metrics as Experiment A
```

### Expected Outcomes
- Log transforms should reduce skewness impact
- Sparse features (kills, enemies) better represented
- Potentially better cluster separation
- Activity % may shift due to better feature balance

### Success Criteria (vs Experiment A)
- Silhouette score: +0.1 improvement
- DB Index: -10% improvement
- Soft membership: more balanced variance
- No collapse to uniform distribution
- Target stability maintained or improved

---

## Evaluation Framework

### Quantitative Comparison

**Clustering Metrics**:
```python
{
  "silhouette_score": float,
  "davies_bouldin_index": float,
  "calinski_harabasz_score": float
}
```

**Soft Membership Stats**:
```python
{
  "mean_combat": float,
  "mean_collection": float,
  "mean_exploration": float,
  "variance_combat": float,
  "variance_collection": float,
  "variance_exploration": float,
  "entropy_mean": float,
  "pct_dominant_archetype": float  # % windows with any archetype >0.6
}
```

**ANFIS Stability**:
```python
{
  "target_min": float,
  "target_max": float,
  "target_mean": float,
  "target_std": float,
  "target_cv": float  # coefficient of variation
}
```

**Activity Distribution**:
```python
{
  "activity_combat_pct": float,
  "activity_collection_pct": float,
  "activity_exploration_pct": float
}
```

### Qualitative Assessment

**Combat Responsiveness Test**:
- Select windows with high kills (top 10%)
- Check if combat archetype membership increases
- Verify target multiplier responds to combat skill

---

## Decision Criteria

### Adopt Experiment B IF AND ONLY IF:

1. ✅ **Clustering improves**:
   - Silhouette score increases by ≥0.05
   - OR DB Index decreases by ≥10%
   - AND CH score increases

2. ✅ **Behavioral variance maintained**:
   - Soft membership entropy does NOT decrease >10%
   - No archetype collapses to <5%
   - Variance remains diverse (not flattened)

3. ✅ **ANFIS stability preserved**:
   - Target CV remains <0.4
   - Range stays within [0.5, 1.5]
   - Responsiveness to skill maintained

### Keep Experiment A IF:

- Clustering metrics don't improve significantly
- OR soft membership becomes too uniform
- OR ANFIS outputs become less responsive
- OR activity distribution becomes unrealistic

---

## Deliverables

1. **Experiment A**:
   - `experiments/experiment_A_baseline/results_baseline.json`
   - `experiments/experiment_A_baseline/viz_*.png` (6 plots)
   - `experiments/experiment_A_baseline/metrics_report.txt`

2. **Experiment B**:
   - `experiments/experiment_B_feature_aware/results_feature_aware.json`
   - `experiments/experiment_B_feature_aware/viz_*.png` (6 plots)
   - `experiments/experiment_B_feature_aware/metrics_report.txt`

3. **Comparison**:
   - `experiments/comparison_table.md`
   - `experiments/recommendation.md`
   - Updated `WALKTHROUGH.md` with experimental results

---

## Timeline

**Day 1** (January 27, 2026):
- 1:24 PM: Framework created
- 1:30 PM: Experiment A setup
- 2:00 PM: Experiment A execution
- 2:30 PM: Experiment B setup
- 3:00 PM: Experiment B execution
- 3:30 PM: Comparison and decision

---

## Academic Rigor

This A/B framework ensures:
- ✅ **Reproducibility**: Both experiments documented
- ✅ **Objectivity**: Metrics-driven decision
- ✅ **Falsifiability**: Clear acceptance criteria
- ✅ **Transparency**: All results saved
- ✅ **Scientific method**: Hypothesis → Test → Conclusion

**For Thesis**: This experimental comparison demonstrates methodological rigor and data-driven optimization, strengthening the methodology chapter.

---

## Notes

- **No cherry-picking**: Report ALL metrics, even if unfavorable
- **No mixing**: Each experiment runs independently
- **No iteration**: One-shot execution per experiment
- **No assumptions**: Let data decide

**Status**: Framework complete, ready for execution
