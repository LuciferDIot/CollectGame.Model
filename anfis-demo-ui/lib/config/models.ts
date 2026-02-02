// Centralized access to model artifacts
// This ensures code stays in sync with the trained model files in /models

import centroids from '@/models/cluster_centroids.json';
import manifest from '@/models/deployment_manifest.json';
import scaler from '@/models/scaler_params.json';

// --- Model Constants ---

// The exact list of features the model expects, in order
export const MODEL_FEATURES = manifest.pipeline.features;

// Capabilities/Constraints from the manifest
export const HARD_CONSTRAINTS = manifest.hard_constraints;

// Scaler ranges for UI visualization (Min/Max/Range)
// We map them to an object for easier access by feature name
export const FEATURE_RANGES = MODEL_FEATURES.reduce((acc, feature, index) => {
    acc[feature] = {
        min: scaler.data_min[index],
        max: scaler.data_max[index],
        range: scaler.data_range[index]
    };
    return acc;
}, {} as Record<string, { min: number, max: number, range: number }>);

// Archetype Definitions
export const ARCHETYPE_DEFINITIONS = Object.values(centroids).map(c => ({
    name: c.archetype,
    centroid: c.centroid
}));

export const ARCHETYPE_NAMES = ARCHETYPE_DEFINITIONS.map(a => a.name);

// --- Helper Types ---
export type ModelFeature = typeof MODEL_FEATURES[number];
export type ArchetypeName = typeof ARCHETYPE_NAMES[number];

// Mapping from Model Names (JSON) to Code Keys (Types)
export const ARCHETYPE_ID_MAP: Record<string, 'combat' | 'collect' | 'explore'> = {
    'Combat': 'combat',
    'Collection': 'collect',
    'Exploration': 'explore'
};

// Reverse mapping for display
export const ARCHETYPE_DISPLAY_NAME: Record<string, string> = {
    'combat': 'Combat',
    'collect': 'Collection',
    'explore': 'Exploration'
};

// UI Colors for consistency (Centralized)
export const ARCHETYPE_COLORS = {
    combat: 'red',
    collect: 'cyan', // or amber, checking existing usage
    explore: 'emerald'
} as const;

export const ARCHETYPE_KEYS = Object.values(ARCHETYPE_ID_MAP);
