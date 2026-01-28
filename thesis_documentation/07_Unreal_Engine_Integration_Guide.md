# Unreal Engine Integration Guide (v2.0 - Option B: Archetype-Aware Adaptation)

## 1. Overview
This document specifies the **Option B** implementation strategy for the ANFIS-based difficulty system. Unlike simple global scaling, this approach applies **archetype-specific pressure** based on the player's behavioral profile.

**Core Principle**: Different parameters scale according to their relevant archetype (Combat, Exploration, Collection), creating nuanced difficulty that matches the player's actual playstyle.

## 2. System Inputs (Frozen ML Outputs)

Every 30 seconds, the ML system provides exactly 4 values:

| Variable | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| `M` | float | [0.5, 1.5] | Global difficulty pressure |
| `soft_combat` | float | [0, 1] | Combat archetype proportion |
| `soft_collect` | float | [0, 1] | Collection archetype proportion |
| `soft_explore` | float | [0, 1] | Exploration archetype proportion |

**Constraint**: `soft_combat + soft_collect + soft_explore = 1.0`

## 3. Mandatory Adaptation Formula (FINAL CONTRACT)

### Core Formula

**For difficulty-increasing parameters** (enemies, resource scarcity):

```
ArchetypeModifier = clamp(0.85 + 0.30 * soft_X, 0.85, 1.15)

EffectiveValue = clamp(
    BaseValue * M * ArchetypeModifier,
    HardMin,
    HardMax
)
```

**For player-friendly parameters** (regen, damage output):

```
EffectiveValue = clamp(
    BaseValue / (M * ArchetypeModifier),
    HardMin,
    HardMax
)
```

**Notation**:
*   `A_c` = Archetype Modifier using `soft_combat`
*   `A_e` = Archetype Modifier using `soft_explore`
*   `A_l` = Archetype Modifier using `soft_collect` (loot)

### Example Calculation

For a combat-heavy player (`soft_combat = 0.8`, `M = 1.2`):
```
A_c = 0.85 + 0.30 * 0.8 = 1.09
EnemyDamage = clamp(10 * 1.2 * 1.09, 5, 18)
            = clamp(13.08, 5, 18)
            = 13.08  ✓ Within bounds
```

For an exploration-heavy player (`soft_explore = 0.7`, `M = 1.2`):
```
A_e = 0.85 + 0.30 * 0.7 = 1.06
StaminaDrain = clamp(5 * 1.2 * 1.06, 2, 10)
             = clamp(6.36, 2, 10)
             = 6.36  ✓ Within bounds
```

## 4. Hard Clamp Ranges (NON-NEGOTIABLE)

These bounds guarantee numerical stability and prevent edge-case failures.

### 4.1. Combat Parameters → `soft_combat` (A_c)

Combat-heavy players face tougher enemies. Explorers avoid combat spikes.

| Parameter | Base | Formula | Hard Clamp |
| :--- | :--- | :--- | :--- |
| **Enemy Spawn Interval** | 40s | `40 / (M * A_c)` | **[20, 80] sec** |
| **Global Enemy Cap** | 35 | `35 * M * A_c` | **[15, 60]** |
| **Enemy Damage Intensity** | 10 | `10 * M * A_c` | **[5, 18]** |
| **Enemy Max Health** | 100 | `100 * M * A_c` | **[60, 180]** |
| **AI Detect (Looking)** | 1800 | `1800 * M * A_c` | **[900, 3000]** |
| **AI Detect (After)** | 2200 | `2200 * M * A_c` | **[1200, 3500]** |
| **AI MaxWalkSpeed** | 450 | `450 * M * A_c` | **[300, 700]** |

### 4.2. Exploration Parameters → `soft_explore` (A_e)

Heavy explorers feel traversal pressure. Combat players keep mobility viable.

| Parameter | Base | Formula | Hard Clamp |
| :--- | :--- | :--- | :--- |
| **Stamina Regen** | 12 | `12 / (M * A_e)` | **[6, 24]** |
| **Stamina Damage** (Cost) | 5 | `5 * M * A_e` | **[2, 10]** |
| **Dash Cooldown** | 3s | `3 * M * A_e` | **[1.5, 5] sec** |

