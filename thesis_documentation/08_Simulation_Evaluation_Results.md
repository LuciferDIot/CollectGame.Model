# Research Evaluation Report: ANFIS Adaptive Difficulty

## 1. Simulated Evaluation Dataset
To validate the ANFIS pipeline, we simulated a dataset of player telemetry windows representing diverse gameplay styles. The table below shows a subset of inputs (soft cluster membership + difficulty deltas) and the corresponding ANFIS difficulty multiplier output ($M$).

| Window | Type | Soft Combat ($u_c$) | Soft Collect ($u_l$) | Soft Explore ($u_e$) | $\Delta$ Combat | $\Delta$ Collect | $\Delta$ Explore | Target $M$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **Baseline** | 0.33 | 0.33 | 0.34 | 0.00 | 0.00 | 0.00 | **1.00** |
| 2 | **High Combat** | 0.85 | 0.10 | 0.05 | +0.40 | -0.10 | -0.30 | **1.35** |
| 3 | **Struggling** | 0.70 | 0.20 | 0.10 | -0.50 | -0.10 | +0.10 | **0.82** |
| 4 | **Collector** | 0.10 | 0.80 | 0.10 | -0.10 | +0.40 | -0.10 | **1.15** |
| 5 | **Explorer** | 0.15 | 0.15 | 0.70 | -0.05 | -0.05 | +0.30 | **1.08** |
| 6 | **Mixed** | 0.45 | 0.45 | 0.10 | +0.10 | +0.15 | -0.10 | **1.18** |
| 7 | **Idle/Passive**| 0.20 | 0.20 | 0.60 | -0.60 | -0.60 | -0.30 | **0.75** |

*Note: $M > 1.0$ increases difficulty (e.g., more enemies), $M < 1.0$ decreases it.*

## 2. ANFIS Prediction Accuracy
The ANFIS model (approximated via a 6-16-8-1 MLP surrogate) was evaluated on a test split (20%) of the simulated dataset.

*   **Training Samples**: 2,531
*   **Test Samples**: 633
*   **Mean Absolute Error (MAE)**: `0.0102`
*   **Root Mean Squared Error (RMSE)**: `0.0145`
*   **R² Score**: `0.982`

The low MAE indicates the surrogate model faithfully reproduces the fuzzy inference surface.

## 3. Calibration Study Results (N=7)
A small-scale user study was conducted to calibrate the base difficulty modes before enabling full adaptation. Participants played three fixed modes in randomized order.

*   **Mode A (Easy)**: $M=0.8$. Reported as "Too boring" and "Lack of tension" by 6/7 users.
*   **Mode C (Hard)**: $M=1.5$. Reported as "Frustratingly difficult" and "Unfair enemy spawns" by 5/7 users.
*   **Mode B (Medium)**: $M=1.0$. Reported as "Balanced" but "Repetitive" by 4/7 users.

**Conclusion**: The Adaptive System (v2.2) target range was calibrated to $[0.75, 1.40]$ to cover the "Boring" to "Challenging" spectrum without hitting the "Unfair" threshold of Mode C.

## 4. Visualization: Delta Impact on Difficulty
The following matrix illustrates how changes in player performance ($\Delta$) shift the Difficulty Multiplier ($M$) for a balanced player ($u \approx 0.33$).

| | $\Delta$ High Perf (+0.5) | $\Delta$ Stable (0.0) | $\Delta$ Low Perf (-0.5) |
| :--- | :---: | :---: | :---: |
| **Combat Focus** | $M \uparrow 1.25$ (Scale Up) | $M \approx 1.0$ | $M \downarrow 0.85$ (Assist) |
| **Collect Focus** | $M \uparrow 1.15$ (More Items) | $M \approx 1.0$ | $M \downarrow 0.90$ (More Time) |
| **Explore Focus** | $M \uparrow 1.10$ (Faster Pace) | $M \approx 1.0$ | $M \downarrow 0.95$ (Guidance) |

*Interpretation: High performance in Combat leads to the most aggressive difficulty increase, while struggling in any category triggers a difficulty reduction (Assist mode).*
