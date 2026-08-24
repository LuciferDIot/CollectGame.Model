# AURA — Model & Cluster Comparisons
> All values sourced directly from experiment CSVs and model JSON artifacts.

---

## 1. Cluster K Selection
*Source: `experiment_B_clustering_config/outputs/optimization_results.csv`*

| K | Silhouette ↑ | DB Index ↓ | CH Score ↑ | Entropy | Decision |
|---|---|---|---|---|---|
| 2 | 0.4166 | 1.0866 | 1944.34 | 0.8701 | ❌ Binary only |
| **3** | **0.3752** | **0.9966** | **2153.47** | **1.5421** | ✅ Selected |
| 4 | 0.3503 | 0.9400 | 1324.92 | 1.4684 | ❌ 4th cluster collapses |
| 5 | 0.3432 | 1.0352 | 2001.59 | 2.2813 | ❌ Unstable centroids |

---

## 2. Feature Space: Percentage vs Raw Features
*Source: `experiment_A_feature_space_validation/outputs/feature_space_results.csv`*

| Approach | K | Silhouette ↑ | DB Index ↓ | CH Score ↑ | Decision |
|---|---|---|---|---|---|
| **A — Percentage (normalised)** | 2 | **0.5799** | **0.6131** | **6177.57** | ✅ Selected |
| B — Raw features | 2 | 0.5058 | 0.8159 | 4004.70 | ❌ Rejected |
| **A — Percentage** | **3** | **0.4948** | **0.8206** | **5253.03** | ✅ Selected |
| B — Raw features | 3 | 0.4635 | 0.8218 | 3339.86 | ❌ Rejected |

---

## 3. Raw vs Soft Membership
*Source: `experiment_B_clustering_config/outputs/hard_vs_soft_comparison.csv`*

| Scheme | Mean Transition Magnitude ↓ | Decision |
|---|---|---|
| Hard (raw K-Means) | 0.9988 | ❌ Near-full swing each window — unstable |
| **Soft (IDW)** | **0.6559** | ✅ Selected — 34% smoother transitions |

---

## 4. Target Formula Versions
*Source: `experiment_C_target_variable/outputs/target_formulation_comparison.csv`*

| Option | Formula Type | Target Std ↑ | Target Range | Test MAE ↓ | Test R² ↑ | Decision |
|---|---|---|---|---|---|---|
| A — Static only | membership terms only | 0.0266 | 0.3022 | 0.0090 | 0.2903 | ❌ Near-zero variance |
| **B — Delta-weighted** | membership + delta terms | **0.0740** | **0.5487** | **0.0101** | **0.9401** | ✅ Selected |

> v1.0 collapsed version (verdict.json): Test R² = **−4.688**, MAE = 0.0107 — catastrophic failure (100% clamped).

---

## 5. MLP Architecture Search
*Source: `experiment_F_anfis_ablation/outputs/mlp_architecture_search.csv`*

| Architecture | Params | Test MAE ↓ | Test R² ↑ | Decision |
|---|---|---|---|---|
| Single [4] | 33 | 0.0615 | −0.1071 | ❌ |
| Single [8] | 65 | 0.0612 | −0.1096 | ❌ |
| Single [16] | 129 | 0.0282 | 0.7170 | ❌ |
| [8-4] | 97 | 0.0164 | 0.8820 | ❌ Insufficient |
| **[16-8]** | **257** | **0.0127** | **0.9264** | ✅ Selected |
| [8-2] | 77 | 0.0212 | 0.7599 | ❌ |
| [4-4-2] | 61 | 0.0609 | −0.1971 | ❌ |
| [8-4-2] | 105 | 0.0146 | 0.8276 | ❌ |
| [12-6-3] | 187 | 0.0067 | 0.9669 | ⚠️ Over-parameterised |

---

## 6. Feature Input Ablation (Soft vs Delta vs Combined)
*Source: `experiment_F_anfis_ablation/outputs/delta_effect_analysis.csv`*

| Input Features | N | Test MAE ↓ | Test R² ↑ | Decision |
|---|---|---|---|---|
| Soft only (no delta) | 3 | 0.0478 | 0.3056 | ❌ Misses momentum |
| Delta only (no soft) | 3 | 0.0340 | 0.6836 | ❌ Misses context |
| **Soft + Delta (combined)** | **6** | **0.0127** | **0.9264** | ✅ Selected |

