import { DeathEvent } from '@/lib/engine/types';
import { TelemetryFeatures } from '@/lib/types';

const getNum = (obj: any, snake: string, camel: string): number => {
    if (snake in obj) return Number(obj[snake]);
    if (camel in obj) return Number(obj[camel]);
    return 0;
};

const mapTelemetryFeatures = (source: any): TelemetryFeatures => ({
    enemiesHit: getNum(source, 'enemies_hit', 'enemiesHit'),
    damageDone: getNum(source, 'damage_done', 'damageDone'),
    timeInCombat: getNum(source, 'time_in_combat', 'timeInCombat'),
    kills: getNum(source, 'kills', 'kills'),
    itemsCollected: getNum(source, 'items_collected', 'itemsCollected'),
    pickupAttempts: getNum(source, 'pickup_attempts', 'pickupAttempts'),
    timeNearInteractables: getNum(source, 'time_near_interactables', 'timeNearInteractables'),
    distanceTraveled: getNum(source, 'distance_traveled', 'distanceTraveled'),
    timeSprinting: getNum(source, 'time_sprinting', 'timeSprinting'),
    timeOutOfCombat: getNum(source, 'time_out_of_combat', 'timeOutOfCombat'),
});

export const parseTelemetry = (json: string): { userId: string, features: TelemetryFeatures } | null => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null) return null;

      const source = parsed.rawJson || parsed.telemetry || parsed;
      const userId = parsed.userId?.$oid || parsed.userId || source.userId || 'sim-user';

      return { 
        userId, 
        features: mapTelemetryFeatures(source) 
      };
    } catch {
      return null;
    }
};

export const parseDeathEvents = (json: string): DeathEvent[] | null => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
          return parsed.map((event: any) => ({
              userId: event.userId?.$oid || event.userId || 'unknown',
              timestamp: event.timestamp?.$date || event.timestamp || new Date().toISOString(),
              deathCount: 1 // Default to 1 if just an event presence
          }));
      }
      return null;
    } catch {
      return null;
    }
};
