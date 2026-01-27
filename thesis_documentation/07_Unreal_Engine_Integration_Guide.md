# Unreal Engine Integration Guide (v2.0)

## 1. Overview
This document specifies how the ANFIS-based difficulty controller (running in Python/C++ integration) modulates the specific gameplay parameters defined in the Unreal Engine `Default` data asset.

**Core Concept**: The system outputs a single **Target Multiplier ($M$)** ranging from **0.5 (Easy)** to **1.5 (Hard)**, with **1.0** being the baseline.

## 2. Adaptation Manager Architecture
To manage these parameters dynamically without overwriting the static Data Assets, implementing an **Adaptation Manager Component** (Actor Component or Subsystem) is recommended.

**Responsibility**:
1.  Read the **Base Values** from the `Default` Data Asset at startup.
2.  Receive the updated Target Multiplier ($M$) from the ANFIS Runtime every 30 seconds.
3.  Calculate **Live Values** using the mapping logic below.
4.  Push Live Values to the respective systems (PCG Spawner, AI Controller, Player Character).

## 3. Parameter Mapping Specification

The following logic maps the adaptation multiplier ($M$) to your specific configuration fields.

### 3.1. Enemy AI & Spawning (Difficulty Scaling)
*Higher $M$ makes enemies stronger, faster, and more numerous.*

| Parameter Category | Field Name | Base Value | Adaptation Logic | Result at M=1.5 (Hard) | Result at M=0.5 (Easy) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PCG Enemy** | `Enemy Spawn Interval` | 40.0s | $\text{Base} / M$ | **26.6s** (Faster Spawns) | **80.0s** (Slower Spawns) |
| **PCG Enemy** | `Global Enemy Cap` | 35 | $\text{Base} \times M$ | **52** (More Enemies) | **17** (Fewer Enemies) |
| **PCG Enemy** | `Max Health` | 100.0 | $\text{Base} \times M$ | **150.0** (Tankier) | **50.0** (Weaker) |
| **PCG Enemy** | `Damage Intensity` | 10.0 | $\text{Base} \times M$ | **15.0** (Harder Hitter) | **5.0** (Weaker Hitter) |
| **AI Movement** | `Distance Detect` | 1800 | $\text{Base} \times M$ | **2700** (Better Vision) | **900** (Poorer Vision) |
| **AI Movement** | `MaxWalkSpeed` | 450 | $\text{Base} \times M$ | **675** (Faster Chase) | **225** (Slower Chase) |

### 3.2. Player Parameters (Challenge Scaling)
*Higher $M$ restricts player resources and capabilities.*

| Parameter Category | Field Name | Base Value | Adaptation Logic | Result at M=1.5 (Hard) | Result at M=0.5 (Easy) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Player** | `Stamina Regen` | 12.0 | $\text{Base} / M$ | **8.0** (Slow Regen) | **24.0** (Fast Regen) |
| **Player** | `Stamina Damage` (Cost) | 5.0 | $\text{Base} \times M$ | **7.5** (High Cost) | **2.5** (Low Cost) |
| **Player** | `Dash Cooldown` | 3.0s | $\text{Base} \times M$ | **4.5s** (Long Wait) | **1.5s** (Spam Dash) |
| **Player** | `Damage Intensity` (Output) | 16.0 | $\text{Base} / M$ | **10.6** (Weak Attacks) | **32.0** (Strong Attacks) |

### 3.3. Collectibles (Scarcity Scaling)
*Higher $M$ makes resources scarcer and harder to secure.*

| Parameter Category | Field Name | Base Value | Adaptation Logic | Result at M=1.5 (Hard) | Result at M=0.5 (Easy) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PCG Collectible** | `Fixed Collectible Count` | 120 | $\text{Base} / M$ | **80** (Fewer Items) | **240** (Detailed World) |
| **PCG Collectible** | `Spawn Interval` | 40.0s | $\text{Base} \times M$ | **60.0s** (Rare Spawns) | **20.0s** (Frequent Spawns) |
| **PCG Collectible** | `Lifetime` | 30.0s | $\text{Base} / M$ | **20.0s** (Vanishes Fast) | **60.0s** (Stays Long) |

## 4. Implementation Steps in Unreal

1.  **Create struct `FAdaptiveParams`**: Include all the fields listed above.
2.  **Create `UAdaptationManager`**:
    *   Variable: `CurrentMultiplier` (float, default 1.0).
    *   Variable: `BaseConfig` (Pointer to your Data Asset).
    *   Function: `UpdateDifficulty(float NewMultiplier)`.
3.  **In `UpdateDifficulty`**:
    *   Apply the math from Section 3.
    *   Broadcast an event `OnDifficultyChanged(FAdaptiveParams NewParams)`.
4.  **Subscribers**:
    *   **Enemy Spawner**: Listens to event, updates `SpawnRate`.
    *   **AI Controller**: Listens to event, updates `PerceptionComponent` range.
    *   **Player Character**: Listens to event, updates `Stamina` variables.

## 5. Smoothing Recommendation
Do **not** apply the raw Target Multiplier directly if it jumps significantly (e.g., 0.8 to 1.2).
Use `FInterpTo` in Unreal:

```cpp
// Update Loop (Tick)
CurrentMultiplier = FMath::FInterpTo(CurrentMultiplier, TargetMultiplier, DeltaTime, InterpSpeed);
// Recommended InterpSpeed: 0.5 (Gradual transition over ~2-3 seconds)
```
