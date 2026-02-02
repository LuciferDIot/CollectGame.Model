# Backend Architecture & Thesis Map

This document maps the implementation of the `anfis-demo-ui` backend to the theoretical chapters of your thesis. Use this as a reference when writing your "Implementation" chapter.

## 1. High-Level Architecture
The backend follows a **Singleton Pipeline Pattern** where a stateless `ANFISPipeline` orchestrator processes stateful user sessions.

*   **Entry Point**: `app/api/pipeline/route.ts` (The Gateway)
*   **Orchestrator**: `lib/pipeline/index.ts` (The Brain)
*   **Math Engine**: `lib/pipeline/{normalization, clustering, mlp}.ts` (The Components)

## 2. The 8-Step Pipeline Flow
The core logic is now explicitly refactored in `lib/pipeline/index.ts` to match your thesis.

| Thesis Step | Method Name | Logic Description | Code Location |
| :--- | :--- | :--- | :--- |
| **1. Acquisition** | `step1_AcquireAndValidate` | Validates telemetry contract and duration. | `index.ts:167` |
| **2. Normalization** | `step2_NormalizeFeatures` | Min-Max scaling using `min_max_scaler.pkl` parameters. | `index.ts:175` |
| **3. Activity Analysis** | `step3_CalculateActivityScores` | Heuristic categorization of player actions. | `index.ts:183` |
| **4. Fuzzification** | `step4_FuzzyClustering` | Soft Membership via FCM Centroids (IDW). | `index.ts:192` |
| **5. Temporal Dynamics** | `step5_ComputeDeltas` | $Velocity = Membership_t - Membership_{t-1}$. | `index.ts:202` |
| **6. Inference** | `step6_InferenceEngine` | Neural Surrogate (MLP) forward pass on 6D vector. | `index.ts:211` |
| **7. Adaptation** | `step7_AdaptationAnalysis` | Applies Adaptation Contract and Safety Clamps. | `index.ts:232` |
| **8. Result** | `step8_` (Implicit) | Returns `PipelineOutput` JSON to client. | `index.ts:98` |

## 3. Key Algorithms

### Soft Membership (Step 4)
*   **Theory**: Fuzzy C-Means (FCM) Logic.
*   **Implementation**: Inverse Distance Weighting (IDW) against pre-computed centroids.
*   **File**: `lib/pipeline/clustering.ts`

### Neural Surrogate (Step 6)
*   **Theory**: ANFIS Rules Layer approximated by MLP.
*   **Implementation**: Matrix multiplication of Weights & Biases loaded from `anfis_mlp_weights.json`.
*   **File**: `lib/pipeline/mlp.ts`

### Delta Variance (Step 5)
*   **Theory**: Addressing "Variance Collapse" in static ANFIS.
*   **Implementation**: `PipelineSessionManager` in `lib/pipeline/session-manager.ts` maintains user state to compute velocity.

## 4. Data Flow Interface
**Client (Unreal/Web)** $\rightarrow$ **JSON POST** $\rightarrow$ **Next.js API Route** $\rightarrow$ **Pipeline**

```json
/* Request Payload */
{
  "telemetry": {
    "userId": "User_123",
    "features": { "enemiesHit": 5, "damageDone": 1200, ... }
  }
}
```

```json
/* Response Payload (Adaptation Contract) */
{
  "target_multiplier": 1.15,
  "adapted_parameters": {
     "enemy_health_scalar": { "base": 1.0, "final": 1.15 },
     "pickup_spawn_rate": { "base": 1.0, "final": 0.95 }
  }
}
```
