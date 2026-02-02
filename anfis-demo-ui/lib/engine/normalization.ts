// Normalization module - MinMaxScaler implementation

import { clamp } from '../math/formulas';
import type { NormalizedFeatures, ScalerParams, TelemetryFeatures } from './types';

export class MinMaxNormalizer {
  private features: string[];
  private dataMin: number[];
  private dataMax: number[];
  private dataRange: number[];
  private minValue: number;
  private maxValue: number;

  constructor(scalerParams: ScalerParams) {
    this.features = scalerParams.features;
    this.dataMin = scalerParams.data_min;
    this.dataMax = scalerParams.data_max;
    this.dataRange = scalerParams.data_range;
    this.minValue = scalerParams.min_value;
    this.maxValue = scalerParams.max_value;
  }

  normalize(features: TelemetryFeatures): NormalizedFeatures {
    const normalized: any = {};

    this.features.forEach((featureName, idx) => {
      const rawValue = (features as any)[featureName] ?? 0;
      
      // MinMaxScaler formula: X_scaled = (X - min) / (max - min)
      // Handles edge case where range is 0
      if (this.dataRange[idx] === 0) {
        normalized[featureName] = this.minValue;
      } else {
        const scaled = (rawValue - this.dataMin[idx]) / this.dataRange[idx];
        // Clip to [min_value, max_value]
        normalized[featureName] = clamp(scaled, this.minValue, this.maxValue);
      }
    });

    return normalized as NormalizedFeatures;
  }

  /**
   * Inverse transform (for debugging/display purposes)
   */
  denormalize(normalized: NormalizedFeatures): TelemetryFeatures {
    const original: any = {};

    this.features.forEach((featureName, idx) => {
      const scaledValue = (normalized as any)[featureName] ?? 0;
      // Inverse: X = X_scaled * (max - min) + min
      original[featureName] = scaledValue * this.dataRange[idx] + this.dataMin[idx];
    });

    return original as TelemetryFeatures;
  }
}
