import { computeDelta } from './lib/engine/utils';

console.assert(computeDelta(0.75, 0.60) === 0.15, 'active session delta');
console.assert(computeDelta(0.75, undefined) === 0, 'undefined previous');
console.assert(computeDelta(0.75, NaN) === 0, 'NaN previous');
console.assert(computeDelta(0.15, 0.25) === -0.10, 'negative delta');

console.log('computeDelta: all assertions passed (if no failures above)');