### 4.3. Collection Parameters → `soft_collect` (A_l)

Collectors get meaningful scarcity. Combat/exploration doesn't starve economy.

| Parameter | Base | Formula | Hard Clamp |
| :--- | :--- | :--- | :--- |
| **Fixed Collectible Count** | 120 | `120 / (M * A_l)` | **[60, 240]** |
| **Spawn Interval** | 40s | `40 * M * A_l` | **[20, 80] sec** |
| **Lifetime** | 30s | `30 / (M * A_l)` | **[15, 60] sec** |

### 4.4. Neutral Parameters (Global M Only)

These scale uniformly with M, no archetype specificity:

| Parameter | Base | Formula | Hard Clamp |
| :--- | :--- | :--- | :--- |
| **Player Damage Intensity** | 16 | `16 / M` | **[10, 32]** |
| **Player Max Health** | 180 | `180 / M` | **[120, 360]** |

## 5. UAdaptationManager Architecture

### 5.1. Component Structure

```cpp
UCLASS()
class UAdaptationManager : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    // Called by telemetry system every 30s
    UFUNCTION(BlueprintCallable)
    void UpdateMLOutputs(float NewM, float NewCombat, float NewCollect, float NewExplore);

    // Getters for live values (smoothed)
    UFUNCTION(BlueprintPure)
    float GetEnemyDamage() const { return CurrentEnemyDamage; }
    
    // ... more getters

private:
    // Base values (loaded from Data Asset)
    FAdaptiveBaseConfig BaseConfig;
    
    // Current ML outputs
    float TargetM;
    float TargetSoftCombat;
    float TargetSoftCollect;
    float TargetSoftExplore;
    
    // Smoothed live values
    float CurrentEnemyDamage;
    float CurrentEnemyHealth;
    // ... more cached values
    
    // Smoothing
    void TickSmoothing(float DeltaTime);
    float CalculateCombatModifier() const { return 0.85f + 0.30f * TargetSoftCombat; }
    float CalculateExploreModifier() const { return 0.85f + 0.30f * TargetSoftExplore; }
    float CalculateCollectModifier() const { return 0.85f + 0.30f * TargetSoftCollect; }
};
```

### 5.2. Initialization Flow

1.  **Game Start**: Load `BaseConfig` from Data Asset
2.  **First Window**: Initialize with `M=1.0`, `soft_* = 0.33`
3.  **Every 30s**: Receive new ML outputs via `UpdateMLOutputs()`
4.  **Every Tick**: Smooth current values toward targets

### 5.3. Value Application

**Enemy Spawner** (Blueprint or C++):
```cpp
void AEnemySpawner::Tick(float DeltaTime)
{
    UAdaptationManager* Mgr = GetGameInstance()->GetSubsystem<UAdaptationManager>();
    
    CurrentSpawnInterval = FMath::FInterpTo(
        CurrentSpawnInterval,
        Mgr->GetEnemySpawnInterval(),
        DeltaTime,
        0.5f  // Smoothing speed
    );
}
```

## 6. Smoothing Requirements

**Mandatory**: Use `FMath::FInterpTo` with speed `0.5` for all parameters.

**Rationale**: Prevents jarring transitions when archetypes shift (e.g., player switches from combat to exploration).

```cpp
float FMath::FInterpTo(float Current, float Target, float DeltaTime, float InterpSpeed);
```

*   `InterpSpeed = 0.5` → ~2-3 second transition
*   Applies exponential smoothing automatically

## 7. Correctness Guarantee (Telemetry → Adaptation)

This architecture ensures behavioral consistency:

**Exploration-Dominant Telemetry** (`soft_explore` high):
*   ✅ Stamina & traversal pressure increases via A_e
*   ✅ Combat remains baseline (A_c near 0.85)
*   ✅ NO enemy spam

