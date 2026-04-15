# Thesis Source Document - CollectGame.CalibrationAnalysis Repository
**System**: AURA (Adaptive User-Responsive Architecture)
**Repo**: CollectGame.CalibrationAnalysis
**Phase**: Pre-Adaptation Calibration
**Date**: January 2026 (complete by 2026-01-19)
**Author**: K. W. J. P. Geevinda

> This document covers the calibration phase of AURA - the controlled study that established the neutral gameplay baseline before the adaptive system was trained. Combine with `repo_CollectGame_Model_thesis_source.md` and `repo_Telemetry_thesis_source.md` for the full thesis.

---

## 1. Purpose and Position in AURA Pipeline

The CalibrationAnalysis repo implements the **pre-adaptation calibration phase** - the first phase of AURA before any adaptive learning occurs.

```
[THIS REPO]
Telemetry (30s windows, from game)
    v
Calibration Dataset Construction   <-- CollectGame.CalibrationAnalysis
    v
Normalisation
    v
Behavioural Clustering
    v
Percentages + Temporal Deltas
    v
ANFIS Reasoning Layer              <-- CollectGame.Model
    v
Real-Time Procedural Content Adaptation
```

**What this phase does NOT do**:
- Does not perform learning, clustering, or adaptation
- Does not retroactively modify any data values
- Does not alter the raw telemetry logs (immutability principle)

**What it does**:
- Constructs a derived, analysis-ready calibration dataset from raw telemetry and death events
- Characterises baseline behavioural tendencies per game mode
- Selects the neutral baseline mode using a composite neutrality score
- Derives initial PCG parameter targets from the selected baseline
- Integrates subjective survey responses and reconciles them with objective telemetry

---

## 2. Study Design

### 2.1 Participants
- **N = 7** participants
- Within-subjects design: each participant played **all three modes** in randomised order
- Blind exposure: modes presented without difficulty labels to prevent demand characteristics
- **Consent**: `consentAgreed` field in the user registration payload; all participants formally consented

### 2.2 Game Modes
Three pre-configured game modes spanning a difficulty range:

| Mode ID | Assigned Label | Role in Study |
|---------|---------------|---------------|
| 1 | Unlabelled | Candidate neutral baseline |
| 2 | Unlabelled | Candidate lower bound (easier) |
| 3 | Unlabelled | Candidate upper bound (harder) |

Participants were not informed of these labels during play.

### 2.3 Data Collection Protocol
- Telemetry collected in **30-second windows** via the CollectGame.Telemetry backend
- Death events logged separately as discrete timestamped events
- Post-session survey: Likert-scale questionnaire on combat fairness, exploration comfort, collectible availability, and categorical votes (most balanced / too easy / too difficult / would play longer)
- Telemetry endpoint: `POST /api/calibration/telemetry` (see Telemetry repo)

---

## 3. Notebook Pipeline (7 Notebooks)

### Notebook 00 - Dataset Generation (`00_generate_calibration_dataset.ipynb`)
**Purpose**: Temporal alignment of raw telemetry windows with discrete death events.

**Alignment Rule**:
> A death event is associated with the **nearest following telemetry window** for the same user and mode: `DeathTime ≤ TelemetryWindowTime`

This aligns each death with the window that contains it (telemetry timestamps mark the end of the 30s interval).

**Outputs**:
- `data/processed/calibration_dataset.csv` - augmented with:
  - `deathOccurredInWindow` (binary 0/1)
  - `deathCountInWindow` (integer count)
- Handling multiple deaths: if multiple deaths fall in one window, `deathCountInWindow` reflects the total count while `deathOccurredInWindow` = 1

**Design principle**: Values are *aligned*, not corrected, interpolated, or retroactively smoothed. If no death occurs in a window, both fields = 0.

### Notebook 01 - Integrity Check (`01_integrity_check.ipynb`)
**Purpose**: Validate that the calibration dataset preserves structural, temporal, and experimental integrity.

**Checks performed**:
- Every `userId` appears in all `modeId`s (balanced exposure)
- No data corruption (NaN values, negative metrics)
- Temporal ordering of windows per user
- No session gaps that would indicate incomplete recordings

**Gate**: Must pass before proceeding. Any failure halts the pipeline.

### Notebook 02 - Mode Profiling (`02_mode_profiling.ipynb`)
**Purpose**: Compute descriptive statistics for each metric within each mode to establish a behavioural fingerprint.

**Feature role configuration**: `config/feature_roles.json` externally defines which metrics belong to which archetype (Combat, Exploration, Collection) - preventing semantic bias from being baked into the analysis code.

**Statistics computed per mode per metric**:
- Mean, variance, standard deviation
- Sparsity (% of windows with zero activity)
- Stability (standard deviation over time - detects "death cascades" or "boredom streaks")

**Output**: `data/processed/mode_profiles.csv`

### Notebook 03 - Parameter Derivation (`03_parameter_derivation.ipynb`)
**Purpose**: Select the neutral baseline mode and derive initial PCG parameters.

