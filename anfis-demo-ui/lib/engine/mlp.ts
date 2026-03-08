import type { ANFISInput, MLPWeights } from './types';

/**
 * MLP surrogate for ANFIS inference (architecture: 6 → 16 → 8 → 1).
 *
 * The full ANFIS rule evaluation is O(n²) in rule count and too slow for
 * real-time use. The MLP is trained offline on ANFIS-generated targets and
 * performs the same mapping via fast matrix multiplication (<1ms per call).
 *
 * Activation: ReLU for hidden layers, Linear for output.
 * Training: sklearn LBFGS, converged in 21 iterations (v2.2.1).
 * Metrics: Test R² = 0.9264, Test MAE = 0.0127.
 */
export class MLPInference {
  private weights: number[][][];
  private biases: number[][];
  private activation: string;
  private outputActivation: string;

  constructor(mlpWeights: MLPWeights) {
    this.weights = mlpWeights.weights;
    this.biases = mlpWeights.biases;
    this.activation = mlpWeights.architecture.activation;
    this.outputActivation = mlpWeights.architecture.output_activation;
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private linear(x: number): number {
    return x;
  }

  private applyActivation(x: number, activationType: string): number {
    switch (activationType) {
      case 'relu':
        return this.relu(x);
      case 'linear':
        return this.linear(x);
      default:
        throw new Error(`Unsupported activation: ${activationType}`);
    }
  }

  /**
   * Forward pass through the network.
   *
   * Returns the raw difficulty multiplier and the first hidden layer activations.
   * The hidden layer activations are exposed to the UI as proxy "rule strengths"
   * (each of the 16 neurons represents a learned pattern in the input space).
   */
  predict(input: ANFISInput): { result: number, activations: number[] } {
    const inputArray = [
      input.soft_combat,
      input.soft_collect,
      input.soft_explore,
      input.delta_combat,
      input.delta_collect,
      input.delta_explore,
    ];

    let currentLayer = inputArray;
    let grabbedActivations: number[] = [];

    for (let layerIdx = 0; layerIdx < this.weights.length; layerIdx++) {
      const layerWeights = this.weights[layerIdx];
      const layerBiases = this.biases[layerIdx];
      const nextLayer: number[] = [];

      for (let neuronIdx = 0; neuronIdx < layerWeights[0].length; neuronIdx++) {
        let sum = layerBiases[neuronIdx];
        for (let inputIdx = 0; inputIdx < currentLayer.length; inputIdx++) {
          sum += currentLayer[inputIdx] * layerWeights[inputIdx][neuronIdx];
        }

        const activationType =
          layerIdx === this.weights.length - 1
            ? this.outputActivation
            : this.activation;

        nextLayer.push(this.applyActivation(sum, activationType));
      }

      if (layerIdx === 0) {
        grabbedActivations = [...nextLayer];
      }

      currentLayer = nextLayer;
    }

    return {
      result: currentLayer[0],
      activations: grabbedActivations
    };
  }

  predictBatch(inputs: ANFISInput[]): number[] {
    return inputs.map(input => this.predict(input).result);
  }
}
