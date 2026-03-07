# Complete Development Journey — ANFIS Adaptive Difficulty System

**Project**: CollectGame.Model
**Final Version**: v2.2.1
**Date Range**: January 2026 – March 2026

---

## Overview

This document records every major decision made during development — including alternatives rejected and their reasons — alongside the problems encountered and how they were resolved.

---

## Phase 1 — Foundation (v1.0)

### 1.1 Problem Statement
Adaptive difficulty systems traditionally use rule-based approaches (hardcoded thresholds) or black-box ML that is not interpretable. The goal was a system that:
- Adapts in real time based on behavioral telemetry
- Is interpretable (can explain *why* difficulty changed)
- Is computationally feasible at game-engine speeds (<10ms inference)
- Is archetype-aware (combat vs. collection vs. exploration playstyles get different adjustments)

### 1.2 Architecture Choice: ANFIS
**Decision**: Use Adaptive Neuro-Fuzzy Inference System (ANFIS).

**Reasoning**: ANFIS combines the interpretability of fuzzy rules (IF-THEN conditions that can be inspected) with the learning capacity of neural networks. Unlike pure ML, every layer has a semantic interpretation:
- Fuzzification layer → "how much does this player belong to each archetype?"
- Rule layer → "which behavioral patterns are active?"
- Defuzzification layer → "what difficulty adjustment is implied?"

**Alternative considered**: Pure neural network (LSTM on raw telemetry). Rejected because: (a) requires large amounts of real gameplay data for training, (b) provides no interpretability, (c) latency of sequential models unsuitable for frame-rate systems.

### 1.3 Initial Pipeline Design (8 Steps)
```
Step 1: Telemetry acquisition (30s window)
Step 2: Feature normalization (Min-Max to [0,1])
Step 3: Activity scoring (per archetype)
Step 4: K-Means soft clustering → fuzzy memberships
Step 5: Delta computation (window-to-window change)
Step 6: ANFIS inference
Step 7: Difficulty multiplier output
Step 8: Parameter cascade to game engine
```

**Decision: 30-second window**. Shorter windows (10s) were too noisy — a single burst of combat would saturate all signals. Longer windows (60s) missed rapid style shifts. 30s was the minimum for meaningful signal accumulation.

**Decision: 10 raw telemetry features**. Selected to cover all three archetypes with no overlap: `enemiesHit, damageDone, timeInCombat, kills` (combat), `itemsCollected, pickupAttempts, timeNearInteractables` (collection), `distanceTraveled, timeSprinting, timeOutOfCombat` (exploration).

### 1.4 Target Formula v1.0
Initial formula: `M = 1.0 − 0.1×deaths + 0.05×activity`

**Problem discovered immediately**: Variance collapse. σ = 0.0113. With such a narrow distribution, gradient descent could not learn — the model collapsed to predicting the constant mean.

**Root cause**: The formula's coefficients (0.1, 0.05) were too small relative to the clamping range [0.5, 1.5]. 100% of training samples hit the upper clamp.

---

## Phase 2 — A/B Testing & Grid Search (v2.0 foundations)

### 2.1 A/B Testing: Preprocessing Strategy
Two preprocessing strategies were tested head-to-head:
- **Experiment A**: Uniform MinMaxScaler (all features to [0,1])
- **Experiment B**: Feature-aware preprocessing (domain-specific scaling)

**Result**: A won 5/8 metrics (Silhouette, DB Index, CH Score, Target CV, Collection %). B added complexity without measurable improvement.

**Decision**: Adopt Experiment A — uniform MinMaxScaler. This is the evidence-based anchor for all downstream work.

### 2.2 Grid Search: 108 Configurations
Parameters swept: K (2,3,4,5) × outlier handling (none, IQR, Z-score) × normalization (3 variants) × feature sets (3 subsets).

**Key finding**: The default K=3 baseline achieved Silhouette=0.3752 — near-optimal. K=2 achieved better clustering (Silhouette=0.4166) but was incompatible with the 3-archetype system design.

**Decision**: Lock K=3. The small gain from K=2 does not justify redesigning the semantic archetype framework.

### 2.3 Signal Analysis: Delta Integration
Correlation analysis showed:
- **Δexplore → Δtarget**: r = 0.808 (very strong)
- **Δcombat → Δtarget**: r = −0.471 (moderate)

