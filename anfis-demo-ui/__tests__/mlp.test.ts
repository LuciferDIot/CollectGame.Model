import { describe, it, expect } from 'vitest';
import { MLPInference } from '../lib/engine/mlp';
import mlpWeights from '../models/anfis_mlp_weights.json';

/**
 * MLPInference Unit Tests
 * 
 * Verifies the neural network surrogate that mimics ANFIS fuzzy logic.
 * Architecture: 6 inputs -> 16 hidden -> 8 hidden -> 1 output.
 */
describe('MLPInference', () => {
    const mlp = new MLPInference(mlpWeights as any);

    it('should perform a forward pass and return a multiplier within safety bounds', () => {
        /**
         * MANDATORY PROPERTY: The multiplier should stay within the [0.5, 1.5]
         * range for safety, although the MLP itself is linear.
         */
        const input = {
            soft_combat: 0.8,
            soft_collect: 0.1,
            soft_explore: 0.1,
            delta_combat: 0.05,
            delta_collect: -0.02,
            delta_explore: -0.03
        };

        const { result, activations } = mlp.predict(input);

        // Result should be a valid number
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0.5);
        expect(result).toBeLessThan(1.5);

        // Hidden layer 1 should have 16 activations
        expect(activations.length).toBe(16);
    });

    it('should implement ReLU activation correctly', () => {
        /**
         * Verification of the internal private logic (non-linearity).
         * Since relu is private, we verify its effect via predict results if possible,
         * or we cast to any for direct unit testing of primitive math logic.
         */
        const anyMlp = mlp as any;
        expect(anyMlp.relu(5)).toBe(5);
        expect(anyMlp.relu(-5)).toBe(0);
    });

    it('should implement Linear activation correctly', () => {
        const anyMlp = mlp as any;
        expect(anyMlp.linear(1.15)).toBe(1.15);
    });

    it('should support batch predictions', () => {
        const inputs = [
            { soft_combat: 0.5, soft_collect: 0.3, soft_explore: 0.2, delta_combat: 0, delta_collect: 0, delta_explore: 0 },
            { soft_combat: 0.2, soft_collect: 0.2, soft_explore: 0.6, delta_combat: 0, delta_collect: 0, delta_explore: 0 }
        ];

        const results = mlp.predictBatch(inputs);
        expect(results.length).toBe(2);
        expect(typeof results[0]).toBe('number');
        expect(typeof results[1]).toBe('number');
    });
});
