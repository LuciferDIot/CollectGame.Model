# Known Limitations and Future Work

> **Scope**: This document catalogs structural limitations of the ANFIS Adaptive Difficulty System (v2.1) that cannot be resolved within the current telemetry schema or dataset, and proposes concrete future improvements for each. Intended for inclusion in the Limitations and Future Work chapter of the thesis.

---

## 1. Weapon-Type Variability in Combat Features

### 1.1 Problem Description

The current telemetry schema records raw combat output - `damageDone`, `enemiesHit`, `timeInCombat`, and `kills` - without any information about the weapon used to achieve those outputs. This creates a fundamental ambiguity: the same numerical feature values can represent entirely different play styles depending on the weapon type equipped.

**Example: Two combat-intent players in the same 30-second window**

| Player | Weapon Type | `enemiesHit` | `damageDone` | `timeInCombat` | `kills` |
|--------|-------------|-------------|-------------|---------------|---------|
| A (Sniper) | Heavy / Long-range | 3 | 900 | 8s | 2 |
| B (SMG) | Light / Rapid-fire | 34 | 340 | 22s | 2 |

Both players are actively engaging enemies and both score 2 kills. However:
- Player A: low `enemiesHit`, very high `damageDone`, short `timeInCombat` (sniper shoots and repositions)
- Player B: high `enemiesHit`, moderate `damageDone`, long `timeInCombat` (SMG sprays and sustains)

After MinMax normalization using the same scaler (fitted on a mixed population), Player A's low `enemiesHit` pulls down their Combat activity score, and Player B's low `damageDone` pulls down theirs. Both may be assigned a **lower Combat score than their actual intent warrants**, potentially drifting toward Exploration or Collection archetypes.

### 1.2 Root Cause

The root cause is a **composite feature problem**: each raw combat metric conflates two independent quantities:

```
damageDone    = weapon_base_damage × hits_landed
enemiesHit    = fire_rate × accuracy × timeInCombat
timeInCombat  = engagement_style (sniper: short, melee/SMG: long)
```

Because the scaler is fitted across all weapon types simultaneously, the normalization range `[min, max]` is dominated by the player distribution of the most common weapon class. A heavy-weapon player's raw values may always normalize to the middle of the range, never reaching the high end - not because they are less combat-active, but because their weapon class inherently produces fewer but more powerful hits.

### 1.3 Impact on Archetype Classification

**Scenario: Sniper-class player**
- `damageDone` is high (1-shot or 2-shot kills) → normalized well
- `enemiesHit` is low (3–5 hits per window vs. 30–50 for SMG) → normalized poorly
- `timeInCombat` is short (sniper engages, kills, disengages quickly)
- **Result**: Combat activity score underestimates true combat intent

**Scenario: Melee-class player**
- `damageDone` is moderate per hit but sustained
- `enemiesHit` is high (many small hits)
- `timeInCombat` is very high
- **Result**: Combat activity score may be well-represented, but so is `timeNearInteractables` if enemies cluster near collectibles - cross-archetype contamination

**Scenario: Area-of-effect (AOE) weapon player**
- `damageDone` is very high (splash damage counted against multiple enemies)
- `enemiesHit` is high (all enemies in splash radius)
- **Result**: These players may appear as extreme outliers during normalization, compressing the range for all other players

### 1.4 Why This Cannot Be Fixed Within the Current Dataset

The current 10-feature telemetry schema (`enemiesHit`, `damageDone`, `timeInCombat`, `kills`, `itemsCollected`, `pickupAttempts`, `timeNearInteractables`, `distanceTraveled`, `timeSprinting`, `timeOutOfCombat`) does not include any weapon identifier or weapon-class label. The dataset used for training was collected without this dimension, and there is no post-hoc way to recover weapon type from the aggregate 30-second window statistics.

Adding a derived ratio `damagePerHit = damageDone / max(enemiesHit, 1)` is possible within the current schema, but this ratio is ambiguous - it cannot distinguish between a skilled sniper (high damage, few hits by design) and a player who struggled to land hits (low accuracy, few hits unintentionally). The ratio is only meaningful when paired with a weapon class label.

### 1.5 Proposed Future Improvement

**Short-term (no new infrastructure)**:
- Add `damagePerHit` as a derived feature: `damageDone / max(enemiesHit, 1)`
- This provides a proxy signal for weapon class and can help separate sniper-type from SMG-type players in feature space
- Limitation: still ambiguous between high-damage and low-accuracy players

**Medium-term (telemetry schema extension)**:
- Collect `weaponClass` as a categorical label per session window: `Heavy`, `Light`, `Melee`, `Ranged`
- Normalize combat features separately within each `weaponClass` stratum
- Train separate scalers per weapon class, or use `weaponClass` as a conditioning input to the MLP

