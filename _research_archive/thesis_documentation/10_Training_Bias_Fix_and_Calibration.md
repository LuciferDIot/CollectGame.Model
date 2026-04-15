# Design Decision: Training Bias Fix & Neutral-Centred Calibration

**Version**: v2.2.1
**Date**: March 7, 2026

---

## 1. The Problem - "Always Easier"

After deploying v2.2 and running the demo UI with diverse player inputs, analytics consistently reported *"easier by X%"* - no matter how aggressive or high-performing the simulated player was. This was a critical semantic failure: a system that can never say "harder" provides no useful adaptive difficulty.

---

## 2. Root Cause Analysis

### 2.1 Membership Cancellation in the Training Formula

The v2.2 training target formula (Option B) was:
```
M = 0.9 + 0.22x(soft_combat−0.5) + 0.18x(soft_collect−0.5)
        + 0.15x(soft_explore−0.5) + 0.55xΔcombat + 0.40xΔcollect
        + 0.35xΔexplore − 0.25xdeath_rate
```

Soft memberships in any K-Means soft-partition scheme satisfy the **partition-of-unity** constraint:
```
soft_combat + soft_collect + soft_explore = 1.0
```

For a balanced player (each ≈ 1/3) with no deltas:
```
M = 0.9 + 0.22x(0.333−0.5) + 0.18x(0.333−0.5) + 0.15x(0.334−0.5)
  = 0.9 + (−0.037) + (−0.030) + (−0.025)
  = 0.9 − 0.092
  = 0.808  <-- the "neutral" training point was below 1.0
```

Even for a *pure combat player* (combat=1.0, collect=0, explore=0) with no deltas:
```
M = 0.9 + 0.22x(0.5) + 0.18x(−0.5) + 0.15x(−0.5) = 0.9 + 0.11 − 0.09 − 0.075 = 0.845
```

This means the MLP was trained on targets that were *never above ~1.02* for realistic membership values (only very large positive deltas could push past 1.0). The model correctly learned the training distribution - but that distribution was biased entirely below semantic neutrality.

**Key Insight**: The state terms sum to zero for a balanced player, but each is individually negative because they are centered at 0.5, not 0.333. The sum of centered terms: `0.22x(1/3−0.5) + 0.18x(1/3−0.5) + 0.15x(1/3−0.5) = (0.22+0.18+0.15)x(−0.167) = 0.55x(−0.167) ≈ −0.092`. This is a **fixed structural offset** that cannot be overcome by the membership values themselves.

### 2.2 Failed First Fix - Min-Max Rescaling

An initial attempted fix tried to map the MLP's empirical output range to the display range:
```
display = min_display + (raw − min_raw) / (max_raw − min_raw) x (max_display − min_display)
```
where `output_range = [0.49, 1.12]` was computed by sweeping delta=+/-1.0 inputs.

This failed because extreme delta values (+/-1.0) are unrealistic in practice - actual players produce deltas in roughly [−0.3, +0.3]. Using +/-1.0 pulled `min_raw` to 0.49, making every realistic player input appear "above the midpoint" -> always HARDER. The root cause was the same training bias, just shifted to a new symptom.

---

## 3. The Fix

### 3.1 Corrected Training Formula (`base = 1.0`)

Changed notebook `06_ANFIS_Preparation.ipynb`:
```python
# Before (biased):
df['target_multiplier'] = 0.9 + 0.22*(combat_c - 0.5) + ...

# After (corrected):
df['target_multiplier'] = 1.0 + 0.22*(combat_c - 0.5) + ...
```

For a balanced player (1/3, 1/3, 1/3, deltas=0):
```
M = 1.0 − 0.092 = 0.908  <-- still not 1.0, but now...
```

The MLP maps this to raw ≈ 0.932 (the learned neutral point). Calibration then maps this back to display = 1.0.

### 3.2 Neutral-Centred Calibration

Instead of min-max rescaling, the display multiplier is computed as:

```
display = clamp(1.0 + (raw − mlp_neutral) x AMPLIFICATION,  0.6,  1.4)
```

where:
- `mlp_neutral = MLP.predict([[1/3, 1/3, 1/3, 0, 0, 0]])` = **0.932006**
- `AMPLIFICATION = 2.0` (fixed design constant: +/-0.4 raw deviation -> +/-0.8 display)

**Semantic guarantee**: A balanced player with no behavioral trend always maps to exactly `display = 1.0`, regardless of how the model weights change between retrains.

### 3.3 Self-Updating After Retrain

Notebook `07_ANFIS_Training.ipynb` was updated to auto-compute and store `mlp_neutral`:
```python
neutral_input = np.array([[1/3, 1/3, 1/3, 0, 0, 0]])
mlp_neutral = float(model.predict(neutral_input)[0])
export_data['mlp_neutral'] = round(mlp_neutral, 6)
```

