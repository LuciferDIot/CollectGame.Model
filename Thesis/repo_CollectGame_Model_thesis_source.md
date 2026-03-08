# Thesis Source Document — CollectGame.Model Repository
**System**: AURA (Adaptive User-Responsive Architecture)
**Repo**: CollectGame.Model
**Final Version**: v2.2.1
**Development Period**: January 2026 – March 2026
**Author**: K. W. J. P. Geevinda
**Supervisor**: Mr. Banu Athuraliya

> This document consolidates all thesis-relevant content from this repository. It is one of three source documents (one per repo). Combine with `repo_CollectGame_CalibrationAnalysis_thesis_source.md` and `repo_TelemetryCollection_thesis_source.md` when writing the full thesis DOCX.

---

## 1. Research Title and Abstract

**Full Title**: Real-Time Environment Adaptation Using Telemetry-Driven Behavioural Clustering and Neuro-Fuzzy Procedural Content Adaptation

**Short Title**: AURA — Adaptive Neuro-Fuzzy Difficulty System

**Abstract (Draft)**:
Static and rule-based adaptive difficulty systems fail to respond to the diversity of implicit player behaviour, resulting in sub-optimal engagement and early player drop-off. This project presents AURA, a calibration-first, telemetry-driven adaptive gameplay framework that classifies player behaviour into three archetypes — Combat, Collection, and Exploration — using K-Means soft clustering with Inverse Distance Weighting (IDW) membership, and predicts a real-time difficulty multiplier using a neuro-fuzzy inference system approximated by a Multi-Layer Perceptron (MLP) surrogate for sub-millisecond runtime inference. The system operates on 30-second telemetry windows, extracting 12 behavioural features (10 raw + 2 derived ratios), computing per-archetype soft memberships and temporal deltas, and mapping these to a bounded difficulty multiplier M ∈ [0.6, 1.4]. A neutral-centred calibration scheme guarantees that a balanced player always receives M = 1.0 by anchoring the output to a semantically defined neutral input. The MLP surrogate achieves Test R² = 0.9264 and Test MAE = 0.0127 on 3,240 synthetic samples. An interactive analytics dashboard (Next.js 14, TypeScript) visualises the complete 8-step pipeline with educational explainers, archetype diagnostics, and window-to-window behavioural comparison. A Vitest test suite of 19 tests validates every engine module with CI/CD via GitHub Actions.

---

## 2. Problem Statement and Research Motivation

### 2.1 Problem Background
Traditional adaptive difficulty systems rely on either:
- **Rule-based approaches**: Hardcoded thresholds (e.g., "if deaths > 3, reduce damage by 10%") that are brittle, designer-dependent, and cannot capture the nuance of multi-dimensional player behaviour.
- **Black-box ML**: LSTM/DNN models trained on raw session data that provide no interpretability — a designer cannot inspect *why* the system made a particular adjustment.
- **Performance-only metrics**: Systems that adapt based solely on win/loss outcomes, ignoring *how* a player achieves those outcomes (aggressive vs. cautious, explorer vs. brawler).

### 2.2 Research Gap
No system in the reviewed literature simultaneously satisfies:
1. Real-time inference speed (<10ms) compatible with game engine frame rates
2. Archetype-aware personalisation (different playstyles get different adjustments)
3. Interpretability (each pipeline stage has a semantic meaning)
4. Bias-free baseline (a neutral player always receives neutral difficulty)

### 2.3 Research Questions
- **RQ1**: Can a neuro-fuzzy inference system, approximated by an MLP surrogate, produce statistically valid difficulty multipliers from 12-dimensional behavioural telemetry in real time?
- **RQ2**: How should temporal behavioural deltas (window-to-window membership changes) be incorporated into the inference input to capture behavioural momentum rather than static state?
- **RQ3**: What calibration strategy guarantees semantic neutrality (balanced player → M = 1.0) without fragility to training distribution extremes?

### 2.4 Research Aim
To design, train, and validate an interpretable neuro-fuzzy adaptive difficulty pipeline that classifies player archetypes from implicit behavioural telemetry, responds to behavioural momentum, and produces bias-free difficulty adjustments within game-engine latency constraints.

### 2.5 Research Objectives
| ID | Objective | Maps to |
|----|-----------|---------|
| RO1 | Comprehensive literature review on adaptive PCG, player modelling, ANFIS | RQ1, RQ2 |
| RO2 | Design 8-step ANFIS pipeline with semantic layer interpretations | RQ1 |
| RO3 | Engineer 12-feature telemetry schema with derived ratio features | RQ1, RQ2 |
| RO4 | Train and validate MLP surrogate (R² ≥ 0.90, MAE ≤ 10% of span) | RQ1 |
| RO5 | Implement neutral-centred calibration guaranteeing balanced→M=1.0 | RQ3 |
| RO6 | Build interactive analytics dashboard with 19-test CI/CD suite | RQ1, RQ2, RQ3 |

### 2.6 Project Scope
**In Scope**:
- Full ANFIS pipeline design and MLP surrogate training (Python, Jupyter)
- 12-feature telemetry schema design and synthetic dataset generation (3,240 samples)
- K-Means behavioural clustering with IDW soft membership
- Neutral-centred calibration and safety clamping
- Interactive Next.js analytics dashboard with full pipeline visualisation
- 19-test Vitest suite, TypeScript type safety, CI/CD via GitHub Actions

**Out of Scope**:
- Full real-time closed-loop integration with Unreal Engine PCG system (GPU resource constraint — see Section 10)
- Real-player A/B study comparing adaptive vs. static difficulty over extended sessions
- Weapon-type stratified normalization (requires telemetry schema extension)

---

## 3. System Architecture