**Combat-Heavy Telemetry** (`soft_combat` high):
*   ✅ Tougher enemies via A_c
*   ✅ Collectibles remain available (A_l near 0.85)
*   ✅ NO collectible starvation

**Collection-Focused Telemetry** (`soft_collect` high):
*   ✅ Resource scarcity & timing pressure via A_l
*   ✅ Combat stays moderate (A_c near 0.85)
*   ✅ NO combat punishment

This is **behavioral adaptation**, not percentage balancing.

## 8. Final Freeze Rules (MANDATORY)

After implementing this specification:

### ❌ Forbidden Forever

*   Math formula changes
*   New parameters or variables
*   Range tuning or bound adjustments
*   Telemetry reinterpretation
*   Archetype rebalancing
*   Feature weighting

### ✅ Allowed Later (UI/Debug Only)

*   Interpolation speed adjustment (`0.3` to `0.7` range acceptable)
*   Debug visualization overlays
*   Logging verbosity

### 🔒 Non-Negotiable Elements

1.  **Base Values** = Default Data Asset (frozen)
2.  **Archetype Modifier** = `0.85 + 0.30 * soft_X` (frozen)
3.  **Hard Clamps** = Tables in Section 4 (frozen)
4.  **Update Rate** = 30 seconds (frozen)
5.  **ML Outputs** = As-is from v2.0 (frozen)

## 9. Validation Checklist

Before deployment, verify:

*   ✅ All formulas match Section 4 exactly (with `A_c`, `A_e`, `A_l` notation)
*   ✅ Archetype modifiers calculate as `clamp(0.85 + 0.30 * soft_X, 0.85, 1.15)`
*   ✅ **Hard clamps applied** to all effective values (Section 4 ranges)
*   ✅ Inverse parameters use division (Spawn Interval, Stamina Regen, etc.)
*   ✅ Smoothing active on all live values (`FInterpTo` with speed 0.5)
*   ✅ Base values loaded from Data Asset, never hardcoded

## 10. Expected Behavior Examples

**Scenario 1: Combat-Heavy Player** (`soft_combat = 0.8`, `soft_explore = 0.1`, `soft_collect = 0.1`, `M = 1.2`)

*   `A_c = 0.85 + 0.30 * 0.8 = 1.09`
*   Enemy Damage: `clamp(10 * 1.2 * 1.09, 5, 18) = 13.08` ✅ Harder hits
*   Enemy Spawn: `clamp(40 / (1.2 * 1.09), 20, 80) = 30.5s` ✅ More frequent
*   Stamina Regen: `clamp(12 / (1.2 * 0.88), 6, 24) = 11.4` ✅ Stays viable (A_e low)

**Scenario 2: Exploration-Heavy Player** (`soft_combat = 0.15`, `soft_explore = 0.7`, `soft_collect = 0.15`, `M = 1.1`)

*   `A_e = 0.85 + 0.30 * 0.7 = 1.06`
*   Stamina Drain: `clamp(5 * 1.1 * 1.06, 2, 10) = 5.83` ✅ Higher cost
*   Dash Cooldown: `clamp(3 * 1.1 * 1.06, 1.5, 5) = 3.5s` ✅ Longer wait
*   Enemy Damage: `clamp(10 * 1.1 * 0.90, 5, 18) = 9.9` ✅ Stays moderate (A_c low)

**Scenario 3: Collection-Heavy Player** (`soft_combat = 0.2`, `soft_explore = 0.2`, `soft_collect = 0.6`, `M = 1.3`)

*   `A_l = 0.85 + 0.30 * 0.6 = 1.03`
*   Item Count: `clamp(120 / (1.3 * 1.03), 60, 240) = 89.6` ✅ Scarcity
*   Item Lifetime: `clamp(30 / (1.3 * 1.03), 15, 60) = 22.4s` ✅ Fast decay
*   Enemy Health: `clamp(100 * 1.3 * 0.91, 60, 180) = 118.3` ✅ Moderate (A_c low)

This demonstrates **personalized difficulty** matching each player's behavioral profile.