**Decision**: Add 3 temporal delta signals (Δcombat, Δcollect, Δexplore) to ANFIS input, extending from 3 to 6 features. This captured *behavioral velocity* — not just where the player is, but which direction they're moving.

### 2.4 Target Formula: Option B
**Problem with v1.0 formula**: Variance collapse (σ=0.0113). The delta signals were not included as variance drivers.

**Option A** (delta-weighted): Used raw delta values directly. Rejected — produced unstable target distribution due to unbounded delta accumulation.

**Option B** (canonical, approved):
```
M = 0.9 + 0.22×(soft_combat−0.5) + 0.18×(soft_collect−0.5)
        + 0.15×(soft_explore−0.5) + 0.55×Δcombat + 0.40×Δcollect
        + 0.35×Δexplore − 0.25×death_rate
clipped to [0.6, 1.4]
```

**Design principles of Option B**:
1. Soft membership terms centered at 0.5 → bidirectional contribution
2. Delta coefficients (0.55, 0.40, 0.35) as primary variance drivers
3. Death rate penalty (−0.25) to reward struggling players with assistance
4. Wider clamp [0.6, 1.4] → allows natural distribution
5. Asymmetric weights (combat > collect > explore) → reflects relative challenge difficulty per archetype

**Result after adopting Option B**: σ increased from 0.0113 to 0.0625 (+453%). R² went from −4.69 (worse than mean prediction) to **0.9391** (near-perfect). Problem considered solved.

---

## Phase 3 — v2.1 Activity Scoring Revision

### 3.1 Bug Discovered
Live gameplay testing revealed that attacker-intent players on sparse-spawn maps were consistently misclassified as Explorers. Investigation traced to the Exploration score:
```
score_explore = distanceTraveled + timeSprinting + timeOutOfCombat  (v2.0, sums)
```

`timeOutOfCombat` accumulates *passively* whenever the player is not in combat — including when they are actively seeking enemies but not finding any. On a map with 5-second initial spawn delays, a combat-focused player would accumulate a high `timeOutOfCombat` just by walking around during spawns.

Additionally, `timeOutOfCombat + timeInCombat = session_duration` — making them perfectly inversely correlated. Including both introduced redundancy that unfairly boosted the Exploration archetype.

A second structural bug: activity scores were computed as **sums**, giving Combat (4 features) a 4× ceiling over any 1-feature category. This created a structural bias toward Combat in the normalized activity space.

### 3.2 v2.1 Fix
```
score_combat  = avg(enemiesHit, damageDone, timeInCombat, kills)       → [0,1]
score_collect = avg(itemsCollected, pickupAttempts, timeNearInteractables) → [0,1]
score_explore = avg(distanceTraveled, timeSprinting)                    → [0,1]
```

**Changes**: Averages (not sums), `timeOutOfCombat` removed, equal ceiling (1.0) per archetype.

**Impact**: Required rerunning notebooks 04→07 (activity scores → clustering → ANFIS preparation → training). All downstream artifacts regenerated.

---

## Phase 4 — v2.2 Derived Features

### 4.1 Remaining Discrimination Gaps (after v2.1)
After the v2.1 fix, two archetype discrimination gaps remained:

1. **Sniper-style vs spray-fire combat**: Both produce similar `enemiesHit` and `timeInCombat` counts, but snipers deal extremely high damage per hit. The existing features could not distinguish them.

2. **Deliberate collector vs. incidental explorer**: An explorer who passes through loot-heavy areas accumulates high `timeNearInteractables` without intending to collect. A deliberate collector has high `pickupAttempts / timeNearInteractables` (high attempt rate).

### 4.2 Derived Features Added
```
damage_per_hit      = damageDone_raw / max(enemiesHit_raw, 1)
pickup_attempt_rate = pickupAttempts_raw / max(timeNearInteractables_raw, 1)
```

Both computed from raw telemetry **before** normalization, then normalized as the 11th and 12th features. Scaler input expanded from 10 → 12 features.

Updated activity scoring:
```
score_combat  = avg(5 features including damage_per_hit)
score_collect = avg(4 features including pickup_attempt_rate)
score_explore = avg(2 features, unchanged)
```

**Decision: Why derived ratios rather than raw values?**
Ratios are scale-independent — a player with 5 hits and 500 damage has the same damage_per_hit as one with 50 hits and 5000 damage, which correctly represents the same weapon-class behavior pattern.