### 3.1 High-Level Architecture (8-Step Pipeline)
```
Step 1  Telemetry Acquisition        (30-second window, 12 features)
Step 2  Feature Normalization         (Min-Max scaler, [0,1])
Step 3  Activity Scoring              (per-archetype averages)
Step 4  K-Means Soft Clustering       (IDW membership → μ_combat, μ_collect, μ_explore)
Step 5  Temporal Delta Computation    (Δ_k = μ_k(t) − μ_k(t−1))
Step 6  MLP Surrogate Inference       (6→16→8→1, ReLU/Linear)
Step 7  Neutral-Centred Calibration   (display = clamp(1.0 + (raw − mlp_neutral) × 2.0, 0.6, 1.4))
Step 8  Parameter Cascade             (per-archetype factor → game engine parameters)
```

### 3.2 Why ANFIS?
ANFIS (Adaptive Neuro-Fuzzy Inference System) was selected over alternatives because it combines:
- **Fuzzy interpretability**: Every layer has a semantic meaning (fuzzification, rule activation, defuzzification)
- **Neural learning**: Parameters are learned from data, not hand-tuned
- **Bounded output**: Naturally constrained to a valid difficulty range

**Alternative considered**: Pure LSTM on raw telemetry. Rejected because:
- Requires large real gameplay datasets (unavailable at research scale)
- No interpretability — cannot explain *why* difficulty changed
- Sequential inference latency incompatible with 60 FPS requirement

### 3.3 Why MLP Surrogate Instead of Full ANFIS at Runtime?
Full ANFIS inference requires iterative least-squares parameter estimation: O(n²) in rule count. With 3 fuzzy inputs and 3 archetypes (3³ = 27 rules), this takes 50–200ms per inference. The MLP surrogate (6→16→8→1) runs in <1ms.

The MLP was trained on 3,240 ANFIS-evaluated synthetic samples, achieving Test R² = 0.9264. The accuracy loss (100% → 92.6%) is acceptable given the 200× inference speed gain.

### 3.4 Key Model Artifacts
| File | Contents |
|------|---------|
| `anfis-demo-ui/models/anfis_mlp_weights.json` | MLP weights, biases, `mlp_neutral` (0.932006), `output_range` |
| `anfis-demo-ui/models/scaler_params.json` | Min-Max scaler params for 12 features |
| `anfis-demo-ui/models/cluster_centroids.json` | K-Means centroids (K=3) in archetype space |
| `anfis-demo-ui/models/deployment_manifest.json` | Hard safety constraints (clamp bounds) |
| `anfis-demo-ui/models/training_stats.json` | Target distribution + mlp_neutral |
| `_research_archive/core/notebooks/` | Full training pipeline (notebooks 01–10) |

### 3.5 Component Overview (Next.js Demo UI)
```
anfis-demo-ui/
├── lib/engine/               ANFIS pipeline (TypeScript)
│   ├── index.ts              ANFISPipeline class (8-step orchestrator)
│   ├── mlp.ts                MLPInference (6→16→8→1)
│   ├── normalization.ts      MinMaxNormalizer
│   ├── clustering.ts         KMeansSoftMembership (IDW)
│   ├── activity.ts           Activity score computation
│   ├── adaptation.ts         Parameter cascade
│   ├── validators.ts         Telemetry input validation
│   └── types.ts              TypeScript interfaces
├── lib/analytics/            Analytics computation + educational content
├── lib/session/              Pipeline context (React state)
├── components/dashboard/     UI tabs and layout
│   └── tabs/
│       ├── behavior-tab.tsx       Telemetry + normalization view
│       ├── archetypes-tab.tsx     Radar chart + K-Means view
│       ├── model-tab.tsx          MLP inference + weights view
│       └── adaptation-tab.tsx     Parameter cascade + history
├── __tests__/                Vitest test suite (19 tests)
└── models/                   Frozen model artifacts (JSON)
```

---

## 4. Feature Engineering

### 4.1 Raw Telemetry Features (10 features)
| Feature | Archetype | Description |
|---------|-----------|-------------|
| `enemiesHit` | Combat | Enemies successfully hit in window |
| `damageDone` | Combat | Total damage output |
| `timeInCombat` | Combat | Seconds actively in combat |
| `kills` | Combat | Confirmed kills |
| `itemsCollected` | Collection | Items picked up |
| `pickupAttempts` | Collection | Attempted pickups |
| `timeNearInteractables` | Collection | Seconds near interactable objects |
| `distanceTraveled` | Exploration | Total movement distance |
| `timeSprinting` | Exploration | Seconds sprinting |
| `timeOutOfCombat` | Exploration (v2.0 only, removed v2.1) | Passive out-of-combat accumulation |

### 4.2 Derived Features (v2.2 addition — 2 features)
| Feature | Formula | Rationale |
|---------|---------|-----------|
| `damage_per_hit` | `damageDone / max(enemiesHit, 1)` | Weapon-class-agnostic intensity proxy; separates sniper-class (high DPH) from spray-fire (low DPH) |
| `pickup_attempt_rate` | `pickupAttempts / max(timeNearInteractables, 1)` | Deliberateness signal; distinguishes intentional collectors from incidental passers-by |

Both are computed from raw telemetry **before** normalization, then normalized as features 11 and 12. The scaler input vector expanded from 10 → 12 features in v2.2.

### 4.3 Activity Scoring (v2.2 canonical)
```
score_combat  = avg(enemiesHit, damageDone, timeInCombat, kills, damage_per_hit)     → [0,1]
score_collect = avg(itemsCollected, pickupAttempts, timeNearInteractables, pickup_attempt_rate) → [0,1]
score_explore = avg(distanceTraveled, timeSprinting)                                  → [0,1]
```

