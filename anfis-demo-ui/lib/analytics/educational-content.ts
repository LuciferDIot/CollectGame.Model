export interface EducationalContent {
  title: string;
  what: string;       // A. What This Metric Is
  why: string;        // B. Why It Matters
  computed: string;   // C. How It’s Computed
  reading: string;    // D. How to Read It
}

export const METRIC_EXPLANATIONS: Record<string, EducationalContent> = {

  // --- MODEL VALIDITY ---
  'model_r2': {
    title: 'Model R² Score (Generalization)',
    what: 'The coefficient of determination measuring how well the trained ANFIS surrogate predicts the engineered target multiplier on unseen data.',
    why: 'A low R² indicates the model failed to learn the adaptive signal. A high R² confirms the mapping from fuzzy behavioral state to difficulty adjustment is statistically valid.',
    computed: 'Calculated offline using a held-out test set. Defined as 1 − (Residual Sum of Squares / Total Sum of Squares).',
    reading: 'Excellent: > 0.90. Acceptable: > 0.80. Warning: < 0.70 (Model requires retraining).',
  },

  'model_mae': {
    title: 'Mean Absolute Error (Test)',
    what: 'The average absolute difference between the model’s predicted multiplier and the target multiplier.',
    why: 'Even with high R², large absolute errors can cause noticeable difficulty spikes. This value should remain small relative to the multiplier span.',
    computed: 'Mean of |Predicted − Target| over the test dataset.',
    reading: 'Good: < 0.05. Warning: > 0.15 (Potential gameplay instability).',
  },

  // --- SIGNAL QUALITY ---
  'target_std': {
    title: 'Target Signal Standard Deviation',
    what: 'A measure of how much meaningful variation exists in the target difficulty signal.',
    why: 'If the target has near-zero variance, the model collapses to predicting a constant value and cannot learn adaptive behavior.',
    computed: 'Standard deviation of the target multiplier in the calibration dataset.',
    reading: 'Healthy (under fuzzy constraints): ≥ 0.05. Warning: < 0.03 (Insufficient learning signal).',
  },

  'clamp_usage': {
    title: 'Safety Clamp Saturation',
    what: 'The percentage of outputs that exceeded the allowed safety bounds (0.6× – 1.4×) and were clipped.',
    why: 'High clamp usage indicates the model is frequently operating outside its valid domain, often due to out-of-distribution inputs.',
    computed: '(Count of outputs at min or max clamp) / Total outputs.',
    reading: 'Safe: < 5%. Warning: > 15% (Model is fighting system constraints).',
  },

  // --- RUNTIME STABILITY ---
  'multiplier_mean': {
    title: 'Mean Difficulty Multiplier',
    what: 'The average difficulty multiplier applied during the current session.',
    why: 'Verifies the balance point of the system. Persistent deviation indicates sustained over- or under-performance.',
    computed: 'Rolling average of the final applied multiplier.',
    reading: 'Neutral: 0.9 – 1.1. Hard: > 1.2. Easy: < 0.8.',
  },

  'multiplier_variance': {
    title: 'Multiplier Variance (Jitter)',
    what: 'How much the difficulty multiplier fluctuates over time.',
    why: 'High variance causes unstable or glitchy gameplay. Adaptation should be smooth and deliberate.',
    computed: 'Variance of multiplier values over a rolling time window.',
    reading: 'Stable: < 0.01. Unstable: > 0.05.',
  },

  // --- INTERNAL PIPELINE ---
  'telemetry_health': {
    title: 'Input Telemetry Health',
    what: 'Validity status of incoming telemetry data.',
    why: 'Invalid, frozen, or missing telemetry prevents meaningful adaptation.',
    computed: 'Checks for NaN values, excessive zeros, or delayed timestamps.',
    reading: 'Pass / Fail.',
  },

  'fuzzy_partition': {
    title: 'Fuzzy Partition Completeness',
    what: 'Verification that archetype memberships form a valid fuzzy partition.',
    why: 'ANFIS requires memberships to form a partition of unity to remain mathematically valid.',
    computed: 'Sum of soft memberships across all archetypes.',
    reading: 'Must equal 1.0 within tolerance (±0.001).',
  },

  // --- ARCHETYPES ---
  'archetype_combat': {
    title: 'Archetype: Combat Specialist',
    what: 'Soft membership indicating alignment with combat-focused behavior.',
    why: 'Combat-oriented players require higher challenge intensity to avoid boredom.',
    computed: 'Inverse-distance weighting to the combat cluster centroid.',
    reading: 'Higher values indicate stronger combat alignment.',
  },

  'archetype_collection': {
    title: 'Archetype: Resource Gatherer',
    what: 'Soft membership indicating alignment with resource-focused behavior.',
    why: 'Gatherers are best challenged through economy and scarcity rather than combat.',
    computed: 'Inverse-distance weighting to the collection cluster centroid.',
    reading: 'Higher values indicate stronger collection alignment.',
  },

  'archetype_exploration': {
    title: 'Archetype: Explorer',
    what: 'Soft membership indicating alignment with traversal and exploration behavior.',
    why: 'Explorers require fluid movement and discovery, not constant combat interruptions.',
    computed: 'Inverse-distance weighting to the exploration cluster centroid.',
    reading: 'Higher values indicate stronger exploration alignment.',
  },

  // --- TELEMETRY FEATURES ---
  'feature_enemiesHit': {
    title: 'Input: Enemies Hit',
    what: 'Total number of successful hits landed on enemies during the window.',
    why: 'Core indicator of combat engagement intensity.',
    computed: 'Count of hit events aggregated over the telemetry window.',
    reading: 'Normalized to [0–1]. Higher values indicate active combat.',
  },

  'feature_damageDone': {
    title: 'Input: Damage Dealt',
    what: 'Total damage inflicted on enemies during the window.',
    why: 'Represents combat effectiveness beyond hit frequency.',
    computed: 'Sum of damage values over the telemetry window.',
    reading: 'Normalized to [0–1].',
  },

  'feature_timeInCombat': {
    title: 'Input: Time in Combat',
    what: 'Total time spent actively engaged in combat.',
    why: 'Distinguishes sustained fights from brief encounters.',
    computed: 'Accumulated seconds flagged as combat state.',
    reading: 'Normalized to [0–1] relative to window duration.',
  },

  'feature_kills': {
    title: 'Input: Enemy Kills',
    what: 'Number of enemies defeated during the window.',
    why: 'Represents combat success and progression.',
    computed: 'Count of kill events.',
    reading: 'Normalized to [0–1].',
  },

  'feature_itemsCollected': {
    title: 'Input: Items Collected',
    what: 'Number of collectibles successfully picked up.',
    why: 'Primary indicator of gathering behavior.',
    computed: 'Count of pickup events.',
    reading: 'Normalized to [0–1].',
  },

  'feature_pickupAttempts': {
    title: 'Input: Pickup Attempts',
    what: 'Number of attempts made to collect items.',
    why: 'Used to infer intent and efficiency of collection.',
    computed: 'Count of interaction attempts.',
    reading: 'Normalized to [0–1].',
  },

  'feature_timeNearInteractables': {
    title: 'Input: Time Near Interactables',
    what: 'Time spent near collectible or interactive objects.',
    why: 'Captures collection intent even without successful pickups.',
    computed: 'Accumulated seconds within interaction radius.',
    reading: 'Normalized to [0–1].',
  },

  'feature_distanceTraveled': {
    title: 'Input: Distance Traveled',
    what: 'Total distance moved during the window.',
    why: 'Primary indicator of exploration behavior.',
    computed: 'Sum of positional displacement.',
    reading: 'Normalized to [0–1].',
  },

  'feature_timeSprinting': {
    title: 'Input: Time Sprinting',
    what: 'Time spent sprinting or fast-moving.',
    why: 'Distinguishes traversal from idle movement.',
    computed: 'Accumulated sprinting seconds.',
    reading: 'Normalized to [0–1].',
  },

  'feature_timeOutOfCombat': {
    title: 'Input: Time Out of Combat',
    what: 'Time spent outside combat during the window.',
    why: 'Supports exploration and recovery behavior detection.',
    computed: 'Window duration minus combat time.',
    reading: 'Normalized to [0–1].',
  },

  // --- ADAPTATION PARAMETERS ---
  'combat_parameter_adaptation': {
    title: 'Param: Spawn Interval',
    what: 'Time delay between enemy spawn waves.',
    why: 'Controls combat pacing and encounter density.',
    computed: 'Base value scaled by difficulty multiplier and combat archetype influence, then clamped.',
    reading: 'Seconds.',
  },

  'global_cap_adaptation': {
    title: 'Param: Enemy Cap',
    what: 'Maximum simultaneous enemies allowed.',
    why: 'Prevents overwhelming encounters and performance issues.',
    computed: 'Base value scaled by difficulty multiplier and archetype influence.',
    reading: 'Count.',
  },

  'combat_intensity': {
    title: 'Param: Enemy Damage',
    what: 'Damage output of enemies.',
    why: 'Increases challenge without increasing enemy count.',
    computed: 'Base value scaled by difficulty multiplier and combat alignment.',
    reading: 'Multiplier.',
  },

  'combat_health_scaling': {
    title: 'Param: Enemy Health',
    what: 'Hit points of enemies.',
    why: 'Increases time-to-kill for skilled players.',
    computed: 'Base value scaled by difficulty multiplier.',
    reading: 'HP.',
  },

  'stamina_penalty': {
    title: 'Param: Stamina Cost',
    what: 'Energy cost for player actions.',
    why: 'Demands better resource management from skilled players.',
    computed: 'Base value scaled by difficulty multiplier.',
    reading: 'Cost per action.',
  },

  'player_power_scaling': {
    title: 'Param: Player Damage',
    what: 'Damage dealt by the player.',
    why: 'Inverse scaling prevents overpowering skilled players.',
    computed: 'Base value inversely scaled by difficulty multiplier.',
    reading: 'Damage.',
  },

  'player_resilience': {
    title: 'Param: Player Defense / HP',
    what: 'Effective durability of the player.',
    why: 'Balances survivability against skill level.',
    computed: 'Base value inversely scaled by difficulty multiplier.',
    reading: 'HP.',
  },

  'resource_density': {
    title: 'Param: Resource Density',
    what: 'Amount of collectible resources spawned.',
    why: 'Rewards resource-focused playstyles.',
    computed: 'Base value scaled by difficulty multiplier and collection alignment.',
    reading: 'Count.',
  },

  'resource_respawn_rate': {
    title: 'Param: Resource Respawn',
    what: 'Time for resources to regenerate.',
    why: 'Ensures economy pacing matches player behavior.',
    computed: 'Base value scaled by difficulty multiplier.',
    reading: 'Seconds.',
  },

  'resource_availability_window': {
    title: 'Param: Loot Lifetime',
    what: 'Duration collectibles remain available.',
    why: 'Controls urgency and pacing of collection.',
    computed: 'Base value scaled by difficulty multiplier.',
    reading: 'Seconds.',
  },

  'stamina_recovery_dynamics': {
    title: 'Param: Stamina Regeneration',
    what: 'Rate at which stamina recovers.',
    why: 'Supports traversal-heavy exploration behavior.',
    computed: 'Base value scaled by difficulty multiplier.',
    reading: 'Points per second.',
  },

  'movement_fluidity': {
    title: 'Param: Movement Cooldowns',
    what: 'Cooldowns on traversal abilities.',
    why: 'Lower cooldowns improve exploration flow.',
    computed: 'Base value scaled by difficulty multiplier.',
    reading: 'Seconds.',
  },

  'adaptive_parameter_tuning': {
    title: 'Adaptive Parameter Tuning',
    what: 'Real-time modulation of game constants based on ANFIS output.',
    why: 'Keeps gameplay within the flow zone between boredom and frustration.',
    computed: 'Base value × difficulty multiplier × archetype influence.',
    reading: 'Dynamic.',
  },

  // --- SYSTEM OVERVIEW ---
  'input_normalization': {
    title: 'Process: Input Normalization',
    what: 'Conversion of raw telemetry into fuzzy-compatible values.',
    why: 'Allows heterogeneous inputs to be compared consistently.',
    computed: 'Linear scaling to [0,1] using training min–max bounds.',
    reading: 'Ensures inputs accurately reflect game state.',
  },

  'rule_firing_strength': {
    title: 'Process: Surrogate Model Activations',
    what: 'Internal activations of the neural surrogate approximating ANFIS inference.',
    why: 'Provides insight into which learned patterns influence adaptation.',
    computed: 'Forward-pass activations of hidden neurons.',
    reading: 'Higher activation indicates stronger influence.',
  },

  'session_classification': {
    title: 'Metric: Session Classification',
    what: 'Current dominant behavioral alignment of the player.',
    why: 'Determines which archetype most influences adaptation.',
    computed: 'Selection of the highest soft membership value.',
    reading: 'The dominant label reflects current playstyle.',
  },

  'model_metadata': {
    title: 'System: Model Metadata',
    what: 'Configuration details of the loaded ANFIS model.',
    why: 'Ensures the correct version is active.',
    computed: 'Static metadata from model artifact.',
    reading: 'Verify version and training date.',
  },

  'session_inertia': {
    title: 'Metric: Session Inertia',
    what: 'The historical distribution of your dominant behavioral archetypes over the entire session.',
    why: 'Prevents rapid flipping between playstyles (jitter). The system uses this "memory" to smooth out adaptation, ensuring consistent difficulty adjustments even if you perform a few outlier actions.',
    computed: 'Running count of how many rounds were classified as Combat vs. Collection vs. Exploration.',
    reading: 'A highly dominant bar (e.g., 80% Combat) means the system is "locked in" to that playstyle. Balanced bars suggest a hybrid or shifting playstyle.',
  },

  'anfis_pipeline_overview': {
    title: 'System: ANFIS Inference Engine',
    what: 'Adaptive Neuro-Fuzzy Inference System.',
    why: 'Maps behavioral telemetry to adaptive difficulty adjustments.',
    computed: 'Telemetry → Fuzzification → Soft Clustering → Neural Inference → Adaptation.',
    reading: 'Visualizes real-time decision flow.',
  },
};
