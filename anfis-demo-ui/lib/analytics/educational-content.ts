export interface EducationalContent {
  title: string;
  what: string;       // A. What This Metric Is
  why: string;        // B. Why It Matters
  computed: string;   // C. How It’s Computed
  reading: string;    // D. How to Read It
  // E. Current Session Value is handled dynamically by the component
}

export const METRIC_EXPLANATIONS: Record<string, EducationalContent> = {
  // --- MODEL VALIDITY ---
  'model_r2': {
    title: 'Model R² Score (Generalization)',
    what: 'The coefficient of determination representing how well the ANFIS model replicates the expert training data on unseen test cases.',
    why: 'A low R² means the model has "failed to learn" the strategy and is essentially guessing. High R² proves the model is a valid clone of the designer\'s intent.',
    computed: 'Calculated offline using a held-out test set (20% of data). 1 - (SSR / SST).',
    reading: 'Excellent: > 0.90. Acceptable: > 0.80. Warning: < 0.70 (Model requires retraining).',
  },
  'model_mae': {
    title: 'Mean Absolute Error (Test)',
    what: 'The average magnitude of error between what the model predicted and what the expert would have done, in multiplier units.',
    why: 'Even if R² is high, large absolute errors can cause gameplay spikes. WE want this to be negligible relative to the multiplier span.',
    computed: 'Average of |Predicted - Actual| over the test set.',
    reading: 'Good: < 0.05 (Negligible impact). Bad: > 0.15 (Noticeable difficulty glitches).',
  },
  
  // --- SIGNAL QUALITY ---
  'target_std': {
    title: 'Target Signal Standard Deviation',
    what: 'A measure of how much "contrast" exists in the training data\'s difficulty adjustments.',
    why: 'If the expert never changes difficulty (Std ≈ 0), the model learns to output a constant. We need variance to learn adaptation.',
    computed: 'Standard deviation of the Target Multiplier column in the calibration dataset.',
    reading: 'Healthy: > 0.1. Flatline Warning: < 0.05 (Data is too static).',
  },
  'clamp_usage': {
    title: 'Safety Clamp Saturation',
    what: 'The percentage of time the model\'s raw output was physically generated outside the allowed safety bounds (0.5x - 1.5x) and had to be clipped.',
    why: 'High clamp usage means the model is "fighting" the system constraints, often indicating it is encountering OOD (Out of Distribution) inputs.',
    computed: '(Count of Outputs == Min OR Count of Outputs == Max) / Total Frames.',
    reading: 'Safe: < 5%. Warning: > 15% (Model thinks the player is breaking the game).',
  },

  // --- RUNTIME STABILITY ---
  'multiplier_mean': {
    title: 'Mean Difficulty Multiplier',
    what: 'The average difficulty adjustment applied over the current session.',
    why: 'To verify the "Balance Point". If the game is neutral, this should hover near 1.0. Drifting means the player is consistently over- or under-performing.',
    computed: 'Rolling average of the final output multiplier.',
    reading: 'Neutral: 0.9 - 1.1. Hard: > 1.2. Easy: < 0.8.',
  },
  'multiplier_variance': {
    title: 'Multiplier Variance (Jitter)',
    what: 'How rapidly the difficulty changes from frame to frame.',
    why: 'High variance feels "glitchy" to players (enemies spawn, then vanish, then spawn). We want smooth, deliberate adaptation.',
    computed: 'Variance of the multiplier over the last 60 seconds.',
    reading: 'Stable: < 0.01. Unstable: > 0.05 (Needs smoothing/damping).',
  },

  // --- INTERNAL PIPELINE ---
  'telemetry_health': {
    title: 'Input Telemetry Health',
    what: 'Status of the raw data stream from the game engine.',
    why: 'Garbage In, Garbage Out. If telemetry is NaN, zeroed, or frozen, the model cannot function.',
    computed: 'Checks for nulls, frequent zeros, or data timestamps lagging real-time.',
    reading: 'Pass / Fail.',
  },
  'fuzzy_partition': {
    title: 'Fuzzy Partition Completeness',
    what: 'Verification that the sum of all memberships equals 1.0 (Partition of Unity).',
    why: 'If membership sums to < 1.0, the "space" is undefined. If > 1.0, it is ambiguous. This is a mathematical validity check for ANFIS.',
    computed: 'Sum(Membership_Combat + Membership_Collect + Membership_Explore).',
    reading: 'Must be exactly 1.0 ± 0.001.',
  }
};
