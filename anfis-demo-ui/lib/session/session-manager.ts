import { Deltas, SoftMembership } from '@/lib/engine/types';
import { calculateDeltaVector, hasSessionTimedOut } from '@/lib/engine/utils';

interface UserSessionState {
    lastSoftMembership: SoftMembership;
    lastTimestamp: number;
}

export class PipelineSessionManager {
    private userStates: Map<string, UserSessionState> = new Map();
    private readonly STATE_TIMEOUT_MS = 40000; // 40 seconds

    /**
     * Compute deltas based on previous state and update state.
     */
    public computeDeltasAndUpdate(userId: string, currentSoft: SoftMembership): Deltas {
        const userState = this.userStates.get(userId);
        const now = Date.now();
        const emptyDeltas = { delta_combat: 0, delta_collect: 0, delta_explore: 0 };

        // 1. New User
        if (!userState) {
            this.updateState(userId, currentSoft, now);
            return emptyDeltas;
        }

        // 2. Stale Session (Timeout)
        if (hasSessionTimedOut(userState.lastTimestamp, this.STATE_TIMEOUT_MS)) {
            console.log(`[SessionManager] Timeout for ${userId}. Resetting Deltas.`);
            this.updateState(userId, currentSoft, now);
            return emptyDeltas;
        }

        // 3. Valid Sequence - Compute Velocity
        const deltas = calculateDeltaVector(currentSoft, userState.lastSoftMembership);

        this.updateState(userId, currentSoft, now);
        return deltas;
    }

    private updateState(userId: string, soft: SoftMembership, timestamp: number) {
        this.userStates.set(userId, {
            lastSoftMembership: { ...soft },
            lastTimestamp: timestamp
        });
    }

    public reset(userId?: string) {
        if (userId) {
            this.userStates.delete(userId);
        } else {
            this.userStates.clear();
        }
    }
}