### 4.3 MLP Architecture Selection
Architecture: **6 → 16 → 8 → 1** (ReLU hidden, Linear output)

**Selection process (5-fold cross-validation)**:
- 1 layer [32]: Test R²=0.82 — insufficient to capture membership × delta interactions
- 2 layers [16,8]: Test R²=0.93 — optimal
- 2 layers [32,16]: R²=0.91 but 4× parameters with no meaningful gain
- 3 layers: Overfitting with no test improvement

**Bottleneck structure (16→8)**: Forces a compressed intermediate representation before the output — encourages the network to learn the most informative combination of membership and delta signals rather than memorizing individual samples.

**Activation choices**:
- Hidden: **ReLU** — faster convergence than sigmoid/tanh; avoids vanishing gradient in the 2nd hidden layer
- Output: **Linear** — allows raw output before calibration; sigmoid/tanh would artificially bound the range

### 4.4 Why an MLP Instead of Full ANFIS at Runtime?
Full ANFIS inference requires iterative least-squares parameter estimation per forward pass — O(n²) in rule count. With 3 fuzzy inputs and 3 archetypes (3³ = 27 rules), this takes 50–200ms. The MLP forward pass is O(weights) and completes in <1ms.

The MLP was trained on 3,240 synthetic samples generated from the ANFIS rule evaluation, achieving Test R²=0.9264. The slight accuracy loss (100% → 92.6%) is acceptable given the 200× inference speed improvement.

---

## Phase 5 — v2.2.1 Training Bias Discovery & Fix

### 5.1 Analytics Anomaly: "Always Easier"
After deploying v2.2 and building the analytics dashboard, every simulated player scenario showed "easier by X%". Running a brute-force sweep of 5000 random inputs confirmed: the MLP output range was [0.535, 0.976] — entirely below 1.0 for all realistic inputs.

### 5.2 Root Cause: Membership Cancellation
The Option B formula with `base=0.9` had a fundamental mathematical problem (see `10_Training_Bias_Fix_and_Calibration.md` for full derivation):

Soft memberships sum to 1.0 (partition-of-unity). When each term is centered at 0.5, a balanced player (1/3, 1/3, 1/3) contributes:
```
0.22×(1/3−0.5) + 0.18×(1/3−0.5) + 0.15×(1/3−0.5) = −0.092
```
This is a **fixed structural offset** — it exists for every possible membership combination because the weights always sum to 0.55 and each balanced membership is always 0.167 below center.

With `base=0.9`: neutral point = 0.9 − 0.092 = **0.808** (far below 1.0)
With `base=1.0`: neutral point = 1.0 − 0.092 = **0.908** (closer but still not 1.0)

### 5.3 Failed First Fix Attempt
An attempted fix computed `output_range = [min_raw, max_raw]` by sweeping all input combinations including delta=±1.0, then applied min-max rescaling.

Problem: Extreme deltas (±1.0) are unrealistic. Real players produce deltas in [−0.3, +0.3]. Using ±1.0 pulled `min_raw` to 0.49 — far below any realistic player. This made every realistic player appear "above the midpoint" → always HARDER. Same symptom, opposite direction.

**Lesson**: Empirical range-based calibration is inherently fragile — it depends on which inputs you choose to define the range.

### 5.4 The Correct Fix: Semantic Anchoring
**Insight**: Instead of computing a range, anchor calibration to a *semantic reference point* — the input that should semantically produce display=1.0.

A balanced player (1/3, 1/3, 1/3, 0, 0, 0) semantically means "average behavior, no trend" → should produce display=1.0 by definition.

```python
mlp_neutral = model.predict([[1/3, 1/3, 1/3, 0, 0, 0]])[0]  # = 0.932006
```

Then:
```
display = clamp(1.0 + (raw − mlp_neutral) × 2.0,  0.6,  1.4)
```

This guarantees: balanced player → display = 1.0 regardless of what `mlp_neutral` happens to be.

### 5.5 Self-Updating System Design
`mlp_neutral` is stored in `anfis_mlp_weights.json` and auto-computed by notebook 07 after every retrain. The Next.js engine reads it at startup. No manual code changes are needed after a retrain.

