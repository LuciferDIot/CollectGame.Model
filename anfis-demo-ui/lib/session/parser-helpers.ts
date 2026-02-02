import type { TelemetryFeatures } from '@/lib/types';

/**
 * Extract user ID from various possible sources in parsed JSON
 */
export function getUserId(parsed: any, source: any): string {
    return parsed.userId?.$oid || parsed.userId || source.userId || 'sim-user';
}

/**
 * Extract telemetry source data from parsed JSON
 */
export function getTelemetrySource(parsed: any): any {
    return parsed.rawJson || parsed.telemetry || parsed;
}

/**
 * Extract numeric value from object using snake_case or camelCase key
 */
export function getNum(obj: any, snake: string, camel: string): number {
    if (snake in obj) return Number(obj[snake]);
    if (camel in obj) return Number(obj[camel]);
    return 0;
}

/**
 * Map raw telemetry data to TelemetryFeatures interface
 */
export function mapTelemetryFeatures(source: any): TelemetryFeatures {
    return {
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
    };
}
