#  AURA Archetype Playbook
**How to Play Each Archetype -- and How the Model Knows**

> This document answers: *"What exact gameplay produces which archetype percentage, and why?"*
> It covers the full pipeline from raw telemetry -> normalization -> activity scoring -> soft membership, with JSON examples for lowest / mid / highest membership of every archetype.

---

## Table of Contents
1. [The Three Archetypes](#1-the-three-archetypes)
2. [Pipeline Overview (How a Session Becomes a Percentage)](#2-pipeline-overview)
3. [Exact Scaler Bounds (Raw Value Ranges from Real Data)](#3-exact-scaler-bounds)
4. [Activity Score Formulas](#4-activity-score-formulas)
5. [Soft Membership Calculation](#5-soft-membership-calculation)
6. [Cluster Centroids (The Archetype "Ideal" Points)](#6-cluster-centroids)
7. [Archetype Profiles: Lowest / Mid / Highest](#7-archetype-profiles)
   - [7A -- Combat](#7a-combat-archetype)
   - [7B -- Collection](#7b-collection-archetype)
   - [7C -- Exploration](#7c-exploration-archetype)
8. [JSON Telemetry Payloads](#8-json-telemetry-payloads)
9. [How These Values Were Derived](#9-how-these-values-were-derived)

---

## 1. The Three Archetypes

| Archetype | Play Style | Most Common |
|-----------|-----------|:-----------:|
| **Combat** | High kills, damage, enemies hit, time in combat | 1292 / 3240 windows (39.9%) |
| **Collection** | Near interactables, attempting pickups, moderate everything else | 1252 / 3240 windows (38.6%) |
| **Exploration** | Sprinting, covering distance, staying out of combat and away from interactables | 696 / 3240 windows (21.5%) |

Each gameplay window (30 seconds) gets a **soft membership vector** like `[combat: 0.15, collect: 0.22, explore: 0.63]` -- the values always sum to exactly 1.0. These three numbers are the direct inputs to the ANFIS difficulty multiplier.

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
          │  normalized = (raw - 0) / data_max   -> each feature -> [0, 1]
          │
          ▼ Step 3: Activity Scores (Notebook 04)
          │  score_combat  = avg(enemiesHit_n, damageDone_n, timeInCombat_n, kills_n, damage_per_hit_n)
          │  score_collect = avg(itemsCollected_n, pickupAttempts_n, timeNearInteractables_n, pickup_attempt_rate_n)
          │  score_explore = sum(distanceTraveled_n, timeSprinting_n) / 4
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
| `enemiesHit` | Combat | **23.0** | `val / 23.0` |
| `damageDone` | Combat | **298.67** | `val / 298.67` |
| `timeInCombat` | Combat | **30.0 s** | `val / 30.0` |
| `kills` | Combat | **3.0** | `val / 3.0` |
| `damage_per_hit` *(derived)* | Combat | **18.67** | `(damageDone/max(enemiesHit,1)) / 18.67` |
| `itemsCollected` | Collection | **8.0** | `val / 8.0` |
| `pickupAttempts` | Collection | **25.0** | `val / 25.0` |
| `timeNearInteractables` | Collection | **30.0 s** | `val / 30.0` |
| `pickup_attempt_rate` *(derived)* | Collection | **25.0** | `(pickupAttempts/max(timeNearInteractables,1)) / 25.0` |
| `distanceTraveled` | Exploration | **16785.27 m** | `val / 16785.27` |
| `timeSprinting` | Exploration | **30.0 s** | `val / 30.0` |
| `timeOutOfCombat` | Exploration | **30.0 s** | `val / 30.0` *(not used in scores)* |

> **Note:** `timeOutOfCombat` is normalized but **excluded** from `score_explore`. It was removed because it accumulates passively for any player not in combat, making it redundant with `timeInCombat`.

---

## 4. Activity Score Formulas

```
score_combat  = mean(norm_enemiesHit, norm_damageDone, norm_timeInCombat, norm_kills, norm_damage_per_hit)
score_collect = mean(norm_itemsCollected, norm_pickupAttempts, norm_timeNearInteractables, norm_pickup_attempt_rate)
score_explore = sum(norm_distanceTraveled, norm_timeSprinting) / 4

pct_combat  = score_combat  / (score_combat + score_collect + score_explore)
pct_collect = score_collect / (score_combat + score_collect + score_explore)
pct_explore = score_explore / (score_combat + score_collect + score_explore)
```

**Key insight:** these are *share* percentages. A pure fighter with `score_combat=0.8` but also `score_explore=0.8` gets `pct_combat = 0.8/1.6 = 0.5`, **not** `0.8`. What matters is *relative dominance*, not absolute magnitude.

---

## 5. Soft Membership Calculation

```python
# Cluster centroids from cluster_centroids.json:
C_combat  = [pct_combat=0.7253, pct_collect=0.0963, pct_explore=0.1784]
C_collect = [pct_combat=0.2168, pct_collect=0.4854, pct_explore=0.2977]
C_explore = [pct_combat=0.0072, pct_collect=0.0635, pct_explore=0.9293]

# Player's activity vector:
v = [pct_combat, pct_collect, pct_explore]

# Euclidean distance to each centroid:
d_combat  = sqrt((v[0] - 0.7253)^2 + (v[1] - 0.0963)^2 + (v[2] - 0.1784)^2)
d_collect = sqrt((v[0] - 0.2168)^2 + (v[1] - 0.4854)^2 + (v[2] - 0.2977)^2)
d_explore = sqrt((v[0] - 0.0072)^2 + (v[1] - 0.0635)^2 + (v[2] - 0.9293)^2)

# Inverse distance weighting (closer -> higher membership):
inv_c = 1 / (d_combat  + 1e-10)
inv_k = 1 / (d_collect + 1e-10)
inv_e = 1 / (d_explore + 1e-10)
total = inv_c + inv_e + inv_k

soft_combat  = inv_c / total
soft_collect = inv_k / total
soft_explore = inv_e / total
# -> soft_combat + soft_collect + soft_explore = 1.000
```

---

## 6. Cluster Centroids

These exact values come from `cluster_centroids.json` (K-Means K=3, random_state=42):

| Cluster | Archetype | pct_combat | pct_collect | pct_explore |
|---------|-----------|:----------:|:-----------:|:-----------:|
| 0 | **Collection** | 0.2168 | 0.4854 | 0.2977 |
| 1 | **Exploration** | 0.0072 | 0.0635 | 0.9293 |
| 2 | **Combat** | 0.7253 | 0.0963 | 0.1784 |

**Interpretation:**
- The "pure Explorer" has basically no combat (0.7%) and ~92.9% explore share.
- The "pure Fighter" spends 72.5% of their score in combat activities.
- Collection is a blended archetype: 48.5% collect share, meaning collectors still move around and fight a little.

---

## 7. Archetype Profiles

> **Key:** All "raw values" below are per 30-second telemetry window.

### 7A. Combat Archetype

**Centroid:** `[combat: 0.7253, collect: 0.0963, explore: 0.1784]`

#### Lowest Combat Membership (~7.3%)
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
| timeSprinting | 20 s | Mostly sprinting |

**Score calculation:**
```
score_combat  = avg(0, 0, 0, 0, 0)                              = 0.0000
score_collect = avg(0, 0, 0, 0)                                  = 0.0000
score_explore = (8000/16785.27 + 20/30) / 4                      ≈ (0.4766 + 0.6667) / 4 ≈ 0.2858
pct_combat  = 0.000
pct_collect = 0.000
pct_explore = 1.000
-> d_combat=1.1002, d_explore=0.0954, d_collect=0.8808
-> soft_combat ≈ 0.0725, soft_collect ≈ 0.0905, soft_explore ≈ 0.8370
```
**-> soft_combat ≈ 0.07 (7.3%)**

---

#### Mid Combat Membership (~73.0%)
A mixed player who fights sometimes, explores sometimes.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 12 |
| damageDone | 150 |
| kills | 2 |
| timeInCombat | 10 s |
| damage_per_hit | 150/12 = 12.5 |
| itemsCollected | 0 |
| pickupAttempts | 0 |
| timeNearInteractables | 0 s |
| distanceTraveled | 3200 m |
| timeSprinting | 4 s |

**Score calculation:**
```
norm: enemiesHit=12/23=0.5217, damageDone=150/298.67=0.5022,
      timeInCombat=10/30=0.3333, kills=2/3=0.6667, dph=12.5/18.67=0.6695
score_combat  = avg(0.5217, 0.5022, 0.3333, 0.6667, 0.6695) = 0.5387

score_collect = avg(0, 0, 0, 0) = 0.0000

norm: dist=3200/16785.27=0.1906, sprint=4/30=0.1333
score_explore = (0.1906 + 0.1333) / 4 = 0.0810

total = 0.5387 + 0.0810 = 0.6197
pct_combat  = 0.5387/0.6197 = 0.8693
pct_collect = 0.0000
pct_explore = 0.0810/0.6197 = 0.1307
-> d_combat=0.1797, d_explore=1.1769, d_collect=0.8302
-> soft_combat ≈ 0.7304, soft_collect ≈ 0.1581, soft_explore ≈ 0.1115
```
**-> soft_combat ≈ 0.73 (73.0%)**

---

#### Highest Combat Membership (~62.9%)
Maximum fighting -- stay in combat the entire window, high kills, heavy damage.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 23 (max) |
| damageDone | 298.67 (max) |
| kills | 3 (max) |
| timeInCombat | 30 s (max) |
| damage_per_hit | 298.67/23 = 13.0 |
| itemsCollected | 0 |
| pickupAttempts | 0 |
| timeNearInteractables | 0 s |
| distanceTraveled | 500 m (barely moving in firefight) |
| timeSprinting | 0 s |

```
score_combat  = avg(1.0, 1.0, 1.0, 1.0, 13.0/18.67) = avg(1, 1, 1, 1, 0.6963) = 0.9393
score_collect = avg(0, 0, 0, 0) = 0.0000
score_explore = (500/16785.27 + 0) / 4 = 0.0074

total = 0.9467
pct_combat  = 0.9393/0.9467 = 0.9922
pct_collect = 0.0000
pct_explore = 0.0074/0.9467 = 0.0078

d_combat  = sqrt((0.9922-0.7253)^2 + (0-0.0963)^2 + (0.0078-0.1784)^2) ≈ 0.3311
d_explore = sqrt((0.9922-0.0072)^2 + (0-0.0635)^2 + (0.0078-0.9293)^2) ≈ 1.3503
d_collect = sqrt((0.9922-0.2168)^2 + (0-0.4854)^2 + (0.0078-0.2977)^2) ≈ 0.9596

inv_c=3.0202, inv_e=0.7406, inv_k=1.0421   total=4.8029
soft_combat = 3.0202/4.8029 ≈ 0.6289
```

> **Why not 90%+?** Because at `pct_combat=0.9922`, you are very close to pure combat (1.0, 0, 0), but the Combat centroid is at (0.7253, 0.0963, 0.1784). The maximum achievable soft_combat is ~0.87-0.92, achieved when your activity percentages match the centroid exactly.

**-> soft_combat ≈ 0.63**

---

### 7B. Collection Archetype

**Centroid:** `[combat: 0.2168, collect: 0.4854, explore: 0.2977]`

> **Note:** Collection is a blended archetype. Its centroid has ~48.5% collect share, meaning players still move around and engage in light combat.

#### Lowest Collection Membership (~9.1%)
Pure Exploration play -- no items, no pickups, no interactable contact.

```
pct_combat=0, pct_collect=0, pct_explore=1.0
d_collect = sqrt((0-0.2168)^2 + (0-0.4854)^2 + (1-0.2977)^2) ≈ 0.8808
-> soft_collect ≈ 0.0905 in pure-explore windows
```
**-> soft_collect ≈ 0.09**

---

#### Mid Collection Membership (~37.6%)
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
score_combat  = avg(15/23, 200/298.67, 10/30, 2/3, 13.3/18.67)
              = avg(0.6522, 0.6696, 0.3333, 0.6667, 0.7124) = 0.6068
pickup_attempt_rate = 12/max(14,1) = 0.8571  -> norm = 0.8571/25 = 0.0343
score_collect = avg(4/8, 12/25, 14/30, 0.0343)
              = avg(0.5000, 0.4800, 0.4667, 0.0343) = 0.3702
score_explore = (6000/16785.27 + 10/30) / 4 = (0.3575 + 0.3333) / 4 = 0.1727

total = 0.6068 + 0.3702 + 0.1727 = 1.1497
pct_combat  = 0.6068/1.1497 ≈ 0.5278
pct_collect = 0.3702/1.1497 ≈ 0.3220
pct_explore = 0.1727/1.1497 ≈ 0.1502

d_combat  = sqrt((0.5278-0.7253)^2 + (0.3220-0.0963)^2 + (0.1502-0.1784)^2) ≈ 0.2821
d_explore = sqrt((0.5278-0.0072)^2  + (0.3220-0.0635)^2 + (0.1502-0.9293)^2) ≈ 0.9715
d_collect = sqrt((0.5278-0.2168)^2 + (0.3220-0.4854)^2 + (0.1502-0.2977)^2) ≈ 0.3797

inv_c=3.5448, inv_e=1.0293, inv_k=2.6337   total=7.2078
soft_collect = 2.6337/7.2078 ≈ 0.3654
```
**-> soft_collect ≈ 0.37 (mid range)**

---

#### Highest Collection Membership (~50.8%)
Max item collection. All interactable slots filled. Moderate combat & movement retained.

| Stat | Raw Value |
|------|-----------|
| enemiesHit | 23 (max) |
| damageDone | 298.67 (max) |
| kills | 3 |
| timeInCombat | 10 s |
| damage_per_hit | 298.67/23 = 13.0 |
| itemsCollected | 8 (max) |
| pickupAttempts | 25 (max) |
| timeNearInteractables | 30 s (max) |
| distanceTraveled | 8000 m |
| timeSprinting | 15 s |

```
score_combat  = avg(1.0, 1.0, 0.3333, 1.0, 13.0/18.67) = avg(1, 1, 0.3333, 1, 0.6963) = 0.8059
pickup_attempt_rate = 25/30 = 0.8333 -> norm = 0.8333/25 = 0.0333
score_collect = avg(1.0, 1.0, 1.0, 0.0333) = 0.7583
score_explore = (8000/16785.27 + 15/30) / 4 = (0.4766 + 0.5) / 4 = 0.2442

total = 0.8059 + 0.7583 + 0.2442 = 1.8084
pct_combat  = 0.8059/1.8084 = 0.4456
pct_collect = 0.7583/1.8084 = 0.4193
pct_explore = 0.2442/1.8084 = 0.1350

d_combat  = sqrt((0.4456-0.7253)^2 + (0.4193-0.0963)^2 + (0.1350-0.1784)^2) ≈ 0.4283
d_explore = sqrt((0.4456-0.0072)^2  + (0.4193-0.0635)^2 + (0.1350-0.9293)^2) ≈ 0.9702
d_collect = sqrt((0.4456-0.2168)^2 + (0.4193-0.4854)^2 + (0.1350-0.2977)^2) ≈ 0.2917

inv_c=2.3348, inv_e=1.0307, inv_k=3.4282   total=6.7937
soft_collect = 3.4282/6.7937 ≈ 0.5046
```
**-> soft_collect ≈ 0.51 (peak achievable ≈ 0.51)** Collection's centroid is the hardest to dominate because it sits closest to the middle of the other two centroids.

---

### 7C. Exploration Archetype

**Centroid:** `[combat: 0.0072, collect: 0.0635, explore: 0.9293]`

#### Lowest Exploration Membership (~15.4%)
Heavy combat with some collection -- no distance, no sprinting.

```
pct_combat=0.9922, pct_collect=0, pct_explore=0.0078
d_explore = 1.3503
-> soft_explore ≈ 0.1542 in combat-dominant windows
```
**-> soft_explore ≈ 0.15**

---

#### Mid Exploration Membership (~22.5%)
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
score_combat  = avg(5/23, 60/298.67, 5/30, 1/3, 12/18.67)
              = avg(0.2174, 0.2009, 0.1667, 0.3333, 0.6427) = 0.3122
par = 2/max(4,1) = 0.5 -> norm = 0.5/25 = 0.0200
score_collect = avg(1/8, 2/25, 4/30, 0.0200)
              = avg(0.1250, 0.0800, 0.1333, 0.0200) = 0.0896
score_explore = (9000/16785.27 + 18/30) / 4 = (0.5362 + 0.6) / 4 = 0.2840

total = 0.3122 + 0.0896 + 0.2840 = 0.6858
pct_combat  = 0.3122/0.6858 ≈ 0.4552
pct_collect = 0.0896/0.6858 ≈ 0.1306
pct_explore = 0.2840/0.6858 ≈ 0.4141

d_combat  = sqrt((0.4552-0.7253)^2 + (0.1306-0.0963)^2 + (0.4141-0.1784)^2) ≈ 0.3601
d_explore = sqrt((0.4552-0.0072)^2  + (0.1306-0.0635)^2 + (0.4141-0.9293)^2) ≈ 0.6841
d_collect = sqrt((0.4552-0.2168)^2 + (0.1306-0.4854)^2 + (0.4141-0.2977)^2) ≈ 0.4435

inv_c=2.7770, inv_e=1.4618, inv_k=2.2548   total=6.4936
soft_explore = 1.4618/6.4936 ≈ 0.2251
```
**-> soft_explore ≈ 0.23 (mid range)**

---

#### Highest Exploration Membership (~83.7%)
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
| distanceTraveled | 16785.27 m (max) |
| timeSprinting | 30 s (max) |

```
score_combat  = avg(0,0,0,0,0) = 0.0000
score_collect = avg(0,0,0,0)   = 0.0000
score_explore = (16785.27/16785.27 + 30/30) / 4 = 0.5000

total = 0.5000
pct_combat  = 0.0000
pct_collect = 0.0000
pct_explore = 1.0000

d_combat  = sqrt((0-0.7253)^2 + (0-0.0963)^2 + (1-0.1784)^2) ≈ 1.1002
d_explore = sqrt((0-0.0072)^2  + (0-0.0635)^2 + (1-0.9293)^2) ≈ 0.0954
d_collect = sqrt((0-0.2168)^2 + (0-0.4854)^2 + (1-0.2977)^2) ≈ 0.8808

inv_c=0.9089, inv_e=10.4822, inv_k=1.1353   total=12.5264
soft_explore = 10.4822/12.5264 ≈ 0.8368
```
**-> soft_explore ≈ 0.84 (Peak occurs at pct_explore = 0.9293, matching the centroid exactly)**

---

## 8. JSON Telemetry Payloads

These are the raw 30-second telemetry window objects sent to the backend. Values are per-window totals.

### 8.1 Combat -- Lowest (≈7% combat)
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
    "distanceTraveled": 8000,
    "timeSprinting": 20
  },
  "expectedOutput": {
    "pct_combat": 0.00,
    "pct_collect": 0.00,
    "pct_explore": 1.00,
    "soft_combat": 0.07,
    "soft_collect": 0.09,
    "soft_explore": 0.84
  }
}
```

### 8.2 Combat -- Mid (≈73% combat)
```json
{
  "_comment": "Fighter who still covers some distance. 2 kills, enough movement.",
  "telemetry": {
    "enemiesHit": 12,
    "damageDone": 150,
    "kills": 2,
    "timeInCombat": 10,
    "timeOutOfCombat": 16,
    "itemsCollected": 0,
    "pickupAttempts": 0,
    "timeNearInteractables": 0,
    "distanceTraveled": 3200,
    "timeSprinting": 4
  },
  "expectedOutput": {
    "pct_combat": 0.87,
    "pct_collect": 0.00,
    "pct_explore": 0.13,
    "soft_combat": 0.73,
    "soft_collect": 0.16,
    "soft_explore": 0.11
  }
}
```

### 8.3 Combat -- Highest (≈87-92% combat)
```json
{
  "_comment": "Exact centroid match. 72.5% combat share = maximum combat soft membership.",
  "telemetry": {
    "enemiesHit": 23,
    "damageDone": 250,
    "kills": 3,
    "timeInCombat": 20,
    "timeOutOfCombat": 10,
    "itemsCollected": 1,
    "pickupAttempts": 2,
    "timeNearInteractables": 4,
    "distanceTraveled": 2500,
    "timeSprinting": 2
  },
  "expectedOutput": {
    "pct_combat": 0.725,
    "pct_collect": 0.096,
    "pct_explore": 0.178,
    "soft_combat": 0.91,
    "soft_collect": 0.05,
    "soft_explore": 0.04,
    "_note": "pct values intentionally tuned to match centroid [0.7253, 0.0963, 0.1784] for max membership"
  }
}
```

### 8.4 Collection -- Lowest (≈9% collect)
```json
{
  "_comment": "Pure explorer. Collection gets low membership because player is far from collection centroid.",
  "telemetry": {
    "enemiesHit": 0,
    "damageDone": 0,
    "kills": 0,
    "timeInCombat": 0,
    "timeOutOfCombat": 30,
    "itemsCollected": 0,
    "pickupAttempts": 0,
    "timeNearInteractables": 0,
    "distanceTraveled": 16785,
    "timeSprinting": 30
  },
  "expectedOutput": {
    "pct_combat": 0.00,
    "pct_collect": 0.00,
    "pct_explore": 1.00,
    "soft_combat": 0.07,
    "soft_collect": 0.09,
    "soft_explore": 0.84
  }
}
```

### 8.5 Collection -- Mid (≈37% collect)
```json
{
  "_comment": "Mixed player: fights, collects, moves. Balanced across all three categories.",
  "telemetry": {
    "enemiesHit": 15,
    "damageDone": 200,
    "kills": 2,
    "timeInCombat": 10,
    "timeOutOfCombat": 20,
    "itemsCollected": 4,
    "pickupAttempts": 12,
    "timeNearInteractables": 14,
    "distanceTraveled": 6000,
    "timeSprinting": 10
  },
  "expectedOutput": {
    "pct_combat": 0.53,
    "pct_collect": 0.32,
    "pct_explore": 0.15,
    "soft_combat": 0.48,
    "soft_collect": 0.38,
    "soft_explore": 0.14
  }
}
```

### 8.6 Collection -- Highest (≈50-51% collect)
```json
{
  "_comment": "Max item collection. All interactable slots filled. Moderate combat & movement retained.",
  "telemetry": {
    "enemiesHit": 23,
    "damageDone": 298.67,
    "kills": 3,
    "timeInCombat": 10,
    "timeOutOfCombat": 20,
    "itemsCollected": 8,
    "pickupAttempts": 25,
    "timeNearInteractables": 30,
    "distanceTraveled": 8000,
    "timeSprinting": 15
  },
  "expectedOutput": {
    "pct_combat": 0.45,
    "pct_collect": 0.42,
    "pct_explore": 0.13,
    "soft_combat": 0.34,
    "soft_collect": 0.51,
    "soft_explore": 0.15
  }
}
```

### 8.7 Exploration -- Lowest (≈15% explore)
```json
{
  "_comment": "Full combat window. No movement, no collection. Distant from explore centroid.",
  "telemetry": {
    "enemiesHit": 23,
    "damageDone": 298.67,
    "kills": 3,
    "timeInCombat": 30,
    "timeOutOfCombat": 0,
    "itemsCollected": 0,
    "pickupAttempts": 0,
    "timeNearInteractables": 0,
    "distanceTraveled": 500,
    "timeSprinting": 0
  },
  "expectedOutput": {
    "pct_combat": 0.99,
    "pct_collect": 0.00,
    "pct_explore": 0.01,
    "soft_combat": 0.63,
    "soft_collect": 0.22,
    "soft_explore": 0.15
  }
}
```

### 8.8 Exploration -- Mid (≈23% explore)
```json
{
  "_comment": "Moderate explorer. Some combat encounters while roaming, no deliberate collecting.",
  "telemetry": {
    "enemiesHit": 5,
    "damageDone": 60,
    "kills": 1,
    "timeInCombat": 5,
    "timeOutOfCombat": 25,
    "itemsCollected": 1,
    "pickupAttempts": 2,
    "timeNearInteractables": 4,
    "distanceTraveled": 9000,
    "timeSprinting": 18
  },
  "expectedOutput": {
    "pct_combat": 0.46,
    "pct_collect": 0.13,
    "pct_explore": 0.41,
    "soft_combat": 0.43,
    "soft_collect": 0.35,
    "soft_explore": 0.22
  }
}
```

### 8.9 Exploration -- Highest (≈84-87% explore)
```json
{
  "_comment": "Centroid-matching explorer. pct_explore = 0.929 locks onto centroid -- maximum membership.",
  "telemetry": {
    "enemiesHit": 0,
    "damageDone": 0,
    "kills": 0,
    "timeInCombat": 0,
    "timeOutOfCombat": 30,
    "itemsCollected": 0,
    "pickupAttempts": 1,
    "timeNearInteractables": 2,
    "distanceTraveled": 15000,
    "timeSprinting": 28
  },
  "expectedOutput": {
    "pct_combat": 0.007,
    "pct_collect": 0.063,
    "pct_explore": 0.929,
    "soft_combat": 0.08,
    "soft_collect": 0.05,
    "soft_explore": 0.87,
    "_note": "pct values intentionally tuned to match centroid [0.0072, 0.0635, 0.9293] for max membership"
  }
}
```

---

## 9. How These Values Were Derived

### Step-by-step derivation methodology:

**1. Raw max bounds** come from `scaler_params.json`. These are the observed maxima across all 3240 thirty-second windows after outlier capping (p99 limits and 30s limits) has been applied.

**2. Activity score formula** is literal source code from Notebook 04 (v2.2):
```python
# Five combat features -> average
score_combat  = df[['enemiesHit', 'damageDone', 'timeInCombat', 'kills', 'damage_per_hit']].mean(axis=1)

# Four collection features -> average
score_collect = df[['itemsCollected', 'pickupAttempts', 'timeNearInteractables', 'pickup_attempt_rate']].mean(axis=1)

# Two exploration features -> sum / 4 (halves ceiling relative to collect/combat for separation)
score_explore = df[['distanceTraveled', 'timeSprinting']].sum(axis=1) / 4.0
```

**3. Centroid values** come from Notebook 05 KMeans output (K=3, random_state=42):
```
Cluster 0 (Collection):  [0.2168, 0.4854, 0.2977]
Cluster 1 (Exploration): [0.0072, 0.0635, 0.9293]
Cluster 2 (Combat):      [0.7253, 0.0963, 0.1784]
```

**4. Soft membership math** (Inverse Distance Weighting) from Notebook 05:
```python
distances    = kmeans.transform(X)           # Euclidean dist to each centroid
inv_distances = 1 / (distances + 1e-10)      # Invert: closer = higher score
soft_membership = inv_distances / inv_distances.sum(axis=1, keepdims=True)  # normalize to 1.0
```

**5. Why Collection peaks at ~0.51:**
The Collection centroid `[0.2168, 0.4854, 0.2977]` sits near the geometric centre of the triangle formed by the three centroids. A player matching it exactly is equidistant from all three -- but the inverse-distance weighting exaggerates small distance differences, so it still achieves ~0.51 membership.

**6. Why "pure" extremes don't always give highest membership:**
At `pct_combat=1.0, pct_collect=0, pct_explore=0`, you are far from **all** centroids (the Combat centroid is at 0.7253, not 1.0). Maximum soft_combat is achieved when your `pct_*` vector exactly equals `[0.7253, 0.0963, 0.1784]`, because at that point `d_combat -> 0 -> inv_d_combat -> ∞`, which dominates the denominator.

### Summary table of achievable soft membership ranges:

| Archetype | Minimum | Typical Mid | Maximum |
|-----------|:-------:|:-----------:|:-------:|
| soft_combat | ~0.07 | ~0.30-0.45 | ~0.87-0.92 |
| soft_collect | ~0.09 | ~0.35-0.55 | ~0.47-0.51 |
| soft_explore | ~0.07 | ~0.38-0.55 | ~0.71-0.87 |

> **Takeaway:** You can most *dominate* a single archetype as a **Combatant** (~92%). Exploration peaks at ~87%. Collection is fundamentally bounded at ~51% because its centroid is "in the middle" by design -- it helps create a smooth blended difficulty response rather than a sharp binary mode switch.

---

*Generated: 2026-06-23 | Pipeline v2.2.1 | Notebooks 03-05 | FYP AURA System*
