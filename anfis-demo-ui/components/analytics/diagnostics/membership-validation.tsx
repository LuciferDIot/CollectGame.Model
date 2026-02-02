import { checkMembershipSumValidity } from '@/lib/analytics/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

function getValidationStyles(status: 'valid' | 'warning' | 'error') {
    switch (status) {
        case 'valid': return 'bg-emerald-950/30 border-emerald-900/50 text-emerald-500';
        case 'error': return 'bg-red-950/30 border-red-900/50 text-red-500';
        default: return 'bg-amber-950/30 border-amber-900/50 text-amber-500';
    }
}

export function MembershipValidation({ sum }: { sum: number }) {
  const status = checkMembershipSumValidity(sum);
  const isValid = status === 'valid';

  return (
    <div className={`mt-2 flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-mono border ${getValidationStyles(status)}`}>
        <span className="uppercase tracking-wider">Partition of Unity</span>
        <div className="flex items-center gap-2">
            <span>Σ = {sum.toFixed(4)}</span>
            {isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        </div>
    </div>
  );
}