**Long-term (architectural)**:
- Add `weaponClass` as a fourth input dimension to the activity scoring step
- Allow the K-Means clustering to operate in a higher-dimensional space that includes weapon class context
- Alternatively, train weapon-class-specific archetypes: e.g., "Sniper-Combat", "Brawler-Combat" as sub-archetypes within the Combat cluster

### 1.6 Thesis Significance

This limitation highlights an important general principle in behavioral telemetry:

> **Raw output metrics are insufficient proxies for behavioral intent when the underlying mechanism (weapon class) varies systematically across players.**

The v2.1 revision addressed a similar structural ambiguity (`timeOutOfCombat` as a passive accumulator), but weapon-type variability is a deeper problem because it affects the primary combat features rather than a peripheral one. The thesis can use this limitation to motivate future work on:
1. Telemetry schema design for game AI systems
2. Multi-context normalization strategies
3. The limits of unsupervised archetype discovery from aggregated raw features

---

## 2. `timeSprinting` as an Ambiguous Signal

### 2.1 Problem Description

`timeSprinting` is included in the Exploration activity score (`avg(distanceTraveled, timeSprinting)`) because movement is a primary indicator of exploration behavior. However, sprinting is not exclusive to explorers - combat-intent players also sprint to close distance on enemies, flank targets, or reposition after an engagement.

### 2.2 Impact

- Aggressive Combat players who sprint frequently between engagements may receive elevated Exploration scores
- This inflates the Exploration archetype cluster and can cause Combat players to drift toward mixed Explore/Combat classifications
- The effect is correlated with map size: large maps amplify this issue because all players sprint more regardless of intent

### 2.3 Proposed Future Improvement

- Add `sprintContext` telemetry: whether sprint occurred within N seconds of a combat event (contextual sprint) vs. during an extended no-combat window (exploratory sprint)
- Alternatively, use `sprintingWhileInCombat` and `sprintingOutOfCombat` as separate features
- Retain `timeSprinting` only for out-of-combat windows to preserve its Exploration signal

---

## 3. `timeNearInteractables` Cross-Archetype Contamination

### 3.1 Problem Description

`timeNearInteractables` is used as a Collection signal. However, in most level layouts, collectible items and interactable objects are placed near high-traffic areas, enemy spawn zones, and objective points. Players with high `distanceTraveled` (explorers) naturally pass near many interactables, and players who pursue enemies into contested areas (combat) also spend time near objects placed at strategic locations.

### 3.2 Impact

- Explorers who cover the full map surface will encounter many interactables incidentally → inflated Collection score
- Combat players who fight near objective areas accumulate `timeNearInteractables` passively
- The Collection cluster centroid in v2.1 reflects this contamination: `pct_explore: 0.5223` (Collection cluster has 52% Exploration signal, more than the Exploration cluster itself at some data slices)

### 3.3 Proposed Future Improvement

- Replace `timeNearInteractables` with `interactableApproachEvents`: discrete events where the player intentionally moved toward an interactable (proximity decreasing), rather than simply being near one
- Add `itemPickupAttemptRate = pickupAttempts / timeNearInteractables` as a ratio to distinguish intentional collectors from incidental passers-by

---

## 4. Uniform Attack Cooldown Not Captured

### 4.1 Problem Description

Related to the weapon-type limitation (Section 1), attack cooldown is a core determinant of how many hits a player can land in a fixed time window. A weapon with a 2-second cooldown can produce at most 15 hits in a 30-second window; a weapon with 0.1-second cooldown can produce 300. The 30-second aggregation window collapses this variation entirely.

### 4.2 Impact

- A player using a slow-fire but high-damage weapon (e.g., heavy crossbow, sniper rifle) appears to have low combat engagement by `enemiesHit` count alone
- The normalization scaler's maximum for `enemiesHit` is dominated by rapid-fire weapon users, compressing the entire heavy-weapon user population toward zero after normalization
- This means heavy-weapon players may structurally never reach the Combat archetype in the current system, regardless of actual intent

### 4.3 Proposed Future Improvement

- Add `weaponFireRate` as a telemetry feature (shots fired per second or attacks per window)
- Derive `hitsPerAttack = enemiesHit / max(attacksAttempted, 1)` as an accuracy measure independent of fire rate
- Normalize `enemiesHit` by `weaponFireRate` to create a fire-rate-adjusted engagement metric

---

## 5. Session Boundary and State Reset

### 5.1 Problem Description

The system maintains per-player session state with a 40-second timeout. If a network delay, game pause, or server hiccup causes the pipeline to not receive a telemetry window for >40 seconds, the session state is reset and deltas are initialized to zero for the next window.

