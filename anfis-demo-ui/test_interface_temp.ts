import type { AdaptationAuditRecord } from './lib/engine/types';

const record: AdaptationAuditRecord = {
  userId: 'player-01',
  timestamp: new Date().toISOString(),
  targetMultiplier: 1.12,
  adaptedParameters: { enemy_spawn_interval: 35, global_enemy_cap: 28 },
  wasClamped: false,
  sessionResetApplied: false,
};

console.log('AdaptationAuditRecord: compiled successfully');
