import { HelpfulTooltip } from '@/components/analytics/shared/helpful-tooltip';
import { Card } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'combat' | 'collection' | 'exploration' | 'neutral';
  suffix?: string;
  help?: {
    title: string;
    description: string;
    calculation?: string;
    interpretation?: string;
  };
}

const colorMap = {
  combat: {
    bg: 'from-red-950/40 via-red-950/20 to-slate-950/50',
    border: 'border-red-500/20',
    text: 'text-red-300',
    accent: 'text-red-400',
  },
  collection: {
    bg: 'from-amber-950/40 via-amber-950/20 to-slate-950/50',
    border: 'border-amber-500/20',
    text: 'text-amber-300',
    accent: 'text-amber-400',
  },
  exploration: {
    bg: 'from-cyan-950/40 via-cyan-950/20 to-slate-950/50',
    border: 'border-cyan-500/20',
    text: 'text-cyan-300',
    accent: 'text-cyan-400',
  },
  neutral: {
    bg: 'from-slate-900/60 via-slate-900/40 to-slate-950/50',
    border: 'border-slate-700/40',
    text: 'text-slate-300',
    accent: 'text-slate-400',
  },
};

export function MetricCard({
  label,
  value,
  trend = 'neutral',
  trendValue,
  color = 'neutral',
  suffix = '',
  help
}: MetricCardProps) {
  const colors = colorMap[color];

  const content = (
    <div className="p-4 cursor-pointer relative z-10">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold opacity-70">
          {label}
        </p>
        {trend !== 'neutral' && trendValue && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/20 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <p className={`text-3xl font-black font-mono tracking-tight ${colors.text}`}>
          {value}
        </p>
        {suffix && (
          <span className={`text-sm ${colors.accent} font-bold opacity-60`}>{suffix}</span>
        )}
      </div>
    </div>
  );

  return (
    <Card className={`bg-linear-to-br ${colors.bg} ${colors.border} backdrop-blur-md hover:scale-[1.02] hover:border-white/20 transition-all duration-300 relative group overflow-hidden border-t-2`}>
      {/* Ambient Light Effect */}
      <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 bg-${color === 'neutral' ? 'slate' : color === 'combat' ? 'red' : color === 'collection' ? 'amber' : 'cyan'}-500`} />

      {help ? (
        <HelpfulTooltip
          trigger={<div className="w-full h-full">{content}</div>}
          title={help.title}
          description={help.description}
          calculation={help.calculation}
          interpretation={help.interpretation}
        />
      ) : content}
    </Card>
  );
}
