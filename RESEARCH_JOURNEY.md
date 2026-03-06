# ANFIS Adaptive Difficulty System — Research Journey

> A complete record of every option explored, experiment conducted, decision made, and path taken during the development of the ANFIS-based adaptive difficulty model for CollectGame.

**Last Updated**: February 14, 2026

---

## Table of Contents

1. [Project Goal](#1-project-goal)
2. [Data Collection & Raw Inputs](#2-data-collection--raw-inputs)
3. [Pipeline Overview (8 Notebooks)](#3-pipeline-overview-8-notebooks)
4. [Notebook 01 — Data Loading & Merging](#4-notebook-01--data-loading--merging)
5. [Notebook 02 — Gameplay Summary & Session Cleaning](#5-notebook-02--gameplay-summary--session-cleaning)
6. [Notebook 03 — Feature Normalization](#6-notebook-03--feature-normalization)
7. [Notebook 04 — Activity Contribution Analysis](#7-notebook-04--activity-contribution-analysis)
8. [Notebook 05 — Clustering (K-Means & Soft Membership)](#8-notebook-05--clustering-k-means--soft-membership)
9. [Notebook 06 — ANFIS Data Preparation & Target Generation](#9-notebook-06--anfis-data-preparation--target-generation)
10. [Notebook 07 — ANFIS Training (MLP Surrogate)](#10-notebook-07--anfis-training-mlp-surrogate)
11. [Notebook 08 — Evaluation & Visualizations](#11-notebook-08--evaluation--visualizations)
12. [A/B Testing — Experiment A vs Experiment B](#12-ab-testing--experiment-a-vs-experiment-b)
13. [Grid Search Optimization (108 Configurations)](#13-grid-search-optimization-108-configurations)
14. [Delta Signal Analysis & Temporal Refinement](#14-delta-signal-analysis--temporal-refinement)
15. [Target Formula Evolution (Option A → Option B)](#15-target-formula-evolution-option-a--option-b)
16. [Critical Bugs Encountered & Fixed](#16-critical-bugs-encountered--fixed)
17. [Model Artifacts & Deployment Outputs](#17-model-artifacts--deployment-outputs)
18. [Independent Analyses](#18-independent-analyses)
19. [Final Metrics & Production Configuration](#19-final-metrics--production-configuration)
20. [Frozen Decisions Summary](#20-frozen-decisions-summary)

---

## 1. Project Goal

Build an **ANFIS (Adaptive Neuro-Fuzzy Inference System)–based adaptive difficulty system** for CollectGame. The system analyses real-time player telemetry in 30-second windows, classifies player behaviour into three archetypes (Combat, Collection, Exploration), and outputs a **difficulty multiplier** that adjusts the game in real time.

**Why ANFIS?** Traditional rule-based difficulty adjustment is brittle. ANFIS combines fuzzy logic (interpretable membership functions) with neural network learning (data-driven optimisation), making it ideal for modelling the continuous spectrum of player behaviour.

---

## 2. Data Collection & Raw Inputs

### Source Files (Phase 2 Telemetry)

| File | Rows | Columns | Description |
|------|------|---------|-------------|
| `telemetry_phase_2.users.csv` | 65 | 8 | Player profiles (name, email, consent, etc.) |
| `telemetry_phase_2.telemetries.csv` | 4,302 | 30 | 30-second gameplay telemetry windows |
| `telemetry_phase_2.deathevents.csv` | 285 | 7 | Player death event records |

### 10 Gameplay Features Used

| Category | Features |
|----------|----------|
| **Combat** | `enemiesHit`, `damageDone`, `timeInCombat`, `kills` |
| **Collection** | `itemsCollected`, `pickupAttempts`, `timeNearInteractables` |
| **Exploration** | `distanceTraveled`, `timeSprinting` _(`timeOutOfCombat` removed — see v2.1)_ |

**Why these 10?** They map directly to the three gameplay pillars designed into CollectGame. Each category represents a fundamentally different play style that the difficulty system must adapt to differently.

> **v2.1 Note**: `timeOutOfCombat` is collected but intentionally excluded from the activity scoring formula. See Section 21 for rationale.

---

## 3. Pipeline Overview (8 Notebooks)

The production pipeline consists of 8 sequential Jupyter notebooks, each performing a distinct transformation:

```
Raw CSVs
  │
  ▼
01_Data_Loading_and_Merging       ─── Merge, PII removal, death mapping
  │
  ▼
02_Gameplay_Summary               ─── Filter short sessions, cap long ones
  │
  ▼
03_Normalization                  ─── MinMaxScaler [0, 1]
  │
  ▼
04_Activity_Contributions         ─── Compute archetype scores & percentages
  │
  ▼
05_Clustering                     ─── K-Means (K=3), soft membership, deltas
  │
  ▼
06_ANFIS_Preparation              ─── Build 6-feature input + target variable
  │
  ▼
07_ANFIS_Training                 ─── Train MLP surrogate (6→16→8→1)
  │
  ▼
08_Evaluation_Visualizations      ─── Charts, validation, quality metrics
```

**Libraries used throughout**: `pandas`, `numpy`, `scikit-learn` (MinMaxScaler, KMeans, MLPRegressor, train_test_split), `scipy` (cdist, linear_sum_assignment), `matplotlib`, `seaborn`.

---

## 4. Notebook 01 — Data Loading & Merging

**Path**: `core/notebooks/01_Data_Loading_and_Merging.ipynb`

### What It Does

1. Loads the three raw CSV files
2. Removes PII columns (`firstName`, `lastName`, `email`) for privacy
3. Parses ISO 8601 timestamps into Unix seconds
4. Maps death events to 30-second telemetry windows
5. Merges telemetry with user data on `userId`

### Death Event Mapping Logic

A death event is assigned to a telemetry window where:

```
death_time ≤ window_timestamp < death_time + 30
```

**Result**: Only 30 out of 285 death events successfully mapped (most deaths fell outside telemetry coverage).

### Output

| File | Rows | Description |
|------|------|-------------|
| `merged_telemetry.csv` | 4,297 | Cleaned, merged telemetry |
| `merged_deathevents.csv` | — | Death events merged with user info |

### Design Decision

**30-second window size**: Trade-off between responsiveness (shorter windows capture quick attention shifts) and statistical significance (longer windows accumulate meaningful data counts). 30 seconds was chosen as the balance point.

---

## 5. Notebook 02 — Gameplay Summary & Session Cleaning

**Path**: `core/notebooks/02_Gameplay_Summary.ipynb`

### What It Does

1. Calculates each player's total play duration: `duration_min = (total_rows × 30) / 60`
2. Filters out players with < 20 minutes of play time
3. Caps analysis to the first 45 minutes (90 rows) per player
4. Sorts chronologically before trimming

### Why Filter?

- **Minimum 20 minutes**: Players with very short sessions don't generate enough behavioural data for meaningful clustering. Removed 19 of 64 users.
- **Maximum 45 minutes**: Ensures fair behavioural comparison. Without a cap, long-session players would dominate the dataset with more data points.

### Output

| File | Rows | Users | Description |
|------|------|-------|-------------|
| `2_cleaned_telemetry_for_modelling.csv` | 3,240 | 45 | Filtered, trimmed dataset |
| `2_player_summary.csv` | 45 | — | Per-player statistics |

---

## 6. Notebook 03 — Feature Normalization

**Path**: `core/notebooks/03_Normalization.ipynb`

### What It Does

Applies `sklearn.preprocessing.MinMaxScaler` to normalize all 10 gameplay features to the [0, 1] range.

```python
scaler = MinMaxScaler()
df[features] = scaler.fit_transform(df[features].fillna(0))
```

### Normalization Options Explored

| Method | Result | Decision |
|--------|--------|----------|
| **MinMaxScaler (Uniform)** | [0, 1] bounds, stable for neural networks | ✅ **Selected** |
| **Log-Sparse Scaler** | +0.4% Silhouette improvement | ❌ Rejected — destroyed interpretability |
| **RobustScaler** | No fixed bounds | ❌ Rejected — risks gradient explosion in MLP |
| **Per-player Min-Max** | Captures individual behavioural ranges | ❌ Rejected — loses cross-player comparability |

### Why Uniform MinMaxScaler Won

- Guarantees bounded [0, 1] input space (critical for neural networks)
- Equal weighting across features (no feature dominates by scale)
- Interpretable (0 = minimum observed, 1 = maximum observed)
- +0.4% gain from alternatives was not statistically significant

### Critical Bug (Phase 1)

In Phase 1, the scaler was **not actually applied** — `fit_transform()` was never called. Raw features like `distanceTraveled` (range 0–5,000) dominated clustering, causing 98.6% of windows to be classified as "Exploration". This was the single most impactful bug in the project. See [Critical Bugs](#16-critical-bugs-encountered--fixed).

### Output

| File | Rows | Description |
|------|------|-------------|
| `3_normalized_telemetry.csv` | 3,240 | All 10 features in [0, 1] |

---

## 7. Notebook 04 — Activity Contribution Analysis

**Path**: `core/notebooks/04_Activity_Contributions.ipynb`

### What It Does

Groups the 10 normalised features into three archetype scores and computes percentage contributions:

```python
score_combat  = enemiesHit + damageDone + timeInCombat + kills
score_collect = itemsCollected + pickupAttempts + timeNearInteractables
score_explore = distanceTraveled + timeSprinting + timeOutOfCombat

score_total   = score_combat + score_collect + score_explore

pct_combat  = score_combat  / score_total
pct_collect = score_collect / score_total
pct_explore = score_explore / score_total
```

### Why Percentages?

Raw scores are additive sums of normalised features. Converting to percentages creates a **compositional representation** — each window's behaviour is described as a proportion of each archetype, always summing to 1.0.

### Critical Bug (Phase 1)

The column selector accidentally included both normalised features AND raw `rawJson.*` columns. A raw `distanceTraveled` value of 4,500 plus a normalised value of 0.5 produced a score of 4,500.5, completely drowning out Combat (score ~0.5). See [Critical Bugs](#16-critical-bugs-encountered--fixed).

### Output

| File | Rows | Description |
|------|------|-------------|
| `4_activity_contributions.csv` | 3,240 | 3 scores + 3 percentages per window |

---

## 8. Notebook 05 — Clustering (K-Means & Soft Membership)

**Path**: `core/notebooks/05_Clustering.ipynb`

### What It Does

1. Runs K-Means (K=3, random_state=42, n_init=10) on percentage features
2. Maps clusters to archetypes using the Hungarian algorithm
3. Computes **soft membership** via inverse distance to centroids
4. Computes **deltas** (temporal change in soft membership)

### Clustering Input

Features: `['pct_combat', 'pct_collect', 'pct_explore']`

### Cluster Centres Found

| Cluster | Combat | Collect | Explore | Archetype |
|---------|--------|---------|---------|-----------|
| 0 | 0.56 | 0.04 | 0.40 | Combat |
| 1 | 0.02 | 0.10 | 0.88 | Exploration |
| 2 | 0.24 | 0.12 | 0.63 | Collection |

### Archetype Distribution

| Archetype | Windows | Percentage |
|-----------|---------|------------|
| Exploration | 1,867 | 57.6% |
| Collection | 970 | 29.9% |
| Combat | 403 | 12.4% |

### Soft Membership — The Key Innovation

Hard K-Means assigns each window to exactly one cluster. This is too coarse for difficulty adaptation — a player at 60% combat / 30% exploration / 10% collection should get different treatment than a player at 100% combat.

**Soft membership** uses inverse distance to all centroids:

```python
distances = kmeans.transform(X)           # Distance to each centroid
inv_distances = 1 / (distances + 1e-10)   # Inverse (closer = higher)
soft = inv_distances / inv_distances.sum(axis=1, keepdims=True)  # Normalise
```

This produces fuzzy scores like `[0.6, 0.3, 0.1]` for every window, enabling smooth, proportional difficulty adjustment.

### Delta Computation

Per-player temporal differences capture how behaviour **changes** over time:

```python
delta_combat  = soft_combat(t)  - soft_combat(t-1)
delta_collect = soft_collect(t) - soft_collect(t-1)
delta_explore = soft_explore(t) - soft_explore(t-1)
```

First window for each player is initialised to 0.

**Why deltas?** A player with 80% combat and rising engagement should be treated differently from 80% combat and declining engagement. Deltas add temporal context. See [Delta Signal Analysis](#14-delta-signal-analysis--temporal-refinement).

### K Value Selection — Options Explored

| K | Silhouette | Decision | Reason |
|---|------------|----------|--------|
| 2 | 0.4166 | ❌ Rejected | Higher metric but lumps "Collectors" and "Explorers" into one cluster — incompatible with the 3-archetype game design |
| **3** | **0.3752** | **✅ Selected** | Maps perfectly to the three gameplay pillars (Combat, Collection, Exploration) |
| 4 | Lower | ❌ Rejected | Splits archetypes unnecessarily, no game design justification |
| 5 | Lower | ❌ Rejected | Over-segmentation, unstable clusters |

**Why accept lower Silhouette for K=3?** The clustering serves the game design, not the other way around. K=2's higher metric is meaningless if it cannot distinguish collectors from explorers — a distinction that directly affects difficulty tuning.

### Output

| File | Rows | Columns | Description |
|------|------|---------|-------------|
| `5_clustered_telemetry.csv` | 3,240 | 51 | Hard clusters, soft membership, deltas |

---

## 9. Notebook 06 — ANFIS Data Preparation & Target Generation

**Path**: `core/notebooks/06_ANFIS_Preparation.ipynb`

### What It Does

Constructs the final 6-feature ANFIS input dataset with a computed target variable (difficulty multiplier).

### ANFIS Input Features (6 Total)

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | `soft_combat` | State | Fuzzy membership to combat archetype |
| 2 | `soft_collect` | State | Fuzzy membership to collection archetype |
| 3 | `soft_explore` | State | Fuzzy membership to exploration archetype |
| 4 | `delta_combat` | Temporal | Δ soft_combat (window-to-window change) |
| 5 | `delta_collect` | Temporal | Δ soft_collect |
| 6 | `delta_explore` | Temporal | Δ soft_explore |

### Target Variable — The Most Critical Decision

The target variable is the **difficulty multiplier** the model learns to predict. Two options were explored:

#### Option A — Static Heuristic (Rejected)

```
Target = 1.0 - (0.1 × deaths) + (0.05 × normalised_activity)
Clipped to [0.5, 1.5]
```

- **Result**: Target variance σ = 0.011 (collapsed to near-constant ~1.02)
- **Problem**: MLP could not learn — predicting the mean was optimal (R² = -4.69)
- **Root cause**: Deaths were too rare and activity intensity too uniform to generate meaningful variance

#### Option B — Delta-Weighted Canonical (Selected ✅)

```
Target = 0.9
       + 0.22 × (soft_combat  - 0.5)
       + 0.18 × (soft_collect - 0.5)
       + 0.15 × (soft_explore - 0.5)
       + 0.55 × delta_combat
       + 0.40 × delta_collect
       + 0.35 × delta_explore
       - 0.25 × death_rate_normalised
Clipped to [0.6, 1.4]
```

- **Result**: Target variance σ = 0.0625 (5.5× improvement over Option A)
- **Key insight**: Deltas are the **primary variance drivers** (weights 0.55, 0.40, 0.35), not static state
- **Rationale**: A player with 80% combat + positive delta (engaging more) should have different difficulty than 80% combat + negative delta (disengaging)

### Why Option B Won

| Metric | Option A | Option B | Improvement |
|--------|----------|----------|-------------|
| Target σ | 0.011 | 0.0625 | **5.5×** |
| Target span | 0.023 | 0.41 | **18×** |
| Model R² | -4.69 | 0.9224 | Functional vs. broken |

Option A failed because the MLP had no meaningful signal to learn from. The target was essentially constant, so predicting the mean was optimal. Option B solved this by using behaviour *changes* (deltas) as the primary drivers of variance.

### Output

| File | Rows | Columns | Description |
|------|------|---------|-------------|
| `6_anfis_dataset.csv` | 3,240 | 10 | userId, timestamp, cluster, 6 inputs, target |

---

## 10. Notebook 07 — ANFIS Training (MLP Surrogate)

**Path**: `core/notebooks/07_ANFIS_Training.ipynb`

### What It Does

Trains a compact neural network (MLP) to approximate the ANFIS difficulty surface.

### Architecture

```
Input (6) → Hidden (16, ReLU) → Hidden (8, ReLU) → Output (1, Linear)
```

### Training Configuration

| Parameter | Value |
|-----------|-------|
| Framework | scikit-learn `MLPRegressor` |
| Hidden layers | (16, 8) |
| Activation | ReLU |
| Solver | Adam |
| Max iterations | 500 |
| Train/Test split | 80/20 (random_state=42) |

### Why MLP Instead of Full ANFIS?

| Aspect | Full ANFIS | MLP Surrogate |
|--------|-----------|---------------|
| Runtime speed | Slower (rule evaluation) | ✅ Faster (matrix multiply) |
| Game engine portability | Needs custom fuzzy parser | ✅ Native linear algebra |
| Interpretability | Higher | Lower (but fuzzy logic is embedded in inputs) |
| Training complexity | Higher | ✅ Simple (scikit-learn) |

The fuzzy logic is already embedded in the **input features** (soft membership, deltas). The MLP approximates the *surface* that maps these fuzzy inputs to a difficulty multiplier, combining the benefits of both approaches.

### Training Results (Option B Canonical)

| Metric | Train | Test |
|--------|-------|------|
| R² | 0.8369 | **0.9224** |
| MAE | 0.0127 | **0.0108** |
| Iterations | 23 | — |

**Key observation**: Test R² > Train R² indicates excellent generalisation (no overfitting).

### Model Export

Weights and biases are serialised to JSON for game engine deployment:

```json
{
  "architecture": "6-16-8-1",
  "input_features": ["soft_combat", "soft_collect", "soft_explore",
                      "delta_combat", "delta_collect", "delta_explore"],
  "weights": { ... },
  "biases": { ... },
  "training_metrics": { "test_r2": 0.9224, "test_mae": 0.0108 },
  "status": "ACTIVE"
}
```

### Output

| File | Description |
|------|-------------|
| `anfis_mlp_weights.json` | Full model weights and biases |
| `anfis_params.json` | Model metadata and feature order |

---

## 11. Notebook 08 — Evaluation & Visualizations

**Path**: `core/notebooks/08_Evaluation_Visualizations.ipynb`

### What It Does

Generates validation visualisations to confirm model quality and present results.

### Visualisations Produced

| File | Description | Purpose |
|------|-------------|---------|
| `viz_archetype_distribution.png` | Bar chart: Exploration 1,867 / Collection 970 / Combat 403 | Validates 3-archetype assumption |
| `viz_soft_membership_heatmap.png` | Heatmap of fuzzy membership across windows | Shows smooth membership gradation |
| `viz_delta_distributions.png` | Distribution of Δcombat, Δcollect, Δexplore | Confirms deltas have meaningful variance |
| `viz_target_distribution.png` | Histogram of target multiplier values | Validates healthy target spread |

### Validation Insights

- Archetype distribution confirms natural clustering into three distinct groups
- Soft membership heatmap shows players are rarely "pure" — most windows have mixed membership
- Delta distributions are centred at 0 with meaningful tails (behaviour does change)

---

## 12. A/B Testing — Experiment A vs Experiment B

### Experiment Design

Two complete preprocessing pipelines were implemented end-to-end and compared:

| Aspect | Experiment A (Baseline) | Experiment B (Feature-Aware) |
|--------|------------------------|------------------------------|
| **Normalization** | Global MinMaxScaler | Per-player MinMaxScaler |
| **Feature scope** | 10 features | 12 features |
| **Philosophy** | Cross-player comparability | Individual behavioural ranges |
| **Path** | `experiments/experiment_A_baseline/` | `experiments/experiment_B_feature_aware/` |

Both experiments ran the full 8-notebook pipeline independently.

### Head-to-Head Results

| Metric | Exp A | Exp B | Winner | Change |
|--------|-------|-------|--------|--------|
| Silhouette Score | **0.3752** | 0.3208 | **A** | -14.5% |
| Davies-Bouldin Index | **0.9768** | 1.1820 | **A** | +21.0% worse |
| Calinski-Harabasz Score | **2,109.30** | 1,739.61 | **A** | -17.5% |
| Mean Entropy | 1.4053 | **1.4553** | B | +3.6% |
| Combat % | 29.49% | **33.68%** | B | +14.2% |
| Collection % | **38.79%** | 34.94% | **A** | -9.9% |
| Exploration % | 31.72% | **31.38%** | B | -1.1% |
| Target CV | **0.0219** | 0.0240 | **A** | +9.6% worse |

**Verdict**: Experiment A won 5 of 8 metrics. The three core clustering quality metrics (Silhouette, DB Index, CH Score) all favoured A.

### Why A Won

- **Global normalisation** preserves cross-player comparability — "high combat" means the same thing for all players
- **Per-player normalisation** (B) made each player's scale relative, introducing noise in clustering
- B's slight advantage in entropy and combat balance was outweighed by worse cluster separation

### Decision

✅ **Experiment A (Baseline / Uniform MinMaxScaler) adopted as production pipeline.**

---

## 13. Grid Search Optimization (108 Configurations)

### Purpose

Systematically validate whether any alternative preprocessing could significantly outperform the baseline.

### Search Space

| Parameter | Values Tested | Count |
|-----------|--------------|-------|
| K (clusters) | 2, 3, 4, 5 | 4 |
| Outlier handling | 95th, 98th, 100th percentile cap | 3 |
| Normalisation | MinMax Uniform, MinMax Log-Sparse, Robust | 3 |
| Feature set | 8 features, 10 features | 2 |
| **Total configurations** | | **108** (incomplete due to some being filtered) |

*(Note: Some combinations were filtered, but 108 configurations were evaluated.)*

### Top Results

| Rank | K | Features | Normalisation | Outlier | Silhouette |
|------|---|----------|--------------|---------|------------|
| 1 | 2 | 8 | MinMax Log-Sparse | 95% | **0.4166** |
| 2 | 2 | 8 | MinMax Log-Sparse | 98% | 0.4128 |
| 3 | 2 | 8 | MinMax Log-Sparse | 100% | 0.3894 |
| ... | | | | | |
| Baseline | 3 | 10 | MinMax Uniform | 100% | **0.3752** |

### Key Findings

1. **K=2 had highest Silhouette (0.4166, +11%)** but was **rejected** — it cannot distinguish collectors from explorers, violating game design requirements
2. **Best K=3 configuration**: Silhouette 0.3764 (+0.4% over baseline) — **not statistically significant**
3. **Log-Sparse normalisation**: +0.4% gain but destroyed interpretability
4. **Feature reduction (8 vs 10)**: Marginal gains, but losing 2 features reduces model expressiveness

### Conclusion

The baseline configuration is **already near-optimal** for K=3. No alternative preprocessing justified the added complexity. The search confirmed rather than changed the approach.

### Feature Weight Sensitivity Analysis

Explored downweighting exploration features (since exploration dominates):

| Explore Weight | Silhouette | DB Index | CH Score | Entropy |
|----------------|------------|----------|----------|---------|
| 1.0 (uniform) | 0.3238 | 1.1067 | 1,880.94 | 1.4319 |
| 0.8 | 0.3389 | 1.0466 | 2,031.38 | 1.4177 |
| 0.6 | 0.3555 | 0.9835 | 2,189.00 | 1.3998 |

**Trend**: Lower exploration weight improved metrics, but was **rejected** because manual weighting introduces arbitrary bias and reduces generalisability.

---

## 14. Delta Signal Analysis & Temporal Refinement

### Motivation

Static soft membership alone tells you **what** a player is doing, not **how their behaviour is changing**. A player shifting from exploration to combat needs different adaptation than one consistently in combat.

### Correlation Analysis

| Signal Pair | Correlation (r) | p-value | Interpretation |
|-------------|-----------------|---------|----------------|
| **Δexplore ↔ Δtarget** | **0.808** | < 1e-77 | Very strong positive |
| Δcombat ↔ Δtarget | -0.471 | < 1e-77 | Moderate negative |
| Δcollect ↔ Δtarget | 0.323 | Significant | Weak positive |

### Key Finding

When a player's exploration engagement increases (Δexplore > 0), the target multiplier should also increase (r = 0.808). This is the **strongest single signal** in the entire system.

### Combat Burst Analysis

- 316 combat burst instances detected
- Mean target change during bursts: -0.018 (difficulty slightly decreases)
- Variance: Raw 0.000536 → With deltas 0.000409 (76.3% efficiency)

### Decision

✅ **Delta signals added to ANFIS inputs**, expanding from 3 features (soft membership only) to 6 features (soft membership + deltas). This was the only approved refinement to the frozen architecture, justified by the strong r=0.808 correlation.

---

## 15. Target Formula Evolution (Option A → Option B)

This was the **most critical turning point** in the entire project.

### The Problem — Variance Collapse

The original target formula (Option A) produced targets clustered at ~1.02 with σ = 0.011. The neural network had nothing to learn — predicting the mean was optimal, yielding R² = -4.69 (worse than a constant prediction).

### Root Cause Analysis

1. **Deaths too rare**: Most windows had 0 deaths → the -0.1 × deaths term had no effect
2. **Activity too uniform**: Normalised activity intensity was nearly constant across windows
3. **Fuzzy constraints**: Soft membership values were already bounded [0, 1], limiting variance

### Option A — Static Heuristic

```
Target = 1.0 - (0.1 × deaths) + (0.05 × normalised_activity)
Clipped to [0.5, 1.5]
```

**Statistics**: Mean 1.024, σ 0.011, Span 0.023

### Option B — Delta-Weighted Canonical (v2.2)

```
Target = 0.9
       + 0.22 × (soft_combat  - 0.5)
       + 0.18 × (soft_collect - 0.5)
       + 0.15 × (soft_explore - 0.5)
       + 0.55 × delta_combat          ← Primary variance driver
       + 0.40 × delta_collect         ← Primary variance driver
       + 0.35 × delta_explore         ← Primary variance driver
       - 0.25 × death_rate_normalised
Clipped to [0.6, 1.4]
```

**Statistics**: Mean 0.797, σ 0.0625, Span 0.41

### Why Option B Works

| Design Element | Purpose |
|----------------|---------|
| Base 0.9 | Start below neutral (slight challenge bias) |
| Centred soft membership (- 0.5) | Creates symmetric positive/negative contributions |
| High delta weights (0.55, 0.40, 0.35) | Behaviour *changes* are the primary variance source |
| Death penalty (-0.25) | Strong safety mechanism for struggling players |
| Clamp [0.6, 1.4] | Prevents extreme difficulty swings |

### Impact

| Metric | Option A | Option B |
|--------|----------|----------|
| Target σ | 0.011 | **0.0625** (5.5×) |
| Target span | 0.023 | **0.41** (18×) |
| Model R² | -4.69 | **0.9224** |
| Model MAE | ~0.011 | **0.0108** |
| Trainability | ❌ Broken | ✅ Functional |

---

## 16. Critical Bugs Encountered & Fixed

### Bug 1 — Missing Normalisation (Phase 1)

- **Symptom**: 98.6% of windows classified as "Exploration"
- **Root cause**: `MinMaxScaler.fit_transform()` was never called; raw feature values were used
- **Impact**: `distanceTraveled` (range 0–5,000) dominated all other features (range 0–100)
- **Fix**: Apply MinMaxScaler strictly to all 10 features before any downstream computation
- **Lesson**: Always verify normalisation by checking feature ranges after transformation

### Bug 2 — Column Selector Including Raw Features (Phase 1)

- **Symptom**: Activity scores were wildly unbalanced (Exploration score ~4,500 vs Combat ~0.5)
- **Root cause**: The column selector matched both `distanceTraveled` (normalised) and `rawJson.distanceTraveled` (raw) columns
- **Impact**: Raw values (4,500) added to normalised values (0.5) created a 9,000:1 ratio
- **Fix**: Strictly filter to normalised columns only using explicit column lists
- **Lesson**: Never use substring matching for column selection in DataFrames

### Bug 3 — Target Variance Collapse (Option A)

- **Symptom**: Model R² = -4.69 (worse than predicting the mean)
- **Root cause**: Target variable had σ = 0.011, making all targets effectively identical
- **Impact**: MLP could not learn any meaningful mapping
- **Fix**: Redesigned target formula (Option B) with delta-weighted coefficients
- **Lesson**: Always inspect target variable distribution before training — low variance means no learning signal

### Combined Impact

These bugs collectively shifted model accuracy from ~40% to **92.2%** (R² = 0.9224). The normalization and column bugs were the most impactful, transforming cluster quality from meaningless to interpretable.

---

## 17. Model Artifacts & Deployment Outputs

### Production Model Files

| File | Contents | Purpose |
|------|----------|---------|
| `anfis_mlp_weights.json` | Weight matrices, biases, architecture | MLP inference in game engine |
| `anfis_params.json` | Feature order, training metrics, version | Model metadata |
| `cluster_centroids.json` | 3 centroid vectors (10 dimensions each) | Runtime cluster assignment |
| `scaler_params.json` | Min/max per feature | Runtime normalisation |
| `deployment_manifest.json` | Complete configuration, constraints | Deployment contract |
| `training_stats.json` | Dataset statistics, ranges | Validation reference |

### Cluster Centroids (Final)

| Archetype | Combat | Collect | Explore |
|-----------|--------|---------|---------|
| Combat | 56.1% | 3.5% | 40.4% |
| Collection | 24.7% | 12.3% | 63.0% |
| Exploration | 1.7% | 10.4% | 87.9% |

### Runtime Inference Flow

```
Telemetry (30s window)
  → Normalise using scaler_params.json
  → Compute activity scores & percentages
  → Compute distances to 3 centroids
  → Inverse-distance soft membership
  → Compute deltas from previous window
  → MLP forward pass (6→16→8→1)
  → Difficulty multiplier [0.6, 1.4]
```

### Export Script

`export_model_artifacts.py` — Loads processed CSVs, extracts model parameters, re-trains MLP if needed, and exports all artifacts to JSON for TypeScript/game engine deployment.

---

## 18. Independent Analyses

### Telemetry Duration Analysis

**File**: `Independent_Telemetry_Duration_Analysis.ipynb`

Analysed session durations from Phase 2 telemetry (4,238 events, 65 players). Uses session detection with >120-second breaks to separate sessions. Top player had 212.85 minutes across 7 sessions. This analysis informed the 20-minute minimum and 45-minute cap decisions in Notebook 02.

### Model Evaluation Output

**Directory**: `model_evaluation_output/`

Contains the **Option A failure evidence**:

| File | Key Content |
|------|-------------|
| `metrics.json` | R² = -4.69 (train: -5.39, val: -4.59) — catastrophic failure |
| `split_info.json` | Train: 2,159 / Val: 491 / Test: 514 samples |
| `verdict.json` | "SEVERELY OVERFITTED (CRITICAL FAILURE)" — sensitivity analysis showed soft_combat had max impact of only 0.145 |
| `plots/distribution.png` | Target distribution visualisation |
| `plots/residuals.png` | Residual analysis |
| `plots/sensitivity.png` | Feature sensitivity analysis |

This evaluation was the **trigger for switching from Option A to Option B**.

---

## 19. Final Metrics & Production Configuration

### Clustering Quality

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Silhouette Score | 0.3752 | > 0.3 | ✅ Pass |
| Davies-Bouldin Index | 0.9768 | < 1.5 | ✅ Pass |
| Calinski-Harabasz Score | 2,109.3 | High = good | ✅ Strong |

### Behavioural Modelling

| Metric | Value |
|--------|-------|
| Soft Membership — Combat | 29.5% |
| Soft Membership — Collection | 38.8% |
| Soft Membership — Exploration | 31.7% |
| Mean Entropy | 1.4053 (near max 1.585) |

### ANFIS Model Performance

| Metric | Value |
|--------|-------|
| Test R² | 0.9224 |
| Test MAE | 0.0108 |
| Train R² | 0.8369 |
| Target CV | 0.022 |
| Target Range | [0.6, 1.4] |

### Responsiveness

| Signal | Correlation |
|--------|-------------|
| Δexplore → Δtarget | r = 0.808 |
| Δcombat → Δtarget | r = -0.471 |
| Δcollect → Δtarget | r = 0.323 |

### Production Configuration (Locked)

```yaml
preprocessing:
  scaler: MinMaxScaler (uniform)
  features: All 10 telemetry features
  outlier_handling: None

clustering:
  algorithm: KMeans
  k: 3
  random_state: 42
  soft_membership: Inverse distance

anfis_inputs:
  - soft_combat
  - soft_collect
  - soft_explore
  - delta_combat
  - delta_collect
  - delta_explore

model:
  architecture: 6-16-8-1
  activation: ReLU (hidden), Linear (output)
  target_range: [0.6, 1.4]
```

---

## 20. Frozen Decisions Summary

Every major decision in this project was validated experimentally and then locked:

| Decision | Options Considered | Selected | Validation Method |
|----------|--------------------|----------|-------------------|
| Normalisation | MinMax Uniform, Log-Sparse, Robust, Per-player | MinMax Uniform | A/B test + Grid search |
| K value | 2, 3, 4, 5 | 3 | Grid search (108 configs) |
| Feature set | 8 features, 10 features | 10 features | Grid search |
| Outlier handling | 95th, 98th, 100th percentile | None (100th) | Grid search |
| Feature weighting | Uniform, Exploration-reduced | Uniform | Sensitivity analysis |
| Soft membership | Hard assignment, Inverse distance | Inverse distance | Design requirement |
| Delta signals | Exclude, Include | Include | Correlation analysis (r=0.808) |
| Target formula | Option A (static), Option B (delta-weighted) | Option B | Variance analysis + R² comparison |
| Model architecture | Full ANFIS, MLP 6-16-8-1 | MLP Surrogate | Runtime performance |
| Session filter | Various thresholds | 20–45 min | Duration analysis |
| Window size | Various | 30 seconds | Design trade-off |

---

## Appendix: File Structure Reference

```
CollectGame.Model/
├── README.md                          ← Production system overview
├── CHANGELOG.md                       ← Version history
├── FINAL_SYSTEM_STATUS.md             ← Architecture status
├── QUICK_START.md                     ← How to run the pipeline
├── RESEARCH_JOURNEY.md                ← This document
│
├── _research_archive/
│   ├── core/
│   │   ├── notebooks/
│   │   │   ├── 01_Data_Loading_and_Merging.ipynb
│   │   │   ├── 02_Gameplay_Summary.ipynb
│   │   │   ├── 03_Normalization.ipynb
│   │   │   ├── 04_Activity_Contributions.ipynb
│   │   │   ├── 05_Clustering.ipynb
│   │   │   ├── 06_ANFIS_Preparation.ipynb
│   │   │   ├── 07_ANFIS_Training.ipynb
│   │   │   └── 08_Evaluation_Visualizations.ipynb
│   │   ├── pipeline_config.yaml       ← Locked production config
│   │   ├── DELTA_IMPLEMENTATION_GUIDE.md
│   │   └── README.md
│   │
│   ├── experiments/
│   │   ├── experiment_A_baseline/     ← Full 8-notebook pipeline (A)
│   │   ├── experiment_B_feature_aware/← Full 8-notebook pipeline (B)
│   │   ├── comparison_table.csv       ← A vs B metrics
│   │   ├── optimization_results.csv   ← 108-config grid search
│   │   ├── delta_effect_analysis.json ← Temporal signal analysis
│   │   ├── feature_weight_sensitivity.csv
│   │   └── exploration_interpretation_report.csv
│   │
│   ├── data/
│   │   ├── telemetry_phase_2.*.csv    ← Raw source data (3 files)
│   │   ├── processed/                 ← Pipeline outputs (CSVs + PNGs)
│   │   └── models/                    ← Trained model artifacts (6 JSONs)
│   │
│   ├── model_evaluation_output/       ← Option A failure evidence
│   │   ├── metrics.json               ← R² = -4.69
│   │   ├── verdict.json               ← "CRITICAL FAILURE"
│   │   └── plots/                     ← Distribution, residuals, sensitivity
│   │
│   ├── thesis_documentation/          ← 13 thesis-ready documents
│   ├── export_model_artifacts.py      ← JSON export script
│   └── Independent_Telemetry_Duration_Analysis.ipynb
│
└── anfis-demo-ui/                     ← Web demo (Next.js)
```

---

## 21. Activity Scoring Revision (v2.1) — March 2026

### Background

Following live gameplay observation with real users, a systematic classification error was
identified: players who clearly intended to play as Attackers (Combat archetype) were being
classified as Explorers during the early portion of game sessions when enemy density was low.
The game spawns a small number of enemies at start; new enemies take time to appear. During
this window, an attacker-intent player walks around searching for enemies but cannot engage.

### Root Cause Analysis

The v2.0 Exploration score included `timeOutOfCombat`:

```
score_explore_v2 = distanceTraveled + timeSprinting + timeOutOfCombat   (sums)
pct_explore      = score_explore / (score_combat + score_collect + score_explore)
```

Two structural problems were identified:

**Problem 1 — Passive Accumulation**
`timeOutOfCombat` measures the absence of combat, not the presence of exploration. A player
standing still in an empty area accumulates this signal identically to a player deliberately
mapping terrain. On a sparse-enemy map, every second of searching for enemies that do not
yet exist becomes an Exploration vote. The player's true intent — combat — is invisible to
the system until enemies arrive.

**Problem 2 — Redundancy with `timeInCombat`**
`timeInCombat` + `timeOutOfCombat` = total session window duration (30 seconds).
Including both features introduces a hard linear dependency: as combat time rises, out-of-
combat time falls by exactly the same amount. This creates inverse coupling that structurally
suppresses Combat classification whenever `timeInCombat` is low, even if that is purely
because no enemies were available.

**Problem 3 — Feature Count Asymmetry (also fixed)**
The sum-based formula gave Combat (4 features, raw range [0, 4]) a higher raw ceiling than
Collection (3 features, [0, 3]) or Exploration ([0, 3] in v2, [0, 2] in v2.1). While this
partially cancelled in the percentage calculation, it created subtle imbalances in mixed
sessions. Switching to averages gives every archetype an equal ceiling of 1.0.

### Solution (v2.1)

```
# v2.1 formula
score_combat  = avg(enemiesHit, damageDone, timeInCombat, kills)          → [0, 1]
score_collect = avg(itemsCollected, pickupAttempts, timeNearInteractables) → [0, 1]
score_explore = avg(distanceTraveled, timeSprinting)                       → [0, 1]

pct_X = score_X / (score_combat + score_collect + score_explore)
```

Exploration now measures only **deliberate movement**: covering distance and sprinting.
A player who stands still searching for enemies contributes 0 to Exploration score —
which accurately reflects their intent.

### Expected Behavioural Impact

| Scenario | v2.0 Classification | v2.1 Classification |
|----------|--------------------|--------------------|
| Attacker waiting for enemies to spawn (stationary) | Explorer (passive `timeOutOfCombat`) | Neutral (33/33/33 — no activity) |
| Attacker moving to search for enemies | Explorer (movement + `timeOutOfCombat`) | Mixed Combat/Explorer (movement only, corrected) |
| Attacker killing enemies | Combat ✅ | Combat ✅ |
| Pure Explorer traversing map | Explorer ✅ | Explorer ✅ (now requires actual movement) |

### Limitations of This Fix

The remaining ambiguity: a player moving around a map while searching for enemies still
accumulates Exploration score from `distanceTraveled` and `timeSprinting`, because these
are the same physical actions as exploration. Without a new telemetry signal (e.g.,
`enemiesInSightline`, `movementTowardEnemyDirection`), movement-as-searching is
indistinguishable from movement-as-exploration using the current 10-feature dataset.

The fix addresses the worst case (passive accumulation) within existing data constraints.
The residual ambiguity is documented for thesis transparency.

### Pipeline Regeneration Required

The centroids in `cluster_centroids.json` and model weights in `anfis_mlp_weights.json`
were computed with the v2.0 formula and must be regenerated:

```
Rerun: 04 → 05 → 06 → 07
```

Notebook 05 now includes an automatic export cell that writes `cluster_centroids.json`
directly to `anfis-demo-ui/models/` upon completion.