### 5.2 Impact

- False "first window" behavior mid-session: deltas = [0, 0, 0] falsely signals no change in player behavior
- The difficulty controller receives a neutral delta signal and may under-respond to actual behavioral shifts that just happened to span the timeout boundary
- More frequent on mobile or unstable connections

### 5.3 Proposed Future Improvement

- Persist session state to a durable store (Redis, database) rather than in-memory only
- Implement session recovery: if a window arrives within 2× the normal cadence (60s), attempt delta reconstruction from the last known state
- Log timeout events as a diagnostic metric

---

## 6. Uniform Parameter Sensitivity Across Adaptation Parameters

### 6.1 Problem Description

The adaptation module applies a uniform sensitivity coefficient of 0.3 to all difficulty parameters when scaling from the MLP output multiplier. This means a 10% increase in the target multiplier produces the same relative change in enemy health, spawn rate, and movement speed - regardless of how much each parameter actually affects perceived difficulty.

### 6.2 Impact

- Enemy health changes are disproportionately impactful compared to spawn rate changes at the same sensitivity level
- A player near the skill ceiling may need very small adjustments to enemy health but larger adjustments to spawn density
- The uniform sensitivity flattens this distinction

### 6.3 Proposed Future Improvement

- Conduct a player study to empirically measure the perceived difficulty impact of ±10% change in each parameter
- Derive parameter-specific sensitivity coefficients (e.g., health: 0.15, spawn: 0.35, speed: 0.25)
- Store these as configurable values in the adaptation registry rather than a single global constant

---

## 7. GPU Resource Constraints and PCG-Based Adaptation Validation

### 7.1 Problem Description

The ANFIS pipeline produces a **target multiplier** - a scalar in `[0.6, 1.4]` - that represents how difficulty should shift relative to a neutral baseline of 1.0. In the current implementation, this multiplier is applied as a simple scalar to individual enemy parameters:

```
enemy_health    = base_health    × target_multiplier × sensitivity
enemy_speed     = base_speed     × target_multiplier × sensitivity
enemy_damage    = base_damage    × target_multiplier × sensitivity
spawn_rate      = base_spawn     × target_multiplier × sensitivity
```

This approach works as a proof-of-concept but has a perceptual limitation: players typically cannot feel small percentage changes in enemy health or damage. A 10% increase in enemy health feels like "enemies take a few extra hits" - subtle and often imperceptible, especially in fast-paced games.

### 7.2 A Better Adaptation Target: Global Enemy Cap

A more direct and perceptible difficulty lever would be the **global enemy cap** - the maximum number of active enemies allowed in a zone or level at any time. Adjusting the enemy cap has immediate, perceivable impact:

| Target Multiplier | Action | Player Experience |
|------------------|--------|-------------------|
| 0.7 (struggling) | Cap: 10 → 7 | Fewer enemies, reduced pressure |
| 1.0 (balanced) | Cap: 10 (unchanged) | Normal gameplay |
| 1.3 (underperforming) | Cap: 10 → 13 | More enemies, increased challenge |

This maps cleanly to the ANFIS output:
```
global_enemy_cap = floor(base_cap × target_multiplier)
```

The player experience change is **qualitative** (more/fewer enemies is immediately felt) rather than **quantitative** (slightly stronger enemies may go unnoticed).

### 7.3 Why This Was Not Implemented: GPU and PCG Constraints

Implementing a global enemy cap adjustment requires a running **Procedural Content Generation (PCG)** system that can dynamically spawn and despawn enemies in real-time. PCG operations in a 3D game environment are computationally expensive:

1. **Navmesh queries**: Finding valid spawn points on the navigation mesh that are not inside geometry or blocked by other entities
2. **Spawn point selection**: Evaluating spawn point distances from the player, enemy sightlines, and fairness constraints
3. **State machine initialization**: Each newly spawned enemy requires AI state initialization (patrol path assignment, target acquisition, animation state)
4. **Culling and despawn**: Gracefully removing excess enemies when the cap decreases (e.g., forcing out-of-sight enemies to despawn without visible pop-out)

These operations, particularly navmesh queries, are GPU-accelerated in modern game engines (Unreal Engine NavMesh baking uses the GPU for large worlds). The research hardware available for this thesis had **limited GPU resources**, making continuous high-frequency PCG testing infeasible for an extended validation study.

**Consequence for the thesis**: The adaptive difficulty system was validated in an **offline/simulation mode** - the ANFIS pipeline (classification → prediction) was evaluated against synthetic and recorded telemetry. The adaptation output (target multiplier) was verified to be numerically correct and semantically aligned, but the **full real-time closed-loop test** (ANFIS → PCG → player observation → new telemetry → ANFIS) was not executed for an extended session.

