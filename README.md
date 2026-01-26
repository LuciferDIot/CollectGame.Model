# CollectGame AURA Pipeline

This repository implements the **AURA (Adaptive Unified Response Agent)** data processing and modelling pipeline. It transforms raw gameplay telemetry into a trained **Neuro-Fuzzy–inspired neural surrogate model** for dynamic difficulty adjustment (DDA).

The pipeline is organized into **7 sequential Jupyter Notebooks**.

---

## 📂 Project Structure

```
├── data/
│   ├── *.telemetries.csv       # Raw Gameplay Data
│   ├── *.deathevents.csv       # Raw Death Data
│   ├── processed/              # Intermediate Outputs
│   └── models/                 # Exported Model Parameters
├── 01_Data_Loading_and_Merging.ipynb
├── 02_Gameplay_Summary.ipynb
├── 03_Normalization.ipynb
├── 04_Activity_Contributions.ipynb
├── 05_Clustering.ipynb
├── 06_ANFIS_Preparation.ipynb
├── 07_ANFIS_Training.ipynb
└── README.md
```

---

## 🚀 Pipeline Steps & Academic Validation

### 1. Data Loading & Merging (`01_Data_Loading_and_Merging.ipynb`)
**Goal:** Consolidate data and perform causal death alignment.
-   **Logic:**
    -   Merges multiple telemetry logs.
    -   Sorts strictly by timestamp.
    -   **Death Integration:** Maps each death event to the single nearest subsequent telemetry window (within 30s) using `merge_asof(direction='forward')`.
-   **Validation:** 1-to-1 mapping ensures no duplication of rows and preserves causal integrity.

### 2. Gameplay Summary & Filtering (`02_Gameplay_Summary.ipynb`)
**Goal:** Ensure data quality and prevent fatigue bias.
-   **Logic:**
    -   **Filter:** Excludes players with < 20 mins (insufficient data).
    -   **Cap:** Trims players > 45 mins to the first 45 mins.
    -   *Reasoning:* Capping avoids **fatigue-induced behavioral drift** influencing the archetype definitions.

### 3. Normalization (`03_Normalization.ipynb`)
**Goal:** Scale features for archetype modelling.
-   **Logic:**
    -   Applies **Min-Max Scaling (0-1)** per player.
    -   *Reasoning:* Captures **relative behavioral emphasis rather than absolute skill**, preventing high-magnitude features (e.g., Distance) from overpowering low-magnitude ones (e.g., Kills).

### 4. Activity Contributions (`04_Activity_Contributions.ipynb`)
**Goal:** Quantify behavioral focus.
-   **Logic:**
    -   Aggregates normalized features into **Combat**, **Collection**, and **Exploration** scores.
    -   Computes **Percentage Contributions** per window.
    -   Computes **Deltas** ($\Delta Pct$) per player to capture temporal adaptation.

### 5. Clustering (`05_Clustering.ipynb`)
**Goal:** Define behavioral archetypes.
-   **Logic:**
    -   **K-Means (K=3):** Clusters activity percentages.
    -   **labeling:** Automatically maps clusters to labeled Archetypes based on centroids.
    -   **Distance:** Computes Euclidean distance to the assigned centroid.
    -   *Note:* Distance is used to derive **soft archetype affiliation strength** (inverse relationship) for the fuzzy reasoning layer.

### 6. Preparation for Surrogate Modeling (`06_ANFIS_Preparation.ipynb`)
**Goal:** Construct the training dataset for the adaptive model.
-   **Logic:**
    -   Constructs input vectors: Archetype Percentages + Deltas.
    -   **Target Generation:** Calculates a **Heuristic Proxy Target** ($M = 1.0 - 0.1 \times Deaths + 0.05 \times Intensity$).
    -   *Reasoning:* The target multiplier is a heuristic proxy used to approximate desired adaptive behaviour in the absence of explicit designer-labelled difficulty targets.

### 7. Surrogate Model Training (`07_ANFIS_Training.ipynb`)
**Goal:** Train the runtime inference model.
-   **Logic:**
    -   Trains an **MLPRegressor** (Multi-Layer Perceptron) as a **Neuro-Fuzzy–inspired neural surrogate**.
    -   *Reasoning:* While a classical ANFIS consists of explicit membership functions and fuzzy rules, this surrogate neural model learns a smooth mapping that emulates the same reasoning behaviour for real-time deployment.
-   **Output:** `data/models/anfis_params.json` containing learned parameters for the runtime game engine inference layer.

---

## 🛠️ Usage

1.  Place raw `.telemetries.csv` and `.deathevents.csv` files in `data/`.
2.  Run the notebooks in numerical order (`01` to `07`).
3.  The final model parameters will be available in `data/models/anfis_params.json`.
