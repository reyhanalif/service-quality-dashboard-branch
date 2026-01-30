import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from 'recharts';
import { GlassCard } from '../ui/GlassCard';

interface LineChartProps {
    data: Record<string, unknown>[];
    lines: {
        dataKey: string;
        color: string;
        name: string;
    }[];
    xAxisKey: string;
    title?: string;
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    yAxisDomain?: [number | 'auto', number | 'auto'];
    referenceLines?: { y?: number; x?: string | number; label?: string; color?: string }[];
}

export function LineChart({
    data,
    lines,
    xAxisKey,
    title,
    height = 200,
    showGrid = true,
    showLegend = false,
    yAxisDomain,
    referenceLines,
}: LineChartProps) {
    return (
        <GlassCard>
            {title && (
                <h3 className="text-sm font-medium text-slate-600 mb-3">{title}</h3>
            )}
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        {showGrid && (
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                        )}
                        <XAxis
                            dataKey={xAxisKey}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            domain={yAxisDomain}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                            }}
                        />
                        {showLegend && <Legend />}
                        {referenceLines?.map((ref, idx) => (
                            <ReferenceLine
                                key={idx}
                                y={ref.y}
                                x={ref.x}
                                stroke={ref.color || '#94a3b8'}
                                strokeDasharray="3 3"
                                label={{
                                    value: ref.label,
                                    position: 'insideTopRight',
                                    fill: ref.color || '#94a3b8',
                                    fontSize: 10
                                }}
                            />
                        ))}
                        {lines.map((line) => (
                            <Line
                                key={line.dataKey}
                                type="monotone"
                                dataKey={line.dataKey}
                                stroke={line.color}
                                strokeWidth={2}
                                dot={false}
                                name={line.name}
                            />
                        ))}
                    </RechartsLineChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