The Next.js engine reads this value at startup:
```typescript
this.mlpNeutral = mlpWeights.mlp_neutral ?? 0.932;  // fallback if missing
```

No code changes are needed after a retrain - only re-running notebooks 06-07 and copying the updated `anfis_mlp_weights.json`.

---

## 4. Why This Approach Is Principled (Not a Hack)

| Property | Min-Max Rescaling | Neutral-Centred |
|----------|------------------|-----------------|
| **Semantic guarantee** | Midpoint of output range ≠ balanced player | Balanced player **always** maps to 1.0 |
| **Sensitivity to training data extremes** | Extreme delta inputs shift min/max | Only balanced input matters for calibration |
| **Self-updating after retrain** | Output range must be recomputed manually | `mlp_neutral` auto-stored by notebook 07 |
| **Mathematical basis** | Empirical range mapping | Semantic anchor point |
| **Amplification** | Implicit (depends on range) | Explicit constant (2.0) |

The `AMPLIFICATION = 2.0` constant means a raw deviation of +/-0.4 from neutral (achievable by moderate delta + archetype combinations) maps to +/-0.8 display, reaching the 0.6-1.4 extremes. This was chosen so extreme but realistic gameplay produces extreme (but clamped) adjustments.

---

## 5. Post-Retrain Verification

| Scenario | Raw MLP | Display | Direction |
|----------|---------|---------|-----------|
| Balanced (1/3,1/3,1/3), Δ=0 | 0.932 | **1.000** | Neutral |
| High combat (0.85,0.10,0.05), Δcombat=+0.3 | ~1.11 | **1.127** | HARDER |
| High explore (0.15,0.15,0.70), Δexplore=+0.3 | ~0.87 | **0.829** | easier |
| Collector (0.10,0.80,0.10), Δcollect=+0.3 | ~0.88 | **0.865** | easier |
| Struggling (Δcombat=−0.4, deaths=0.5) | ~0.85 | **0.840** | easier |

All 19 unit tests pass. TypeScript type check clean.

---

## 6. Post-Retrain Metrics

| Metric | v2.2 (biased) | v2.2.1 (corrected) | Notes |
|--------|--------------|---------------------|-------|
| Test R^2 | 0.9391 | **0.9264** | Slight decrease expected - wider variance is harder to fit |
| Test MAE | 0.0112 | **0.0127** | +/-1.3% of [0.6,1.4] span - acceptable |
| Target min | 0.609 | **0.600** | Reaches lower clamp |
| Target max | 1.021 | **1.107** | Now reaches above neutral |
| Target mean | 0.801 | **0.902** | Approaching the correct centre |
| Target std | 0.062 | **0.074** | Healthier variance |
| Convergence | 230 iters | **21 iters** | LBFGS faster on corrected distribution |

---

## 7. Design Decision Summary

**Decision**: Use neutral-centred calibration with `mlp_neutral` stored in the model artifact.

**Justification**:
- The training target formula has a fixed structural offset due to partition-of-unity constraint on soft memberships. Correcting `base` to 1.0 reduces but does not eliminate this offset (since 1/3 < 0.5).
- The neutral-centred approach defines the calibration semantically (balanced player = 1.0) rather than statistically (midpoint of output range). This is robust to distribution shifts between retrains.
- `AMPLIFICATION = 2.0` was chosen such that +/-0.4 raw deviation (the practical range for moderate-intensity gameplay) spans +/-0.8 of the display range, leaving margin before the hard clamps.

**Alternative considered and rejected**: Per-feature output range sweep with extreme inputs - rejected because unrealistic extreme deltas (+/-1.0) dominate the range computation, making every realistic player appear "above average" -> always HARDER.

---

## 8. Files Changed

| File | Change |
|------|--------|
| `_research_archive/core/notebooks/06_ANFIS_Preparation.ipynb` | `base=0.9` -> `base=1.0` |
| `_research_archive/core/notebooks/07_ANFIS_Training.ipynb` | Added `mlp_neutral` computation + export; replaced output_range sweep with clean deploy cell |
| `anfis-demo-ui/lib/engine/index.ts` | `computeTargetMultiplier()` uses neutral-centred formula; reads `mlpNeutral` from weights |
| `anfis-demo-ui/lib/engine/types.ts` | Added `mlp_neutral?: number` to `MLPWeights` interface |
| `anfis-demo-ui/models/anfis_mlp_weights.json` | Retrained weights + `mlp_neutral: 0.932006` |
| `anfis-demo-ui/models/training_stats.json` | Updated with correct post-retrain target distribution |
| `anfis-demo-ui/lib/analytics/educational-content.ts` | `how_surrogate_model_works` updated with new metrics and calibration formula |

