import { DeathEvent } from '@/lib/engine/types';
import type { TelemetryFeatures } from '@/lib/types';
import { getTelemetrySource, getUserId, mapTelemetryFeatures } from './parser-helpers';

/**
 * Parse telemetry JSON and extract user ID and features
 * Complexity: CC = 2 (down from 9)
 */
export const parseTelemetry = (json: string): { userId: string, features: TelemetryFeatures } | null => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== 'object' || parsed === null) return null;

      const source = getTelemetrySource(parsed);
      const userId = getUserId(parsed, source);

      return { 
        userId, 
        features: mapTelemetryFeatures(source) 
      };
    } catch {
      return null;
    }
};

/**
 * Parse death events JSON array
 */
export const parseDeathEvents = (json: string): DeathEvent[] | null => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
          return parsed.map((event: any) => ({
              userId: event.userId?.$oid || event.userId || 'unknown',
              timestamp: event.timestamp?.$date || event.timestamp || new Date().toISOString(),
              deathCount: 1
          }));
      }
      return null;
    } catch {
      return null;
    }
};
