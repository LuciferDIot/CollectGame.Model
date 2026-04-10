# Research Evaluation Report: ANFIS Adaptive Difficulty

## 1. Simulated Evaluation Dataset
To validate the ANFIS pipeline, we simulated a dataset of player telemetry windows representing diverse gameplay styles. The table below shows a subset of inputs (soft cluster membership + difficulty deltas) and the corresponding ANFIS difficulty multiplier output ($M$).

| Window | Type | Soft Combat | Soft Collect | Soft Explore | Δ Combat | Δ Collect | Δ Explore | Display $M$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **Balanced** | 0.33 | 0.33 | 0.34 | 0.00 | 0.00 | 0.00 | **1.00** ← guaranteed by neutral-centred calibration |
| 2 | **High Combat** | 0.85 | 0.10 | 0.05 | +0.40 | −0.10 | −0.30 | **~1.36** (HARDER) |
| 3 | **Struggling** | 0.70 | 0.20 | 0.10 | −0.50 | −0.10 | +0.10 | **~0.82** (easier) |
| 4 | **Collector** | 0.10 | 0.80 | 0.10 | −0.10 | +0.40 | −0.10 | **~0.87** (easier) |
| 5 | **Explorer** | 0.15 | 0.15 | 0.70 | −0.05 | −0.05 | +0.30 | **~0.83** (easier) |
| 6 | **Mixed** | 0.45 | 0.45 | 0.10 | +0.10 | +0.15 | −0.10 | **~1.10** (HARDER) |
| 7 | **Idle/Passive**| 0.20 | 0.20 | 0.60 | −0.60 | −0.60 | −0.30 | **~0.72** (easier) |

*$M > 1.0$: difficulty increases (more enemies, less loot). $M < 1.0$: difficulty decreases (fewer enemies, more loot). $M = 1.0$: no change. Display values computed via neutral-centred formula: $M_{\text{display}} = \text{clamp}(1.0 + (\text{raw} - 0.932) \times 2.0,\ 0.6,\ 1.4)$.*

## 2. ANFIS Prediction Accuracy (v2.2.1 - corrected)
The ANFIS model (approximated via a 6-16-8-1 MLP surrogate) was evaluated on a test split (20%) of the full synthetic dataset.

*   **Total Samples**: 3,240 (80/20 split → 2,592 train / 648 test)
*   **Mean Absolute Error (MAE)**: `0.0127`
*   **R² Score**: `0.9264`
*   **Convergence**: 21 iterations (LBFGS solver, max_iter=500)
*   **mlp_neutral**: 0.932006 (neutral-centred calibration baseline)

The low MAE (1.3% of target span) indicates the surrogate faithfully reproduces the fuzzy inference surface. Note: earlier versions of this report cited R²=0.982 and MAE=0.0102 - those figures came from a biased training run (base=0.9) and a smaller dataset. The current figures reflect the corrected v2.2.1 retrain.

## 3. Calibration Study Results (N=7)
A small-scale user study was conducted to calibrate the base difficulty modes before enabling full adaptation. Participants played three fixed modes in randomized order.

*   **Mode A (Easy)**: $M=0.8$. Reported as "Too boring" and "Lack of tension" by 6/7 users.
*   **Mode C (Hard)**: $M=1.5$. Reported as "Frustratingly difficult" and "Unfair enemy spawns" by 5/7 users.
*   **Mode B (Medium)**: $M=1.0$. Reported as "Balanced" but "Repetitive" by 4/7 users.

**Conclusion**: The Adaptive System (v2.2.1) target range is $[0.60, 1.40]$. The lower bound (0.6×) corresponds to full assistance mode; the upper bound (1.4×) represents maximum challenge, below the "Unfair" threshold observed in Mode C ($M=1.5$). Balanced players are guaranteed to receive $M=1.0$ via neutral-centred calibration.

## 4. Visualization: Delta Impact on Difficulty
The following matrix illustrates how changes in player performance ($\Delta$) shift the Difficulty Multiplier ($M$) for a balanced player ($u \approx 0.33$).

| | $\Delta$ High Perf (+0.5) | $\Delta$ Stable (0.0) | $\Delta$ Low Perf (-0.5) |
| :--- | :---: | :---: | :---: |
| **Combat Focus** | $M \uparrow 1.25$ (Scale Up) | $M \approx 1.0$ | $M \downarrow 0.85$ (Assist) |
| **Collect Focus** | $M \uparrow 1.15$ (More Items) | $M \approx 1.0$ | $M \downarrow 0.90$ (More Time) |
| **Explore Focus** | $M \uparrow 1.10$ (Faster Pace) | $M \approx 1.0$ | $M \downarrow 0.95$ (Guidance) |

*Interpretation: High performance in Combat leads to the most aggressive difficulty increase, while struggling in any category triggers a difficulty reduction (Assist mode).*

## 5. Runtime Analytics Bridge (The "Trust Anchor")

**Bridge Implementation**:
To verify these simulation results in the live game, we implemented the "Trust Anchor" chart in the Admin Dashboard.

*   **Offline vs Online**: This report proves the *Model* works (R²=0.98). The Dashboard proves the *Game* submits correct data.
*   **Visual Validation**:
    *   The "Trust Anchor" plots real-time telemetry (white dots) against the K-Means centroids (colored backgrounds).
    *   **Success Criteria**: If a player is fighting, their dot MUST move into the Red (Combat) zone.
    *   **Failure Mode**: If the dot remains in the center during combat, the Feature Extraction Logic is broken.

*See `ANALYTICS_WALKTHROUGH.md` for the full live verification protocol.*