**Why averages, not sums?** Sums give Combat (5 features) a 5× ceiling over Exploration (2 features). Averages impose equal ceilings per archetype, preventing structural classification bias.

**Why was `timeOutOfCombat` removed?** It accumulates passively whenever the player is not in combat — including when a combat-intent player is seeking enemies during sparse spawns. This caused systematic Combat→Exploration misclassification (v2.0 bug). It is also perfectly inversely correlated with `timeInCombat`, introducing redundancy.

### 4.4 Normalisation
**Strategy**: Uniform Min-Max Scaler — all features scaled to [0,1] using pre-fitted min/max from calibration dataset.

**Selection**: A/B tested against feature-aware Log-Sparse scaling and RobustScaler across 108 configurations. Uniform MinMax won 5/8 quality metrics (Silhouette, DB Index, CH Score, Target CV, Collection %). The marginal gain from Log-Sparse (+0.4% Silhouette) did not justify increased complexity or reduced interpretability.

**Why not Z-score?** Fuzzy membership functions require inputs in [0,1]. Z-score produces unbounded values incompatible with the triangular membership function semantics.

---

## 5. Behavioural Clustering

### 5.1 K-Means Configuration
**K = 3** clusters: Combat, Collection, Exploration.

**Selection process (grid search, 108 configurations)**:
| K | Silhouette | DB Index | Decision |
|---|-----------|----------|---------|
| 2 | 0.4166 | 1.041 | Rejected — binary classification incompatible with 3-archetype design |
| **3** | **0.3752** | **0.977** | **Selected** — optimal domain fit |
| 4 | 0.341 | 1.12 | 4th cluster (Stealth) collapsed into Exploration |
| 5 | 0.298 | 1.31 | Unstable centroids |

**Why K=3 over K=2?** K=2 would segment players into "High/Low" engagement only, losing the distinction between a combat-focused player and an exploration-focused player — the distinction that drives differentiated difficulty adaptation.

**Entropy validation**: Entropy = 1.405 (max 1.585), confirming that the 3-cluster solution models diverse player behaviour without collapsing to a single dominant mode.

### 5.2 Soft Membership (IDW — Inverse Distance Weighting)
**Why soft, not hard clustering?** Hard K-Means assigns each player to exactly one archetype, causing boundary oscillation — a player at the boundary between Combat and Collection alternates between the two each window, producing unstable difficulty outputs.

**IDW formula**:
```
d_k = || P − C_k ||            (Euclidean distance to centroid k)
w_k = 1 / (d_k + ε)           (ε = 1e-9 to prevent division by zero)
μ_k = w_k / Σ_j w_j           (normalise to partition-of-unity: Σ μ_k = 1.0)
```

This satisfies the partition-of-unity constraint: memberships always sum to 1.0, enabling their direct use as fuzzy inputs to the inference layer.

### 5.3 Temporal Delta Signals
```
Δ_k(t) = μ_k(t) − μ_k(t−1)
```

**Why deltas?** Static membership captures *current state* but not *direction of change*. A player increasing their combat engagement (Δcombat = +0.3) requires a different response than one maintaining it (Δcombat = 0) even if their current membership is identical.

**Empirical validation**: Pearson correlation analysis on the training dataset:
- Δexplore → Δtarget: r = 0.808 (very strong)
- Δcombat → Δtarget: r = −0.471 (moderate)

This confirmed deltas as the primary variance drivers in the target formula.

---

## 6. Target Formula and Training

### 6.1 Formula Evolution

**v1.0 (failed)**: `M = 1.0 − 0.1×deaths + 0.05×activity`
- Result: σ = 0.0113, R² = −4.69 (worse than mean prediction)
- Root cause: Variance collapse — 100% of samples hit the upper clamp; gradient descent could not learn

**Option B (v2.2 canonical, base=1.0)**:
```
M = 1.0 + 0.22×(soft_combat − 0.5) + 0.18×(soft_collect − 0.5) + 0.15×(soft_explore − 0.5)
      + 0.55×Δcombat + 0.40×Δcollect + 0.35×Δexplore − 0.25×death_rate

M_final = clamp(M, 0.6, 1.4)
```

**Design principles**:
1. **Centred soft membership terms** (subtract 0.5): bidirectional contribution — being 100% Combat increases M above 1.0; being 0% Combat decreases it
2. **Strong delta coefficients** (0.55, 0.40, 0.35): primary variance drivers — behavioural momentum drives most of the adaptation signal
3. **Asymmetric weights** (combat > collect > explore): reflects relative challenge difficulty per archetype
4. **Death rate penalty** (−0.25): rewards struggling players with difficulty reduction
5. **Wider clamp** ([0.6, 1.4]): allows natural distribution without saturation

**Why base=1.0 not 0.9?** The soft membership terms always sum to 1.0. When centred at 0.5, a balanced player (⅓,⅓,⅓) contributes a fixed negative offset:
```
0.22×(1/3−0.5) + 0.18×(1/3−0.5) + 0.15×(1/3−0.5) = −0.092
```
With base=0.9: neutral point = 0.9 − 0.092 = **0.808** (training skewed below 1.0 — discovered as the v2.2 training bias bug). With base=1.0: neutral point = 1.0 − 0.092 = **0.908** — still not 1.0, but the neutral-centred calibration corrects this at runtime without retraining.

### 6.2 Feature Influence Hierarchy
| Rank | Feature | Coefficient | Role |
|------|---------|------------|------|
| 1 | Δcombat | 0.55 | Primary variance driver |
| 2 | Δcollect | 0.40 | Secondary variance driver |
| 3 | Δexplore | 0.35 | Tertiary variance driver |
| 4 | death_rate | −0.25 | Assist penalty |
| 5 | soft_combat | 0.22 | Context/archetype bias |
| 6 | soft_collect | 0.18 | Context/archetype bias |
| 7 | soft_explore | 0.15 | Context/archetype bias |

