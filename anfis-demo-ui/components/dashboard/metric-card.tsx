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
    bg: 'from-red-950/30 to-red-900/20',
    border: 'border-red-900/30',
    text: 'text-red-300',
    accent: 'text-red-400',
  },
  collection: {
    bg: 'from-amber-950/30 to-amber-900/20',
    border: 'border-amber-900/30',
    text: 'text-amber-300',
    accent: 'text-amber-400',
  },
  exploration: {
    bg: 'from-cyan-950/30 to-cyan-900/20',
    border: 'border-cyan-900/30',
    text: 'text-cyan-300',
    accent: 'text-cyan-400',
  },
  neutral: {
    bg: 'from-slate-900/50 to-slate-800/30',
    border: 'border-slate-700/50',
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
    <div className="p-4 cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </p>
        {trend !== 'neutral' && trendValue && (
          <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        <p className={`text-3xl font-bold ${colors.text}`}>
          {value}
        </p>
        {suffix && (
          <span className={`text-lg ${colors.accent} font-medium`}>{suffix}</span>
        )}
      </div>
    </div>
  );

  return (
    <Card className={`bg-gradient-to-br ${colors.bg} ${colors.border} hover:scale-[1.02] transition-transform duration-200 relative group`}>
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
