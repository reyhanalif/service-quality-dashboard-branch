import { generateAllData, aggregateByArea, aggregateByRegion } from './generator';

// Generate all synthetic data
const rawData = generateAllData();

// Compute aggregations
export const areaSummaries = aggregateByArea(rawData.regions, rawData.dailyMetrics, rawData.monthlyMetrics);
export const regionSummaries = aggregateByRegion(rawData.regions, areaSummaries);

// Export raw data
export const { regions, branches, dailyMetrics, monthlyMetrics } = rawData;

// Convenience: flat list of areas
export const areas = regions.flatMap(r => r.areas);

// All sorted dates
export const allDates = [...new Set(dailyMetrics.map(m => m.date))].sort();

// Last 30 days of metrics for quick access
export const recentDates = allDates.slice(-30);
export const recentDailyMetrics = dailyMetrics.filter(m => recentDates.includes(m.date));

// Last 60 days for executive trend charts
export const last60Dates = allDates.slice(-60);
export const last60DailyMetrics = dailyMetrics.filter(m => last60Dates.includes(m.date));

// Monthly aggregates for trend charts
export const monthlyLabels = [...new Set(monthlyMetrics.map(m => m.month))].sort();

// Summary statistics
export const bankwideSummary = {
    totalBranches: branches.length,
    totalAreas: areas.length,
    totalRegions: regions.length,
    avgQueueTime: Math.round(areaSummaries.reduce((s, a) => s + a.avgQueueTime, 0) / areaSummaries.length * 10) / 10,
    avgSlaMet: Math.round(areaSummaries.reduce((s, a) => s + a.slaMet, 0) / areaSummaries.length * 10) / 10,
    avgServiceFailureRate: Math.round(areaSummaries.reduce((s, a) => s + a.serviceFailureRate, 0) / areaSummaries.length * 10) / 10,
    avgSes: Math.round(areaSummaries.reduce((s, a) => s + a.sesScore, 0) / areaSummaries.length * 100) / 100,
    avgNps: Math.round(areaSummaries.reduce((s, a) => s + a.npsScore, 0) / areaSummaries.length),
    branchesImproving: branches.filter(b => b.status === 'Improving').length,
    branchesStagnant: branches.filter(b => b.status === 'Stagnant').length,
    branchesDeclining: branches.filter(b => b.status === 'Declining').length,
};

// Helper: compute period comparison (current week vs last week)
export function computePeriodComparison(
    metrics: typeof dailyMetrics,
    branchIds: string[],
    metricKey: 'avgQueueTime' | 'slaMet' | 'serviceFailureRate' | 'totalTransactions',
    periodDays: number = 7
) {
    const filtered = metrics.filter(m => branchIds.includes(m.branchId));
    const dates = [...new Set(filtered.map(m => m.date))].sort();

    const currentPeriodDates = dates.slice(-periodDays);
    const previousPeriodDates = dates.slice(-periodDays * 2, -periodDays);

    const currentData = filtered.filter(m => currentPeriodDates.includes(m.date));
    const previousData = filtered.filter(m => previousPeriodDates.includes(m.date));

    const currentAvg = currentData.length > 0
        ? currentData.reduce((s, m) => s + m[metricKey], 0) / currentData.length
        : 0;
    const previousAvg = previousData.length > 0
        ? previousData.reduce((s, m) => s + m[metricKey], 0) / previousData.length
        : 0;

    const change = currentAvg - previousAvg;
    const changePercent = previousAvg !== 0 ? (change / previousAvg) * 100 : 0;

    return {
        current: Math.round(currentAvg * 10) / 10,
        previous: Math.round(previousAvg * 10) / 10,
        change: Math.round(change * 10) / 10,
        changePercent: Math.round(changePercent * 10) / 10,
    };
}

// Helper: aggregate daily metrics by date for trend chart
export function aggregateDailyTrend(
    metrics: typeof dailyMetrics,
    branchIds: string[],
    metricKey: 'avgQueueTime' | 'slaMet' | 'serviceFailureRate' | 'totalTransactions'
) {
    const filtered = metrics.filter(m => branchIds.includes(m.branchId));
    const byDate: Record<string, number[]> = {};

    filtered.forEach(m => {
        if (!byDate[m.date]) byDate[m.date] = [];
        byDate[m.date].push(m[metricKey]);
    });

    return Object.entries(byDate)
        .map(([date, values]) => ({
            date,
            value: Math.round(values.reduce((s, v) => s + v, 0) / values.length * 10) / 10,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

console.log('Mock data generated:', {
    branches: branches.length,
    areas: areas.length,
    regions: regions.length,
    dailyRecords: dailyMetrics.length,
    monthlyRecords: monthlyMetrics.length,
});
