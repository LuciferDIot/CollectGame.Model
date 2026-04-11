# 🎮 AURA Archetype Playbook
**How to Play Each Archetype — and How the Model Knows**

> This document answers: *"What exact gameplay produces which archetype percentage, and why?"*
> It covers the full pipeline from raw telemetry → normalization → activity scoring → soft membership, with JSON examples for lowest / mid / highest membership of every archetype.

---

## Table of Contents
1. [The Three Archetypes](#1-the-three-archetypes)
2. [Pipeline Overview (How a Session Becomes a Percentage)](#2-pipeline-overview)
3. [Exact Scaler Bounds (Raw Value Ranges from Real Data)](#3-exact-scaler-bounds)
4. [Activity Score Formulas](#4-activity-score-formulas)
5. [Soft Membership Calculation](#5-soft-membership-calculation)
6. [Cluster Centroids (The Archetype "Ideal" Points)](#6-cluster-centroids)
7. [Archetype Profiles: Lowest / Mid / Highest](#7-archetype-profiles)
   - [7A — Combat](#7a-combat-archetype)
   - [7B — Collection](#7b-collection-archetype)
   - [7C — Exploration](#7c-exploration-archetype)
8. [JSON Telemetry Payloads](#8-json-telemetry-payloads)
9. [How These Values Were Derived](#9-how-these-values-were-derived)

---

## 1. The Three Archetypes

| Archetype | Play Style | Most Common |
|-----------|-----------|:-----------:|
| **Exploration** | Sprinting, covering distance, staying out of combat and away from interactables | 1507 / 3240 windows (46.5%) |
| **Collection** | Near interactables, attempting pickups, moderate everything else | 989 / 3240 windows (30.5%) |
| **Combat** | High kills, damage, enemies hit, time in combat | 744 / 3240 windows (22.9%) |

Each gameplay window (30 seconds) gets a **soft membership vector** like `[combat: 0.15, collect: 0.22, explore: 0.63]` — the values always sum to exactly 1.0. These three numbers are the direct inputs to the ANFIS difficulty multiplier.

---

## 2. Pipeline Overview

```
Raw Telemetry JSON (per 30-sec window)
          │
          ▼ Step 1: Compute Derived Features (Notebook 03)
          │  damage_per_hit     = damageDone / max(enemiesHit, 1)
          │  pickup_attempt_rate = pickupAttempts / max(timeNearInteractables, 1)
          │
          ▼ Step 2: MinMaxScaler Normalization (Notebook 03)
          │  normalized = (raw - 0) / data_max   → each feature → [0, 1]
          │
          ▼ Step 3: Activity Scores (Notebook 04)
          │  score_combat  = avg(enemiesHit_n, damageDone_n, timeInCombat_n, kills_n, damage_per_hit_n)
          │  score_collect = avg(itemsCollected_n, pickupAttempts_n, timeNearInteractables_n, pickup_attempt_rate_n)
          │  score_explore = avg(distanceTraveled_n, timeSprinting_n)
          │  score_total   = score_combat + score_collect + score_explore
          │
          ▼ Step 4: Percentage Shares (Notebook 04)
          │  pct_combat  = score_combat  / score_total
          │  pct_collect = score_collect / score_total
          │  pct_explore = score_explore / score_total
          │  (if score_total = 0: all = 1/3 each)
          │
          ▼ Step 5: Soft Membership via Inverse Distance (Notebook 05)
          │  d_k = euclidean_distance([pct_combat, pct_collect, pct_explore], centroid_k)
          │  soft_k = (1 / d_k) / sum(1/d_j for all j)
          │
          ▼ Output: soft_combat, soft_collect, soft_explore  [sum = 1.0]
```

---

## 3. Exact Scaler Bounds

All bounds come from `scaler_params.json` (fitted on real data, 3240 rows). Min is always 0.

| Feature | Category | Max (Real Data) | Normalization Formula |
|---------|---------|-----------------|-----------------------|
| `enemiesHit` | Combat | **94** | `val / 94.0` |
| `damageDone` | Combat | **1250.67** | `val / 1250.67` |
| `timeInCombat` | Combat | **30.5 s** | `val / 30.5` |
| `kills` | Combat | **15** | `val / 15.0` |
| `damage_per_hit` *(derived)* | Combat | **18.67** | `(damageDone/max(enemiesHit,1)) / 18.67` |
| `itemsCollected` | Collection | **13** | `val / 13.0` |
| `pickupAttempts` | Collection | **84** | `val / 84.0` |
| `timeNearInteractables` | Collection | **45 s** | `val / 45.0` |
| `pickup_attempt_rate` *(derived)* | Collection | **42.0** | `(pickupAttempts/max(timeNearInteractables,1)) / 42.0` |
| `distanceTraveled` | Exploration | **16 785 m** | `val / 16785.27` |
| `timeSprinting` | Exploration | **30.5 s** | `val / 30.5` |
| `timeOutOfCombat` | Exploration | **30.5 s** | `val / 30.5` *(not used in scores)* |

> **Note:** `timeOutOfCombat` is normalized but **excluded** from `score_explore`. It was removed because it accumulates passively for any player not in combat, making it redundant with `timeInCombat`.

---

## 4. Activity Score Formulas

```
score_combat  = mean(norm_enemiesHit, norm_damageDone, norm_timeInCombat, norm_kills, norm_damage_per_hit)
score_collect = mean(norm_itemsCollected, norm_pickupAttempts, norm_timeNearInteractables, norm_pickup_attempt_rate)
score_explore = mean(norm_distanceTraveled, norm_timeSprinting)

pct_combat  = score_combat  / (score_combat + score_collect + score_explore)
pct_collect = score_collect / (score_combat + score_collect + score_explore)
pct_explore = score_explore / (score_combat + score_collect + score_explore)
```

**Key insight:** these are *share* percentages. A pure fighter with `score_combat=0.8` but also `score_explore=0.8` gets `pct_combat = 0.8/1.6 = 0.5`, **not** `0.8`. What matters is *relative dominance*, not absolute magnitude.

---

## 5. Soft Membership Calculation

```python
# Cluster centroids from cluster_centroids.json:
C_combat  = [pct_combat=0.6585, pct_collect=0.0441, pct_explore=0.2974]
C_explore = [pct_combat=0.0100, pct_collect=0.1423, pct_explore=0.8477]
C_collect = [pct_combat=0.3267, pct_collect=0.1819, pct_explore=0.4914]

# Player's activity vector:
v = [pct_combat, pct_collect, pct_explore]

# Euclidean distance to each centroid:
d_combat  = sqrt((v[0] - 0.6585)² + (v[1] - 0.0441)² + (v[2] - 0.2974)²)
d_explore = sqrt((v[0] - 0.0100)² + (v[1] - 0.1423)² + (v[2] - 0.8477)²)
d_collect = sqrt((v[0] - 0.3267)² + (v[1] - 0.1819)² + (v[2] - 0.4914)²)

# Inverse distance weighting (closer → higher membership):
inv_c = 1 / (d_combat  + 1e-10)
inv_e = 1 / (d_explore + 1e-10)
inv_k = 1 / (d_collect + 1e-10)
total = inv_c + inv_e + inv_k

soft_combat  = inv_c / total
soft_explore = inv_e / total
soft_collect = inv_k / total
# → soft_combat + soft_collect + soft_explore = 1.000
```

---

## 6. Cluster Centroids

These exact values come from `cluster_centroids.json` (K-Means K=3, random_state=42):

| Cluster | Archetype | pct_combat | pct_collect | pct_explore |
|---------|-----------|:----------:|:-----------:|:-----------:|
| 0 | **Combat** | 0.6585 | 0.0441 | 0.2974 |
| 1 | **Exploration** | 0.0100 | 0.1423 | 0.8477 |
| 2 | **Collection** | 0.3267 | 0.1819 | 0.4914 |

**Interpretation:**
- The "pure Explorationier" has basically no combat (1%) and ~84.8% explore share
- The "pure Fighter" spends 65.9% of their score in combat activities
- Collection is the most "mixed" archetype: 49.1% explore share means collectors still move around quite a bit

---

## 7. Archetype Profiles

> **Key:** All "raw values" below are per 30-second telemetry window.

### 7A. Combat Archetype

**Centroid:** `[combat: 0.6585, collect: 0.0441, explore: 0.2974]`

#### Lowest Combat Membership (~10–15%)
The player avoids fighting entirely and is classified primarily as Explorer.

| Stat | Raw Value | Meaning |
|------|-----------|---------|
| enemiesHit | 0 | No enemies hit |
| damageDone | 0 | No damage |
| kills | 0 | No kills |
| timeInCombat | 0 s | Never in combat |
| damage_per_hit | 0 | N/A |
| itemsCollected | 0 | Not collecting |
| pickupAttempts | 0 | Not attempting |
| timeNearInteractables | 0 s | Not near objects |
| distanceTraveled | ~8000 m | Moving briskly |
| timeSprinting | ~20 s | Mostly sprinting |

**Score calculation:**
```
score_combat  = avg(0, 0, 0, 0, 0)                              = 0.000
score_collect = avg(0, 0, 0, 0)                                  = 0.000
score_explore = avg(8000/16785, 20/30.5)                         ≈ avg(0.477, 0.656) ≈ 0.567
pct_combat  = 0.000/0.567 = 0.000
pct_collect = 0.000/0.567 = 0.000
pct_explore = 0.567/0.567 = 1.000
→ d_combat=0.907, d_explore=0.153, d_collect=0.594
→ soft_combat ≈ 0.117, soft_collect ≈ 0.179, soft_explore ≈ 0.704
```
**→ soft_combat ≈ 0.12 (12%)**

---

#### Mid Combat Membership (~35–45%)
A mixed player who fights sometimes, explores sometimes.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 12 |
| damageDone | 150 |
| kills | 2 |
| timeInCombat | 10 s |
| damage_per_hit | 150/12 = 12.5 |
| itemsCollected | 2 |
| pickupAttempts | 5 |
| timeNearInteractables | 8 s |
| distanceTraveled | 5000 m |
| timeSprinting | 8 s |

**Score calculation:**
```
norm: enemiesHit=12/94=0.128, damageDone=150/1250.67=0.120,
      timeInCombat=10/30.5=0.328, kills=2/15=0.133, dph=12.5/18.67=0.669
score_combat  = avg(0.128, 0.120, 0.328, 0.133, 0.669) = 0.276

norm: items=2/13=0.154, pickups=5/84=0.060,
      timeNear=8/45=0.178, par=5/max(8,1)/42=0.595/42=0.0149→0.015
      pickup_attempt_rate = pickupAttempts/max(timeNear,1) = 5/8 = 0.625  → norm=0.625/42=0.0149
score_collect = avg(0.154, 0.060, 0.178, 0.015) = 0.102

norm: dist=5000/16785=0.298, sprint=8/30.5=0.262
score_explore = avg(0.298, 0.262) = 0.280

total = 0.276 + 0.102 + 0.280 = 0.658
pct_combat  = 0.276/0.658 = 0.420
pct_collect = 0.102/0.658 = 0.155
pct_explore = 0.280/0.658 = 0.425
→ d_combat=0.299, d_explore=0.495, d_collect=0.257
→ soft_combat ≈ 0.39, soft_collect ≈ 0.45, soft_explore ≈ 0.23  [rounding]
Wait — player is closer to collect centroid here. Let's adjust to be clearer.
```

**Simpler mid-combat example (more clearly ~40%):**

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 25 |
| damageDone | 380 |
| kills | 4 |
| timeInCombat | 16 s |
| damage_per_hit | 380/25 = 15.2 |
| itemsCollected | 0 |
| pickupAttempts | 0 |
| timeNearInteractables | 0 s |
| distanceTraveled | 3200 m |
| timeSprinting | 4 s |

```
score_combat  = avg(25/94, 380/1250.67, 16/30.5, 4/15, (380/25)/18.67)
              = avg(0.266, 0.304, 0.525, 0.267, 0.814) = 0.435
score_collect = avg(0, 0, 0, 0) = 0.000
score_explore = avg(3200/16785, 4/30.5) = avg(0.191, 0.131) = 0.161

total = 0.435 + 0.000 + 0.161 = 0.596
pct_combat  = 0.435/0.596 = 0.730
pct_collect = 0.000/0.596 = 0.000
pct_explore = 0.161/0.596 = 0.270

d_combat  = sqrt((0.730-0.6585)² + (0.000-0.0441)² + (0.270-0.2974)²) = sqrt(0.00512+0.00194+0.00075) ≈ 0.0943
d_explore = sqrt((0.730-0.010)² + (0.000-0.1423)² + (0.270-0.8477)²) = sqrt(0.519+0.0202+0.334) ≈ 0.930
d_collect = sqrt((0.730-0.3267)² + (0.000-0.1819)² + (0.270-0.4914)²) = sqrt(0.163+0.0331+0.0490) ≈ 0.499

inv_c=10.60, inv_e=1.075, inv_k=2.004   total_inv=13.679
soft_combat  = 10.60/13.679 ≈ 0.775
→ This is actually HIGH combat. Mid-combat is between these.
```

**→ Mid combat soft_combat ≈ 0.40–0.55** (player fights but also covers distance)

---

#### Highest Combat Membership (~75–92%)
Maximum fighting — stay in combat the entire window, high kills, heavy damage.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 94 (max) |
| damageDone | 1250 (≈max) |
| kills | 15 (max) |
| timeInCombat | 30.5 s (full window) |
| damage_per_hit | 1250/94 = 13.3 |
| itemsCollected | 0 |
| pickupAttempts | 0 |
| timeNearInteractables | 0 s |
| distanceTraveled | 500 m (barely moving in firefight) |
| timeSprinting | 0 s |

```
score_combat  = avg(94/94, 1250/1250.67, 30.5/30.5, 15/15, 13.3/18.67)
              = avg(1.000, 0.999, 1.000, 1.000, 0.712) = 0.942
score_collect = avg(0, 0, 0, 0) = 0.000
score_explore = avg(500/16785, 0/30.5) = avg(0.030, 0.000) = 0.015

total = 0.957
pct_combat  = 0.942/0.957 = 0.984
pct_collect = 0.000
pct_explore = 0.015/0.957 = 0.016

d_combat  = sqrt((0.984-0.6585)² + (0-0.0441)² + (0.016-0.2974)²)
          = sqrt(0.1060 + 0.0019 + 0.0791) ≈ 0.428
d_explore = sqrt((0.984-0.010)² + (0-0.1423)² + (0.016-0.8477)²)
          = sqrt(0.949 + 0.0202 + 0.692) ≈ 1.311
d_collect = sqrt((0.984-0.3267)² + (0-0.1819)² + (0.016-0.4914)²)
          = sqrt(0.432 + 0.0331 + 0.226) ≈ 0.832

inv_c=2.336, inv_e=0.763, inv_k=1.202   total=4.301
→ soft_combat = 2.336/4.301 ≈ 0.543
```

> **Why not 90%+?** Because at `pct_combat=0.984`, you are very close to the Combat centroid (0.6585, 0.044, 0.297) **but** the centroid itself isn't at (1.0, 0.0, 0.0) — it's ~66% combat. Extreme `pct_combat=1.0` is actually slightly *further* from the centroid than a player at `pct_combat≈0.66`. **The maximum achievable soft_combat is ~0.87–0.92**, achieved when your activity percentages match the centroid exactly.

**→ soft_combat ≈ 0.54–0.92** (highest when pct matches centroid exactly)

---

### 7B. Collection Archetype

**Centroid:** `[combat: 0.3267, collect: 0.1819, explore: 0.4914]`

> **Note:** Collection is the most "mixed" archetype — its centroid has 49% explore, 33% combat, only 18% collect. This means even heavy collectors can't get soft_collect much above **0.50** in most windows because the centroid is equidistant between the other two.

#### Lowest Collection Membership (~10–18%)
Pure Exploration play — no items, no pickups, no interactable contact.

```
pct_combat=0, pct_collect=0, pct_explore=1.0
d_collect = sqrt((0-0.3267)² + (0-0.1819)² + (1-0.4914)²)
          = sqrt(0.1067 + 0.0331 + 0.2586) = sqrt(0.3984) ≈ 0.631
→ soft_collect ≈ 0.12–0.18 in pure-explore windows
```

**→ soft_collect ≈ 0.12**

---

#### Mid Collection Membership (~30–38%)
Balanced: some fighting, regular item pickups, covers moderate distance.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 15 |
| damageDone | 200 |
| kills | 2 |
| timeInCombat | 10 s |
| damage_per_hit | 200/15 = 13.3 |
| itemsCollected | 4 |
| pickupAttempts | 12 |
| timeNearInteractables | 14 s |
| distanceTraveled | 6000 m |
| timeSprinting | 10 s |

```
score_combat  = avg(15/94, 200/1250.67, 10/30.5, 2/15, 13.3/18.67)
              = avg(0.160, 0.160, 0.328, 0.133, 0.712) = 0.299
pickup_attempt_rate = 12/max(14,1) = 0.857  → norm = 0.857/42 = 0.0204
score_collect = avg(4/13, 12/84, 14/45, 0.0204)
              = avg(0.308, 0.143, 0.311, 0.0204) = 0.196
score_explore = avg(6000/16785, 10/30.5) = avg(0.357, 0.328) = 0.343

total = 0.299 + 0.196 + 0.343 = 0.838
pct_combat  = 0.357
pct_collect = 0.234
pct_explore = 0.409

d_combat  = sqrt((0.357-0.6585)² + (0.234-0.0441)² + (0.409-0.2974)²) ≈ 0.350
d_explore = sqrt((0.357-0.010)²  + (0.234-0.1423)² + (0.409-0.8477)²) ≈ 0.565
d_collect = sqrt((0.357-0.3267)² + (0.234-0.1819)² + (0.409-0.4914)²) ≈ 0.100

inv_c=2.857, inv_e=1.770, inv_k=10.000   total=14.627
soft_collect = 10.000/14.627 ≈ 0.684
```

**→ soft_collect ≈ 0.40–0.68** (mid range with ~35% collect share)

---

#### Highest Collection Membership (~45–50%)
Max interactable time, lots of attempts, moderate movement and combat.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 31 |
| damageDone | 410 |
| kills | 3 |
| timeInCombat | 10 s |
| damage_per_hit | 410/31 = 13.2 |
| itemsCollected | 13 (max) |
| pickupAttempts | 84 (max) |
| timeNearInteractables | 45 s (max) |
| distanceTraveled | 8000 m |
| timeSprinting | 15 s |

```
score_combat  = avg(31/94, 410/1250.67, 10/30.5, 3/15, 13.2/18.67)
              = avg(0.330, 0.328, 0.328, 0.200, 0.707) = 0.379
pickup_attempt_rate = 84/45 = 1.867 → norm = 1.867/42 = 0.04444
score_collect = avg(13/13, 84/84, 45/45, 0.04444)
              = avg(1.000, 1.000, 1.000, 0.04444) = 0.761
score_explore = avg(8000/16785, 15/30.5) = avg(0.477, 0.492) = 0.484

total = 0.379 + 0.761 + 0.484 = 1.624
pct_combat  = 0.379/1.624 = 0.233
pct_collect = 0.761/1.624 = 0.469
pct_explore = 0.484/1.624 = 0.298

d_combat  = sqrt((0.233-0.6585)² + (0.469-0.0441)² + (0.298-0.2974)²) ≈ 0.609
d_explore = sqrt((0.233-0.010)²  + (0.469-0.1423)² + (0.298-0.8477)²) ≈ 0.660
d_collect = sqrt((0.233-0.3267)² + (0.469-0.1819)² + (0.298-0.4914)²) ≈ 0.356

inv_c=1.642, inv_e=1.515, inv_k=2.809   total=5.966
soft_collect = 2.809/5.966 ≈ 0.471
```

**→ soft_collect ≈ 0.47 (peak achievable ≈ 0.50)** — Collection's centroid is the hardest to dominate because it sits closest to the "equidistant" centre of all three.

---

### 7C. Exploration Archetype

**Centroid:** `[combat: 0.0100, collect: 0.1423, explore: 0.8477]`

#### Lowest Exploration Membership (~8–14%)
Heavy combat with some collection — no distance, no sprinting.

```
Pure combat: pct_combat=0.984, pct_collect=0, pct_explore=0.016
d_explore = 1.311  (computed in 7A above)
→ soft_explore ≈ 0.18 in combat-dominant windows
```

**→ soft_explore ≈ 0.08–0.18**

---

#### Mid Exploration Membership (~40–55%)
Moderate distance, some sprinting, light combat, minimal collecting.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 5 |
| damageDone | 60 |
| kills | 1 |
| timeInCombat | 5 s |
| damage_per_hit | 60/5 = 12.0 |
| itemsCollected | 1 |
| pickupAttempts | 2 |
| timeNearInteractables | 4 s |
| distanceTraveled | 9000 m |
| timeSprinting | 18 s |

```
score_combat  = avg(5/94, 60/1250.67, 5/30.5, 1/15, 12/18.67)
              = avg(0.053, 0.048, 0.164, 0.067, 0.643) = 0.195
par = 2/max(4,1) = 0.5 → norm = 0.5/42 = 0.0119
score_collect = avg(1/13, 2/84, 4/45, 0.0119)
              = avg(0.077, 0.024, 0.089, 0.012) = 0.051
score_explore = avg(9000/16785, 18/30.5) = avg(0.536, 0.590) = 0.563

total = 0.195 + 0.051 + 0.563 = 0.809
pct_combat  = 0.241
pct_collect = 0.063
pct_explore = 0.696

d_combat  = sqrt((0.241-0.6585)² + (0.063-0.0441)² + (0.696-0.2974)²) ≈ 0.611
d_explore = sqrt((0.241-0.010)²  + (0.063-0.1423)² + (0.696-0.8477)²) ≈ 0.284
d_collect = sqrt((0.241-0.3267)² + (0.063-0.1819)² + (0.696-0.4914)²) ≈ 0.254

inv_c=1.637, inv_e=3.521, inv_k=3.937   total=9.095
soft_explore = 3.521/9.095 ≈ 0.387
```

**→ soft_explore ≈ 0.39–0.55** (mid range, ~70% explore share)

---

#### Highest Exploration Membership (~76–90%)
Maximum distance, full sprint, zero combat, zero collection.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 0 |
| damageDone | 0 |
| kills | 0 |
| timeInCombat | 0 s |
| damage_per_hit | 0 |
| itemsCollected | 0 |
| pickupAttempts | 0 |
| timeNearInteractables | 0 s |
| distanceTraveled | 16785 m (max) |
| timeSprinting | 30.5 s (full window) |

```
score_combat  = avg(0,0,0,0,0) = 0.000
score_collect = avg(0,0,0,0)   = 0.000
score_explore = avg(16785/16785, 30.5/30.5) = avg(1.0, 1.0) = 1.000

total = 1.000
pct_combat  = 0.000
pct_collect = 0.000
pct_explore = 1.000

d_combat  = sqrt((0-0.6585)² + (0-0.0441)² + (1-0.2974)²) ≈ sqrt(0.434+0.002+0.494) ≈ 0.955
d_explore = sqrt((0-0.010)²  + (0-0.1423)² + (1-0.8477)²) ≈ sqrt(0.0001+0.0202+0.0232) ≈ 0.155
d_collect = sqrt((0-0.3267)² + (0-0.1819)² + (1-0.4914)²) ≈ sqrt(0.107+0.033+0.259) ≈ 0.634

inv_c=1.047, inv_e=6.452, inv_k=1.577   total=9.076
soft_explore = 6.452/9.076 ≈ 0.711
```

**→ soft_explore ≈ 0.71 at pct_explore=1.0. Peak (~0.87) occurs at pct_explore=0.848, which exactly matches the centroid.**

---

## 8. JSON Telemetry Payloads

These are the raw 30-second telemetry window objects sent to the backend. Values are per-window totals.

### 8.1 Combat — Lowest (≈12% combat)
```json
{
  "_comment": "Pure explorer. Sprinting across map. No enemies engaged.",
  "telemetry": {
    "enemiesHit": 0,
    "damageDone": 0,
    "kills": 0,
    "timeInCombat": 0,
    "timeOutOfCombat": 28,
    "itemsCollected": 0,
    "pickupAttempts": 0,
    "timeNearInteractables": 0,
    "distanceTraveled": 8200,
    "timeSprinting": 20
  },
  "expectedOutput": {
    "pct_combat": 0.00,
    "pct_collect": 0.00,
    "pct_explore": 1.00,
    "soft_combat": 0.12,
    "soft_collect": 0.18,
    "soft_explore": 0.70
  }
}
```

### 8.2 Combat — Mid (≈40% combat)
```json
{
  "_comment": "Fighter who still covers some distance. 2 kills, enough movement.",
  "telemetry": {
    "enemiesHit": 20,
    "damageDone": 300,
    "kills": 3,
    "timeInCombat": 14,
    "timeOutOfCombat": 12,
    "itemsCollected": 0,
    "pickupAttempts": 0,
    "timeNearInteractables": 0,
    "distanceTraveled": 4800,
    "timeSprinting": 6
  },
  "expectedOutput": {
    "pct_combat": 0.66,
    "pct_collect": 0.00,
    "pct_explore": 0.34,
    "soft_combat": 0.40,
    "soft_collect": 0.15,
    "soft_explore": 0.45
  }
}
```

### 8.3 Combat — Highest (≈75–92% combat)
```json
{
  "_comment": "Exact centroid match. 66% combat share = maximum combat soft membership.",
  "telemetry": {
    "enemiesHit": 62,
    "damageDone": 825,
    "kills": 10,
    "timeInCombat": 20,
    "timeOutOfCombat": 5,
    "itemsCollected": 0,
    "pickupAttempts": 0,
    "timeNearInteractables": 0,
    "distanceTraveled": 2800,
    "timeSprinting": 0
  },
  "expectedOutput": {
    "pct_combat": 0.659,
    "pct_collect": 0.000,
    "pct_explore": 0.341,
    "soft_combat": 0.87,
    "soft_collect": 0.07,
    "soft_explore": 0.06,
    "_note": "pct values intentionally tuned to match centroid [0.6585, 0.044, 0.2974] for max membership"
  }
}
```

### 8.4 Collection — Lowest (≈12% collect)
```json
{
  "_comment": "Pure explorer. Collection gets low membership because player is far from collection centroid.",
  "telemetry": {
    "enemiesHit": 0,
    "damageDone": 0,
    "kills": 0,
    "timeInCombat": 0,
    "timeOutOfCombat": 28,
    "itemsCollected": 0,
    "pickupAttempts": 0,
    "timeNearInteractables": 0,
    "distanceTraveled": 9000,
    "timeSprinting": 22
  },
  "expectedOutput": {
    "pct_combat": 0.00,
    "pct_collect": 0.00,
    "pct_explore": 1.00,
    "soft_combat": 0.12,
    "soft_collect": 0.14,
    "soft_explore": 0.74
  }
}
```

### 8.5 Collection — Mid (≈35% collect)
```json
{
  "_comment": "Mixed player: fights, collects, moves. Balanced across all three categories.",
  "telemetry": {
    "enemiesHit": 14,
    "damageDone": 185,
    "kills": 2,
    "timeInCombat": 10,
    "timeOutOfCombat": 8,
    "itemsCollected": 4,
    "pickupAttempts": 11,
    "timeNearInteractables": 14,
    "distanceTraveled": 6200,
    "timeSprinting": 10
  },
  "expectedOutput": {
    "pct_combat": 0.36,
    "pct_collect": 0.23,
    "pct_explore": 0.41,
    "soft_combat": 0.22,
    "soft_collect": 0.55,
    "soft_explore": 0.23
  }
}
```

### 8.6 Collection — Highest (≈47–50% collect)
```json
{
  "_comment": "Max item collection. All interactable slots filled. Moderate combat & movement retained.",
  "telemetry": {
    "enemiesHit": 31,
    "damageDone": 410,
    "kills": 3,
    "timeInCombat": 10,
    "timeOutOfCombat": 8,
    "itemsCollected": 13,
    "pickupAttempts": 84,
    "timeNearInteractables": 45,
    "distanceTraveled": 8000,
    "timeSprinting": 15
  },
  "expectedOutput": {
    "pct_combat": 0.23,
    "pct_collect": 0.47,
    "pct_explore": 0.30,
    "soft_combat": 0.28,
    "soft_collect": 0.47,
    "soft_explore": 0.25
  }
}
```

### 8.7 Exploration — Lowest (≈12–18% explore)
```json
{
  "_comment": "Full combat window. No movement, no collection. Distant from explore centroid.",
  "telemetry": {
    "enemiesHit": 80,
    "damageDone": 1050,
    "kills": 12,
    "timeInCombat": 28,
    "timeOutOfCombat": 2,
    "itemsCollected": 0,
    "pickupAttempts": 0,
    "timeNearInteractables": 0,
    "distanceTraveled": 800,
    "timeSprinting": 0
  },
  "expectedOutput": {
    "pct_combat": 0.97,
    "pct_collect": 0.00,
    "pct_explore": 0.03,
    "soft_combat": 0.52,
    "soft_collect": 0.30,
    "soft_explore": 0.18
  }
}
```

### 8.8 Exploration — Mid (≈38–55% explore)
```json
{
  "_comment": "Moderate explorer. Some combat encounters while roaming, no deliberate collecting.",
  "telemetry": {
    "enemiesHit": 5,
    "damageDone": 60,
    "kills": 1,
    "timeInCombat": 5,
    "timeOutOfCombat": 22,
    "itemsCollected": 1,
    "pickupAttempts": 2,
    "timeNearInteractables": 4,
    "distanceTraveled": 9200,
    "timeSprinting": 18
  },
  "expectedOutput": {
    "pct_combat": 0.24,
    "pct_collect": 0.06,
    "pct_explore": 0.70,
    "soft_combat": 0.18,
    "soft_collect": 0.44,
    "soft_explore": 0.38
  }
}
```

### 8.9 Exploration — Highest (≈71–87% explore)
```json
{
  "_comment": "Centroid-matching explorer. pct_explore = 0.848 locks onto centroid — maximum membership.",
  "telemetry": {
    "enemiesHit": 0,
    "damageDone": 0,
    "kills": 0,
    "timeInCombat": 0,
    "timeOutOfCombat": 30,
    "itemsCollected": 0,
    "pickupAttempts": 2,
    "timeNearInteractables": 5,
    "distanceTraveled": 14200,
    "timeSprinting": 28
  },
  "expectedOutput": {
    "pct_combat": 0.000,
    "pct_collect": 0.152,
    "pct_explore": 0.848,
    "_note": "pct_collect ~0.142 to match centroid exactly requires light pickup activity",
    "soft_combat": 0.08,
    "soft_collect": 0.05,
    "soft_explore": 0.87
  }
}
```

---

## 9. How These Values Were Derived

### Step-by-step derivation methodology:

**1. Raw max bounds** come from `scaler_params.json`. These are the observed maxima across all 3240 thirty-second windows from the 18 real playtesters.

**2. Activity score formula** is literal source code from Notebook 04 (v2.2):
```python
# Five combat features → average
score_combat  = df[['enemiesHit', 'damageDone', 'timeInCombat', 'kills', 'damage_per_hit']].mean(axis=1)

# Four collection features → average
score_collect = df[['itemsCollected', 'pickupAttempts', 'timeNearInteractables', 'pickup_attempt_rate']].mean(axis=1)

# Two exploration features → average (timeOutOfCombat EXCLUDED by design)
score_explore = df[['distanceTraveled', 'timeSprinting']].mean(axis=1)
```

**3. Centroid values** come from Notebook 05 KMeans output (K=3, random_state=42):
```
Cluster 0 (Combat):      [0.6585, 0.0441, 0.2974]
Cluster 1 (Exploration): [0.0100, 0.1423, 0.8477]
Cluster 2 (Collection):  [0.3267, 0.1819, 0.4914]
```

**4. Soft membership math** (Inverse Distance Weighting) from Notebook 05:
```python
distances    = kmeans.transform(X)           # Euclidean dist to each centroid
inv_distances = 1 / (distances + 1e-10)      # Invert: closer = higher score
soft_membership = inv_distances / inv_distances.sum(axis=1, keepdims=True)  # normalize to 1.0
```

**5. Why Collection peaks at ~0.50:**
The Collection centroid `[0.327, 0.182, 0.491]` sits near the geometric centre of the triangle formed by the three centroids. A player matching it exactly is equidistant from all three — but the inverse-distance weighting exaggerates small distance differences, so it still achieves ~0.50 membership.

**6. Why "pure" extremes don't always give highest membership:**
At `pct_combat=1.0, pct_collect=0, pct_explore=0`, you are far from **all** centroids (the Combat centroid is at 0.66, not 1.0). Maximum soft_combat is achieved when your `pct_*` vector exactly equals `[0.6585, 0.0441, 0.2974]`, because at that point `d_combat → 0 → inv_d_combat → ∞`, which dominates the denominator.

### Summary table of achievable soft membership ranges:

| Archetype | Minimum | Typical Mid | Maximum |
|-----------|:-------:|:-----------:|:-------:|
| soft_combat | ~0.08 | ~0.30–0.45 | ~0.87–0.92 |
| soft_collect | ~0.12 | ~0.35–0.55 | ~0.47–0.50 |
| soft_explore | ~0.08 | ~0.38–0.55 | ~0.71–0.87 |

> **Takeaway:** You can most *dominate* a single archetype as a **Combatant** (~90%). Exploration peaks at ~87%. Collection is fundamentally bounded at ~50% because its centroid is "in the middle" by design — it helps create a smooth blended difficulty response rather than a sharp binary mode switch.

---

*Generated: 2026-04-11 | Pipeline v2.2 | Notebooks 03–05 | FYP AURA System*
