# Runtime Execution Workflow Specification (v2.0)

> **v2.1 Update (March 2026)**: The activity scoring formula (Step 3) was revised to use per-archetype averages and exclude `timeOutOfCombat` from Exploration scoring.
>
> **v2.2 Update (March 2026)**: Two derived features added - `damage_per_hit` (Combat, 5th feature) and `pickup_attempt_rate` (Collection, 4th feature). Raw feature vector is now 12-wide (10 original + 2 derived computed server-side before normalization). Scaler, centroids, and MLP weights regenerated.
>
> **v2.2.1 Update (March 2026)**: Training bias fixed (base=0.9->1.0 in target formula). MLP output calibration changed from min-max rescaling to **neutral-centred**: `display = clamp(1.0 + (raw − 0.932006) x 2.0, 0.6, 1.4)`. Final metrics: **Test R^2 = 0.9264, Test MAE = 0.0127**. `mlp_neutral = 0.932006` stored in `anfis_mlp_weights.json` and auto-updated by notebook 07 after each retrain.

## 1. Runtime Flow Diagram

```mermaid
graph TD
    A[Continuous Gameplay Telemetry] -->|Aggregate 30s Window| B(Raw Feature Vector [10] + 2 derived = [12])
    B -->|Apply Saved scaler.json| C(Normalized Vector [12])
    C -->|Distance to Saved centroids.json| D{K-Means Centroids}
    D -->|Inverse Distance Weighting| E(Soft Membership [3])
    E -->|Retrieve Previous State| F(Delta Computation)
    F -->|Concat State + Delta| G(ANFIS Input Vector [6])
    E -.->|Store Current State| H[(Player State Cache)]
    G -->|Feed to Saved mlp_model.json| I(Target Multiplier)
    I -->|Smooth (5-15s)| J[Game Engine Difficulty Controller]
```

## 2. Execution Frequency Table

| Component | Frequency | Trigger | Latency Requirement |
| :--- | :--- | :--- | :--- |
| **Telemetry Collection** | Continuous (Real-time) | Frame Update / Event | Instant (<1ms) |
| **Window Aggregation** | Every 30 Seconds | Timer / Window Complete | Low (<10ms) |
| **Feature Extraction** | Every 30 Seconds | Aggregation Complete | Low (<50ms) |
| **Model Inference** | Every 30 Seconds | Feature Ready | Low (<100ms) |
| **Difficulty Application** | Continuous (Smoothed) | Inference Complete | Interpolated |
| **State Persistence** | Every 30 Seconds | Inference Complete | N/A (Memory) |

## 3. Model Artifacts Required at Runtime

The game engine requires the following frozen artifacts (JSON/Binary) exported from the training pipeline:

1.  **`scaler_params.json`**: Contains `min` and `scale` values for all **12 features** (10 raw + 2 derived).
    *   *Source*: Notebook `03_Normalization.ipynb`
2.  **`cluster_centroids.json`**: Contains the (3, 3) centroid matrix in pct_combat/collect/explore space.
    *   *Source*: Notebook `05_Clustering.ipynb`
3.  **`anfis_mlp_weights.json`**: Contains weights/biases for the 6-input MLP + `mlp_neutral` (0.932006) for neutral-centred calibration.
    *   *Source*: Notebook `07_ANFIS_Training.ipynb` (auto-exports `mlp_neutral` after every retrain)
4.  **`deployment_manifest.json`**: Hard constraints - `target_multiplier_range: [0.6, 1.4]`, feature order, version.
    *   *Source*: Manually maintained; version-bumped per release

## 4. State Variables to Persist

For each active player session, the runtime system must maintain a minimal state object:

```json
{
  "player_id": "uuid",
  "current_window_start_time": 1729384920,
  "telemetry_buffer": { ... },  // Accumulators for 10 raw features
  "previous_soft_membership": [0.33, 0.33, 0.33] // Default initialization
}
```

*   **`previous_soft_membership`**: Required to compute deltas. Updates at the end of every inference step.

## 5. Failure-Safe Behavior

| Scenario | Behavior | Justification |
| :--- | :--- | :--- |
| **First Window (t=0)** | Set `Deltas = [0, 0, 0]`. Use static soft membership. | No history exists for change detection. |
| **Missing Telemetry** | Zero-fill features. Output `Target = 1.0` (Neutral). | Defaults to baseline difficulty to prevent spikes. |
| **Corrupt Artifacts** | Fallback to `Target = 1.0`. Log Critical Error. | Game stability > Adaptation. |
| **Extreme Outliers** | Clip Input to Scaler Min/Max. Neutral-centred output + clamp to [0.6, 1.4]. | Prevent mathematical instability from affecting gameplay. |

## 6. Verification

This workflow uses the v2.2.1 models (2026-03-07). Changes from v2.0:
- **v2.1**: Activity scoring corrected - averages instead of sums, `timeOutOfCombat` excluded from Exploration
- **v2.2**: Derived features added (`damage_per_hit`, `pickup_attempt_rate`); scaler expanded to 12 features
- **v2.2.1**: Training target base corrected (0.9->1.0); output calibration changed to neutral-centred mapping

All execution frequencies and failure-safe behaviors remain as specified above.

