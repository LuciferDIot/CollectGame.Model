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
  "userId": "player_01",    // [REQUIRED] Unique Session ID
  "telemetry": {
      "enemiesHit": 15,       // integer
      "damageDone": 850.5,    // float
      "timeInCombat": 12.5,
      "kills": 3,
      "itemsCollected": 8,
      "pickupAttempts": 8,
      "timeNearInteractables": 15.0,
      "distanceTraveled": 210.0,
      "timeSprinting": 45.0,
      "timeOutOfCombat": 10.0,
      "deathCount": 0         // [OPTIONAL] Total deaths in this window
    },
  "reset": false              // Set true to force new session state
}
```

> **Note**: `deathCount` is now a direct property of `features`. The separate `deaths` object has been deprecated.

### Response Body Schema
```json
{
  "target_multiplier": 1.15,
  "soft_membership": {
    "soft_combat": 0.65,
    "soft_collect": 0.25,
    "soft_explore": 0.10
  },
  "adapted_parameters": {
    // --- Combat Parameters ---
    "enemy_spawn_interval": {
      "id": "enemy_spawn_interval",
      "base": 40,
      "final": 34.78,   // Inverse Scaling (Harder)
      "clamped": false
    },
    "global_enemy_cap": {
      "id": "global_enemy_cap",
      "base": 35,
      "final": 40.25,   // Direct Scaling (Harder)
      "clamped": false
    },
    "enemy_damage_intensity": {
      "id": "enemy_damage_intensity",
      "base": 10,
      "final": 11.5,
      "clamped": false
    },
    "enemy_max_health": {
      "id": "enemy_max_health",
      "base": 100,
      "final": 115.0,
      "clamped": false
    },

    // --- Exploration Parameters ---
    "stamina_regen": {
      "id": "stamina_regen",
      "base": 12,
      "final": 10.43,   // Inverse Scaling
      "clamped": false
    },
    "stamina_damage": {
      "id": "stamina_damage",
      "base": 5,
      "final": 5.75,
      "clamped": false
    },
    "dash_cooldown": {
      "id": "dash_cooldown",
      "base": 3,
      "final": 3.45,
      "clamped": false
    },

    // --- Collection Parameters ---
    "collectible_count": {
      "id": "collectible_count",
      "base": 120,
      "final": 104.34,
      "clamped": false
    },
    "collectible_spawn_interval": {
      "id": "collectible_spawn_interval",
      "base": 40,
      "final": 46.0,
      "clamped": false
    },
    "collectible_lifetime": {
      "id": "collectible_lifetime",
      "base": 30,
      "final": 26.08,
      "clamped": false
    },

    // --- Global Parameters ---
    "player_damage_intensity": {
      "id": "player_damage_intensity",
      "base": 16,
      "final": 13.91,
      "clamped": false
    },
    "player_max_health": {
      "id": "player_max_health",
      "base": 180,
      "final": 156.52,
      "clamped": false
    }
  },
  "validation": {
    "membership_sum": 1.0,
    "delta_range_ok": true,
    "multiplier_clamped": false,
    "all_params_in_bounds": true
  }
}
```

### Response Value Definitions
*   **target_multiplier**: The raw AI difficulty recommendation (e.g., `1.15` = 15% Harder).
*   **soft_membership**: The player's current classification (must sum to 1.0).
*   **adapted_parameters**: The dictionary of *final* game values to apply directly to the game engine. Each parameter contains:
    *   `base`: The default value.
    *   `final`: The AI-adjusted value to use.
    *   `clamped`: Boolean flag indicating if safety limits were hit.
*   **validation**: System health checks. `all_params_in_bounds` confirms no hard limits were exceeded.
