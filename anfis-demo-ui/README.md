# ANFIS Adaptive Difficulty Engine (v2.2)

This repository serves as the runtime demonstration and integration backend for the **Adaptive Neuro-Fuzzy Inference System (ANFIS)**. It implements the complete mathematical pipeline derived from the core research notebooks, allowing external game engines (Unity/Unreal) to query for real-time difficulty adjustments.

---

## 1. System Architecture

The system is designed as a modular pipeline where data flows strictly from raw telemetry to adapted parameters.

### Directory Structure & Responsibility
*   `app/api/pipeline/route.ts`: **Entry Point**. Handles API requests, validation, and session state.
*   `lib/pipeline/index.ts`: **Orchestrator**. Manages the sequential execution of mathematical modules.
*   `lib/pipeline/normalization.ts`: **Step 1**. Applies MinMax scaling from training data.
*   `lib/pipeline/activity.ts`: **Step 2**. calculated behavioral intensity percentages.
*   `lib/pipeline/clustering.ts`: **Step 3**. Fuzzy clustering (Soft Membership).
*   `lib/pipeline/mlp.ts`: **Step 5**. Neural network inference.
*   `lib/pipeline/adaptation.ts`: **Step 6**. Applies contract logic to game parameters.
*   `lib/analytics`: **New**. Centralized Analytics Context and Computation Engine for session diagnostics.

---

## 2. Mathematical Pipeline (Detailed)

Every step in the pipeline strictly follows the mathematical definitions from the research thesis.

### Step 1: Feature Normalization
Raw telemetry features ($X$) are scaled to the $[0, 1]$ range using parameters from `scaler_params.json`.

$$ X'_{\text{norm}} = \frac{X - \text{min}}{\text{max} - \text{min}} $$

### Step 2: Activity Score Calculation
We calculate the "Activity Percentage" for each behavioral category by summing the normalized features and normalizing the result to a valid probability distribution (Sum = 1.0).

**Component Sums**:
*   $S_{\text{combat}} = \text{EnemiesHit} + \text{DamageDone} + \text{TimeInCombat} + \text{Kills}$
*   $S_{\text{collect}} = \text{ItemsCollected} + \text{PickupAttempts} + \text{TimeNearInteractables}$
*   $S_{\text{explore}} = \text{DistanceTraveled} + \text{TimeSprinting} + \text{TimeOutOfCombat}$

**Normalization**:
$$ P_{\text{category}} = \frac{S_{\text{category}}}{S_{\text{combat}} + S_{\text{collect}} + S_{\text{explore}}} $$

### Step 3: Soft Membership (Fuzzy Clustering)
Players are classified into archetypes using **Inverse Distance Weighting (IDW)** based on the distance to pre-calculated centroids (`cluster_centroids.json`).

1.  **Euclidean Distance ($d_k$)**: Calculated between the player's activity vector and each centroid $C_k$.
2.  **Inverse Distance ($w_k$)**:
    $$ w_k = \frac{1}{d_k + 10^{-10}} $$
3.  **Soft Membership ($\mu_k$)**:
    $$ \mu_k = \frac{w_k}{\sum_{j=1}^{3} w_j} $$

### Step 4: Temporal Deltas (Velocity)
To track behavioral shifts, we calculate the rate of change from the previous request ($t-1$).

$$ \Delta_{\text{cat}}(t) = \mu_{\text{cat}}(t) - \mu_{\text{cat}}(t-1) $$

This "Behavioral Velocity" is critical for detecting rapid playstyle shifts (e.g., sudden aggression) versus steady-state behavior.

### Step 5: ANFIS Inference (MLP Surrogate)
A trained Multi-Layer Perceptron (MLP) predicts the difficulty multiplier.

*   **Inputs**: $[\mu_{\text{c}}, \mu_{\text{l}}, \mu_{\text{e}}, \Delta_{\text{c}}, \Delta_{\text{l}}, \Delta_{\text{e}}]$ (6 dimensions)
*   **Weights**: Loaded from `anfis_mlp_weights.json`.
*   **Output**: $M_{\text{target}}$ (clamped between 0.5 and 1.5).

### Step 6: Adaptation Logic
The final game parameters are calculated using the **Archetype-Aware Adaptation** formula.