### 7.4 What Was Validated vs. What Was Not

| Component | Validation Status | Notes |
|-----------|-----------------|-------|
| Telemetry normalization | Validated offline | Against recorded data |
| Activity scoring (v2.1) | Validated offline | Notebook 04 |
| K-Means clustering | Validated offline | Silhouette = 0.3752 |
| Soft membership (IDW) | Validated offline | Numerically stable |
| Temporal delta computation | Validated offline | r=0.808 for Δexplore |
| MLP inference | Validated offline | R² = 0.9391 (v2.2 rerun) |
| Scalar parameter adaptation | Validated in demo UI | Health/speed/damage multipliers |
| **Global enemy cap adaptation** | **Not implemented** | PCG infrastructure required |
| **Full real-time closed-loop** | **Not validated** | GPU resource constraint |

### 7.5 Proposed Future Implementation

With adequate GPU resources and full game engine integration:

```
1. ANFIS pipeline runs every 30s → produces target_multiplier
2. Difficulty controller computes:
     new_cap = clamp(floor(base_cap × target_multiplier), min_cap, max_cap)
3. PCG system receives new_cap:
     if current_active < new_cap: spawn additional enemies at valid navmesh points
     if current_active > new_cap: flag excess enemies for graceful despawn
4. Game continues → new telemetry captured → next ANFIS window
```

This creates a **true adaptive feedback loop** where difficulty responds to player behavior through a more natural mechanism (population density) rather than invisible stat scaling.

### 7.6 Thesis Significance

This limitation demonstrates a practical constraint of ML-based adaptive difficulty research:

> **The ML component (ANFIS pipeline) and the game engine component (PCG) require independent validation due to hardware resource separation. A complete end-to-end system test requires production-grade infrastructure beyond typical academic research constraints.**

This is consistent with the broader adaptive game AI literature, where learned difficulty controllers are commonly validated in simulation before integration testing. The thesis contribution - the ANFIS pipeline design, the Option B target formula, and the v2.1 activity scoring fix - is fully validated within the simulation scope. PCG integration remains a deployment-phase engineering task.

---

## 8. Summary Table

| # | Limitation | Affected Layer | Resolvable Without New Infrastructure? | Priority |
|---|-----------|---------------|---------------------------------------|----------|
| 1 | Weapon-type variability in combat features | Feature Engineering | Partial (ratio proxy only) | **High** |
| 2 | `timeSprinting` combat/exploration ambiguity | Feature Engineering | No (context label needed) | High |
| 3 | `timeNearInteractables` cross-contamination | Feature Engineering | Partial (ratio: `pickupAttempts/timeNear`) | High |
| 4 | Attack cooldown not captured | Feature Engineering | No (fire rate telemetry needed) | High |
| 5 | Session state reset on timeout | State Management | Yes (durable persistence) | Medium |
| 6 | Uniform adaptation sensitivity | Adaptation Registry | Yes (parameter study) | Low |
| 7 | Global enemy cap adaptation not implemented | PCG / Game Engine | No (GPU + PCG infrastructure needed) | **High** |
| 8 | Full real-time closed-loop not validated | End-to-End System | No (production GPU required) | **High** |

---

## 9. Limitations Within the Current Thesis Scope

The limitations above are documented for completeness. Within the thesis, the following boundaries apply:

1. **Weapon-type limitation is acknowledged but not resolved** - the current dataset does not include weapon type, and the thesis contribution is the ANFIS pipeline design and the v2.1 activity scoring fix, not weapon-specific modeling.

2. **`timeSprinting` and `timeNearInteractables` ambiguities are accepted** - these are structural properties of the feature set that are common in behavioral telemetry systems. The v2.1 fix addressed the most impactful and tractable one (`timeOutOfCombat`).

3. **Session timeout is acceptable** for the thesis prototype - it is a production-readiness concern beyond the research scope.

4. **Uniform sensitivity is a simplification that is explicitly noted** in the adaptation module - it is out of scope for a scoring accuracy fix.

5. **GPU resource constraints prevented full PCG integration** - the ANFIS pipeline is validated in simulation. The global enemy cap adaptation and closed-loop real-time testing are identified as future work requiring production GPU infrastructure. This is consistent with standard practice in adaptive game AI research, where the learned controller is validated separately from the game engine integration.

The thesis argues that despite these limitations, the system achieves its core objective: producing a statistically valid, generalizing model (R² = 0.9391, v2.2) that adapts difficulty based on real behavioral signals. Future work can address each limitation incrementally as telemetry infrastructure matures.

---

*Created: 2026-03-06 | Updated: 2026-03-07 | Version: v2.2 | Status: THESIS-READY*

