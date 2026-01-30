import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from 'recharts';
import { GlassCard } from '../ui/GlassCard';

interface StackedBarChartProps {
    data: Record<string, unknown>[];
    bars: {
        dataKey: string;
        color: string;
        name: string;
    }[];
    xAxisKey: string;
    title?: string;
    height?: number;
    stacked?: boolean;
    showLegend?: boolean;
    layout?: 'horizontal' | 'vertical';
}

export function StackedBarChart({
    data,
    bars,
    xAxisKey,
    title,
    height = 200,
    stacked = true,
    showLegend = true,
    layout = 'horizontal',
}: StackedBarChartProps) {
    return (
        <GlassCard>
            {title && (
                <h3 className="text-sm font-medium text-slate-600 mb-3">{title}</h3>
            )}
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                        data={data}
                        layout={layout}
                        margin={{ top: 5, right: 5, left: layout === 'vertical' ? 60 : -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                        {layout === 'horizontal' ? (
                            <>
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
                                />
                            </>
                        ) : (
                            <>
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                <YAxis
                                    dataKey={xAxisKey}
                                    type="category"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    width={55}
                                />
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
                        />
                        {showLegend && (
                            <Legend
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                                iconSize={8}
                            />
                        )}
                        {bars.map((bar) => (
                            <Bar
                                key={bar.dataKey}
                                dataKey={bar.dataKey}
                                fill={bar.color}
                                stackId={stacked ? 'stack' : undefined}
                                name={bar.name}
                                radius={stacked ? 0 : [4, 4, 0, 0]}
                            />
                        ))}
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}

// Simple bar chart for single series with conditional coloring
interface SimpleBarChartProps {
    data: { name: string; value: number; color?: string }[];
    title?: string;
    height?: number;
    valueFormatter?: (value: number) => string;
}

export function SimpleBarChart({
    data,
    title,
    height = 200,
}: SimpleBarChartProps) {
    return (
        <GlassCard>
            {title && (
                <h3 className="text-sm font-medium text-slate-600 mb-3">{title}</h3>
            )}
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} horizontal />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            width={55}
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
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color || '#3b82f6'} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
