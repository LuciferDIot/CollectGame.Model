export interface EducationalContent {
  title: string;
  what: string;            // A. What This Metric Is (plain English)
  why: string;             // B. Why It Matters
  computed: string;        // C. How It's Computed / Algorithm
  reading: string;         // D. How to Read It / Thresholds
  designDecisions?: string; // E. Design Decisions -- why this approach was chosen over alternatives
}

export const METRIC_EXPLANATIONS: Record<string, EducationalContent> = {

  // --- MODEL VALIDITY ---
  'model_r2': {
    title: 'Model R^2 Score (Generalization)',
    what: 'The coefficient of determination measuring how well the trained ANFIS surrogate predicts the engineered target multiplier on unseen data.',
    why: 'A low R^2 indicates the model failed to learn the adaptive signal. A high R^2 confirms the mapping from fuzzy behavioral state to difficulty adjustment is statistically valid.',
    computed: 'Calculated offline using a held-out test set. Defined as 1 − (Residual Sum of Squares / Total Sum of Squares).',
    reading: 'Excellent: > 0.90. Acceptable: > 0.80. Warning: < 0.70 (Model requires retraining).',
  },

  'model_mae': {
    title: 'Mean Absolute Error (Test)',
    what: "The average absolute difference between the model's predicted multiplier and the target multiplier.",
    why: 'Even with high R^2, large absolute errors can cause noticeable difficulty spikes. This value should remain small relative to the multiplier span.',
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
    what: 'The percentage of outputs that exceeded the allowed safety bounds (0.6x - 1.4x) and were clipped.',
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
    reading: 'Neutral: 0.9 - 1.1. Hard: > 1.2. Easy: < 0.8.',
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
    reading: 'Must equal 1.0 within tolerance (+/-0.001).',
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
    why: 'Primary indicator of combat engagement. Used in conjunction with Damage Dealt to derive combat intensity.',
    computed: 'Count of hit events aggregated over the telemetry window.',
    reading: 'Normalized to [0-1]. Higher values indicate active combat.',
  },

  'feature_damageDone': {
    title: 'Input: Damage Dealt',
    what: 'Total damage inflicted on enemies during the window.',
    why: 'Represents combat effectiveness. Essential for calculating Damage per Hit.',
    computed: 'Sum of damage values over the telemetry window.',
    reading: 'Normalized to [0-1].',
  },

  'feature_damagePerHit': {
    title: 'Input: Damage per Hit',
    what: 'A derived v2.2 feature measuring the average damage dealt per individual hit landed.',
    why: 'Crucial for identifying weapon-class archetypes. Sniper/heavy-weapon players deal high damage with few hits; spray-weapon players deal low damage with many hits. Without this, snipers are underrepresented in combat scoring.',
    computed: 'damageDone_raw / max(enemiesHit_raw, 1).',
    reading: 'High values (0.7+) signal precision/heavy playstyles. Moderate values (0.3-0.6) signal hybrid playstyles.',
  },

  'feature_timeInCombat': {
    title: 'Input: Time in Combat',
    what: 'Total time spent actively engaged in combat.',
    why: 'Distinguishes sustained fights from brief encounters.',
    computed: 'Accumulated seconds flagged as combat state.',
    reading: 'Normalized to [0-1] relative to window duration.',
  },

  'feature_kills': {
    title: 'Input: Enemy Kills',
    what: 'Number of enemies defeated during the window.',
    why: 'Represents combat success and progression.',
    computed: 'Count of kill events.',
    reading: 'Normalized to [0-1].',
  },

  'feature_itemsCollected': {
    title: 'Input: Items Collected',
    what: 'Number of collectibles successfully picked up.',
    why: 'Primary indicator of gathering behavior.',
    computed: 'Count of pickup events.',
    reading: 'Normalized to [0-1].',
  },

  'feature_pickupAttempts': {
    title: 'Input: Pickup Attempts',
    what: 'Number of attempts made to collect items.',
    why: 'Core indicator of deliberate interaction intent. Used to derive pickup success/attempt rates.',
    computed: 'Count of interaction attempts.',
    reading: 'Normalized to [0-1].',
  },

  'feature_pickupAttemptRate': {
    title: 'Input: Pickup Attempt Rate',
    what: 'A derived v2.2 feature measuring the frequency of pickup attempts relative to time spent near items.',
    why: 'Distinguishes intentional collectors from incidental explorers. Explorers may pass near many items (high timeNearInteractables) without attempting to pick them up (low rate). Collectors actively engage.',
    computed: 'pickupAttempts_raw / max(timeNearInteractables_raw, 1).',
    reading: 'High values indicate high collection intent. Low values with high proximity indicate exploration focus.',
  },

  'feature_timeNearInteractables': {
    title: 'Input: Time Near Interactables',
    what: 'Time spent within interaction proximity of collectible objects.',
    why: 'Signals potential collection intent or navigation through loot-heavy areas.',
    computed: 'Accumulated seconds within interaction radius.',
    reading: 'Normalized to [0-1].',
  },

  'feature_distanceTraveled': {
    title: 'Input: Distance Traveled',
    what: 'Total distance moved during the window.',
    why: 'Primary indicator of exploration behavior.',
    computed: 'Sum of positional displacement.',
    reading: 'Normalized to [0-1].',
  },

  'feature_timeSprinting': {
    title: 'Input: Time Sprinting',
    what: 'Time spent sprinting or fast-moving.',
    why: 'Distinguishes traversal from idle movement.',
    computed: 'Accumulated sprinting seconds.',
    reading: 'Normalized to [0-1].',
  },

  'feature_timeOutOfCombat': {
    title: 'Input: Time Out of Combat (Telemetry Only)',
    what: 'Time spent outside combat during the window. Received but excluded from scoring since v2.1.',
    why: 'Excluded from activity scoring to avoid "passive signal" bias. Players waiting for spawns on sparse maps would previously be mis-categorized as explorers. Scoring now uses active signals exclusively.',
    computed: 'Window duration minus timeInCombat.',
    reading: 'Visible in telemetry logs but contributes 0% weight to archetype memberships.',
  },

  'system_session_timeout': {
    title: 'System: Session Persistence',
    what: 'The duration for which the system maintains player state memory (deltas).',
    why: 'Increased to 90s in v2.2 to accommodate loading screens and network latency without resetting adaptation progress.',
    computed: 'Hardcoded temporal constant (90,000ms).',
    reading: 'Ensures smooth adaptation across short gameplay interruptions.',
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
    title: 'Process: Per-Parameter Sensitivity',
    what: 'Modulation of game constants using non-uniform sensitivity weights (v2.2).',
    why: 'Not all game changes are equally perceptible. Spawning more enemies (0.35) is more obvious than increasing health (0.20). Tuning these weights ensures adaptation feels tailored and natural.',
    computed: 'Config-driven archetype weights (ranging 0.20 to 0.35).',
    reading: 'Determines the "steepness" of adaptation for each specific game variable.',
  },

  // --- SYSTEM OVERVIEW ---
  'input_normalization': {
    title: 'Process: Input Normalization (v2.2)',
    what: 'Conversion of raw telemetry (10 features) and derived signals (2 features) into fuzzy-compatible values.',
    why: 'Allows heterogeneous inputs (e.g., meters vs. damage points) to be compared consistently. v2.2 includes Damage per Hit and Pickup Attempt Rate to better capture playstyle nuances.',
    computed: 'Linear scaling to [0,1] using training min-max bounds across 12 feature dimensions.',
    reading: 'Ensures inputs accurately reflect game state without magnitude bias.',
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
    what: 'Adaptive Neuro-Fuzzy Inference System -- an 8-step pipeline that reads raw game telemetry, classifies play style, and outputs a difficulty multiplier in real time.',
    why: 'Maps behavioral telemetry to adaptive difficulty adjustments. Each step is independently testable and auditable, making the system transparent and debuggable.',
    computed: 'Step 1: Raw telemetry collection (12 features)\nStep 2: Derived feature computation (damagePerHit, pickupAttemptRate)\nStep 3: Min-Max normalization -> [0,1]\nStep 4: Activity scoring per archetype\nStep 5: K-Means soft clustering -> memberships\nStep 6: Delta computation vs. previous window\nStep 7: MLP surrogate inference -> multiplier\nStep 8: Parameter cascade to game engine',
    reading: 'Each step feeds the next. A failure at any step propagates visibly -- you can inspect each step in the Pipeline Execution panel.',
    designDecisions: 'Why 8 steps?\nDecomposing into discrete steps makes each stage independently testable, which was essential for debugging the v2.1 -> v2.2 regression. A monolithic pipeline would have hidden the "passive signal" bug in exploration scoring.\n\nWhy a 30-second telemetry window?\nGame telemetry accumulates meaningful patterns at ~30 seconds -- shorter windows are too noisy (single-action spikes), longer windows miss rapid style shifts. 30s was validated empirically in training data.\n\nWhy 12 features?\n10 raw signals cover all three archetypes. 2 derived signals (damagePerHit, pickupAttemptRate) were added in v2.2 to handle edge cases: sniper-style players and passive-explorer mis-classification.',
  },

  // ─── BEGINNER EXPLAINERS ────────────────────────────────────────────────────

  'how_normalization_works': {
    title: 'How Normalization Works',
    what: 'Normalization converts raw game measurements (kills, meters, damage) into values between 0 and 1. This is called Min-Max scaling.',
    why: 'The AI cannot directly compare a kill count of 10 with a damage total of 850 -- they live on completely different scales. Normalization puts all inputs on the same 0-1 playing field so the AI can weight them fairly.',
    computed: 'Formula: normalized = (raw_value − training_minimum) / (training_maximum − training_minimum).\n\nExample: 10 kills, range 0-50 -> (10 − 0) / 50 = 0.200\nExample: 800 damage, range 0-2000 -> (800 − 0) / 2000 = 0.400\n\nValues are then clamped to [0, 1] to handle extreme outliers.',
    reading: '0.0 = minimum ever seen in training data (low activity).\n0.5 = about average.\n1.0 = maximum ever seen (exceptional).\nAmber-highlighted rows (> 0.80) indicate high activity in that category.',
    designDecisions: 'Why Min-Max over Z-Score (standardization)?\nZ-score normalization produces values in (−∞, +∞) which are incompatible with fuzzy membership functions that require [0, 1] inputs. Min-Max guarantees the [0, 1] constraint.\n\nWhy use training-set bounds (not per-session)?\nUsing fixed training bounds ensures a player who is "average" always maps to ~0.5, regardless of session context. Per-session normalization would lose absolute signal strength -- a player who deals 500 damage would look identical whether the session max was 600 or 6000.\n\nWhy clamp to [0, 1]?\nExtreme outliers (e.g., a modded player dealing 99,999 damage) would otherwise produce values >> 1.0, which would saturate the fuzzy functions and cause all-maximum outputs.',
  },

  'how_deltas_work': {
    title: 'How Behavioral Deltas Work',
    what: 'A delta (Δ) is the change in a player\'s archetype membership between two consecutive windows. It tells the AI whether behaviour is trending up or down.',
    why: 'Without deltas, a player always at 70% Combat looks identical to one who just jumped from 50% to 70%. The delta reveals velocity -- the AI can spot trends and adapt ahead of time, not just react to the current snapshot.',
    computed: 'delta_combat = soft_combat_NOW − soft_combat_PREVIOUS\n\nExample:\n  Previous window: Combat 50%\n  Current window:  Combat 70%\n  Δ Combat = +20% -> player is getting more aggressive!\n\nDeltas reset to 0 after a 90-second gap (session timeout).',
    reading: 'Positive delta (+) -> behaviour increasing this window.\nNegative delta (−) -> behaviour decreasing.\nZero -> consistent play style, no trend.\n\nLarger deltas trigger stronger parameter adjustments.',
    designDecisions: 'Why include deltas as MLP inputs, not just memberships?\nIn synthetic training data, identical membership vectors (e.g., [0.7, 0.2, 0.1]) produced different target multipliers depending on whether the player was converging to or diverging from that state. Without deltas, the MLP predicted a single static value for each membership state, causing "flat response" behaviour for dynamic players.\n\nWhy a 90-second session timeout for delta reset?\nThe telemetry window is 30 seconds. At 40s (original timeout), a single loading screen or network retry would reset the session -- losing delta history mid-game. 90s = 3x window length, tolerating common interruptions without treating them as new sessions.\n\nWhy three delta dimensions (not one composite)?\nA single composite delta would conflate directional changes -- a player shifting from Combat to Exploration produces Δcombat=−0.3 and Δexplore=+0.3. These have opposite implications for parameter tuning and must be tracked separately.',
  },

  'how_archetypes_differ': {
    title: 'How the Three Archetypes Differ',
    what: 'Players are classified as a blend of Combat Specialist, Resource Gatherer (Collection), and Explorer. Each archetype uses different signals and drives different parameter changes.',
    why: 'A single difficulty scale fails all player types. Fighters need harder enemies; collectors need sparser items; explorers need fluid movement. Soft membership lets all three archetypes co-exist in one session.',
    computed: 'K-Means clustering finds three centroids during training. At runtime, inverse-distance weighting from the current activity vector to each centroid produces three memberships that sum to 1.0.',
    reading: 'All memberships sum to 100%. A player can be 60% Combat + 30% Explorer + 10% Collector simultaneously. The dominant archetype drives the largest parameter shift. Even 0%-archetype players receive 50% of the global adaptation as a baseline.',
    designDecisions: 'Why exactly 3 archetypes?\nFour was tested (Combat, Collection, Exploration, Stealth/Passive) but the 4th cluster collapsed into Exploration in K-Means because stealth and exploration share movement signals. Three produces stable, well-separated centroids with silhouette score > 0.6.\n\nWhy soft (fuzzy) membership instead of hard classification?\n"Hard" K-Means assigns each player to exactly one archetype. This caused jarring difficulty spikes at archetype boundaries -- a player 51% Combat and 49% Exploration would oscillate between two entirely different parameter sets each window. Soft membership blends smoothly.\n\nWhy Inverse-Distance Weighting (IDW) for memberships?\nIDW was compared against Gaussian kernel weighting and softmax-distance. IDW outperformed both: it is interpretable (distance is intuitive), requires no tuning parameter, and naturally handles the "partition of unity" constraint (memberships sum to 1.0) without normalization.',
  },

  'how_surrogate_model_works': {
    title: 'What is the Surrogate Model?',
    what: 'A small neural network (MLP -- Multi-Layer Perceptron) that was trained to replicate the ANFIS output. It takes the three archetype memberships + three behavioural deltas as inputs and outputs a single difficulty multiplier.',
    why: 'A full ANFIS is expensive to run in real time. The MLP surrogate was trained on 3,240 synthetic samples and achieves R^2=0.9264 accuracy, running in under 1ms instead of potentially hundreds of milliseconds for a full ANFIS inference.',
    computed: 'Architecture: 6 inputs -> Dense(16, ReLU) -> Dense(8, ReLU) -> Dense(1, Linear)\nInputs:  [soft_combat, soft_collect, soft_explore, Δcombat, Δcollect, Δexplore]\nOutput:  raw -> neutral-centred -> clamp([0.6, 1.4])\n\nCalibration formula: display = clamp(1.0 + (raw − mlp_neutral) x 2.0,  0.6, 1.4)\n  mlp_neutral = MLP output for balanced (1/3,1/3,1/3) no-delta input = 0.932006\n  Amplification = 2.0  ->  +/-0.4 raw deviation maps to +/-0.8 display shift\n\nTraining: sklearn MLPRegressor, LBFGS solver, max_iter=500 (converged in 21 iterations), 80/20 train-test split\nTest R^2 = 0.9264 | Test MAE = 0.0127',
    reading: '> 1.0 = harder (enemies stronger, items fewer).\n< 1.0 = easier (enemies weaker, more items, better movement).\n= 1.0 = balanced, no change (raw output equals mlp_neutral).\n\nMAE of 0.0127 means the multiplier prediction is off by only +/-1.3% of the total 0.6-1.4 range.',
    designDecisions: 'Why an MLP instead of directly running ANFIS at runtime?\nThe canonical ANFIS requires iterative least-squares parameter estimation per inference step, which is O(n^2) in rule count. With 27 rules (3^3 fuzzy inputs), this takes 50-200ms -- too slow for a 30s window. The MLP forward pass is O(weights) and completes in <1ms.\n\nWhy 2 hidden layers with [16, 8] nodes?\n- 1 layer (e.g., [32]) failed to capture the non-linear interaction between membership and delta inputs (test R^2=0.82)\n- 3 layers added overfitting with no accuracy gain on the test set\n- [16, 8] was the smallest architecture that achieved R^2 > 0.90 on the test set\n- The bottleneck structure (16 -> 8) forces the network to learn a compressed representation before the output\n\nWhy ReLU activation?\nSigmoid and tanh were tested. ReLU achieved faster convergence and avoided the vanishing gradient problem in the second hidden layer. The output layer uses Linear (no activation) to allow full-range multiplier output before clamping.\n\nWhy neutral-centred calibration instead of min-max rescaling?\nMin-max rescaling requires a fixed empirical output range which is highly sensitive to extreme training inputs. A perfectly balanced player (1/3,1/3,1/3 memberships, zero deltas) must map to display=1.0 by semantic definition. Neutral-centred calibration enforces this: raw==mlp_neutral -> display=1.0, deviations above/below scale symmetrically by factor 2.0. mlp_neutral is auto-recomputed by notebook 07 after each retrain -- no code changes needed.\n\nWhy clamp output to [0.6, 1.4]?\nThe safety bounds prevent catastrophic difficulty spikes from out-of-distribution inputs. The lower bound 0.6x prevents the game from becoming trivially easy (still a meaningful challenge). The upper bound 1.4x prevents the game from becoming impossibly hard (a 40% increase in all enemy stats is already very significant).',
  },

  // ─── METRIC-SPECIFIC EXPLAINERS ────────────────────────────────────────────

  'metric_activity_index': {
    title: 'Activity Index',
    what: 'The Activity Index shows what percentage of this player\'s total game actions fell into this archetype\'s category during the current 30-second window.',
    why: 'It tells you how busy the player was with this archetype\'s specific activities -- separate from how strongly they match the archetype pattern. A player can have high activity but low membership if their actions were spread evenly across all three types.',
    computed: 'For each archetype, the relevant telemetry signals are summed and normalised:\n  Combat activity   = avg(enemiesHit, damageDone, kills, timeInCombat, damagePerHit)\n  Collection activity = avg(itemsCollected, pickupAttempts, timeNearInteractables, pickupAttemptRate)\n  Exploration activity = avg(distanceTraveled, timeSprinting)\n\nEach component is already normalised to [0,1] before averaging. The result is multiplied by 100 and shown as a percentage.',
    reading: 'High Activity % (70%+): this player spent most of the window doing this archetype\'s activities.\nLow Activity % (under 20%): this archetype was barely engaged.\n\nActivity % is a raw measure -- it does NOT account for how the player compares to the cluster centroid. Two players can both show 50% combat activity but have very different Combat memberships if their specific pattern of kills, damage, and hit rate differs.',
    designDecisions: 'Why show Activity Index separately from the membership %?\nMembership (the large %) is the output of K-Means distance computation -- it answers "how closely does this player\'s overall profile match the archetype centroid?" Activity Index is a simpler raw average -- it answers "how much time did they spend on these activities?"\n\nThese can diverge interestingly: a player with 60% combat activity but only 33% combat membership is doing combat actions but not with the intensity pattern (kill rate, damage per hit) that the cluster centroid expects.',
  },

  'metric_confidence': {
    title: 'Classification Confidence',
    what: 'Confidence is a heuristic indicator of how clearly and reliably the AI was able to classify this player into this archetype. It is NOT a probability -- it is a signal quality score.',
    why: 'A high confidence means the player\'s signals were strong and unambiguous -- the classification is trustworthy. A low confidence means the signals were weak, mixed, or near the boundary between archetypes, and the classification should be treated with more caution.',
    computed: 'Confidence is derived from two factors:\n  1. Signal strength: how far the normalised activity score is from 0 (no signal)\n  2. Separation: how much larger this archetype\'s membership is vs. the next-closest archetype\n\nFormula: confidence = 0.5 x (activity_score) + 0.5 x (membership − second_highest_membership)\nResult is clamped to [0, 1].',
    reading: 'Green (90%+): Strong, clear signal. The classification is reliable.\nAmber (60-89%): Moderate signal. The player shows this archetype but other archetypes are also present.\nRed (below 60%): Weak signal. Player may be in a transition phase or playing a genuinely hybrid style. Adaptation will be cautious.\n\nNote: All three Confidence values shown simultaneously can all be high -- this happens when the player has strong, clear activity in all three areas (a very active hybrid player).',
    designDecisions: 'Why a heuristic confidence score instead of a true probability?\nK-Means does not produce probabilistic outputs -- it produces distances. Converting distances to probabilities (e.g., via softmax) conflates "close to multiple centroids" with "close to one centroid". The heuristic approach -- combining absolute signal strength with relative separation -- better captures the intuitive meaning of "how sure is the AI?".\n\nWhy show confidence at all?\nEarly versions of the dashboard showed only the membership %. This led to misleading outputs: a player idle in the middle of the map would score ~33% for all archetypes (equal distance to all centroids) and all badges would show "MED". Confidence at ~10% flags this as an unreliable classification, prompting the user to wait for more data.',
  },
};