**Neutrality Score formula**:
```
NeutralityScore = (w1 x MeanSparsity) + (w2 x DeathRate) + (w3 x MeanStdDev)
                = (1.0 x MeanSparsity) + (100.0 x DeathRate) + (0.1 x MeanStdDev)
```

**Weights rationale**:
- DeathRate has the highest weight (100.0): frequent deaths indicate frustrating challenge, not neutral baseline
- MeanSparsity (1.0): high sparsity means players aren't engaging, indicating a mode too easy or poorly structured
- MeanStdDev (0.1): high variance indicates unstable gameplay, but is less critical than the above two

**Selection**: Mode with lowest NeutralityScore = neutral baseline.

**PCG parameter derivation**: Initial game parameters are derived from the means of the selected mode's telemetry. These become the `base_*` values in the ANFIS adaptation cascade.

**Transition declaration**: Explicitly declares end of calibration -> beginning of adaptive training phase. From this point, all future telemetry is used for adaptive model training, not calibration refinement.

### Notebook 04 - Survey Analysis (`04_survey_analysis.ipynb`)
**Purpose**: Aggregate participant questionnaire responses to establish subjective mode rankings.

**Processing steps**:
- Likert scale transformation: text ratings (e.g., "5 (Very fair)") -> numeric values
- Categorical value mapping: "Balanced" -> 3, etc. (semantic mapping)
- Median computation over mean (small sample n=7; median more robust to outliers)
- Vote aggregation: most balanced / too easy / too difficult / would play longer per mode

**Outputs**:
- `data/processed/survey_summary.csv`
- `data/processed/survey_rankings.json`

**Independence**: Survey analysis is conducted independently of gameplay telemetry - no merging of datasets before subjective results are computed (prevents contamination).

### Notebook 05 - Baseline Justification (`05_baseline_justification.ipynb`)
**Purpose**: Detailed documentation of why the selected mode satisfies neutrality criteria.

**Content**:
- Explains Mode 1 selection (lowest NeutralityScore: 84.21)
- Flags Mode 3 as upper difficulty bound (NeutralityScore: 106.48, DeathRate: 0.2258)
- Flags Mode 2 as lower bound reference (NeutralityScore: 86.00)
- All reasoning documented in academic language suitable for thesis methodology section

**Outputs**:
- `reports/neutral_baseline_justification.md`
- `data/processed/mode_classifications.json`

### Script 06 - Calibration Report (`06_calibration_report.py`)
**Purpose**: Integrate objective and subjective results into final academic-tone report.

**Core content**:
- Reconciles discrepancy between objective selection (Mode 1) and subjective preference (Mode 2)
- Justifies prioritisation of objective behavioural neutrality over subjective enjoyment
- Declares formal end of calibration phase

**Output**: `reports/calibration_final_report.md` (suitable for direct inclusion in thesis)

---

## 4. Results

### 4.1 Objective Results (Telemetry Analysis)

| Mode | Mean Sparsity | Death Rate (per window) | Mean Std Dev | Neutrality Score |
|------|--------------|------------------------|-------------|-----------------|
| **1 (Selected)** | **48.15%** | **0.0556** | **305.09** | **84.21** <-- Lowest |
| 2 | 43.89% | 0.1103 | 310.79 | 86.00 |
| 3 | 50.31% | 0.2258 | 335.93 | 106.48 |

**Objective winner: Mode 1**
- Balanced activity (48.15% sparsity - not too active, not too passive)
- Manageable death rate (0.0556/window - one death per ~18 windows)
- Stable gameplay (lowest relative std deviation)

Mode 1 occupies the "Goldilocks zone": not trivially easy, not frustratingly hard, and not structurally favouring any single playstyle.

### 4.2 Subjective Results (Survey Analysis, N=7)

| Mode | "Most Balanced" Votes | "Too Easy" Votes | "Too Difficult" Votes | "Would Play Longer" |
|------|--------------------|-----------------|---------------------|-------------------|
| 1 | 0 (0.0%) | 5 | 1 | 0 |
| **2** | **6 (85.7%)** | 1 | 0 | 3 |
| 3 | 1 (14.3%) | 0 | 4 | 4 |

**Subjective winner: Mode 2** (6/7 votes for "most balanced")

**Median ratings for Mode 2**:
- Combat fairness: 4.0 / 5
- Exploration comfort: 4.0 / 5
- Collectible availability: 3.0 / 5

### 4.3 Discrepancy Analysis and Final Decision

**Discrepancy**: Objective telemetry selected Mode 1; subjective survey preferred Mode 2.

**Interpretation**:
Participants tend to prefer modes that feel *engaging* or *rewarding* (subjective enjoyment), which does not necessarily align with *statistical neutrality*. Mode 1 was perceived as "too easy" by 5/7 participants, yet its low death rate and balanced sparsity make it the most statistically neutral starting point.

