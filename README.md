# CollectGame AURA Pipeline

This repository contains the **AURA (Adaptive Unified Response Agent)** data processing and modelling pipeline. It transforms raw gameplay telemetry into a trained Neuro-Fuzzy inference model for dynamic difficulty adjustment (DDA).

The pipeline is organized into **7 sequential Jupyter Notebooks**.

---

## 📂 Project Structure

```
├── data/
│   ├── *.telemetries.csv       # Raw Gameplay Data (Multiple files)
│   ├── *.deathevents.csv       # Raw Death Event Data
│   ├── processed/              # Intermediate and Final CSV outputs
│   └── models/                 # Exported AI Models (JSON/PKL)
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

## 🚀 Pipeline Steps

### 1. Data Loading & Merging (`01_Data_Loading_and_Merging.ipynb`)
**Goal:** Consolidate raw data and attribute player deaths to specific gameplay windows.
-   **Logic:**
    -   Globs all `*.telemetries.csv` files and merges them.
    -   **Strict Sorting:** Sorts by `userId` and `timestamp` to ensure temporal integrity.
    -   **Death Integration:** Uses `pandas.merge_asof(direction='forward')` to map each death event to the *single* nearest subsequent telemetry window (within 30s).
-   **Output:** `data/processed/1_telemetry_with_deaths.csv`

### 2. Gameplay Summary & Filtering (`02_Gameplay_Summary.ipynb`)
**Goal:** Clean the dataset by removing outliers and normalizing session durations.
-   **Logic:**
    -   Computes total gameplay duration per player.
    -   **Filter:** Excludes players with **< 20 minutes** of data.
    -   **Cap:** Trims players with **> 45 minutes** of data (keeps only the first 45 minutes).
    -   Outputs a summary table of player statistics.
-   **Output:** `data/processed/2_cleaned_telemetry_for_modelling.csv`

### 3. Normalization (`03_Normalization.ipynb`)
**Goal:** Scale features to a standard range for fair comparison.
-   **Logic:**
    -   Applies **Min-Max Scaling (0-1)** to all numeric gameplay features.
    -   **Per-Player Normalization:** Scaling is calculated based on *each player's own* min/max values to capture relative behavioral emphasis rather than absolute skill.
-   **Output:** `data/processed/3_normalized_telemetry.csv`

### 4. Activity Contribution Analysis (`04_Activity_Contributions.ipynb`)
**Goal:** Quantify player focus (Combat vs. Collection vs. Exploration).
-   **Logic:**
    -   Maps features to three categories:
        -   **Combat:** `enemiesHit`, `damageDone`, `timeInCombat`, `kills`
        -   **Collection:** `itemsCollected`, `pickupAttempts`, `timeNearInteractables`
        -   **Exploration:** `distanceTraveled`, `timeSprinting`, `timeOutOfCombat`
    -   **Scores:** Sums the *normalized* features for each category.
    -   **Percentages:** Calculates the % contribution of each category to the total score.
    -   **Deltas:** Computes the rate of change ($\Delta Pct$) from the previous window to the current window (Per-Player).
-   **Output:** `data/processed/4_activity_contributions.csv`

### 5. Clustering (`05_Clustering.ipynb`)
**Goal:** Classify behavior into distinct archetypes.
-   **Logic:**
    -   **K-Means (K=3):** Clusters the Activity Percentages (`pct_combat`, `pct_collect`, `pct_explore`).
    -   **Automated Labeling:** Assigns labels ("Combat", "Collection", "Exploration") to clusters based on the dominant feature of the cluster centroid.
    -   **Distance Calculation:** Computes the Euclidean distance of each point to its assigned centroid (measure of archetype strength).
    -   Generates per-player archetype profiles.
-   **Output:** `data/processed/5_clustered_telemetry.csv`

### 6. ANFIS Preparation (`06_ANFIS_Preparation.ipynb`)
**Goal:** Construct the training dataset for the Neuro-Fuzzy system.
-   **Logic:**
    -   **Inputs:** Archetype Percentages + Delta Values.
    -   **Target Generation (heuristic):**
        -   Calculates an **Adaptation Multiplier** ($M$).
        -   **Formula:** $M = 1.0 - (0.1 \times Deaths) + (0.05 \times Intensity)$.
        -   *Interpretation:* Deaths lower the multiplier (Eases difficulty). High activity raises it.
-   **Output:** `data/processed/6_anfis_dataset.csv`

### 7. ANFIS Training (`07_ANFIS_Training.ipynb`)
**Goal:** Train the runtime inference model.
-   **Logic:**
    -   Uses an **MLPRegressor** (Multi-Layer Perceptron) as a surrogate for the Neuro-Fuzzy reasoning layer.
    -   Architecture: 6 Inputs -> Hidden Layers [16, 8] -> 1 Output (Multiplier).
    -   **Export:** Saves the model weights and biases to a JSON file for easy import into the C#/Unity game engine.
-   **Output:** `data/models/anfis_params.json`

---

## 🛠️ Usage

1.  Place raw `.telemetries.csv` and `.deathevents.csv` files in `data/`.
2.  Run the notebooks in numerical order (`01` to `07`).
3.  The final model parameters will be available in `data/models/anfis_params.json`.
