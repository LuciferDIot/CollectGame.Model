// MLP Neural Network Inference

import type { ANFISInput, MLPWeights } from './types';

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

  /**
   * ReLU activation function
   */
  private relu(x: number): number {
    return Math.max(0, x);
  }

  /**
   * Linear activation (identity function)
   */
  private linear(x: number): number {
    return x;
  }

  /**
   * Apply activation function
   */
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
   * Forward pass through the MLP network
   * 
   * Architecture: 6 → 16 → 8 → 1
   * - Layer 0: Input (6) → Hidden1 (16) with ReLU
   * - Layer 1: Hidden1 (16) → Hidden2 (8) with ReLU
   * - Layer 2: Hidden2 (8) → Output (1) with Linear
   */
  predict(input: ANFISInput): { result: number, activations: number[] } {
    // Convert input to array in correct order
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

    // Forward pass through each layer
    for (let layerIdx = 0; layerIdx < this.weights.length; layerIdx++) {
      const layerWeights = this.weights[layerIdx];
      const layerBiases = this.biases[layerIdx];
      const nextLayer: number[] = [];

      // For each neuron in the next layer
      for (let neuronIdx = 0; neuronIdx < layerWeights[0].length; neuronIdx++) {
        // Compute weighted sum
        let sum = layerBiases[neuronIdx];
        
        for (let inputIdx = 0; inputIdx < currentLayer.length; inputIdx++) {
          sum += currentLayer[inputIdx] * layerWeights[inputIdx][neuronIdx];
        }

        // Apply activation
        const activationType = 
          layerIdx === this.weights.length - 1 
            ? this.outputActivation 
            : this.activation;
        
        nextLayer.push(this.applyActivation(sum, activationType));
      }

      // Capture the first hidden layer (Layer 0 output) as our "Fuzzy Rules" proxy
      if (layerIdx === 0) {
        grabbedActivations = [...nextLayer];
      }

      currentLayer = nextLayer;
    }

    // Return output value and the captured activations
    return { result: currentLayer[0], activations: grabbedActivations };
  }

  /**
   * Batch prediction (for testing/validation)
   */
  predictBatch(inputs: ANFISInput[]): number[] {
    return inputs.map(input => this.predict(input).result);
  }
}