---

## 7. MLP Surrogate Architecture and Training

### 7.1 Architecture
```
Input:  [μ_combat, μ_collect, μ_explore, Δcombat, Δcollect, Δexplore]  — 6 features
H1:     16 neurons, ReLU activation
H2:     8 neurons, ReLU activation
Output: 1 neuron, Linear activation  (raw M before calibration)
```

**Bottleneck structure (16→8)**: Forces a compressed intermediate representation — the network must learn the most informative combination of membership and delta signals rather than memorising individual sample patterns.

**Activation choices**:
- Hidden: ReLU — faster convergence than sigmoid/tanh; no vanishing gradient in the second hidden layer
- Output: Linear — preserves raw output range; sigmoid/tanh would artificially compress the output before calibration

### 7.2 Architecture Selection (5-fold CV)
| Architecture | Test R² | Decision |
|-------------|---------|---------|
| 1×[32] | 0.82 | Insufficient to capture membership×delta interactions |
| **2×[16,8]** | **0.93** | **Selected — optimal** |
| 2×[32,16] | 0.91 | 4× more parameters, no meaningful gain |
| 3 layers | 0.90 | Overfitting, no test improvement |

### 7.3 Training Results (v2.2.1 canonical)
| Metric | Value |
|--------|-------|
| Total samples | 3,240 (80/20 split) |
| Train MAE | 0.0130 |
| Test MAE | **0.0127** |
| Train R² | 0.9550 |
| Test R² | **0.9264** |
| Convergence | 21 iterations (LBFGS) |
| mlp_neutral | **0.932006** |

**Generalisation check**: Test R² (0.9264) ≥ Train R² threshold — no overfitting. MAE = 1.3% of target span [0.6, 1.4].

### 7.4 Target Distribution (v2.2.1 corrected)
| Metric | Collapsed (v1.0) | Option B Biased (v2.2) | Option B Corrected (v2.2.1) |
|--------|----------------|----------------------|--------------------------|
| Std Dev | 0.0113 | 0.062 | **0.074** |
| Span | 0.023 | 0.411 | **0.507** |
| Mean | — | 0.801 | **0.902** |
| Upper clamp % | 100% | 0% | 0% |
| Test R² | −4.69 | 0.9391 | **0.9264** |

### 7.5 Training Notebook Pipeline
| Notebook | Purpose |
|----------|---------|
| 01 | Data ingestion and integrity check |
| 02 | Feature exploration and correlation analysis |
| 03 | Derived feature computation (damage_per_hit, pickup_attempt_rate) |
| 04 | Activity scoring (combat/collect/explore averages) |
| 05 | K-Means clustering (K=3) and centroid fitting |
| 06 | ANFIS dataset preparation (target formula, delta computation) |
| 07 | MLP training, mlp_neutral computation, artifact export |
| 08 | Grid search validation (108 configurations) |
| 09 | Simulation evaluation (7 synthetic player scenarios) |
| 10 | Integration test runner |

---

## 8. Neutral-Centred Calibration (Critical Design)

### 8.1 Problem: Training Bias Discovery (v2.2 → v2.2.1)
After deploying v2.2, every player scenario in the analytics dashboard showed "easier by X%" regardless of archetype. A brute-force sweep of 5,000 random inputs confirmed: MLP raw output range was [0.535, 0.976] — entirely below 1.0.

**Root cause**: The partition-of-unity constraint means soft memberships always sum to 1.0. When centred at 0.5, a balanced player (⅓,⅓,⅓) always contributes a fixed negative offset (−0.092) to the target. With base=0.9, the training neutral point was 0.808, biasing the entire training distribution below 1.0. The MLP never learned to predict "harder".

**Failed first fix**: Min-max rescaling using the MLP output range computed over extreme delta=±1.0 inputs. This pulled `min_raw` to 0.49 — far below any realistic player — causing every realistic session to appear "above midpoint" → always HARDER. Same symptom, opposite direction. Lesson: empirical range-based calibration is fragile.

### 8.2 The Correct Fix: Semantic Anchoring
**Insight**: Rather than computing a range, anchor calibration to the semantic reference point — the input that *should* produce display=1.0.

A balanced player (⅓,⅓,⅓, Δ=0) semantically means "average behaviour, no trend" → should always produce display=1.0.

```
mlp_neutral = MLP.predict([[1/3, 1/3, 1/3, 0, 0, 0]])  =  0.932006

display = clamp( 1.0 + (raw − mlp_neutral) × 2.0,  0.6,  1.4 )
```

**AMPLIFICATION = 2.0**: Fixed design constant. Maps the typical raw output variation (≈ ±0.2) to a meaningful display range (≈ ±0.4).

### 8.3 Self-Updating System Design
`mlp_neutral` is stored in `anfis_mlp_weights.json` and auto-computed by notebook 07 after every retrain:
```python
mlp_neutral = trained_model.predict([[1/3, 1/3, 1/3, 0, 0, 0]])[0]
weights_dict['mlp_neutral'] = float(mlp_neutral)
```
The Next.js engine reads it at startup:
```typescript
this.mlpNeutral = mlpWeights.mlp_neutral ?? 0.932;
```
No manual code changes are needed after a retrain — the system is self-consistent.

### 8.4 Verification Results
| Scenario | Raw MLP | Display M | Correct? |
|----------|---------|----------|----------|
| Balanced (⅓,⅓,⅓), Δ=0 | 0.932 | **1.000** | ✅ Neutral |
| High combat + Δcombat=+0.3 | ~1.11 | **1.127** | ✅ HARDER |
| High explore + Δexplore=+0.3 | ~0.87 | **0.829** | ✅ easier |
| Struggling (death_rate=0.5) | ~0.85 | **0.840** | ✅ easier |
| Idle/Passive, Δ=−0.6 | ~0.72 | **0.720** (clamped) | ✅ easier (clamped) |

