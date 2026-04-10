# Technical Specification: Temporal Delta Integration

## 1. Overview
This document details the implementation of the temporal delta signal, integrated into the ANFIS-based difficulty system to capture real-time trends in player behavior. This feature allows the system to differentiate between static states (e.g., "currently collecting") and dynamic shifts (e.g., "accelerating exploration rate").

## 2. Implementation Logic

### 2.1. Soft Membership Calculation
Prior to delta computation, fuzzy membership for each behavioral archetype (Combat, Collection, Exploration) is calculated using Inverse Distance Weighting (IDW) relative to the K-Means cluster centers.

*   **Source**: Notebook `05_Clustering.ipynb`
*   **Method**: `1 / (Euclidean Distance + epsilon)` normalized to sum to 1.0.

### 2.2. Delta Computation
The delta signal ($\Delta$) represents the rate of change in soft membership between consecutive 30-second time windows ($t$ and $t-1$).

**Formula**:
$$ \Delta_{archetype}(t) = \text{Membership}_{archetype}(t) - \text{Membership}_{archetype}(t-1) $$

This computation is performed sequentially per player session. Using a simple 1-step difference ensures maximum responsiveness to behavioral changes.

*   **Implementation**: `df.groupby('userId')['soft_archetype'].diff().fillna(0)`
*   **Initial State**: The first window of every session is assigned a delta of 0.0.

## 3. System Architecture Integration

### 3.1. Expanded Feature Space
The input vector for the ANFIS surrogate model (Notebook `06_ANFIS_Preparation.ipynb`) was expanded from 3 to 6 dimensions to incorporate these temporal signals.

**Final Input Vector**:
1.  `soft_combat` (State)
2.  `soft_collect` (State)
3.  `soft_explore` (State)
4.  `delta_combat` (Rate of Change)
5.  `delta_collect` (Rate of Change)
6.  `delta_explore` (Rate of Change)

### 3.2. Model Training
The MLP surrogate model (Notebook `07_ANFIS_Training.ipynb`) was retrained on this 6-dimensional input space. This allows the difficulty controller to anticipate player intent based on their trajectory, not just their current position.

## 4. Validation
The integration was validated by visualizing the delta distributions in Notebook `08_Evaluation_Visualizations.ipynb`. Results confirmed that the signals closely track behavioral shifts, providing a centered distribution around zero with active tails corresponding to distinct phase changes in gameplay.

