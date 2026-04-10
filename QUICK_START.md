# Quick Start Guide - ANFIS Production Pipeline

**Last Updated**: January 27, 2026, 2:28 PM IST

---

## System Status: PRODUCTION READY

All experimentation is complete. Architecture frozen. Delta integration specified. Documentation finalized.

---

## Running the Pipeline

### Step 1: Navigate to Notebooks Directory
```bash
cd F:\Campus\FYP\Implementation\CollectGame.Model\core\notebooks
```

### Step 2: Start Jupyter
```bash
jupyter notebook
```

### Step 3: Run Notebooks Sequentially (01-08)

**IMPORTANT**: Run in order, one at a time

1. `01_Data_Loading_and_Merging.ipynb` - Loads raw telemetry, users, death events
2. `02_Gameplay_Summary.ipynb` - Aggregates to 30s windows
3. `03_Normalization.ipynb` - Applies MinMaxScaler
4. `04_Activity_Contributions.ipynb` - Calculates activity scores
5. `05_Clustering.ipynb` - K-Means clustering + soft membership + **deltas**
6. `06_ANFIS_Preparation.ipynb` - Creates 6-feature input + targets
7. `07_ANFIS_Training.ipynb` - Trains MLP surrogate
8. `08_Evaluation_Visualizations.ipynb` - Generates visualizations

---

## Expected Data Structure

```
CollectGame.Model/
├── data/
│   ├── telemetry_phase_2.users.csv          <- Must exist
│   ├── telemetry_phase_2.telemetries.csv    <- Must exist
│   ├── telemetry_phase_2.deathevents.csv    <- Must exist
│   └── processed/                            <- Created automatically
│       ├── merged_telemetry.csv
│       ├── 2_gameplay_summary.csv
│       ├── 3_normalized_telemetry.csv
│       ├── 4_activity_contributions.csv
│       ├── 5_clustered_telemetry.csv
│       ├── 6_anfis_dataset.csv
│       └── viz_*.png
└── core/
    └── notebooks/ <- Run from here
```

---

## Before Running

**Check that raw data files exist**:
- `F:\Campus\FYP\Implementation\CollectGame.Model\data\telemetry_phase_2.users.csv`
- `F:\Campus\FYP\Implementation\CollectGame.Model\data\telemetry_phase_2.telemetries.csv`
- `F:\Campus\FYP\Implementation\CollectGame.Model\data\telemetry_phase_2.deathevents.csv`

If files are missing, the first notebook will fail with `FileNotFoundError`.

---

## Troubleshooting

### Error: "No such file or directory: 'data/...'"
**Solution**: Paths are already fixed to `../../data/`. Make sure you're running from `core/notebooks/` directory.

### Error: "Module not found"
**Solution**: Install dependencies:
```bash
pip install pandas numpy matplotlib seaborn scikit-learn jupyterlab
```

### Notebook won't execute
**Solution**: Restart kernel and run cells in order (Kernel -> Restart & Clear Output)

---

## Final Outputs

After running all 8 notebooks successfully:

**Data Files** (`../../data/processed/`):
- `6_anfis_dataset.csv` - Final ANFIS inputs (6 features + targets)
- `5_clustered_telemetry.csv` - With soft membership + deltas

**Model** (`../../data/models/`):
- `anfis_params.json` - Trained MLP parameters

**Visualizations** (`../../data/processed/`):
- Multiple `viz_*.png` files

---

## Success Indicators

After running all notebooks, you should see:
- No errors in any notebook
- All CSV files in `data/processed/`
- Soft membership columns in `5_clustered_telemetry.csv`
- Delta columns (delta_combat, delta_collect, delta_explore)
- 6-feature input in `6_anfis_dataset.csv`
- Visualizations generated

---

## Documentation

- **System Overview**: `../../README.md`
- **Configuration**: `../pipeline_config.yaml`
- **Delta Implementation**: `../DELTA_IMPLEMENTATION_GUIDE.md`
- **Thesis Reports**: `../../thesis_documentation/`

---

## For Thesis

This pipeline produces all results and visualizations needed for thesis chapters:
- Methodology: Document these 8 steps
- Results: Use metrics from outputs
- Visualizations: Include all `viz_*.png` files

**Status**: Production-ready, experimentally validated, thesis-defensible
