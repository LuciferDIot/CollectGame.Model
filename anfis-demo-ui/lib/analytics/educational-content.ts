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
  },
  // --- ARCHETYPES ---
  'archetype_combat': {
    title: 'Archetype: Combat Specialist',
    what: 'A dynamic classification representing aggressive, engagement-focused player behavior.',
    why: 'Identifying combat-heavy players allows the system to scale difficulty (spawn rates, health) to match their skill, preventing boredom.',
    computed: 'Min(Combat, 1 - Collection, 1 - Exploration) via fuzzy inference rules.',
    reading: 'High: > 0.6. The player is seeking fights.',
  },
  'archetype_collection': {
    title: 'Archetype: Resource Gatherer',
    what: 'A classification for stratigic, optimization-focused players prioritizing loot and resources.',
    why: 'Gatherers need resource scarcity modulation rather than combat intensity to feel challenged.',
    computed: 'Driven by resourcesCollected and low combat engagement stats.',
    reading: 'High: > 0.6. The player is optimizing their inventory.',
  },
  'archetype_exploration': {
    title: 'Archetype: Explorer',
    what: 'A classification for players focused on map traversal, discovery, and speed.',
    why: 'Explorers require fluidity (stamina, movement speed) and new areas to discover, not constant combat interruptions.',
    computed: 'Driven by mapExplored ratio and averageSpeed.',
    reading: 'High: > 0.6. The player is roaming freely.',
  },

  // --- TELEMETRY FEATURES (Behaviors) ---
  'feature_enemiesHit': {
    title: 'Input: Enemies Hit (Rate)',
    what: 'The frequency of successful attacks landed on enemies in the last window.',
    why: 'Primary indicator of combat engagement and skill.',
    computed: 'Rolling average count of hit events / time.',
    reading: 'Norm: 0-1. Higher = More aggressive.',
  },
  'feature_enemiesTargeting': {
    title: 'Input: Enemy Aggro Count',
    what: 'Number of enemies currently actively targeting the player.',
    why: 'Measures "Pressure". High pressure should trigger adaptation to prevent overwhelming the player.',
    computed: 'Raw count from the blackened telemetry stream.',
    reading: '0-5 (Safe), 5-10 (High Pressure).',
  },
  'feature_playerHealth': {
    title: 'Input: Player Health Status',
    what: 'Current HP percentage of the player.',
    why: 'Low health is a critical signal to reduce difficulty or spawn defensive resources.',
    computed: 'Current HP / Max HP.',
    reading: 'Norm: 0-1.',
  },
  'feature_playerStamina': {
    title: 'Input: Player Stamina',
    what: 'Available energy for sprinting/dodging.',
    why: 'Low stamina limits capabilities. Adaptation may boost regen if stamina is chronically low.',
    computed: 'Current Stamina / Max Stamina.',
    reading: 'Norm: 0-1.',
  },
  'feature_timeSinceCombat': {
    title: 'Input: Time Since Combat',
    what: 'Seconds elapsed since the last damage event or attack.',
    why: 'Determines if the player is "Out of Combat" (OOC), allowing for recovery or pacing resets.',
    computed: 'Time.now - LastCombatTimestamp.',
    reading: 'Norm: 0-1 (Scaled to max window).',
  },
  'feature_resourcesCollected': {
    title: 'Input: Resources Collected',
    what: 'Rate of resource acquisition.',
    why: 'High collection rates indicate a "Gatherer" archetype, triggering economy balancing.',
    computed: 'Count over time window.',
    reading: 'Norm: 0-1.',
  },
  'feature_resourceDistance': {
    title: 'Input: Resource Proximity',
    what: 'Average distance to nearest collectible.',
    why: 'If resources are too far, players may disengage. System may spawn loot closer.',
    computed: 'Avg(Distance to visible loot).',
    reading: 'Norm: 0-1.',
  },
  'feature_clusterDensity': {
    title: 'Input: Cluster Density',
    what: 'How clumped together game entities (enemies/loot) are.',
    why: 'High density increases interaction intensity.',
    computed: 'Spatial variance of entity positions.',
    reading: 'Norm: 0-1.',
  },
  'feature_mapExplored': {
    title: 'Input: Map Exploration %',
    what: 'Percentage of the world grid visited.',
    why: 'High exploration drives the Explorer archetype.',
    computed: 'Visited Cells / Total Cells.',
    reading: 'Norm: 0-1.',
  },
  'feature_averageSpeed': {
    title: 'Input: Player Velocity',
    what: 'Average movement speed.',
    why: 'Stationary players may be stuck or managing inventory. High speed indicates traversal.',
    computed: 'Magnitude of velocity vector.',
    reading: 'Norm: 0-1.',
  },
  'feature_timeStationary': {
    title: 'Input: Time Stationary',
    what: 'Duration the player has remained in one spot.',
    why: 'May indicate AFK, strategic camping, or confusion.',
    computed: 'Time since velocity > threshold.',
    reading: 'Norm: 0-1.',
  },

  // --- ADAPTATION PARAMETERS ---
  'combat_parameter_adaptation': {
    title: 'Param: Spawn Interval',
    what: 'Time delay between enemy spawn waves.',
    why: 'Lower interval = More enemies/minute. The primary lever for combat pacing.',
    computed: 'Base * (2 - CombatFactor). High combat skill -> Lower interval (More enemies).',
    reading: 'Seconds.',
  },
  'global_cap_adaptation': {
    title: 'Param: Enemy Cap',
    what: 'Maximum simultaneous enemies allowed.',
    why: 'Prevents performance issues and unfair swarm sizes.',
    computed: 'Base * CombatFactor.',
    reading: 'Count.',
  },
  'combat_intensity': {
    title: 'Param: Damage Intensity',
    what: 'Damage output multiplier for enemies.',
    why: 'Makes individual enemies more dangerous without increasing their numbers.',
    computed: 'Base * CombatFactor.',
    reading: 'Multiplier.',
  },
  'combat_health_scaling': {
    title: 'Param: Enemy Health',
    what: 'Hit points for spawned enemies.',
    why: 'Increases "Time to Kill" (TTK), demanding higher sustained DPS from the player.',
    computed: 'Base * CombatFactor.',
    reading: 'HP Value.',
  },
  'stamina_penalty': {
    title: 'Param: Stamina Cost',
    what: 'Energy cost for actions (dodge/attack).',
    why: 'Higher cost demands more precise resource management from skilled players.',
    computed: 'Base * CombatFactor.',
    reading: 'Cost per action.',
  },
  'player_power_scaling': {
    title: 'Param: Player Damage',
    what: 'Damage dealt by the player to enemies.',
    why: 'Inverse scaling: Skilled players do LESS damage, requiring more hits to kill.',
    computed: 'Base * (1/CombatFactor).',
    reading: 'Damage Value.',
  },
  'player_resilience': {
    title: 'Param: Player Defense/HP',
    what: 'Effective hit points of the player.',
    why: 'Inverse scaling: Skilled players are more fragile.',
    computed: 'Base * (1/CombatFactor).',
    reading: 'HP Value.',
  },
  'resource_density': {
    title: 'Param: Resource Density',
    what: 'Number of collectibles spawned per zone.',
    why: 'Rewards "Gatherer" playstyles with more loot opportunities.',
    computed: 'Base * CollectionFactor.',
    reading: 'Count.',
  },
  'resource_respawn_rate': {
    title: 'Param: Resource Respawn',
    what: 'How quickly looted nodes regenerate.',
    why: 'Ensures the economy keeps up with a fast gatherer.',
    computed: 'Base * (2 - CollectionFactor).',
    reading: 'Seconds.',
  },
  'resource_availability_window': {
    title: 'Param: Loot Lifetime',
    what: 'How long items stay on ground before despawning.',
    why: 'Longer windows allow relaxed gathering; shorter windows demand speed.',
    computed: 'Base * CollectionFactor.',
    reading: 'Seconds.',
  },
  'stamina_recovery_dynamics': {
    title: 'Param: Stamina Regen',
    what: 'Speed of stamina recovery.',
    why: 'Explorers need fast recovery to maintain sprint/traversal speed.',
    computed: 'Base * (1/ExplorationFactor).',
    reading: 'Points/Sec.',
  },
  'movement_fluidity': {
    title: 'Param: Global Speed / Dash',
    what: 'Cooldowns on movement abilities.',
    why: 'Lower cooldowns make traversal feel more fluid and responsive.',
    computed: 'Base * (2 - ExplorationFactor).',
    reading: 'Seconds.',
  },
  'adaptive_parameter_tuning': {
    title: 'Adaptive Parameter Tuning',
    what: 'Real-time modulation of game constants based on ANFIS output.',
    why: 'Ensures the game state remains in the "Flow Channel" between Boredom and Anxiety.',
    computed: 'Base_Value * Multiplier_Function(Archetype_Weight).',
    reading: 'Dynamic.',
  },
  // --- SYSTEM SECTIONS & HEADERS ---
  'input_normalization': {
    title: 'Process: Input Normalization',
    what: 'The first stage of the pipeline where raw game data (hp=100) is converted into fuzzy-compatible values (0.0 - 1.0).',
    why: 'Fuzzy logic requires universals. We cannot compare "100 HP" with "50 meters" directly, but we can compare "High Health" (0.8) with "Far Distance" (0.8).',
    computed: 'Linear scaling: (Value - Min) / (Max - Min). clamped to [0, 1].',
    reading: 'Review this table to ensure inputs are sensing the game state correctly.',
  },
  'rule_firing_strength': {
    title: 'Process: Rule Inference',
    what: 'The "Brain" of the FIS. Rules combine inputs (IF low health AND high aggro) to trigger archetypes.',
    why: 'Shows which logical conditions are currently active. A rule with 0.0 strength is dormant; 1.0 is fully active.',
    computed: 'Min-Operator (AND) across all antecedents in the rule.',
    reading: 'Bars show activation strength. Hover to see the specific logic rule.',
  },
  'session_classification': {
    title: 'Metric: Session Classification',
    what: 'The real-time categorization of the player\'s current behavior pattern.',
    why: 'Determines which "Bucket" the player falls into, driving the global adaptation strategy.',
    computed: 'Centroid defuzzification of the aggregated archetype memberships.',
    reading: 'The dominant color/label dictates the current game feel.',
  },
  'model_metadata': {
    title: 'System: Model Metadata',
    what: 'Configuration details of the currently loaded ANFIS model.',
    why: 'Ensures we are running the correct version of the "Designer\'s Brain".',
    computed: 'Static constants from the .json model file.',
    reading: 'Verify Version matches the latest training run.',
  },
  'anfis_pipeline_overview': {
    title: 'System: ANFIS Inference Engine',
    what: 'Adaptive Neuro-Fuzzy Inference System.',
    why: 'A hybrid AI that maps input situations to difficulty adjustments using human-readable rules weighted by neural network training.',
    computed: 'Input -> Fuzzification -> Inference -> Aggregation -> Defuzzification.',
    reading: 'This dashboard visualizes the real-time flow of thinking.',
  },
};