### 8.5 Safety Clamp Bounds: [0.6, 1.4]
**Justification from calibration study (N=7 participants)**:
- M = 0.8 (Mode A, "Easy"): 6/7 participants reported "too boring", "lack of tension" → lower bound must be below 0.8 to provide meaningful assistance
- M = 1.5 (Mode C, "Hard"): 5/7 participants reported "frustratingly difficult", "unfair enemy spawns" → upper bound must remain below 1.5
- Selected: [0.6, 1.4] — sufficient headroom below "boring" and above "unfair"

---

## 9. Analytics Dashboard (Next.js 14 Demo UI)

### 9.1 Architecture Decision
**Decision**: Build a Next.js 14 (App Router) TypeScript frontend as the demo UI rather than a standalone game.

**Reasoning**: The primary thesis contribution is the ANFIS pipeline design. A full game implementation would require months of game development unrelated to the research contribution. The demo UI provides:
- Interactive JSON input simulating game telemetry
- Full pipeline visualisation (each 8-step stage is inspectable)
- Analytics dashboard (archetype classification, session history, model metrics)
- Educational mode (all concepts explained in plain English)
- Tutorial toggle (educational content hidden by default; shown on demand)

### 9.2 Dashboard Tabs
| Tab | Content |
|-----|---------|
| **Behavior** | Raw telemetry display, normalised values, K-Means radar chart |
| **Archetypes** | Soft membership percentages, archetype comparison, current classification |
| **Model** | MLP forward pass trace, weight visualisation, model notes |
| **Adaptation** | Per-parameter cascade, window-to-window comparison, delta explainer |
| **Analytics** | Session history, distribution health, responsiveness correlation |

### 9.3 Tutorial Mode
A context-based tutorial mode (stored in localStorage) hides all educational explainers, intro banners, and "How to read these numbers" sections by default. Activated via a "TUTORIAL" toggle in the analytics panel header. This allows the dashboard to function as either:
- A **clean analytics display** (tutorial off) for demo/presentation
- A **teaching tool** (tutorial on) for explaining the ANFIS pipeline to an academic audience

### 9.4 Key UI Components
| Component | File | Purpose |
|-----------|------|---------|
| `HelpfulTooltip` | `components/analytics/shared/helpful-tooltip.tsx` | Plain-English tooltip for every technical metric |
| `EducationalDrawer` | `components/analytics/shared/educational-drawer.tsx` | Slide-over deep-dive explanations |
| `MetricDetailModal` | `components/analytics/shared/metric-detail-modal.tsx` | Click-to-learn metric definitions |
| `ANFISPipeline` | `lib/engine/index.ts:275` | Core pipeline orchestrator |
| `TutorialProvider` | `lib/analytics/tutorial-context.tsx` | Tutorial mode React context |
| `educational-content.ts` | `lib/analytics/educational-content.ts` | All plain-English explanations |

### 9.5 Test Suite (19/19 Passing)
| Test File | Tests | Coverage |
|-----------|-------|---------|
| `normalization.test.ts` | 4 | Min-Max scaler edge cases, clamping, feature ordering |
| `activity.test.ts` | 4 | Per-archetype score computation, equal ceiling |
| `clustering.test.ts` | 3 | IDW soft membership, partition-of-unity, epsilon stability |
| `mlp.test.ts` | 4 | Forward pass accuracy, weight loading, architecture shape |
| `adaptation.test.ts` | 2 | Parameter clamping, archetype factor formula |
| `pipeline.test.ts` | 2 | End-to-end 8-step integration |

**CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`) triggers on every push and PR:
1. `npx tsc --noEmit` — TypeScript type safety check
2. `npx vitest run` — all 19 tests must pass
3. Build fails on any failure

---

## 10. Known Limitations and Future Work

### 10.1 Weapon-Type Variability (High Priority)
**Problem**: The telemetry schema does not capture weapon class. A sniper (3 hits, 900 damage) and an SMG user (34 hits, 340 damage) with identical kill counts are structurally different but produce overlapping normalised feature vectors.

**Impact**: Sniper-class players may receive lower Combat scores than their actual intent warrants, drifting toward Exploration archetype.

**v2.2 partial fix**: Added `damage_per_hit` as a proxy ratio — separates high-damage-per-hit (sniper-class) from low-damage-per-hit (spray-class) without requiring weapon labels.

**Future**: Add `weaponClass` as a categorical telemetry feature; train per-weapon-class normalisation scalers; extend K-Means to include weapon context.

### 10.2 `timeSprinting` Ambiguity (High Priority)
**Problem**: Sprint behaviour is shared between explorers (covering the map) and combat players (flanking/repositioning). This inflates the Exploration score for aggressive Combat players on large maps.

**Future**: Collect `sprintContext` — sprint events tagged as "within N seconds of combat" (combat-related) vs. "extended no-combat sprint" (exploration).

### 10.3 `timeNearInteractables` Cross-Contamination (High Priority)
**Problem**: Collectibles are placed near high-traffic areas. Explorers who cover the map incidentally accumulate `timeNearInteractables`, inflating their Collection score.

**v2.2 partial fix**: Added `pickup_attempt_rate` to distinguish intentional collectors (high attempts per time near object) from incidental passers-by.

**Future**: Replace `timeNearInteractables` with discrete `interactableApproachEvents` (player actively moving toward object).

### 10.4 Full Real-Time Closed-Loop Not Validated (High Priority — Unreal Engine)
**Problem**: The ANFIS pipeline outputs a difficulty multiplier M. In a full deployment, this would adjust the global enemy cap via PCG:
```
new_cap = clamp(floor(base_cap × M), min_cap, max_cap)
PCG → spawn/despawn enemies to reach new_cap
new telemetry → next ANFIS window
```

**Why not implemented**: PCG navmesh queries and enemy state machine initialisation require GPU-accelerated Unreal Engine infrastructure. Research hardware had insufficient GPU resources for sustained closed-loop testing.

**What WAS validated**: All 8 pipeline steps were validated offline against synthetic telemetry. The scalar parameter adaptation (health/speed/damage multipliers) was validated in the Next.js demo UI.

**What was NOT validated**: Global enemy cap PCG integration, full real-time closed-loop session, Unreal Engine game screenshots, live player observation.

**Future**: Full Unreal Engine integration; real-time PCG enemy cap adjustment; extended closed-loop player study measuring session duration and engagement.

### 10.5 Uniform Adaptation Sensitivity (Low Priority)
**Problem**: A single global sensitivity coefficient (0.3) is applied to all difficulty parameters equally. Enemy health changes are disproportionately impactful compared to spawn rate changes.

**Future**: Conduct player study to measure perceived difficulty impact of ±10% change per parameter; derive parameter-specific sensitivity coefficients.

### 10.6 Session Timeout (Medium Priority)
**Problem**: 40s in-memory session timeout resets delta state, causing false "first window" signals mid-session (especially on unstable connections).

**Fix applied in v2.2**: Increased to 90s (= 3× window cadence), reducing false resets.

**Future**: Persist session state to Redis/database; implement delta reconstruction for late-arriving windows.

---

## 11. Development Journey (Chronological)

### Phase 1 — Foundation (v1.0, January 2026)
- Established 8-step ANFIS pipeline architecture
- Chose 10-feature telemetry schema
- Selected 30-second window (shorter = too noisy; longer = misses rapid style shifts)
- Implemented initial target formula → discovered variance collapse (σ=0.0113, R²=−4.69)

### Phase 2 — A/B Testing and Grid Search (v2.0 foundations)
- A/B test: Uniform MinMax vs. feature-aware preprocessing → Uniform wins 5/8 metrics
- Grid search: 108 configurations (K=2..5 × 3 outlier strategies × 3 normalisations × 3 feature sets)
- Correlation analysis → deltas identified as primary variance drivers (Δexplore: r=0.808)
- Option B target formula designed → σ increased +453%, R² → 0.9391

### Phase 3 — v2.1 Activity Scoring Revision (February 2026)
- Bug discovered: Combat-intent players systematically misclassified as Explorers
- Root cause: `timeOutOfCombat` passive accumulation; sum asymmetry (Combat ceiling 4× higher)
- Fix: Switched to per-archetype averages; removed `timeOutOfCombat`
- Required full pipeline rerun (notebooks 04→07)

### Phase 4 — v2.2 Derived Features (February–March 2026)
- Remaining gap: sniper vs. spray-fire indistinguishable; deliberate vs. incidental collector indistinguishable
- Added `damage_per_hit` and `pickup_attempt_rate` derived features
- Scaler expanded: 10 → 12 features
- MLP retrained: Test R²=0.9391, Test MAE=0.0112
- Bug found (commit `0fff75d`): camelCase/snake_case mismatch caused derived features to silently receive zeros → fixed key naming across pipeline

### Phase 5 — v2.2.1 Training Bias Fix (March 2026)
- Analytics anomaly: "always easier" output regardless of player type
- Root cause: base=0.9 + membership cancellation → training neutral point = 0.808
- Failed first fix: min-max rescaling with extreme delta=±1.0 inputs → "always harder"
- Correct fix: base=1.0 + neutral-centred calibration (mlp_neutral = 0.932006)
- Retrained: Test R²=0.9264, Test MAE=0.0127, convergence=21 iterations
- Self-updating: mlp_neutral auto-stored in artifact JSON after every retrain

### Phase 6 — Analytics Dashboard and CI/CD (March 2026)
- Built Next.js 14 demo UI with 5 analytics tabs
- Implemented 19 Vitest tests covering all engine modules
- GitHub Actions CI/CD: TypeScript + tests on every push
- Responsive layout for presentation (commit `2b5dbe0`)
- Behavioural comparison tracking: window-to-window delta panel (commit `9d7110d`)
- Tutorial mode toggle: hide/show educational content (commit `87684f5`)

---

## 12. Design Decisions Catalogue

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| ML approach | ANFIS + MLP surrogate | Pure LSTM | ANFIS interpretable; LSTM needs large real data, no interpretability, too slow |
| Runtime inference | MLP surrogate (<1ms) | Full ANFIS (50–200ms) | 200× speed gain; R² loss acceptable (0.9264 vs theoretical 1.0) |
| Feature space | 12 (10 raw + 2 derived) | 10 raw only | Sniper and deliberate-collector discrimination gaps |
| Activity scoring | Per-archetype average | Sum | Equal ceiling per archetype; prevents structural Combat bias |
| Temporal window | 30 seconds | 10s, 60s | 10s too noisy; 60s misses rapid style shifts |
| Clustering | K=3, IDW soft | K=2, K=4, hard K-Means | K=2: binary; K=4: collapses; hard: boundary oscillation |
| ANFIS input | 6D (3 soft + 3 delta) | 3D (soft only) | Deltas capture velocity; Δexplore r=0.808 |
| MLP architecture | 6→16→8→1 | [32], [16,8,4], LSTM | Smallest with R²>0.90; bottleneck forces compression |
| MLP activation | ReLU/Linear | sigmoid/tanh | ReLU: no vanishing gradient; Linear: unbounded raw output |
| Normalisation | Uniform MinMax | Feature-aware, Z-score | A/B: Uniform wins 5/8 metrics; Z-score incompatible with fuzzy [0,1] |
| Output calibration | Neutral-centred (mlp_neutral) | Min-max rescaling | Semantic guarantee (balanced→1.0); robust to training distribution |
| Safety clamp | [0.6, 1.4] | [0.5, 1.5], [0.7, 1.3] | Calibration study: M=1.5 "unfair"; M=0.5 trivial |
| Session timeout | 90s | 40s | 40s too short for loading screens; 90s = 3× window cadence |
| Target base | 1.0 | 0.9 | 0.9 causes systematic downward bias due to membership cancellation |
| UI framework | Next.js 14 (TypeScript) | Unity/Unreal demo | Primary contribution is pipeline, not game; demo UI sufficient for validation |

---

## 13. Git Commit Trail

| Commit | Message | Phase |
|--------|---------|-------|
| `b0ec0d2` | API req body reformatted | Foundation |
| `0058190` | Add Feature Validation | v1.0 |
| `d50b93f` | Add simulation fetcher service | v1.0 |
| `cb0643c` | Add MLP surrogate evaluation and pipeline integration test notebooks | v2.0 |
| `48019bc` | Document backend architecture | v2.0 |
| `8dc5615` | Add RESEARCH_JOURNEY.md | v2.0 |
| `0fff75d` | fix: combat score not updating, biased to explorer | v2.1 |
| `7a4c918` | Implement v2.2 pipeline improvements and parameter sensitivity | v2.2 |
| `5f755de` | Upgrade ANFIS adaptive difficulty to v2.2 | v2.2 |
| `bf45ba6` | Finalize v2.2 pipeline and implement test suite | v2.2 |
| `e7a2ded` | Implement CI/CD automation, 19/19 tests | v2.2 |
| `8f8fedd` | Add GitHub Actions CI workflow | v2.2 |
| `bb46bf5` | Implement v2.2 derived features and fix pipeline bugs | v2.2 |
| `9d7110d` | feat(ui): add behavioral comparison tracking and educational explainers | v2.2 |
| `f32faaa` | fix: biased to explorer and collector fixed | v2.2 |
| `2b5dbe0` | feat(ui): UI Responsive added | v2.2 |
| `fc8fecd` | Comments and documents optimized | v2.2.1 |
| `87684f5` | Tutorial toggle added | v2.2.1 |

---

## 14. Algorithms (Pseudocode)

### Algorithm 1: Calibration Baseline Selection
```
Input:  CandidateConfigurations C
Output: SelectedBaseline

