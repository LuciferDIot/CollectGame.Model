import { describe, it, expect, beforeEach } from 'vitest';
import { MinMaxNormalizer } from '../lib/engine/normalization';
import { ScalerParams } from '../lib/engine/types';

describe('MinMaxNormalizer (v2.2)', () => {
    const mockScalerParams: ScalerParams = {
        features: ['enemiesHit', 'damage_per_hit'],
        data_min: [0, 0],
        data_max: [100, 1000],
        data_range: [100, 1000],
        min_value: 0,
        max_value: 1
    };

    let normalizer: MinMaxNormalizer;

    beforeEach(() => {
        normalizer = new MinMaxNormalizer(mockScalerParams);
    });

    it('should correctly normalize values within range', () => {
        /**
         * Case: Direct scaling
         * enemiesHit: 50 in range [0, 100] -> Should be 0.5
         * damage_per_hit: 500 in range [0, 1000] -> Should be 0.5
         */
        const input = { enemiesHit: 50, damage_per_hit: 500 };
        const result = normalizer.normalize(input as any);
        expect(result.enemiesHit).toBe(0.5);
        expect(result.damage_per_hit).toBe(0.5);
    });

    it('should clamp values exceeding maximum', () => {
        /**
         * Case: Out of bounds (High)
         * input 150 > max 100 -> Should clamp to 1.0 (normalized max)
         */
        const input = { enemiesHit: 150 };
        const result = normalizer.normalize(input as any);
        expect(result.enemiesHit).toBe(1);
    });

    it('should clamp values below minimum', () => {
        /**
         * Case: Out of bounds (Low)
         * input -10 < min 0 -> Should clamp to 0.0 (normalized min)
         */
        const input = { enemiesHit: -10 };
        const result = normalizer.normalize(input as any);
        expect(result.enemiesHit).toBe(0);
    });

    it('should handle missing features by returning 0', () => {
        /**
         * Case: Absent feature
         * The normalizer should not return NaN; it defaults missing data to 0.0
         */
        const input = {};
        const result = normalizer.normalize(input as any);
        expect(result.enemiesHit).toBe(0);
    });
});
