import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';
import { GlassCard } from '../ui/GlassCard';

interface DonutChartProps {
    data: { name: string; value: number; color: string }[];
    title?: string;
    height?: number;
    showLegend?: boolean;
    innerRadius?: number;
    outerRadius?: number;
}

export function DonutChart({
    data,
    title,
    height = 200,
    showLegend = true,
    innerRadius = 50,
    outerRadius = 70,
}: DonutChartProps) {
    return (
        <GlassCard>
            {title && (
                <h3 className="text-sm font-medium text-slate-600 mb-3">{title}</h3>
            )}
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            paddingAngle={2}
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
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
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                                iconSize={8}
                            />
                        )}
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