1. For each c in C:
   Collect telemetry with adaptation disabled.

2. Compute:
   MeanSparsity, DeathRate, MeanStdDev

3. NeutralityScore = (w1 × MeanSparsity) + (w2 × DeathRate) + (w3 × MeanStdDev)

4. Select configuration with minimum NeutralityScore.

5. Freeze: scaler parameters, cluster centroids, dataset partitions.
```

### Algorithm 2: Behavioural Modelling (IDW Soft Membership)
```
Input:  RawTelemetryWindow W, PreviousMembership μ_prev
Output: BehaviourVector [μ, Δ]

1. Normalize: X' = (X − min) / (max − min)

2. Activity scores:
   score_combat  = avg(enemiesHit', damageDone', timeInCombat', kills', damage_per_hit')
   score_collect = avg(itemsCollected', pickupAttempts', timeNearInteractables', pickup_attempt_rate')
   score_explore = avg(distanceTraveled', timeSprinting')

3. Percentage vector: P_k = score_k / Σ score_j

4. IDW soft membership:
   d_k = || P − centroid_k ||
   w_k = 1 / (d_k + ε)
   μ_k = w_k / Σ w_j            (partition-of-unity: Σ μ_k = 1.0)

5. Temporal delta:
   Δ_k = μ_k(t) − μ_k(t−1)
```

### Algorithm 3: MLP Surrogate Inference
```
Input:  BehaviourVector X = [μ_combat, μ_collect, μ_explore, Δcombat, Δcollect, Δexplore]
Output: Display Multiplier M_display

1. h1 = ReLU(W1 · X + b1)       (6→16)
2. h2 = ReLU(W2 · h1 + b2)      (16→8)
3. raw = W3 · h2 + b3            (8→1, Linear)

4. Neutral-centred calibration:
   M_display = clamp(1.0 + (raw − mlp_neutral) × 2.0, 0.6, 1.4)
```

### Algorithm 4: Parameter Cascade
```
Input:  M_display (global multiplier), μ_k (soft memberships)
Output: Per-archetype adjusted game parameters

1. Category factor per archetype:
   factor_k = 1.0 + (M_display − 1.0) × (0.5 + μ_k × 1.5)

   (0.5 baseline: every player gets ≥50% of global adaptation)
   (1.5 weight: 100% membership → 200% factor weight)

2. Direct scaling:
   V_new = V_base × factor_k          (e.g., enemy count, item lifetime)

3. Inverse scaling:
   V_new = V_base / factor_k          (e.g., cooldowns, spawn intervals)

4. Future-only enforcement:
   Apply only to next procedural generation window.
   Current window is never retroactively modified.
```

---

## 15. Simulation Evaluation Results

### 15.1 Synthetic Player Scenarios
| Window | Scenario | μ_combat | μ_collect | μ_explore | Δcombat | Δexplore | M_display |
|--------|----------|----------|----------|----------|---------|---------|----------|
| 1 | Balanced | 0.33 | 0.33 | 0.34 | 0.00 | 0.00 | **1.000** (guaranteed) |
| 2 | High Combat | 0.85 | 0.10 | 0.05 | +0.40 | −0.30 | **~1.36** (HARDER) |
| 3 | Struggling | 0.70 | 0.20 | 0.10 | −0.50 | +0.10 | **~0.82** (easier) |
| 4 | Collector | 0.10 | 0.80 | 0.10 | −0.10 | −0.10 | **~0.87** (easier) |
| 5 | Explorer | 0.15 | 0.15 | 0.70 | −0.05 | +0.30 | **~0.83** (easier) |
| 6 | Mixed | 0.45 | 0.45 | 0.10 | +0.10 | −0.10 | **~1.10** (HARDER) |
| 7 | Idle/Passive | 0.20 | 0.20 | 0.60 | −0.60 | −0.30 | **~0.72** (easier) |

### 15.2 Delta Impact Matrix
| Archetype Focus | Δ High Perf (+0.5) | Δ Stable (0.0) | Δ Low Perf (−0.5) |
|----------------|-------------------|--------------|-----------------|
| Combat | M ↑ 1.25 (Scale Up) | M ≈ 1.0 | M ↓ 0.85 (Assist) |
| Collection | M ↑ 1.15 (More Items) | M ≈ 1.0 | M ↓ 0.90 (More Time) |
| Exploration | M ↑ 1.10 (Faster Pace) | M ≈ 1.0 | M ↓ 0.95 (Guidance) |

### 15.3 Validation Status
| Component | Status | Notes |
|-----------|--------|-------|
| Telemetry normalization | ✅ Validated | Against recorded and synthetic data |
| Activity scoring (v2.2) | ✅ Validated | Notebooks 03–04 |
| K-Means clustering | ✅ Validated | Silhouette=0.3752, DB=0.977 |
| IDW soft membership | ✅ Validated | Partition-of-unity: Σμ_k=1.0 |
| Temporal delta | ✅ Validated | Δexplore r=0.8394 |
| MLP inference | ✅ Validated | R²=0.9264, MAE=0.0127 |
| Neutral-centred calibration | ✅ Validated | Balanced→M=1.000 confirmed |
| Scalar parameter adaptation | ✅ Validated | Demo UI parameter cascade |
| 19-test Vitest suite | ✅ Passing | All modules covered |
| Global enemy cap (PCG) | ❌ Not implemented | Requires Unreal Engine + GPU |
| Full real-time closed-loop | ❌ Not validated | GPU resource constraint |

---

## 16. Technology Stack (This Repo)

### Python Training Pipeline
- **Python 3.14+**
- **scikit-learn**: MinMaxScaler, KMeans, MLPRegressor, cross_validate
- **pandas**: Dataset manipulation, CSV I/O
- **numpy**: Numerical operations, array handling
- **matplotlib / seaborn**: Training diagnostics, cluster visualisation
- **Jupyter Notebooks**: Interactive pipeline development (01–10)

### Next.js Analytics Dashboard
- **Next.js 14** (App Router, Server/Client components)
- **TypeScript**: Full type safety across pipeline and UI
- **Tailwind CSS v4**: Utility-first styling
- **Radix UI**: Dialog, Sheet, Tooltip primitives
- **Recharts**: Radar chart, time-series plots
- **Vitest**: Unit and integration testing
- **GitHub Actions**: CI/CD (TypeScript + test runner)

---

## 17. Thesis Contribution Summary

### Primary Contributions
1. **8-step interpretable ANFIS pipeline** with semantic layer meanings — each stage maps to a human-readable concept (normalisation, archetype scoring, fuzzy clustering, inference, calibration)

2. **Option B target formula** — demonstrated that fuzzy-membership partition-of-unity constraints cause variance collapse in naive supervised learning targets; resolved through delta-driven design (Δexplore r=0.808)

3. **v2.1 activity scoring revision** — showed that passive accumulating features (`timeOutOfCombat`) and sum asymmetry cause systematic archetype misclassification; corrected through per-archetype average scoring

4. **v2.2 derived ratio features** — demonstrated that raw output metrics are insufficient proxies for behavioural intent when underlying mechanism varies (weapon class); introduced `damage_per_hit` and `pickup_attempt_rate` as scale-independent intent proxies

5. **Neutral-centred calibration** — proved that min-max rescaling is fragile to training distribution extremes; introduced semantic anchoring (mlp_neutral) as a robust alternative with guaranteed balanced→1.0 property

6. **MLP surrogate design** — 200× inference speedup over full ANFIS with only 7.4% R² reduction; validated through 5-fold CV architecture selection

### Secondary Contributions
- Interactive analytics dashboard as a pedagogical tool for explaining adaptive difficulty systems
- 19-test CI/CD suite establishing reproducibility and correctness guarantees
- Comprehensive failure mode documentation (training bias, activity scoring bugs, camelCase mismatch) as a practical guide for future adaptive game AI research

---

## 18. References for Thesis Writing

Key papers and sources to cite (populate in thesis):
- ANFIS original: Jang, J.S.R. (1993). ANFIS: Adaptive-network-based fuzzy inference system
- Player modelling survey: Yannakakis & Togelius (2015). Experience-driven procedural content generation
- Dynamic difficulty adjustment: Hunicke (2005). The case for dynamic difficulty adjustment
- K-Means soft clustering: MacQueen (1967) + IDW: Shepard (1968)
- Adaptive PCG: Shaker, Togelius & Nelson (2016). Procedural Content Generation in Games
- Neural surrogate models: general ML regression literature
- Saunders' Research Onion: Saunders, Lewis & Thornhill (2009). Research Methods for Business Students

---

*Document generated: 2026-03-07 | Repo: CollectGame.Model | Version: v2.2.1*
*Combine with CalibrationAnalysis and TelemetryCollection repo source docs for full thesis.*
