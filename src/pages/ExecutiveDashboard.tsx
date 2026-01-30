import { useMemo, useState } from 'react';
import {
    Clock,
    CheckCircle,
    TrendingUp,
    Minus,
    Zap,
    Heart,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { GlassCard, Select } from '../components/ui';
import { StackedBarChart, IndonesiaMap } from '../components/charts';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    regions,
    areaSummaries,
    branches,
    dailyMetrics,
    computePeriodComparison,
    aggregateDailyTrend,
    monthlyLabels,
} from '../data/mockData';

type TimeframeDays = 30 | 60 | 90;

export function ExecutiveDashboard() {
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [fastTimeframe, setFastTimeframe] = useState<TimeframeDays>(60);
    const [consistentTimeframe, setConsistentTimeframe] = useState<TimeframeDays>(60);
    const [efficientTimeframe, setEfficientTimeframe] = useState<TimeframeDays>(60);

    // Branch Movement comparison state
    const [comparisonType, setComparisonType] = useState<'monthly' | 'weekly'>('monthly');
    // Default: compare previous month to current month (last 2 months)
    const availableMonths = monthlyLabels.slice(-6); // Last 6 months
    const [compareMonth1, setCompareMonth1] = useState(availableMonths[availableMonths.length - 2] || '');
    const [compareMonth2, setCompareMonth2] = useState(availableMonths[availableMonths.length - 1] || '');
    // Weekly: compare last 2 weeks
    const [compareWeek1, setCompareWeek1] = useState(1); // Week offset from current (1 = last week)
    const [compareWeek2, setCompareWeek2] = useState(0); // 0 = current week

    // Get filtered branch IDs
    const filteredBranchIds = useMemo(() => {
        if (!selectedRegion) return branches.map(b => b.id);
        return branches.filter(b => b.regionId === selectedRegion).map(b => b.id);
    }, [selectedRegion]);

    // Filter area summaries
    const filteredAreaSummaries = useMemo(() => {
        if (!selectedRegion) return areaSummaries;
        return areaSummaries.filter(a => a.regionId === selectedRegion);
    }, [selectedRegion]);

    // Map Data (SQI Calculation - 6 metrics)
    const mapPoints = useMemo(() => {
        return filteredAreaSummaries.map(area => {
            // Normalize each metric to 0-100 scale
            // 1. Queue Time: < 5min = 100, > 25min = 0 (lower is better)
            const queueScore = Math.max(0, Math.min(100, 100 - (area.avgQueueTime - 5) * 5));

            // 2. SLA Compliance: already 0-100 (higher is better)
            const slaScore = area.slaMet;

            // 3. Service Spread: < 2min = 100, > 10min = 0 (lower is better)
            const spreadScore = Math.max(0, Math.min(100, 100 - (area.serviceSpread - 2) * 12.5));

            // 4. Service Failure Rate: 0% = 100, > 15% = 0 (lower is better)
            const failureScore = Math.max(0, Math.min(100, 100 - area.serviceFailureRate * 6.67));

            // 5. Service Time: < 4min = 100, > 10min = 0 (lower is better)
            const serviceTimeScore = Math.max(0, Math.min(100, 100 - (area.avgServiceTime - 4) * 16.67));

            // 6. NPS: -100 to 100 -> 0 to 100 (higher is better)
            const npsScore = Math.max(0, Math.min(100, (area.npsScore + 100) / 2));

            // SQI = average of all 6 scores
            const index = Math.round((queueScore + slaScore + spreadScore + failureScore + serviceTimeScore + npsScore) / 6);

            return {
                id: area.areaId,
                x: area.coordinates?.x || 50,
                y: area.coordinates?.y || 50,
                value: index,
                label: area.areaName,
                subLabel: `SQI: ${index}`,
                radius: Math.max(2, Math.sqrt(area.branchCount) * 1.5),
                color: index >= 85 ? '#10b981' : index >= 70 ? '#f59e0b' : '#ef4444',
                details: {
                    queue: area.avgQueueTime,
                    sla: area.slaMet,
                    spread: area.serviceSpread,
                    failure: area.serviceFailureRate,
                    serviceTime: area.avgServiceTime,
                    nps: area.npsScore
                }
            };
        });
    }, [filteredAreaSummaries]);

    // ========== FAST SECTION DATA ==========
    // Week-over-week comparisons for Fast metrics
    const queueComparison = useMemo(
        () => computePeriodComparison(dailyMetrics, filteredBranchIds, 'avgQueueTime', 7),
        [filteredBranchIds]
    );

    const slaComparison = useMemo(
        () => computePeriodComparison(dailyMetrics, filteredBranchIds, 'slaMet', 7),
        [filteredBranchIds]
    );

    // Daily trend data for the chosen timeframe
    const queueTrendData = useMemo(() => {
        const allTrend = aggregateDailyTrend(dailyMetrics, filteredBranchIds, 'avgQueueTime');
        return allTrend.slice(-fastTimeframe).map(d => ({
            ...d,
            date: d.date.slice(5), // MM-DD format
            fullDate: d.date,
        }));
    }, [filteredBranchIds, fastTimeframe]);

    const slaTrendData = useMemo(() => {
        const allTrend = aggregateDailyTrend(dailyMetrics, filteredBranchIds, 'slaMet');
        return allTrend.slice(-fastTimeframe).map(d => ({
            ...d,
            date: d.date.slice(5),
            fullDate: d.date,
        }));
    }, [filteredBranchIds, fastTimeframe]);

    // ========== CONSISTENT SECTION DATA ==========
    const serviceFailureComparison = useMemo(
        () => computePeriodComparison(dailyMetrics, filteredBranchIds, 'serviceFailureRate', 7),
        [filteredBranchIds]
    );

    // Service spread - compute from P80 - P50 (using serviceSpread field)
    const spreadComparison = useMemo(() => {
        const filtered = dailyMetrics.filter(m => filteredBranchIds.includes(m.branchId));
        const dates = [...new Set(filtered.map(m => m.date))].sort();
        const currentDates = dates.slice(-7);
        const previousDates = dates.slice(-14, -7);

        const currentData = filtered.filter(m => currentDates.includes(m.date));
        const previousData = filtered.filter(m => previousDates.includes(m.date));

        const currentAvg = currentData.length > 0
            ? currentData.reduce((s, m) => s + m.serviceSpread, 0) / currentData.length
            : 0;
        const previousAvg = previousData.length > 0
            ? previousData.reduce((s, m) => s + m.serviceSpread, 0) / previousData.length
            : 0;

        const change = currentAvg - previousAvg;
        const changePercent = previousAvg !== 0 ? (change / previousAvg) * 100 : 0;

        return {
            current: Math.round(currentAvg * 10) / 10,
            previous: Math.round(previousAvg * 10) / 10,
            change: Math.round(change * 10) / 10,
            changePercent: Math.round(changePercent * 10) / 10,
        };
    }, [filteredBranchIds]);

    const serviceFailureTrendData = useMemo(() => {
        const allTrend = aggregateDailyTrend(dailyMetrics, filteredBranchIds, 'serviceFailureRate');
        return allTrend.slice(-consistentTimeframe).map(d => ({
            ...d,
            date: d.date.slice(5),
        }));
    }, [filteredBranchIds, consistentTimeframe]);

    const spreadTrendData = useMemo(() => {
        const filtered = dailyMetrics.filter(m => filteredBranchIds.includes(m.branchId));
        const byDate: Record<string, number[]> = {};
        filtered.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = [];
            byDate[m.date].push(m.serviceSpread);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                value: Math.round(values.reduce((s, v) => s + v, 0) / values.length * 10) / 10,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-consistentTimeframe);
    }, [filteredBranchIds, consistentTimeframe]);

    // ========== EFFICIENT SECTION DATA ==========
    // Average FTE per branch (mock: assume 5 FTE per branch on average)
    const avgFTEPerBranch = 5;
    const totalFTE = filteredBranchIds.length * avgFTEPerBranch;

    // Trx per FTE comparison
    const trxPerFTEComparison = useMemo(() => {
        const filtered = dailyMetrics.filter(m => filteredBranchIds.includes(m.branchId));
        const dates = [...new Set(filtered.map(m => m.date))].sort();
        const currentDates = dates.slice(-7);
        const previousDates = dates.slice(-14, -7);

        const currentData = filtered.filter(m => currentDates.includes(m.date));
        const previousData = filtered.filter(m => previousDates.includes(m.date));

        // Sum total transactions and divide by FTE count
        const currentTotal = currentData.reduce((s, m) => s + m.totalTransactions, 0);
        const previousTotal = previousData.reduce((s, m) => s + m.totalTransactions, 0);

        const currentDays = currentDates.length || 1;
        const previousDays = previousDates.length || 1;

        const currentAvg = currentTotal / currentDays / totalFTE;
        const previousAvg = previousTotal / previousDays / totalFTE;

        const change = currentAvg - previousAvg;
        const changePercent = previousAvg !== 0 ? (change / previousAvg) * 100 : 0;

        return {
            current: Math.round(currentAvg * 10) / 10,
            previous: Math.round(previousAvg * 10) / 10,
            change: Math.round(change * 10) / 10,
            changePercent: Math.round(changePercent * 10) / 10,
        };
    }, [filteredBranchIds, totalFTE]);

    const serviceTimeComparison = useMemo(() => {
        const filtered = dailyMetrics.filter(m => filteredBranchIds.includes(m.branchId));
        const dates = [...new Set(filtered.map(m => m.date))].sort();
        const currentDates = dates.slice(-7);
        const previousDates = dates.slice(-14, -7);

        const currentData = filtered.filter(m => currentDates.includes(m.date));
        const previousData = filtered.filter(m => previousDates.includes(m.date));

        const currentAvg = currentData.length > 0
            ? currentData.reduce((s, m) => s + m.avgServiceTime, 0) / currentData.length
            : 0;
        const previousAvg = previousData.length > 0
            ? previousData.reduce((s, m) => s + m.avgServiceTime, 0) / previousData.length
            : 0;

        const change = currentAvg - previousAvg;
        const changePercent = previousAvg !== 0 ? (change / previousAvg) * 100 : 0;

        return {
            current: Math.round(currentAvg * 10) / 10,
            previous: Math.round(previousAvg * 10) / 10,
            change: Math.round(change * 10) / 10,
            changePercent: Math.round(changePercent * 10) / 10,
        };
    }, [filteredBranchIds]);

    const serviceTimeTrendData = useMemo(() => {
        const filtered = dailyMetrics.filter(m => filteredBranchIds.includes(m.branchId));
        const byDate: Record<string, number[]> = {};
        filtered.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = [];
            byDate[m.date].push(m.avgServiceTime);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                value: Math.round(values.reduce((s, v) => s + v, 0) / values.length * 10) / 10,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-efficientTimeframe);
    }, [filteredBranchIds, efficientTimeframe]);

    // Trx per FTE Trend Data
    const trxPerFTETrendData = useMemo(() => {
        const filtered = dailyMetrics.filter(m => filteredBranchIds.includes(m.branchId));
        const byDate: Record<string, number[]> = {};
        filtered.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = [];
            byDate[m.date].push(m.totalTransactions);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                value: Math.round(values.reduce((s, v) => s + v, 0) / totalFTE * 10) / 10,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-efficientTimeframe);
    }, [filteredBranchIds, efficientTimeframe, totalFTE]);

    // Digital Rate data - transactions that can be done digitally
    const digitalRateData = useMemo(() => {
        return [
            { name: 'Setor Tunai', value: 44, color: '#7c3aed' },
            { name: 'Pembayaran/Transfer', value: 43, color: '#a855f7' },
            { name: 'Tarik Tunai', value: 12, color: '#d8b4fe' },
            { name: 'Lainnya', value: 1, color: '#f3e8ff' },
        ];
    }, []);

    // Total teller transactions volume (in millions)
    const totalTellerTransactions = 57.3; // Juta/Million

    // Trend data showing decreasing digital-eligible transaction VOLUME at branch (in Juta/Million)
    const digitalTrendData = useMemo(() => {
        const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Simulating decreasing volume as digitalization increases (transactions moving to digital channels)
        const baseVolume = 50.5; // Starting volume in Juta
        return months.map((month, i) => ({
            date: month,
            volume: Math.round((baseVolume - i * 2.3 + (Math.random() * 1 - 0.5)) * 10) / 10,
        }));
    }, []);

    const latestVolume = digitalTrendData[digitalTrendData.length - 1]?.volume || 0;
    const firstVolume = digitalTrendData[0]?.volume || 0;
    const volumeChange = Math.round((latestVolume - firstVolume) * 10) / 10;


    // ========== POSITIVE SECTION DATA ==========
    const sesComparison = useMemo(() => {
        // Using area summaries for SES (monthly data)
        const avgSes = filteredAreaSummaries.length > 0
            ? filteredAreaSummaries.reduce((s, a) => s + a.sesScore, 0) / filteredAreaSummaries.length
            : 0;
        // Simulated previous value (slightly different)
        const prevSes = avgSes * (1 - (Math.random() * 0.04 - 0.02));
        const change = avgSes - prevSes;
        const changePercent = prevSes !== 0 ? (change / prevSes) * 100 : 0;
        return {
            current: Math.round(avgSes * 100) / 100,
            previous: Math.round(prevSes * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 10) / 10,
        };
    }, [filteredAreaSummaries]);

    const npsComparison = useMemo(() => {
        const avgNps = filteredAreaSummaries.length > 0
            ? filteredAreaSummaries.reduce((s, a) => s + a.npsScore, 0) / filteredAreaSummaries.length
            : 0;
        const prevNps = avgNps - (Math.random() * 4 - 2);
        const change = avgNps - prevNps;
        return {
            current: Math.round(avgNps),
            previous: Math.round(prevNps),
            change: Math.round(change),
            changePercent: 0, // NPS doesn't use % change
        };
    }, [filteredAreaSummaries]);

    const sesTrendData = useMemo(() => {
        // Generate trend from monthly aggregates
        const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const baseScore = sesComparison.current;
        return months.map((month, i) => ({
            date: month,
            value: Math.round((baseScore - 0.15 + (i * 0.03) + (Math.random() * 0.1 - 0.05)) * 100) / 100,
        }));
    }, [sesComparison.current]);

    const npsTrendData = useMemo(() => {
        const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const baseScore = npsComparison.current;
        return months.map((month, i) => ({
            date: month,
            value: Math.round(baseScore - 8 + (i * 1.5) + (Math.random() * 4 - 2)),
        }));
    }, [npsComparison.current]);

    const nsiTrendData = useMemo(() => {
        const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // NSI is typically a yearly score but showing monthly trend
        const baseScore = 75; // Example base NSI
        return months.map((month, i) => ({
            date: month,
            value: Math.round(baseScore - 5 + (i * 1) + (Math.random() * 4 - 2)),
        }));
    }, []);

    // Branch movement data
    const movementData = useMemo(() => {
        return filteredAreaSummaries.map(area => ({
            name: area.areaName.split(' ')[0],
            improving: area.branchesImproving,
            stagnant: area.branchesStagnant,
            declining: area.branchesDeclining,
        }));
    }, [filteredAreaSummaries]);

    // Intervention areas with SQI decline calculation (week-over-week)
    const interventionAreas = useMemo(() => {
        return [...filteredAreaSummaries]
            .map(area => {
                // Calculate current SQI
                const queueScore = Math.max(0, Math.min(100, 100 - (area.avgQueueTime - 5) * 5));
                const slaScore = area.slaMet;
                const spreadScore = Math.max(0, Math.min(100, 100 - (area.serviceSpread - 2) * 12.5));
                const failureScore = Math.max(0, Math.min(100, 100 - area.serviceFailureRate * 6.67));
                const serviceTimeScore = Math.max(0, Math.min(100, 100 - (area.avgServiceTime - 4) * 16.67));
                const npsScore = Math.max(0, Math.min(100, (area.npsScore + 100) / 2));
                const sqi = Math.round((queueScore + slaScore + spreadScore + failureScore + serviceTimeScore + npsScore) / 6);

                // Simulate previous week metrics (slight random variation to show changes)
                const prevQueue = area.avgQueueTime * (0.85 + Math.random() * 0.3);
                const prevSLA = Math.min(100, area.slaMet * (0.95 + Math.random() * 0.1));
                const prevSpread = area.serviceSpread * (0.85 + Math.random() * 0.3);
                const prevFailure = Math.max(0, area.serviceFailureRate * (0.7 + Math.random() * 0.6));
                const prevServiceTime = area.avgServiceTime * (0.9 + Math.random() * 0.2);
                const prevNPS = area.npsScore * (0.85 + Math.random() * 0.3);

                // Calculate previous SQI
                const prevQueueScore = Math.max(0, Math.min(100, 100 - (prevQueue - 5) * 5));
                const prevSlaScore = prevSLA;
                const prevSpreadScore = Math.max(0, Math.min(100, 100 - (prevSpread - 2) * 12.5));
                const prevFailureScore = Math.max(0, Math.min(100, 100 - prevFailure * 6.67));
                const prevServiceTimeScore = Math.max(0, Math.min(100, 100 - (prevServiceTime - 4) * 16.67));
                const prevNpsScoreCalc = Math.max(0, Math.min(100, (prevNPS + 100) / 2));
                const prevSqi = Math.round((prevQueueScore + prevSlaScore + prevSpreadScore + prevFailureScore + prevServiceTimeScore + prevNpsScoreCalc) / 6);

                // Calculate SQI decline % (positive = decline, negative = improvement)
                const sqiDecline = prevSqi > 0 ? Math.round(((prevSqi - sqi) / prevSqi) * 100) : 0;

                // Calculate metric changes (positive = worsened for queue/spread/failure/serviceTime, improved for SLA)
                const queueChange = prevQueue > 0 ? Math.round(((area.avgQueueTime - prevQueue) / prevQueue) * 100) : 0;
                const slaChange = prevSLA > 0 ? Math.round(((area.slaMet - prevSLA) / prevSLA) * 100) : 0;
                const spreadChange = prevSpread > 0 ? Math.round(((area.serviceSpread - prevSpread) / prevSpread) * 100) : 0;
                const failureChange = prevFailure > 0 ? Math.round(((area.serviceFailureRate - prevFailure) / prevFailure) * 100) : 0;
                const serviceTimeChange = prevServiceTime > 0 ? Math.round(((area.avgServiceTime - prevServiceTime) / prevServiceTime) * 100) : 0;

                return {
                    ...area,
                    sqi,
                    prevSqi,
                    sqiDecline,
                    queueChange,
                    slaChange,
                    spreadChange,
                    failureChange,
                    serviceTimeChange
                };
            })
            .filter(area => area.sqiDecline > 0) // Only show areas with SQI decline
            .sort((a, b) => b.sqiDecline - a.sqiDecline) // Sort by largest decline first
            .slice(0, 10);
    }, [filteredAreaSummaries]);

    // SQI Ranking - All areas sorted by SQI (highest first)
    const sqiRanking = useMemo(() => {
        return [...filteredAreaSummaries]
            .map(area => {
                // Calculate SQI for each area (same formula as mapPoints)
                const queueScore = Math.max(0, Math.min(100, 100 - (area.avgQueueTime - 5) * 5));
                const slaScore = area.slaMet;
                const spreadScore = Math.max(0, Math.min(100, 100 - (area.serviceSpread - 2) * 12.5));
                const failureScore = Math.max(0, Math.min(100, 100 - area.serviceFailureRate * 6.67));
                const serviceTimeScore = Math.max(0, Math.min(100, 100 - (area.avgServiceTime - 4) * 16.67));
                const npsScore = Math.max(0, Math.min(100, (area.npsScore + 100) / 2));
                const sqi = Math.round((queueScore + slaScore + spreadScore + failureScore + serviceTimeScore + npsScore) / 6);

                return { ...area, sqi };
            })
            .sort((a, b) => b.sqi - a.sqi); // Sort by SQI descending (best first)
    }, [filteredAreaSummaries]);

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800">
                        Strategic Service Quality Dashboard
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Executive overview of service transformation progress
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select
                        label="Region"
                        value={selectedRegion}
                        onChange={setSelectedRegion}
                        options={regions.map(r => ({ value: r.id, label: r.name }))}
                        placeholder="All Regions"
                        className="w-48"
                    />
                </div>
            </div>

            {/* National Map Section */}
            <section className="mb-0">
                <IndonesiaMap
                    title="Regional Service Quality Map"
                    points={mapPoints}
                    height={380}
                />
            </section>

            {/* ==================== POSITIVE SECTION ==================== */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50">
                            <Heart className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">POSITIVE</h3>
                            <p className="text-sm text-slate-500">Customer experience and perception</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Monthly data</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* SES Monthly Trend */}
                    <GlassCard>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-slate-600">
                                SES Score Trend
                            </h4>
                            <span className="text-xs text-slate-400">6 months</span>
                        </div>
                        <div className="h-[140px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={sesTrendData}
                                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="sesGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                        strokeOpacity={0.5}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[3.5, 4.5]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255,255,255,0.95)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                        formatter={(value: number) => [`${value.toFixed(2)}`, 'SES Score']}
                                    />
                                    <ReferenceLine
                                        y={4.0}
                                        stroke="#10b981"
                                        strokeDasharray="5 5"
                                        label={{
                                            value: 'Target 4.0',
                                            position: 'right',
                                            fontSize: 10,
                                            fill: '#10b981',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="url(#sesGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Latest value & improvement cue */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Latest:</span>
                                <span className="text-lg font-bold text-slate-800">
                                    {sesTrendData[sesTrendData.length - 1]?.value.toFixed(2)}
                                </span>
                            </div>
                            {sesTrendData.length >= 2 && (
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sesTrendData[sesTrendData.length - 1].value > sesTrendData[sesTrendData.length - 2].value
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : sesTrendData[sesTrendData.length - 1].value < sesTrendData[sesTrendData.length - 2].value
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-slate-50 text-slate-500'
                                    }`}>
                                    {sesTrendData[sesTrendData.length - 1].value > sesTrendData[sesTrendData.length - 2].value ? (
                                        <>
                                            <ArrowUpRight className="w-3 h-3" />
                                            <span>Improving</span>
                                        </>
                                    ) : sesTrendData[sesTrendData.length - 1].value < sesTrendData[sesTrendData.length - 2].value ? (
                                        <>
                                            <ArrowDownRight className="w-3 h-3" />
                                            <span>Declining</span>
                                        </>
                                    ) : (
                                        <>
                                            <Minus className="w-3 h-3" />
                                            <span>Stable</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* NPS Monthly Trend */}
                    <GlassCard>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-slate-600">
                                NPS Score Trend
                            </h4>
                            <span className="text-xs text-slate-400">6 months</span>
                        </div>
                        <div className="h-[140px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={npsTrendData}
                                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="npsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                        strokeOpacity={0.5}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255,255,255,0.95)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                        formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value}`, 'NPS']}
                                    />
                                    <ReferenceLine
                                        y={50}
                                        stroke="#10b981"
                                        strokeDasharray="5 5"
                                        label={{
                                            value: 'Target +50',
                                            position: 'right',
                                            fontSize: 10,
                                            fill: '#10b981',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#059669"
                                        strokeWidth={2}
                                        fill="url(#npsGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Latest value & improvement cue */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Latest:</span>
                                <span className="text-lg font-bold text-slate-800">
                                    {npsTrendData[npsTrendData.length - 1]?.value >= 0 ? '+' : ''}{npsTrendData[npsTrendData.length - 1]?.value}
                                </span>
                            </div>
                            {npsTrendData.length >= 2 && (
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${npsTrendData[npsTrendData.length - 1].value > npsTrendData[npsTrendData.length - 2].value
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : npsTrendData[npsTrendData.length - 1].value < npsTrendData[npsTrendData.length - 2].value
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-slate-50 text-slate-500'
                                    }`}>
                                    {npsTrendData[npsTrendData.length - 1].value > npsTrendData[npsTrendData.length - 2].value ? (
                                        <>
                                            <ArrowUpRight className="w-3 h-3" />
                                            <span>Improving</span>
                                        </>
                                    ) : npsTrendData[npsTrendData.length - 1].value < npsTrendData[npsTrendData.length - 2].value ? (
                                        <>
                                            <ArrowDownRight className="w-3 h-3" />
                                            <span>Declining</span>
                                        </>
                                    ) : (
                                        <>
                                            <Minus className="w-3 h-3" />
                                            <span>Stable</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* NSI Monthly Trend */}
                    <GlassCard>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-slate-600">
                                NSI Score Trend
                            </h4>
                            <span className="text-xs text-slate-400">6 months</span>
                        </div>
                        <div className="h-[140px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={nsiTrendData}
                                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="nsiGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                        strokeOpacity={0.5}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[50, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255,255,255,0.95)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                        formatter={(value: number) => [`${value}`, 'NSI Score']}
                                    />
                                    <ReferenceLine
                                        y={75}
                                        stroke="#0ea5e9"
                                        strokeDasharray="5 5"
                                        label={{
                                            value: 'Target 75',
                                            position: 'right',
                                            fontSize: 10,
                                            fill: '#0ea5e9',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#0ea5e9"
                                        strokeWidth={2}
                                        fill="url(#nsiGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Latest value & improvement cue */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Latest:</span>
                                <span className="text-lg font-bold text-slate-800">
                                    {nsiTrendData[nsiTrendData.length - 1]?.value}
                                </span>
                            </div>
                            {nsiTrendData.length >= 2 && (
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${nsiTrendData[nsiTrendData.length - 1].value > nsiTrendData[nsiTrendData.length - 2].value
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : nsiTrendData[nsiTrendData.length - 1].value < nsiTrendData[nsiTrendData.length - 2].value
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-slate-50 text-slate-500'
                                    }`}>
                                    {nsiTrendData[nsiTrendData.length - 1].value > nsiTrendData[nsiTrendData.length - 2].value ? (
                                        <>
                                            <ArrowUpRight className="w-3 h-3" />
                                            <span>Improving</span>
                                        </>
                                    ) : nsiTrendData[nsiTrendData.length - 1].value < nsiTrendData[nsiTrendData.length - 2].value ? (
                                        <>
                                            <ArrowDownRight className="w-3 h-3" />
                                            <span>Declining</span>
                                        </>
                                    ) : (
                                        <>
                                            <Minus className="w-3 h-3" />
                                            <span>Stable</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </section>

            {/* ==================== FAST SECTION ==================== */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">FAST</h3>
                            <p className="text-sm text-slate-500">Speed of service delivery</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Timeframe:</span>
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                            {([30, 60, 90] as TimeframeDays[]).map(days => (
                                <button
                                    key={days}
                                    onClick={() => setFastTimeframe(days)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${fastTimeframe === days
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {days}D
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Queue Time Scorecard */}
                    <div className="col-span-2">
                        <GlassCard className="h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Avg Queue Time
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-slate-800 tabular-nums">
                                            {queueComparison.current}
                                        </span>
                                        <span className="text-lg text-slate-500">min</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {queueComparison.changePercent < 0 ? (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {Math.abs(queueComparison.changePercent)}%
                                                    </span>
                                                </div>
                                            ) : queueComparison.changePercent > 0 ? (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {queueComparison.changePercent}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Minus className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">0%</span>
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-400">vs last week</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Was {queueComparison.previous} min
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* SLA Compliance Scorecard */}
                    <div className="col-span-2">
                        <GlassCard className="h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-cyan-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        SLA Compliance
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-slate-800 tabular-nums">
                                            {slaComparison.current}
                                        </span>
                                        <span className="text-lg text-slate-500">%</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {slaComparison.changePercent > 0 ? (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {slaComparison.changePercent}%
                                                    </span>
                                                </div>
                                            ) : slaComparison.changePercent < 0 ? (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {Math.abs(slaComparison.changePercent)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Minus className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">0%</span>
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-400">vs last week</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Was {slaComparison.previous}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Queue Time Trend Chart */}
                    <div className="col-span-4">
                        <GlassCard className="h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-600">
                                    Queue Time Trend ({fastTimeframe} Days)
                                </h4>
                            </div>
                            <div className="h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={queueTrendData}
                                        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="queueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            strokeOpacity={0.5}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={Math.floor(queueTrendData.length / 6)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={['dataMin - 2', 'dataMax + 2']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.95)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                            formatter={(value: number) => [`${value} min`, 'Queue Time']}
                                        />
                                        <ReferenceLine
                                            y={15}
                                            stroke="#ef4444"
                                            strokeDasharray="5 5"
                                            label={{
                                                value: 'SLA Target',
                                                position: 'right',
                                                fontSize: 10,
                                                fill: '#ef4444',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            fill="url(#queueGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </div>

                    {/* SLA Compliance Trend Chart */}
                    <div className="col-span-4">
                        <GlassCard className="h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-600">
                                    SLA Compliance Trend ({fastTimeframe} Days)
                                </h4>
                            </div>
                            <div className="h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={slaTrendData}
                                        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="slaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            strokeOpacity={0.5}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={Math.floor(slaTrendData.length / 6)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[60, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.95)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                            formatter={(value: number) => [`${value}%`, 'SLA Met']}
                                        />
                                        <ReferenceLine
                                            y={80}
                                            stroke="#10b981"
                                            strokeDasharray="5 5"
                                            label={{
                                                value: 'Target 80%',
                                                position: 'right',
                                                fontSize: 10,
                                                fill: '#10b981',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#06b6d4"
                                            strokeWidth={2}
                                            fill="url(#slaGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </section>


            {/* ==================== EFFICIENT SECTION ==================== */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-50">
                            <TrendingUp className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">EFFICIENT</h3>
                            <p className="text-sm text-slate-500">Productivity and resource utilization</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Timeframe:</span>
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                            {([30, 60, 90] as TimeframeDays[]).map(days => (
                                <button
                                    key={days}
                                    onClick={() => setEfficientTimeframe(days)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${efficientTimeframe === days
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {days}D
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Service Time Scorecard - now first */}
                    <div className="col-span-2">
                        <GlassCard className="h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-cyan-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Avg Service Time
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-slate-800 tabular-nums">
                                            {serviceTimeComparison.current}
                                        </span>
                                        <span className="text-lg text-slate-500">min</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {serviceTimeComparison.changePercent < 0 ? (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {Math.abs(serviceTimeComparison.changePercent)}%
                                                    </span>
                                                </div>
                                            ) : serviceTimeComparison.changePercent > 0 ? (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {serviceTimeComparison.changePercent}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Minus className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">0%</span>
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-400">vs last week</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Was {serviceTimeComparison.previous} min
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Trx per FTE Scorecard - now second */}
                    <div className="col-span-2">
                        <GlassCard className="h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Trx/FTE
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-slate-800 tabular-nums">
                                            {trxPerFTEComparison.current}
                                        </span>
                                        <span className="text-lg text-slate-500">/day</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {trxPerFTEComparison.changePercent > 0 ? (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {trxPerFTEComparison.changePercent}%
                                                    </span>
                                                </div>
                                            ) : trxPerFTEComparison.changePercent < 0 ? (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {Math.abs(trxPerFTEComparison.changePercent)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Minus className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">0%</span>
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-400">vs last week</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {totalFTE} total FTE
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Trx/FTE Trend Chart */}
                    <div className="col-span-4">
                        <GlassCard className="h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-600">
                                    Trx/FTE Trend ({efficientTimeframe} Days)
                                </h4>
                            </div>
                            <div className="h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={trxPerFTETrendData}
                                        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="trxFTEGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            strokeOpacity={0.5}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={Math.floor(trxPerFTETrendData.length / 6)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={['dataMin - 1', 'dataMax + 1']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.95)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                            formatter={(value: number) => [`${value}`, 'Trx/FTE']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#06b6d4"
                                            strokeWidth={2}
                                            fill="url(#trxFTEGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Service Time Trend Chart */}
                    <div className="col-span-4">
                        <GlassCard className="h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-600">
                                    Service Time Trend ({efficientTimeframe} Days)
                                </h4>
                            </div>
                            <div className="h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={serviceTimeTrendData}
                                        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="serviceTimeGradient2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0891b2" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            strokeOpacity={0.5}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={Math.floor(serviceTimeTrendData.length / 6)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[0, 'dataMax + 1']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.95)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                            formatter={(value: number) => [`${value} min`, 'Service Time']}
                                        />
                                        <ReferenceLine
                                            y={5}
                                            stroke="#10b981"
                                            strokeDasharray="5 5"
                                            label={{
                                                value: 'Target 5 min',
                                                position: 'right',
                                                fontSize: 10,
                                                fill: '#10b981',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#0891b2"
                                            strokeWidth={2}
                                            fill="url(#serviceTimeGradient2)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </div>



                    {/* Digital Rate Section - Full width row */}
                    <div className="col-span-12">
                        <GlassCard>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-500" />
                                    <h4 className="text-sm font-medium text-slate-600">
                                        Digital Rate - Transactions Available for Digital Channels
                                    </h4>
                                </div>
                                <div className="flex items-center gap-3">
                                    {volumeChange < 0 ? (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                                            <ArrowDownRight className="w-3 h-3" />
                                            <span>{Math.abs(volumeChange)} Juta reduced</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
                                            <ArrowUpRight className="w-3 h-3" />
                                            <span>{volumeChange} Juta increase</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-slate-400">Goal: Reduce branch transactions</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-6">
                                {/* Left: Volume Scorecard + Pie Breakdown */}
                                <div className="col-span-4">
                                    {/* Total Volume */}
                                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 mb-4">
                                        <div className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
                                            Total Teller Transactions (2024)
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-slate-800">{totalTellerTransactions}</span>
                                            <span className="text-sm text-slate-500">Juta</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            Customer-facing transactions only
                                        </div>
                                    </div>

                                    {/* Pie Chart with breakdown */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-[120px] h-[120px] relative flex-shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={digitalRateData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={35}
                                                        outerRadius={55}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                    >
                                                        {digitalRateData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: number) => [`${value}%`, '']}
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(255,255,255,0.95)',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {digitalRateData.map((item) => (
                                                <div key={item.name} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2.5 h-2.5 rounded-full"
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                        <span className="text-xs text-slate-600">{item.name}</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-800">{item.value}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Trend Line Chart */}
                                <div className="col-span-8">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-sm font-medium text-slate-600">
                                            Digital-Eligible Transactions at Branch (Volume in Juta)
                                        </h5>
                                        <span className="text-xs text-slate-400">6 months trend • Goal: Reduce volume</span>
                                    </div>
                                    <div className="h-[180px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={digitalTrendData}
                                                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                                            >
                                                <defs>
                                                    <linearGradient id="digitalTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                                                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#e2e8f0"
                                                    strokeOpacity={0.5}
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    domain={[35, 55]}
                                                    tickFormatter={(val) => `${val}M`}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                    }}
                                                    formatter={(value: number) => [`${value} Juta`, 'Transaction Volume']}
                                                />
                                                <ReferenceLine
                                                    y={40}
                                                    stroke="#10b981"
                                                    strokeDasharray="5 5"
                                                    label={{
                                                        value: 'Target 40 Juta',
                                                        position: 'right',
                                                        fontSize: 10,
                                                        fill: '#10b981',
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="volume"
                                                    stroke="#a855f7"
                                                    strokeWidth={2}
                                                    fill="url(#digitalTrendGradient)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">Latest:</span>
                                            <span className="text-lg font-bold text-slate-800">{latestVolume} Juta</span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            <span className="text-purple-600 font-medium">↓ Decreasing trend</span> indicates successful digitalization
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </section>

            {/* ==================== CONSISTENT SECTION ==================== */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-50">
                            <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">CONSISTENT</h3>
                            <p className="text-sm text-slate-500">Service reliability and uniformity</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Timeframe:</span>
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                            {([30, 60, 90] as TimeframeDays[]).map(days => (
                                <button
                                    key={days}
                                    onClick={() => setConsistentTimeframe(days)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${consistentTimeframe === days
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {days}D
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Service Failure Rate Scorecard - Lower is better */}
                    <div className="col-span-2">
                        <GlassCard className="h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Service Failure Rate
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-slate-800 tabular-nums">
                                            {serviceFailureComparison.current}
                                        </span>
                                        <span className="text-lg text-slate-500">%</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {/* Lower is better - invert colors */}
                                            {serviceFailureComparison.changePercent < 0 ? (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {Math.abs(serviceFailureComparison.changePercent)}%
                                                    </span>
                                                </div>
                                            ) : serviceFailureComparison.changePercent > 0 ? (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {serviceFailureComparison.changePercent}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Minus className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">0%</span>
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-400">vs last week</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Was {serviceFailureComparison.previous}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Service Spread Scorecard */}
                    <div className="col-span-2">
                        <GlassCard className="h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Service Spread
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-slate-800 tabular-nums">
                                            {spreadComparison.current}
                                        </span>
                                        <span className="text-lg text-slate-500">min</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">P80 − P50</p>
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {spreadComparison.changePercent < 0 ? (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {Math.abs(spreadComparison.changePercent)}%
                                                    </span>
                                                </div>
                                            ) : spreadComparison.changePercent > 0 ? (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {spreadComparison.changePercent}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Minus className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">0%</span>
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-400">vs last week</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Service Failure Rate Trend Chart - Lower is better */}
                    <div className="col-span-4">
                        <GlassCard className="h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-600">
                                    Service Failure Trend ({consistentTimeframe} Days)
                                </h4>
                            </div>
                            <div className="h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={serviceFailureTrendData}
                                        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="failureGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            strokeOpacity={0.5}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={Math.floor(serviceFailureTrendData.length / 6)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[0, 20]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.95)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                            formatter={(value: number) => [`${value}%`, 'Failure Rate']}
                                        />
                                        <ReferenceLine
                                            y={5}
                                            stroke="#10b981"
                                            strokeDasharray="5 5"
                                            label={{
                                                value: 'Target ≤5%',
                                                position: 'right',
                                                fontSize: 10,
                                                fill: '#10b981',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            fill="url(#failureGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Service Spread Trend Chart */}
                    <div className="col-span-4">
                        <GlassCard className="h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-600">
                                    Service Spread Trend ({consistentTimeframe} Days)
                                </h4>
                            </div>
                            <div className="h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={spreadTrendData}
                                        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="spreadGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            strokeOpacity={0.5}
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={Math.floor(spreadTrendData.length / 6)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[0, 'dataMax + 2']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.95)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                            formatter={(value: number) => [`${value} min`, 'Spread (P80-P50)']}
                                        />
                                        <ReferenceLine
                                            y={5}
                                            stroke="#ef4444"
                                            strokeDasharray="5 5"
                                            label={{
                                                value: 'Max 5 min',
                                                position: 'right',
                                                fontSize: 10,
                                                fill: '#ef4444',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            fill="url(#spreadGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </section>




            {/* Branch Movement by Area */}
            <GlassCard>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-medium text-slate-700">Branch Movement by Area</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Comparing {comparisonType === 'monthly'
                                ? `${compareMonth1} vs ${compareMonth2}`
                                : `Week ${compareWeek1} vs Week ${compareWeek2}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Type Toggle */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Compare:</span>
                            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => setComparisonType('monthly')}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${comparisonType === 'monthly' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setComparisonType('weekly')}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${comparisonType === 'weekly' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Weekly
                                </button>
                            </div>
                        </div>

                        {/* Period Selectors */}
                        {comparisonType === 'monthly' ? (
                            <div className="flex items-center gap-2">
                                <select
                                    value={compareMonth1}
                                    onChange={(e) => setCompareMonth1(e.target.value)}
                                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700"
                                >
                                    {availableMonths.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <span className="text-xs text-slate-400">vs</span>
                                <select
                                    value={compareMonth2}
                                    onChange={(e) => setCompareMonth2(e.target.value)}
                                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700"
                                >
                                    {availableMonths.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <select
                                    value={compareWeek1}
                                    onChange={(e) => setCompareWeek1(Number(e.target.value))}
                                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700"
                                >
                                    {[4, 3, 2, 1].map(w => (
                                        <option key={w} value={w}>Week -{w}</option>
                                    ))}
                                </select>
                                <span className="text-xs text-slate-400">vs</span>
                                <select
                                    value={compareWeek2}
                                    onChange={(e) => setCompareWeek2(Number(e.target.value))}
                                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700"
                                >
                                    {[3, 2, 1, 0].map(w => (
                                        <option key={w} value={w}>{w === 0 ? 'This Week' : `Week -${w}`}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                        <span className="text-xs text-slate-500">Improving (↑ from {compareMonth1})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-amber-500" />
                        <span className="text-xs text-slate-500">Stagnant (no change)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <span className="text-xs text-slate-500">Declining (↓ from {compareMonth1})</span>
                    </div>
                </div>
                <div style={{ height: 220 }}>
                    <StackedBarChart
                        data={movementData.slice(0, 12)}
                        xAxisKey="name"
                        bars={[
                            { dataKey: 'improving', color: '#10b981', name: 'Improving' },
                            { dataKey: 'stagnant', color: '#f59e0b', name: 'Stagnant' },
                            { dataKey: 'declining', color: '#ef4444', name: 'Declining' },
                        ]}
                        height={200}
                        stacked
                    />
                </div>
            </GlassCard>

            {/* Bottom Row: Intervention Table & Transformation Scatter */}
            <div className="grid grid-cols-2 gap-4">
                <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-medium text-slate-700">Where to Intervene</h3>
                            <p className="text-xs text-slate-400">Areas with SQI decline vs last week, ranked by % decline</p>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200/50">
                                    <th className="text-left py-2 px-1.5 text-xs font-medium text-slate-500 uppercase">
                                        Area
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        SQI
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        Queue
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        SLA
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        Spread
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        Fail%
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        Svc.T
                                    </th>
                                    <th className="text-right py-2 px-1.5 text-xs font-medium text-slate-500 uppercase">
                                        SQI Δ
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {interventionAreas.slice(0, 8).map((area) => (
                                    <tr
                                        key={area.areaId}
                                        className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="py-1.5 px-1.5 text-slate-700 truncate max-w-[90px]" title={area.areaName}>
                                            {area.areaName.split(' ').slice(0, 2).join(' ')}
                                        </td>
                                        <td className="py-1.5 px-1 text-center">
                                            <span className={`font-semibold tabular-nums ${area.sqi >= 85 ? 'text-emerald-600' :
                                                area.sqi >= 70 ? 'text-amber-600' : 'text-red-600'
                                                }`}>
                                                {area.sqi}
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-1 text-center">
                                            <span className={`text-xs tabular-nums ${area.queueChange > 0 ? 'text-red-500' : area.queueChange < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {area.queueChange > 0 ? '↑' : area.queueChange < 0 ? '↓' : '–'}{Math.abs(area.queueChange)}%
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-1 text-center">
                                            <span className={`text-xs tabular-nums ${area.slaChange < 0 ? 'text-red-500' : area.slaChange > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {area.slaChange > 0 ? '↑' : area.slaChange < 0 ? '↓' : '–'}{Math.abs(area.slaChange)}%
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-1 text-center">
                                            <span className={`text-xs tabular-nums ${area.spreadChange > 0 ? 'text-red-500' : area.spreadChange < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {area.spreadChange > 0 ? '↑' : area.spreadChange < 0 ? '↓' : '–'}{Math.abs(area.spreadChange)}%
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-1 text-center">
                                            <span className={`text-xs tabular-nums ${area.failureChange > 0 ? 'text-red-500' : area.failureChange < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {area.failureChange > 0 ? '↑' : area.failureChange < 0 ? '↓' : '–'}{Math.abs(area.failureChange)}%
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-1 text-center">
                                            <span className={`text-xs tabular-nums ${area.serviceTimeChange > 0 ? 'text-red-500' : area.serviceTimeChange < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {area.serviceTimeChange > 0 ? '↑' : area.serviceTimeChange < 0 ? '↓' : '–'}{Math.abs(area.serviceTimeChange)}%
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-1.5 text-right">
                                            <span className={`font-semibold tabular-nums px-1.5 py-0.5 rounded ${area.sqiDecline >= 10 ? 'bg-red-100 text-red-700' :
                                                area.sqiDecline >= 5 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                ↓{area.sqiDecline}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-medium text-slate-700">SQI Ranking by Area</h3>
                            <p className="text-xs text-slate-400">All areas ranked by Service Quality Index (highest first)</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">≥85 Excellent</span>
                            <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700">70-84 Good</span>
                            <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">&lt;70 Needs Work</span>
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[360px]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm">
                                <tr className="border-b border-slate-200/50">
                                    <th className="text-left py-2 px-1.5 text-xs font-medium text-slate-500 uppercase">
                                        #
                                    </th>
                                    <th className="text-left py-2 px-1.5 text-xs font-medium text-slate-500 uppercase">
                                        Area
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        SQI
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        Queue
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        SLA
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        Spread
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        Fail%
                                    </th>
                                    <th className="text-center py-2 px-1 text-xs font-medium text-slate-500 uppercase">
                                        Svc.T
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sqiRanking.map((area, idx) => (
                                    <tr
                                        key={area.areaId}
                                        className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="py-1.5 px-1.5 font-medium text-slate-500 text-xs">
                                            {idx + 1}
                                        </td>
                                        <td className="py-1.5 px-1.5 text-slate-700 truncate max-w-[120px]" title={area.areaName}>
                                            {area.areaName.split(' ').slice(0, 2).join(' ')}
                                        </td>
                                        <td className="py-1.5 px-1 text-center">
                                            <span className={`inline-block w-8 text-center font-semibold tabular-nums rounded px-1 py-0.5 ${area.sqi >= 85 ? 'bg-emerald-100 text-emerald-700' :
                                                area.sqi >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {area.sqi}
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-1 text-center tabular-nums text-slate-600 text-xs">
                                            {area.avgQueueTime}m
                                        </td>
                                        <td className="py-1.5 px-1 text-center tabular-nums text-slate-600 text-xs">
                                            {area.slaMet}%
                                        </td>
                                        <td className="py-1.5 px-1 text-center tabular-nums text-slate-600 text-xs">
                                            {area.serviceSpread}m
                                        </td>
                                        <td className="py-1.5 px-1 text-center tabular-nums text-slate-600 text-xs">
                                            {area.serviceFailureRate}%
                                        </td>
                                        <td className="py-1.5 px-1 text-center tabular-nums text-slate-600 text-xs">
                                            {area.avgServiceTime}m
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

