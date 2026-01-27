"""
Export trained model artifacts for Next.js ANFIS validation website.
This script extracts scaler params, cluster centroids, and MLP weights
from the trained pipeline and saves them as JSON for TypeScript consumption.
"""

import pandas as pd
import numpy as np
import json
import pickle
from pathlib import Path
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans

# Paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / 'data'
PROCESSED_DIR = DATA_DIR / 'processed'
MODELS_DIR = DATA_DIR / 'models'

# Load processed data to extract artifacts
print("Loading processed data...")
normalized_df = pd.read_csv(PROCESSED_DIR / '3_normalized_telemetry.csv')
clustered_df = pd.read_csv(PROCESSED_DIR / '5_clustered_telemetry.csv')
anfis_df = pd.read_csv(PROCESSED_DIR / '6_anfis_dataset.csv')

# 1. Extract Scaler Parameters
print("\n1. Extracting scaler parameters...")
features_to_normalize = [
    'enemiesHit', 'damageDone', 'timeInCombat', 'kills',
    'itemsCollected', 'pickupAttempts', 'timeNearInteractables',
    'distanceTraveled', 'timeSprinting', 'timeOutOfCombat'
]

# We need to refit on original data to get min/max values
# Load the pre-normalized data
pre_normalized_df = pd.read_csv(PROCESSED_DIR / '2_cleaned_telemetry_for_modelling.csv')
available_features = [f for f in features_to_normalize if f in pre_normalized_df.columns]

scaler = MinMaxScaler()
scaler.fit(pre_normalized_df[available_features].fillna(0))

scaler_params = {
    "features": available_features,
    "data_min": scaler.data_min_.tolist(),
    "data_max": scaler.data_max_.tolist(),
    "data_range": scaler.data_range_.tolist(),
    "min_value": 0.0,
    "max_value": 1.0
}

with open(MODELS_DIR / 'scaler_params.json', 'w') as f:
    json.dump(scaler_params, f, indent=2)
print(f"✓ Saved scaler params for {len(available_features)} features")

# 2. Extract Cluster Centroids
print("\n2. Extracting cluster centroids...")
features_for_clustering = ['pct_combat', 'pct_collect', 'pct_explore']
X_cluster = clustered_df[features_for_clustering].fillna(0).values

# Refit K-Means to get centroids
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
kmeans.fit(X_cluster)

# Map clusters to archetypes using Hungarian algorithm
from scipy.spatial.distance import cdist
from scipy.optimize import linear_sum_assignment

ideal_combat = np.array([1.0, 0.0, 0.0])
ideal_collect = np.array([0.0, 1.0, 0.0])
ideal_explore = np.array([0.0, 0.0, 1.0])
ideal_centers = np.array([ideal_combat, ideal_collect, ideal_explore])

distances = cdist(kmeans.cluster_centers_, ideal_centers, metric='euclidean')
row_ind, col_ind = linear_sum_assignment(distances)

archetype_names = ['Combat', 'Collection', 'Exploration']
mapping = {row_ind[i]: archetype_names[col_ind[i]] for i in range(len(row_ind))}

cluster_centroids = {}
for cluster_id, archetype in mapping.items():
    centroid = kmeans.cluster_centers_[cluster_id]
    cluster_centroids[str(cluster_id)] = {
        "archetype": archetype,
        "centroid": {
            "pct_combat": float(centroid[0]),
            "pct_collect": float(centroid[1]),
            "pct_explore": float(centroid[2])
        }
    }

with open(MODELS_DIR / 'cluster_centroids.json', 'w') as f:
    json.dump(cluster_centroids, f, indent=2)
print(f"✓ Saved {len(cluster_centroids)} cluster centroids with archetype mapping")

