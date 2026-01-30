import {
    ScatterChart as RechartsScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ZAxis,
    Cell,
    ReferenceLine,
    LabelList,
} from 'recharts';
import { GlassCard } from '../ui/GlassCard';

interface ScatterPlotProps {
    data: Record<string, unknown>[];
    xKey: string;
    yKey: string;
    zKey?: string;
    colorKey?: string;
    labelKey?: string;
    xLabel?: string;
    yLabel?: string;
    title?: string;
    height?: number;
    showQuadrants?: boolean;
    xMidpoint?: number;
    yMidpoint?: number;
    showLabels?: boolean;
    legend?: { label: string; color: string }[];
}

const statusColors: Record<string, string> = {
    Improving: '#10b981',
    Stagnant: '#f59e0b',
    Declining: '#ef4444',
};

export function ScatterPlot({
    data,
    xKey,
    yKey,
    zKey,
    colorKey,
    labelKey,
    xLabel,
    yLabel,
    title,
    height = 300,
    showQuadrants = false,
    xMidpoint = 0,
    yMidpoint = 0,
    showLabels = false,
    legend,
}: ScatterPlotProps) {
    return (
        <GlassCard>
            {title && (
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-600">{title}</h3>
                    {legend && (
                        <div className="flex items-center gap-4">
                            {legend.map((item) => (
                                <div key={item.label} className="flex items-center gap-1.5">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-xs text-slate-500">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsScatterChart margin={{ top: 20, right: 80, bottom: 30, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis
                            type="number"
                            dataKey={xKey}
                            name={xLabel}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            label={xLabel ? { value: xLabel, position: 'bottom', offset: 10, fontSize: 12, fill: '#64748b' } : undefined}
                        />
                        <YAxis
                            type="number"
                            dataKey={yKey}
                            name={yLabel}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: '#64748b' } : undefined}
                        />
                        {zKey && <ZAxis type="number" dataKey={zKey} range={[50, 400]} />}
                        {showQuadrants && (
                            <>
                                <ReferenceLine x={xMidpoint} stroke="#94a3b8" strokeDasharray="5 5" />
                                <ReferenceLine y={yMidpoint} stroke="#94a3b8" strokeDasharray="5 5" />
                            </>
                        )}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                            }}
                            formatter={(value: number, name: string) => [value.toFixed(1), name]}
                            labelFormatter={(_, payload) => {
                                if (payload && payload.length > 0 && labelKey) {
                                    const dataPoint = payload[0].payload;
                                    return dataPoint[labelKey] as string;
                                }
                                return '';
                            }}
                        />
                        <Scatter data={data} fill="#3b82f6">
                            {colorKey &&
                                data.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={statusColors[entry[colorKey] as string] || '#3b82f6'}
                                    />
                                ))}
                            {showLabels && labelKey && (
                                <LabelList
                                    dataKey={labelKey}
                                    position="right"
                                    offset={8}
                                    style={{ fontSize: 9, fill: '#64748b' }}
                                />
                            )}
                        </Scatter>
                    </RechartsScatterChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}

