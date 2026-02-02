# Runtime Execution Workflow Specification (v2.0)

## 1. Runtime Flow Diagram

```mermaid
graph TD
    A[Continuous Gameplay Telemetry] -->|Aggregate 30s Window| B(Raw Feature Vector [10])
    B -->|Apply Saved scaler.json| C(Normalized Vector [10])
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

1.  **`scaler_params.json`**: Contains `min` and `scale` values for the 10 core features.
    *   *Source*: Notebook `03_Normalization.ipynb`
2.  **`cluster_centroids.json`**: Contains the (3, 10) coordinate matrix of the K-Means centroids and their archetype labels.
    *   *Source*: Notebook `05_Clustering.ipynb`
3.  **`mlp_model_weights.json`**: Contains the weights and biases for the 6-input MLP regressor.
    *   *Source*: Notebook `07_ANFIS_Training.ipynb`

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
| **Extreme Outliers** | Clip Input to Scaler Min/Max. Clip Output to [0.5, 1.5]. | Prevent mathematical instability from affecting gameplay. |

## 6. Verification

This workflow uses the frozen v2.0 models exactly as trained and is safe for production runtime deployment.