1.  **Archetype Modifier ($A_x$)**:
    $$ A_x = \text{clamp}(0.85 + 0.3 \times \mu_x, 0.85, 1.15) $$
2.  **Effective Multiplier**:
    $$ M_{\text{eff}} = M_{\text{target}} \times A_x $$
3.  **Parameter Update**:
    *   **Direct Scaling** (e.g., Damage): $V_{\text{final}} = V_{\text{base}} \times M_{\text{eff}}$
    *   **Inverse Scaling** (e.g., Cooldowns): $V_{\text{final}} = V_{\text{base}} / M_{\text{eff}}$
4.  **Safety Clamping**:
    $$ V_{\text{final}} = \text{clamp}(V_{\text{final}}, \text{HardMin}, \text{HardMax}) $$

---

## 3. Dashboard Analytics & Diagnostics

The dashboard provides deep introspection into the engine's state, powered by a React Context-based Analytics Engine.

### 3.1 Membership Diagnostics
Located in the **Archetypes** tab, this panel breaks down the Fuzzy Clustering process.
*   **Partition of Unity Check**: Validates that $\sum \mu = 1.0$.
*   **Current Round Distribution**: Visualizes the exact mix of Combat/Collect/Explore for the current time step.
*   **Dominant Archetype**: Identifies the primary classification.

### 3.2 Counterfactual Analysis (New in v2.2)
Located in the **Archetypes** tab, this feature answers "What if?".
*   **Adaptation Impact**: Calculates the difference between the *actual* difficulty multiplier and a theoretical *static* multiplier (as if Deltas were zero).
*   **Metric**: "Dynamic Adjust" shows how much the player's *rate of change* (Velocity) contributed to the difficulty, separate from their static position.

### 3.3 Pipeline History
The "Pipeline Visualization" center panel now tracks state history.
*   **Step 5 (Defuzzification)**: Displays **Behavioral Deltas** (Velocity), showing the exact numerical shift in behavior since the last tick.
*   **Previous State (t-1)**: Shows the Soft Membership values from the prior request, allowing easy comparison.

### 3.4 Session Analytics
*   **Responsiveness**: Measures how quickly the system adapts to changes.
*   **Clamp Statistics**: Tracks how often parameters hit their safety bounds (Min/Max).
*   **Archetype Distribution**: Long-term session averages for player classification.

---

## 4. API Integration & Usage

### Endpoint
*   **URL**: `POST /api/pipeline`
*   **Content-Type**: `application/json`

### Workflow for External Clients
1.  **Collect Telemetry**: Accumulate player actions over a window (e.g., 30-60 seconds).
2.  **Send Request**: POST the aggregated counts to the API.
3.  **Apply Response**: Parse `adapted_parameters` and update game variables immediately.

### Request Body Schema
```json
{
  "telemetry": {
    "duration": 30, // Window duration in seconds
    "features": {
      "enemiesHit": 10,       // integer
      "damageDone": 500.0,    // float
      "timeInCombat": 15.0,
      "kills": 2,
      "itemsCollected": 5,
      "pickupAttempts": 6,
      "timeNearInteractables": 10.0,
      "distanceTraveled": 150.0,
      "timeSprinting": 20.0,
      "timeOutOfCombat": 5.0
    }
  },
  "deaths": { "count": 0 }, // Optional death data
  "reset": false            // Set true for new session
}
```

### Response Body Schema
```json
{
  "target_multiplier": 1.12,
  "soft_membership": {
    "soft_combat": 0.40,
    "soft_collect": 0.35,
    "soft_explore": 0.25
  },
  "adapted_parameters": {
    "enemy_damage_intensity": {
      "base": 10,
      "final": 11.2,
      "clamped": false
    },
    // ... complete list of 12 parameters
  },
  "validation": {
    "membership_sum": 1.0,  // Verified logic
    "delta_range_ok": true
  }
}
```

### Adapted Parameters List
The API returns updates for the following GameSync parameters:
*   **Combat**: `enemy_spawn_interval`, `global_enemy_cap`, `enemy_damage_intensity`, `enemy_max_health`
*   **Collection**: `collectible_count`, `collectible_spawn_interval`, `collectible_lifetime`
*   **Exploration**: `stamina_regen`, `stamina_damage`, `dash_cooldown`
*   **Global**: `player_damage_intensity`, `player_max_health`