This was a deliberate design goal: the system should be **self-consistent** — every component derives its calibration from the model artifact, not from hardcoded constants that can become stale.

---

## Phase 6 — Next.js Demo UI & Analytics Dashboard

### 6.1 UI Architecture Decision
**Decision**: Build a Next.js 14 (App Router) TypeScript frontend as the demo UI, rather than a standalone game or Unity/Unreal integration.

**Reasoning**: The primary deliverable is the ANFIS pipeline. A full game implementation would require months of game development unrelated to the thesis contribution. The demo UI provides:
- Interactive JSON input (simulating game telemetry)
- Full pipeline visualization (each of the 8 steps inspectable)
- Analytics dashboard (archetype classification, session history, model metrics)
- Educational tooltips explaining every decision and design choice

### 6.2 Test Suite (19/19)
A mandatory Vitest test suite was implemented covering every engine module:
- `normalization.test.ts` — Min-Max scaler edge cases
- `activity.test.ts` — Per-archetype score computation
- `clustering.test.ts` — IDW soft membership, partition-of-unity
- `mlp.test.ts` — Forward pass accuracy, weight loading
- `adaptation.test.ts` — Parameter clamping, archetype influence
- `pipeline.test.ts` — End-to-end integration (8-step flow)

CI/CD via GitHub Actions runs all tests on every push.

### 6.3 Key Bug Found During UI Development: Combat Score Not Updating
Commit `0fff75d` (fix: combat score isnt updating. biased to explorer): A `camelCase` vs `snake_case` mismatch in `lib/engine/index.ts` caused derived feature keys (`damagePerHit`, `pickupAttemptRate`) to not match the scaler's feature order. The MLP was receiving zeros for those two features — effectively disabling the combat discrimination fix from v2.2.

**Fix**: Aligned key naming convention across the pipeline. Added explicit type validation in the engine to catch future mismatches.

### 6.4 Behavioral Comparison Tracking
Commit `9d7110d` added a window-to-window comparison panel: shows previous state alongside current state, highlights which features changed, and explains what the delta values mean in plain English.

This was motivated by user testing: without context, a delta of "+0.15 combat" is meaningless. The comparison panel answers "compared to last window, you fought 15% more."

### 6.5 Educational Explainers
Every technical concept in the dashboard has a plain-English tooltip (via `HelpfulTooltip` component) backed by `lib/analytics/educational-content.ts`. Key explainers:
- Why Min-Max normalization (vs Z-score)
- Why soft membership (vs hard K-Means)
- Why 3 archetypes (vs 4)
- Why deltas (vs static membership only)
- Why MLP surrogate (vs full ANFIS at runtime)
- Why neutral-centred calibration (vs min-max rescaling)

---

## Phase 7 — CI/CD & Production Readiness

### 7.1 GitHub Actions
Workflow file added (`commit e7a2ded`):
- Triggered on push to `bug-fix` branch and PRs to `master`
- Runs `npx tsc --noEmit` (TypeScript check) and `npx vitest run` (19 tests)
- Build fails if any test fails or TypeScript errors exist

### 7.2 Responsive UI (`commit 2b5dbe0`)
The dashboard was made responsive for presentation on both 1080p monitors and laptop screens. The center panel (pipeline visualization) uses a sticky layout; the analytics slide-over uses a fixed width; archetypes tab uses a 2-column grid on wide screens.

---

## Key Challenges & How They Were Resolved

| Challenge | Phase | Root Cause | Resolution |
|-----------|-------|------------|------------|
| R² = −4.69 (model worse than mean) | v1.0 | Variance collapse (σ=0.011) | Option B target formula (σ→0.062) |
| Attacker misclassified as Explorer | v2.0 | `timeOutOfCombat` passive accumulation | v2.1: removed from Exploration score |
| Sum asymmetry — Combat ceiling 4× higher | v2.0 | Raw sums, not per-archetype averages | v2.1: switched to per-archetype mean |
| Sniper-style underrepresented | v2.1 | No per-hit damage signal | v2.2: `damage_per_hit` derived feature |
| Deliberate vs incidental collector | v2.1 | No attempt rate signal | v2.2: `pickup_attempt_rate` derived feature |
| "Always easier" analytics output | v2.2 | Training `base=0.9`, membership cancellation | v2.2.1: base=1.0 + neutral-centred calibration |
| "Always harder" (first fix attempt) | v2.2 | Min-max used extreme delta inputs for range | v2.2.1: semantic anchor (mlp_neutral) instead |
| Combat score not updating | v2.2 | camelCase/snake_case mismatch for derived features | Fixed key naming convention |
| Session reset mid-game | v2.0 | 40s timeout too short for loading screens | v2.2: increased to 90s (3× window cadence) |

