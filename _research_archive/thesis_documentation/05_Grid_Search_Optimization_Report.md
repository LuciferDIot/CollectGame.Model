# Optimization Study: Parameter Tuning and Configuration Selection

## 1. Introduction

To validate the configuration of the ANFIS adaptive difficulty system, a comprehensive optimization study was conducted. The objective was to determine whether alternative preprocessing techniques, clustering parameters, or feature sets could yield superior behavioral modeling compared to the preliminary baseline.

## 2. Methodology

A grid search was implemented to systematically evaluate the hyperparameter space. The study tested **108 unique configurations** across four dimensions:

*   **Cluster Count (K)**: Tested K=2, 3, 4, 5 to identify optimal behavioral segmentation.
*   **Outlier Handling**: Evaluated capping at 95th percentile, 98th percentile, and no capping (100%).
*   **Normalization**: Compared Uniform MinMaxScaler against feature-aware Log-Sparse scaling and RobustScaler.
*   **Feature Sets**: Tested subsets of 8, 9, and the full 10 telemetry features.

**Total Configurations**: 4 (K) × 3 (Outlier) × 3 (Norm) × 3 (Features) = 108.

## 3. Results Analysis

The performance of each configuration was evaluated using the Silhouette Score (cluster separation) and Davies-Bouldin Index (cluster compactness).

### 3.1. Impact of Cluster Count (K)
The analysis revealed that **K=2** consistently provided the highest quantitative metrics:
*   **Silhouette Score**: 0.4166 (+11.1% over baseline).
*   **Davies-Bouldin Index**: 1.0411.

However, K=2 inherently segments players into a binary "High/Low" classification, which is incompatible with the project's theoretical framework requiring three distinct archetypes (Combat, Collection, Exploration).

**K=3** offered the best balance for the specific domain requirements, despite a marginally lower Silhouette Score (0.376).

### 3.2. Normalization Techniques
Feature-specific preprocessing (e.g., Log-transforming sparse features like `timeInCombat`) showed negligible improvement for K=3:
*   **Log-Sparse + K=3**: Silhouette 0.3764 (+0.4%).
*   **Baseline MinMax + K=3**: Silhouette 0.3752.

The marginal gain (+0.4%) was insufficient to justify the increased computational complexity and reduced interpretability of the log-transformed feature space.

### 3.3. Outlier Handling
Capping features at the 95th or 98th percentile did not yield consistent improvements. In several configurations, it reduced cluster quality by compressing the variance necessary to distinguish high-skill outliers.

## 4. Discussion and Justification

### 4.1. Selection of the Baseline Configuration
Based on the grid search results, the original baseline configuration was selected for the final production system. 

**Selected Configuration**:
*   **K = 3** (Combat, Collection, Exploration).
*   **Features = 10** (Full telemetry set).
*   **Normalization = Uniform MinMaxScaler**.
*   **Outlier Handling = None**.

**Justification Metrics**:
1.  **Metric Stability**: Silhouette Score of 0.375 exceeds the acceptable threshold (>0.3).
2.  **Cluster Compactness**: DB Index of 0.977 is well below the upper limit (<1.5).
3.  **Behavioral Diversity**: Entropy of 1.405 (near max 1.585) confirms that the system effectively models a diverse range of player behaviors rather than collapsing into a single mode.
4.  **System Compatibility**: Retaining K=3 ensures seamless integration with the intended 3-archetype ANFIS controller.

### 4.2. Trade-off Analysis
While K=2 offered statistically superior separation, optimizing purely for Silhouette Score would have compromised the system's ability to respond to specific gameplay styles (e.g., distinguishing "Explorers" from "Collectors"). The decision to prioritize domain compatibility (K=3) over raw clustering metrics aligns with the project's goal of nuanced difficulty adaptation.

## 5. Conclusion
The optimization study confirms that the baseline configuration is not merely a default choice but a performant, stable, and theoretically sound solution for this specific application. The absence of significant gains from complex preprocessing validates the robustness of the core 10-feature telemetry set.

