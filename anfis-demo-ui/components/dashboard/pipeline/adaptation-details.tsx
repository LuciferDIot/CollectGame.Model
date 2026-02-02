import { AdaptationMethodBadge, NoDeltasFallback } from './adaptation-badges';
import { BehavioralDeltasList } from './behavioral-deltas';
import { ParameterAdjustmentsList } from './parameter-adjustments';

/**
 * Prepare and extract delta data from details
 */
function prepareAdaptationData(details: any) {
    const deltas = details.adaptationDeltas || details.behavioralDeltas || [];
    const previousState = details.previousState;
    const method = details.method || details.adaptationMethod || 'ANFIS Gradient Descent';
    const hasBehavioralDeltas = details.behavioralDeltas && typeof details.behavioralDeltas === 'object';
    const hasParameterDeltas = Array.isArray(deltas) && deltas.length > 0;
    const hasAnyDeltas = hasBehavioralDeltas || hasParameterDeltas;
    
    return {
        deltas,
        previousState,
        method,
        hasBehavioralDeltas,
        hasParameterDeltas,
        hasAnyDeltas,
        behavioralDeltas: details.behavioralDeltas
    };
}

/**
 * Adaptation details renderer - shows behavioral deltas and parameter changes
 */
export function AdaptationDetails({ details }: { details: any }) {
    const data = prepareAdaptationData(details);
    
    return (
        <div className="space-y-2">
            <AdaptationMethodBadge method={data.method} />
            
            {data.hasBehavioralDeltas && (
                <BehavioralDeltasList 
                    deltas={data.behavioralDeltas} 
                    previousState={data.previousState}
                />
            )}
            
            {data.hasParameterDeltas && <ParameterAdjustmentsList deltas={data.deltas} />}
            
            {!data.hasAnyDeltas && <NoDeltasFallback />}
        </div>
    );
}