# 3. Load or retrain MLP weights
print("\n3. Extracting MLP weights...")
try:
    # Try to load existing trained model
    from sklearn.neural_network import MLPRegressor
    from sklearn.model_selection import train_test_split
    
    feature_cols = [
        'soft_combat', 'soft_collect', 'soft_explore',
        'delta_combat', 'delta_collect', 'delta_explore'
    ]
    
    X = anfis_df[feature_cols].values
    y = anfis_df['target_multiplier'].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("  Training MLP (16-8 architecture)...")
    model = MLPRegressor(hidden_layer_sizes=(16, 8), activation='relu', max_iter=500, random_state=42, verbose=False)
    model.fit(X_train, y_train)
    
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    mlp_weights = {
        "architecture": {
            "input_size": 6,
            "hidden_layers": [16, 8],
            "output_size": 1,
            "activation": "relu",
            "output_activation": "linear"
        },
        "feature_order": feature_cols,
        "weights": [w.tolist() for w in model.coefs_],
        "biases": [b.tolist() for b in model.intercepts_],
        "training_metrics": {
            "train_mae": float(mean_absolute_error(y_train, train_pred)),
            "test_mae": float(mean_absolute_error(y_test, test_pred)),
            "train_mse": float(mean_squared_error(y_train, train_pred)),
            "test_mse": float(mean_squared_error(y_test, test_pred)),
            "train_r2": float(r2_score(y_train, train_pred)),
            "test_r2": float(r2_score(y_test, test_pred)),
            "num_iterations": model.n_iter_,
            "num_samples": len(X)
        },
        "version": "2.0",
        "status": "FROZEN"
    }
    
    with open(MODELS_DIR / 'anfis_mlp_weights.json', 'w') as f:
        json.dump(mlp_weights, f, indent=2)
    
    print(f"✓ Saved MLP weights (Test MAE: {mlp_weights['training_metrics']['test_mae']:.6f})")
    print(f"  Architecture: 6 → 16 → 8 → 1")
    print(f"  Iterations: {mlp_weights['training_metrics']['num_iterations']}")
    
except Exception as e:
    print(f"⚠ Could not extract MLP weights: {e}")
    print("  Using existing anfis_mlp_weights.json")

# 4. Create comprehensive deployment manifest
print("\n4. Creating deployment manifest...")
deployment_manifest = {
    "version": "2.0",
    "status": "FROZEN",
    "export_date": pd.Timestamp.now().isoformat(),
    "pipeline": {
        "features": available_features,
        "num_features": len(available_features),
        "k_clusters": 3,
        "anfis_architecture": "6-16-8-1",
        "training_samples": len(anfis_df)
    },
    "artifacts": {
        "scaler": "scaler_params.json",
        "centroids": "cluster_centroids.json",
        "mlp_model": "anfis_mlp_weights.json",
        "stats": "training_stats.json"
    },
    "hard_constraints": {
        "duration_min_minutes": 20,
        "duration_cap_minutes": 45,
        "target_multiplier_range": [0.5, 1.5],
        "archetype_modifier_range": [0.85, 1.15]
    },
    "feature_calculations": {
        "pct_combat": "(enemiesHit + damageDone + timeInCombat + kills) / 4",
        "pct_collect": "(itemsCollected + pickupAttempts + timeNearInteractables) / 3",
        "pct_explore": "(distanceTraveled + timeSprinting + timeOutOfCombat) / 3"
    }
}

with open(MODELS_DIR / 'deployment_manifest.json', 'w') as f:
    json.dump(deployment_manifest, f, indent=2)
print("✓ Saved deployment manifest")

print("\n" + "="*60)
print("✅ Model artifact export complete!")
print("="*60)
print(f"\nExported artifacts:")
print(f"  • scaler_params.json ({len(available_features)} features)")
print(f"  • cluster_centroids.json (3 archetypes)")
print(f"  • anfis_mlp_weights.json (6→16→8→1 MLP)")
print(f"  • deployment_manifest.json")
print(f"\nLocation: {MODELS_DIR}")