---

## Design Decisions Catalogue

| Decision | Chosen | Rejected Alternatives | Reason |
|----------|--------|----------------------|--------|
| Feature space | 12 features (10 raw + 2 derived) | 10 raw only | Sniper and collector discrimination gaps |
| Activity scoring | Per-archetype average | Sum | Equal ceiling per archetype; prevents structural bias |
| Clustering | K=3, soft IDW | K=2, K=4, hard K-Means | K=2 incompatible with 3 archetypes; K=4 collapses; hard K-Means causes boundary oscillation |
| ANFIS input | 6D (3 soft + 3 delta) | 3D (soft only) | Deltas capture velocity; r=0.808 correlation with target |
| MLP architecture | 6→16→8→1 | [32], [16,8,4], LSTM | Smallest with R²>0.90; 5-fold CV validated |
| MLP activation | ReLU | sigmoid, tanh | Faster convergence; no vanishing gradient |
| Runtime inference | MLP surrogate | Full ANFIS | ANFIS O(n²) = 50–200ms; MLP <1ms |
| Output calibration | Neutral-centred (mlp_neutral) | Min-max rescaling | Semantic guarantee (balanced→1.0); not fragile to range computation |
| Safety clamp | [0.6, 1.4] | [0.5, 1.5], [0.7, 1.3] | Calibration study: M=1.5 "unfair"; M=0.5 trivial |
| Session timeout | 90s | 40s | 40s too short for loading screens; 90s = 3× window cadence |
| Normalization | Uniform MinMax | Feature-aware, Z-score | A/B test: uniform wins 5/8 metrics; Z-score incompatible with fuzzy [0,1] requirement |

---

## Git Commit Trail

| Commit | Message | Phase |
|--------|---------|-------|
| `b0ec0d2` | API req body reformatted | Foundation |
| `0058190` | Add Feature Validation | v1.0 |
| `d50b93f` | Add simulation fetcher service | v1.0 |
| `cb0643c` | Add MLP surrogate evaluation and pipeline integration test notebooks | v2.0 |
| `48019bc` | Document backend architecture | v2.0 |
| `8dc5615` | Add RESEARCH_JOURNEY.md | v2.0 |
| `0fff75d` | Fix: combat score not updating, biased to explorer | v2.1 |
| `7a4c918` | Implement v2.2 pipeline improvements and parameter sensitivity | v2.2 |
| `5f755de` | Upgrade ANFIS adaptive difficulty to v2.2 | v2.2 |
| `bf45ba6` | Finalize v2.2 pipeline and implement test suite | v2.2 |
| `e7a2ded` | Implement CI/CD automation, 19/19 tests | v2.2 |
| `8f8fedd` | Add GitHub Actions CI workflow | v2.2 |
| `bb46bf5` | Implement v2.2 derived features and fix pipeline bugs | v2.2 |
| `9d7110d` | Add behavioral comparison tracking and educational explainers | v2.2 |
| `f32faaa` | Fix: biased to explorer and collector fixed | v2.2 |
| `2b5dbe0` | UI responsive layout | v2.2 |
| *(current)* | Training bias fix (base=0.9→1.0), neutral-centred calibration | v2.2.1 |

---

## Final System State (v2.2.1)

| Component | Value |
|-----------|-------|
| Architecture | ANFIS (K-Means + MLP surrogate) |
| Features | 12 (10 raw + 2 derived) |
| Archetypes | 3 (Combat, Collection, Exploration) |
| MLP | 6→16→8→1, ReLU/Linear |
| Test R² | 0.9264 |
| Test MAE | 0.0127 |
| Calibration | Neutral-centred: `display = clamp(1.0 + (raw − 0.932006) × 2.0, 0.6, 1.4)` |
| Safety clamp | [0.6, 1.4] |
| Session timeout | 90,000ms |
| Tests | 19/19 passing |
| CI | GitHub Actions (TypeScript + Vitest) |