**Final selection: Mode 1** (objective neutrality prevails)

**Justification**:
1. **Neutral starting point**: The adaptive system requires an unbiased baseline that does not structurally favour specific playstyles. Mode 2's higher perceived engagement may already introduce a collection or exploration bias.
2. **Runtime adaptation**: Player preferences will be learned dynamically during gameplay - the calibration baseline need not be the most enjoyable, only the most neutral.
3. **Generalisability**: Behavioural neutrality generalises better across diverse player populations than small-sample (n=7) subjective votes.

This decision reflects the core distinction in the thesis: **calibration seeks a neutral starting point, not an optimal one**.

---

## 5. Initial PCG Parameters (Frozen Artifacts)

The following parameters are locked from Mode 1's behavioural profile and serve as the `base_*` values in the ANFIS adaptation cascade:

| Parameter | Target Value |
|-----------|-------------|
| `target_enemiesHit` | 3.7630 |
| `target_damageDone` | 53.8272 |
| `target_timeInCombat` | 6.7959 |
| `target_deathOccurredInWindow` | 0.0667 |
| `target_deathCountInWindow` | 0.0667 |

Full specification: `config/initial_parameters.json`

**Frozen artifacts (not modifiable by future telemetry)**:
- `data/processed/calibration_dataset.csv`
- `data/processed/mode_profiles.csv`
- `config/initial_parameters.json`
- `data/processed/survey_summary.csv`
- `reports/calibration_final_report.md`

---

## 6. Feature Role Configuration

`config/feature_roles.json` defines metric groupings to prevent analysis from embedding archetype semantics implicitly:

| Role | Metrics |
|------|---------|
| Combat | `enemiesHit`, `damageDone`, `timeInCombat`, `kills` |
| Collection | `itemsCollected`, `pickupAttempts`, `timeNearInteractables` |
| Exploration | `distanceTraveled`, `timeSprinting`, `timeOutOfCombat` |
| Death | `deathOccurredInWindow`, `deathCountInWindow` |

Using an external config (rather than hardcoded groupings) means the analysis notebooks can be re-executed if the telemetry schema changes without modifying analysis logic.

---

## 7. Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | Python 3.14+ |
| Environment | Jupyter Notebooks (.ipynb) + Python script (.py) |
| Data manipulation | pandas (DataFrames, CSV I/O) |
| Numerical ops | NumPy |
| Configuration | JSON (`config/feature_roles.json`) |
| Data storage | CSV format (`data/processed/`) - transparent and interoperable |
| Report generation | Automated Markdown report from `06_calibration_report.py` |

---

## 8. Git Commit Trail

| Commit | Message | Date |
|--------|---------|------|
| `bd271e8` | Initial commit | Jan 18, 2026 |
| `e751e4b` | initialized | Jan 18, 2026 |
| `dfe750a` | survey process | Jan 18, 2026 |
| `2e8aa84` | Merge PR #1 from forumAnalysis | Jan 18, 2026 |
| `fac159d` | Update notebook outputs and metadata for consistency | Jan 18, 2026 |
| `dceb67c` | Merge branch 'main' into forumAnalysis | Jan 19, 2026 |
| `7374e37` | update | Jan 19, 2026 |
| `65827b3` | Merge PR #2 from forumAnalysis | Jan 19, 2026 |
| `fccfc8f` | Initial plan | Jan 2026 |
| `41cc1b0` | Add comprehensive analysis documentation for calibration notebooks | Feb 2026 |
| `eb980e3` | Merge PR #3: create analysis md file | Feb 2026 |
| `4ba48bc` | feat: execute calibration notebooks 00-05 and capture analysis outputs | Feb 2026 |
| `6e2191c` | Merge PR #4 from forumAnalysis | Feb 2026 |

---

## 8. Thesis Contributions from This Repo

### Methodological Contributions
1. **Dual validation approach**: Both objective telemetry and subjective surveys employed - demonstrates triangulation of evidence in the calibration methodology
2. **Transparent neutrality scoring**: Algorithm is explicitly defined, reproducible, and documented - suitable for peer review
3. **Separation of concerns**: Clear boundary between calibration phase (this repo) and training phase (CollectGame.Model) prevents data contamination

### Research Insights
1. **Objective-subjective discrepancy**: Players prefer modes that *feel* engaging (Mode 2), but *feel* engaging ≠ statistically neutral. Mode 1 has the lowest death rate and sparsity balance - properties a player cannot directly perceive, but which are critical for a neutral ML baseline.
2. **Cold-start neutrality**: The calibration approach provides a principled answer to "what difficulty should the game start at?" - the mode with the lowest composite neutrality score, not the most popular.
3. **Archetype coverage**: Mode 1's 48.15% sparsity indicates balanced engagement across archetypes - no single type of player saturates the mode.

---

*Document generated: 2026-03-07 | Repo: CollectGame.CalibrationAnalysis | Phase complete: 2026-01-19*

