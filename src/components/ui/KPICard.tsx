import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { GlassCard } from './GlassCard';

interface KPICardProps {
    title: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'stable' | 'down';
    trendValue?: string;
    sparklineData?: { value: number }[];
    color?: 'blue' | 'purple' | 'cyan' | 'green' | 'amber' | 'red';
    subtitle?: string;
    icon?: ReactNode;
    invertTrendColor?: boolean;
}

const colorMap = {
    blue: { main: '#3b82f6', gradient: 'from-blue-500/20 to-blue-500/5', bg: 'bg-blue-50' },
    purple: { main: '#8b5cf6', gradient: 'from-purple-500/20 to-purple-500/5', bg: 'bg-purple-50' },
    cyan: { main: '#06b6d4', gradient: 'from-cyan-500/20 to-cyan-500/5', bg: 'bg-cyan-50' },
    green: { main: '#10b981', gradient: 'from-emerald-500/20 to-emerald-500/5', bg: 'bg-emerald-50' },
    amber: { main: '#f59e0b', gradient: 'from-amber-500/20 to-amber-500/5', bg: 'bg-amber-50' },
    red: { main: '#ef4444', gradient: 'from-red-500/20 to-red-500/5', bg: 'bg-red-50' },
};

export function KPICard({
    title,
    value,
    unit,
    trend,
    trendValue,
    sparklineData,
    color = 'blue',
    subtitle,
    icon,
    invertTrendColor = false,
}: KPICardProps) {
    const colors = colorMap[color];

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    let trendColor = 'text-slate-400';
    if (trend === 'up') {
        trendColor = invertTrendColor ? 'text-red-500' : 'text-emerald-600';
    } else if (trend === 'down') {
        trendColor = invertTrendColor ? 'text-emerald-600' : 'text-red-500';
    }

    return (
        <GlassCard className="relative overflow-hidden" hover>
            {/* Background gradient accent */}
            <div className={clsx('absolute inset-0 bg-gradient-to-br opacity-50', colors.gradient)} />

            {/* Content */}
            <div className="relative">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {icon && (
                            <div className={clsx('p-2 rounded-lg', colors.bg)} style={{ color: colors.main }}>
                                {icon}
                            </div>
                        )}
                        <div>
                            <h3 className="text-sm font-medium text-slate-600">{title}</h3>
                            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                        </div>
                    </div>

                    {trend && (
                        <div className={clsx('flex items-center gap-1 text-sm font-medium', trendColor)}>
                            <TrendIcon className="w-4 h-4" />
                            {trendValue && <span>{trendValue}</span>}
                        </div>
                    )}
                </div>

                <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-semibold text-slate-800 tabular-nums">{value}</span>
                        {unit && <span className="text-sm text-slate-500">{unit}</span>}
                    </div>

                    {sparklineData && sparklineData.length > 0 && (
                        <div className="w-24 h-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={`sparkline-${color}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={colors.main} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={colors.main} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={colors.main}
                                        strokeWidth={1.5}
                                        fill={`url(#sparkline-${color})`}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
