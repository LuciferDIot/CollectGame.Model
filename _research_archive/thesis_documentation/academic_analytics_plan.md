# Academic Analytics Board - Implementation Plan

**Objective**: Upgrade runtime diagnostics to a **Thesis-Grade Evaluation Board** that explicitly separates *Offline Accuracy* (static) from *Runtime Validity* (dynamic).

**Core Philosophy**:
1.  **Offline Trust Anchor**: Show proven training metrics (R^2, MAE) first.
2.  **Online Correctness**: Verify runtime behavior matches training distributions (not "accuracy").
3.  **Comparative Proof**: Explicitly show Option B improvements over Original.

---

##  Architecture: The 5 Sections

###  Section 1: Model Evaluation (Offline Trust Anchor)
*   **Type**: Static (Hardcoded validated metrics)
*   **Content**:
    *   Train R^2: **0.955** | Test R^2: **0.956**
    *   MAE: **0.013**
    *   Target Std: **0.062** (5.5x gain)
    *   Target Span: **0.41** (18x gain)
*   **Component**: `components/analytics/model-evaluation-card.tsx`

###  Section 2: Runtime Consistency (Online Validity)
*   **Type**: Dynamic (Per-round)
*   **Content**:
    *   **Distribution Check**: Current $M$ vs Training Mean $\pm 2\sigma$.
    *   **Clamp Pressure**: % rounds clamped (Safe zone: 0-5%).
*   **Updates**:
    *   Modify `PredictionHealth` to include "Training Bands".
    *   Refine `ClampMonitor` to be the "Stability Score".

###  Section 3: Responsiveness Accuracy (Correlation)
*   **Type**: Dynamic (Rolling window)
*   **Content**:
    *   **Rolling Correlation**: $corr(|\Delta Behavior|, |\Delta M|)$.
    *   **Interpretation**:
        *   $>0.6$: Strong Alignment (Done)
        *   $0.3-0.6$: Moderate
        *   $<0.3$: Weak Coupling (Note:)
*   **Updates**:
    *   Update `compute.ts` to calculate Pearson correlation on rolling window.
    *   Update `ResponsivenessIndicator` to use correlation instead of heuristics.

###  Section 4: Contribution Breakdown (Integrity)
*   **Type**: Dynamic
*   **Content**:
    *   Relative contribution of **Deltas** vs **Soft Membership** vs **Death Penalty**.
    *   Shows *why* the prediction moved.
*   **Component**: `components/analytics/feature-contribution.tsx`

###  Section 5: Comparative Evidence (Why Option B?)
*   **Type**: Static Comparison
*   **Content**: Table comparing Original vs. Option B.
    *   Std: 0.011 $\to$ 0.062
    *   Span: 0.023 $\to$ 0.41
    *   R^2: -4.69 $\to$ 0.96
*   **Component**: `components/analytics/comparative-panel.tsx`

---

##  Implementation Steps

### Step 1: Analytics Engine Upgrade (`lib/analytics/compute.ts`)
*   Add `computeRollingCorrelation(x[], y[])`.
*   Add `checkDistributionConsistency(val, mean, std)`.
*   Establish `OFFLINE_METRICS` constant (The "Truth").

### Step 2: New UI Components
*   Create `ModelEvaluationCard` (Section 1).
*   Create `ComparativePanel` (Section 5).
*   Create `FeatureContribution` (Section 4).

### Step 3: Component Enhancements
*   Upgrade `PredictionHealth` with "Training Distribution Band" visual.
*   Upgrade `ResponsivenessIndicator` to use correlation math.

### Step 4: Dashboard Integration
*   Rebuild `AnalyticsTab` to follow the 5-Section Academic Layout.
*   Add explicit "Offline" vs "Online" labels.

---

## Constraints Checklist
*   No Model Retraining.
*   No "Runtime R^2" (impossible).
*   No formula changes.
*   All new panels are Read-Only views.

##  Deliverable
A dashboard that answers: *"How do we know it works?"* via **Offline Proof + Online Consistency**.

