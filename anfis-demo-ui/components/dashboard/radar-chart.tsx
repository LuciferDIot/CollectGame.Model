'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadar, ResponsiveContainer } from 'recharts';

interface RadarDataPoint {
  attribute: string;
  value: number;
  fullMark?: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  dataKey?: string;
  color?: string;
  fillOpacity?: number;
}

export function RadarChart({ 
  data, 
  dataKey = 'value',
  color = '#3b82f6',
  fillOpacity = 0.6
}: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadar data={data}>
        <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
        <PolarAngleAxis 
          dataKey="attribute" 
          tick={{ fill: 'rgb(203, 213, 225)', fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]}
          tick={{ fill: 'rgb(148, 163, 184)', fontSize: 10 }}
        />
        <Radar
          name="Behavior"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={fillOpacity}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