---

## 7. Per-Feature Drop Impact
*Source: `experiment_F_anfis_ablation/outputs/feature_ablation_results.csv`*

| Dropped Feature | Test MAE | Test R² | MAE Increase % | Verdict |
|---|---|---|---|---|
| None (baseline) | 0.0127 | 0.9264 | — | — |
| soft_combat | 0.0140 | 0.9293 | +10.48% | Moderate impact |
| soft_collect | 0.0131 | 0.9291 | +2.73% | Low impact |
| soft_explore | 0.0125 | 0.9336 | −1.35% | Negligible |
| delta_combat | 0.0089 | 0.9571 | −29.81% | ⚠️ Collinear with target |
| **delta_collect** | **0.0182** | **0.8771** | **+42.87%** | 🔴 Most critical |
| delta_explore | 0.0142 | 0.9011 | +11.95% | Significant |

---

## 8. ML Approach Comparison
*Source: `experiment_D_approach_comparison/outputs/approach_comparison.csv`*

| Approach | Test MAE ↓ | Test R² ↑ | Inference (µs) ↓ | Unity Portable | Decision |
|---|---|---|---|---|---|
| Direct Formula | 0.2768 | −13.0975 | 140.22 | ✅ Yes | ❌ Brittle, no preprocessing |
| **MLP Surrogate [16-8]** | **0.0127** | **0.9264** | **48.94** | ✅ Yes | ✅ Selected |
| ANFIS (729 rules) | N/A | N/A | 71.22 | ❌ Difficult | ❌ Cannot port to Unity C# |

---

## 9. Model Type Comparison
*Source: `experiment_E_model_selection/outputs/model_selection_results.csv`*

| Rank | Model | Test MAE ↓ | Test R² ↑ | Inference (µs) ↓ | Decision |
|---|---|---|---|---|---|
| 1 | **MLP [16-8]** | **0.0127** | **0.9264** | **45.53** | ✅ Selected |
| 2 | ExtraTrees (d=3) | 0.0145 | 0.9162 | 977.89 | ❌ 21× slower |
| 3 | Decision Tree (d=3) | 0.0155 | 0.9133 | 43.51 | ❌ Lower accuracy |
| 4 | KNN (k=500) | 0.0159 | 0.8779 | 395.89 | ❌ 9× slower |
| 5 | MLP [8-4] | 0.0164 | 0.8820 | 48.92 | ❌ Lower R² |
| 6 | AdaBoost (lr=0.05) | 0.0178 | 0.8880 | 2483.99 | ❌ 55× slower |
| 7 | Gradient Boost (n=10) | 0.0376 | 0.5374 | 98.83 | ❌ Poor fit |
| 8 | MLP [4-2] | 0.0475 | 0.3464 | 49.13 | ❌ Underfits |
| 9 | SVR (poly, d=3) | 0.0499 | 0.5177 | 60.08 | ❌ Poor fit |

---

## 10. Final Canonical Model (v2.2.1)
*Source: `models/anfis_mlp_weights.json`, `models/training_stats.json`*

| Metric | Value |
|---|---|
| Architecture | 6→16→8→1 (ReLU / Linear) |
| Total samples | 3,240 (80/20 split) |
| Train MAE | 0.014430 |
| **Test MAE** | **0.012322** |
| Train MSE | 0.000803 |
| **Test MSE** | **0.000352** |
| Train R² | 0.8631 |
| **Test R²** | **0.9350** |
| Convergence | 21 iterations (LBFGS) |
| mlp_neutral | 0.931601 |
| Target mean | 0.9103 |
| Target std | 0.0760 |
| Target min | 0.6000 |
| Target max | 1.1213 |

### Cluster Centroids (`models/cluster_centroids.json`)

| Archetype | pct_combat | pct_collect | pct_explore |
|---|---|---|---|
| Combat | 0.7253 | 0.0963 | 0.1784 |
| Collection | 0.2168 | 0.4854 | 0.2977 |
| Exploration | 0.0072 | 0.0635 | 0.9293 |
