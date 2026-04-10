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

### Step 2: Activity Score Calculation (v2.2)
Each archetype score is computed as the **per-archetype average** of its normalized signals. This gives every archetype an equal ceiling of 1.0, preventing structural bias from feature-count asymmetry.

**v2.2 Formulae** (two derived features added - computed before normalization):

| Archetype | Features (5 / 4 / 2) | Formula |
|-----------|----------------------|---------|
| **Combat** | EnemiesHit, DamageDone, TimeInCombat, Kills, **DamagePerHit** | $\text{score\_combat} = \text{avg}(5\text{ features})$ |
| **Collection** | ItemsCollected, PickupAttempts, TimeNearInteractables, **PickupAttemptRate** | $\text{score\_collect} = \text{avg}(4\text{ features})$ |
| **Exploration** | DistanceTraveled, TimeSprinting | $\text{score\_explore} = \text{avg}(2\text{ features})$ |

> **Why averages, not sums?** (v2.1 fix): Sums gave Combat a 4× ceiling over a 1-feature Exploration category. Averages guarantee a fair [0,1] ceiling per archetype.
> **Why remove `timeOutOfCombat`?** (v2.1 fix): It accumulated *passively* for any player not fighting, mis-classifying attacker-intent players as Explorers on sparse-spawn maps.
> **Why `DamagePerHit` and `PickupAttemptRate`?** (v2.2 addition): Sniper-style players deal high damage with few hits - without this, they were under-represented in Combat scoring. `PickupAttemptRate` distinguishes deliberate Collectors from incidental Explorers who pass near items without picking them up.

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
A trained Multi-Layer Perceptron (MLP) predicts a raw difficulty score, which is then mapped to the display multiplier via **neutral-centred calibration**.

*   **Inputs**: $[\mu_{\text{c}}, \mu_{\text{l}}, \mu_{\text{e}}, \Delta_{\text{c}}, \Delta_{\text{l}}, \Delta_{\text{e}}]$ (6 dimensions)
*   **Architecture**: 6 → Dense(16, ReLU) → Dense(8, ReLU) → Dense(1, Linear)
*   **Weights**: Loaded from `anfis_mlp_weights.json` (Test R²=0.9264, MAE=0.0127)
*   **Calibration** (neutral-centred):

$$M_{\text{display}} = \text{clamp}\!\left(1.0 + (\text{raw} - \text{mlp\_neutral}) \times 2.0,\ 0.6,\ 1.4\right)$$

where $\text{mlp\_neutral} = 0.932006$ = MLP output for a balanced (⅓,⅓,⅓) no-delta player.

> **Why neutral-centred?** A balanced player must semantically map to display=1.0 (no change). Min-max rescaling was sensitive to extreme training inputs and broke this guarantee. Neutral-centred calibration enforces it by construction. `mlp_neutral` is auto-recomputed and saved by notebook 07 after each retrain - no code changes needed.

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

