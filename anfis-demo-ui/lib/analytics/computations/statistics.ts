import { calculateMean, calculateStandardDeviation } from '@/lib/math/statistics';

/**
 * Compute Pearson correlation coefficient over sliding window
 */
export function computeRollingCorrelation(
  x: number[],
  y: number[],
  window: number
): number | null {
  if (x.length < window || y.length < window) return null;
  
  const xSlice = x.slice(-window);
  const ySlice = y.slice(-window);
  
  const xMean = calculateMean(xSlice);
  const yMean = calculateMean(ySlice);
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < window; i++) {
    const diffX = xSlice[i] - xMean;
    const diffY = ySlice[i] - yMean;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }
  
  if (denomX === 0 || denomY === 0) return 0; // No variance
  
  return numerator / Math.sqrt(denomX * denomY);
}

/**
 * Check if value is within training distribution bounds (consistency check)
 */
export function checkDistributionConsistency(
  value: number,
  mean: number,
  std: number,
  sigma: number = 2
): 'consistent' | 'edge' | 'ood' {
  const diff = Math.abs(value - mean);
  const threshold = std * sigma;
  
  if (diff <= threshold) return 'consistent';
  if (diff <= threshold * 1.5) return 'edge';
  return 'ood'; // Out-of-distribution
}

/**
 * Compute rolling statistics over a sliding window
 */
export function computeRollingStats(
  values: number[],
  window: number
): { mean: number; std: number } | null {
  if (values.length === 0) return null;
  
  const slice = values.slice(-window);
  if (slice.length === 0) return null;
  
  return {
      mean: calculateMean(slice),
      std: slice.length > 1 ? calculateStandardDeviation(slice) : 0
  };
}
