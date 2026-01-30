import {
    Region, Area, Branch, DailyMetrics, MonthlyMetrics,
    AreaSummary, RegionSummary, TimeSeriesPoint
} from './types';

// Seeded random for reproducibility
class SeededRandom {
    private seed: number;

    constructor(seed: number = 42) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    int(min: number, max: number): number {
        return Math.floor(this.range(min, max + 1));
    }

    pick<T>(arr: T[]): T {
        return arr[this.int(0, arr.length - 1)];
    }

    gaussian(mean: number, std: number): number {
        const u1 = this.next();
        const u2 = this.next();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z * std;
    }
}

const rng = new SeededRandom(12345);

// Region/Area/Branch names for Indonesian bank context
const regionNames = ['Wilayah Jawa', 'Wilayah Sumatera', 'Wilayah Kalimantan', 'Wilayah Sulawesi'];

const areaNamesByRegion: Record<string, string[]> = {
    'Wilayah Jawa': ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Barat', 'Bandung', 'Surabaya', 'Semarang', 'Yogyakarta'],
    'Wilayah Sumatera': ['Medan', 'Palembang', 'Pekanbaru', 'Padang', 'Lampung'],
    'Wilayah Kalimantan': ['Balikpapan', 'Banjarmasin', 'Pontianak', 'Samarinda'],
    'Wilayah Sulawesi': ['Makassar', 'Manado', 'Kendari', 'Palu'],
};

const branchPrefixes = ['KC', 'KCP', 'KK'];

// Real coordinates for major cities (Lat/Long)
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    // Jawa
    'Jakarta Pusat': { lat: -6.18, lng: 106.83 },
    'Jakarta Selatan': { lat: -6.26, lng: 106.81 },
    'Jakarta Barat': { lat: -6.16, lng: 106.76 },
    'Bandung': { lat: -6.91, lng: 107.61 },
    'Surabaya': { lat: -7.25, lng: 112.75 },
    'Semarang': { lat: -7.00, lng: 110.42 },
    'Yogyakarta': { lat: -7.79, lng: 110.36 },
    // Sumatera
    'Medan': { lat: 3.59, lng: 98.67 },
    'Palembang': { lat: -2.97, lng: 104.77 },
    'Pekanbaru': { lat: 0.50, lng: 101.44 },
    'Padang': { lat: -0.94, lng: 100.41 },
    'Lampung': { lat: -5.39, lng: 105.26 },
    // Kalimantan
    'Balikpapan': { lat: -1.23, lng: 116.88 },
    'Banjarmasin': { lat: -3.31, lng: 114.59 },
    'Pontianak': { lat: -0.02, lng: 109.33 },
    'Samarinda': { lat: -0.50, lng: 117.15 },
    // Sulawesi
    'Makassar': { lat: -5.14, lng: 119.43 },
    'Manado': { lat: 1.47, lng: 124.84 },
    'Kendari': { lat: -3.99, lng: 122.51 },
    'Palu': { lat: -0.90, lng: 119.83 },
};

// Generate hierarchy
function generateHierarchy(): Region[] {
    const regions: Region[] = [];
    let branchCounter = 1;

    regionNames.forEach((regionName, regionIdx) => {
        const regionId = `R${regionIdx + 1}`;
        const areaNames = areaNamesByRegion[regionName] || [];
        const areas: Area[] = [];

        areaNames.forEach((areaName, areaIdx) => {
            const areaId = `${regionId}-A${areaIdx + 1}`;

            // Get Coords or default to Jakarta (fallback)
            const coords = cityCoordinates[areaName] || { lat: -2, lng: 118 };

            // Jitter for area center (small)
            const areaLat = coords.lat + rng.gaussian(0, 0.05);
            const areaLng = coords.lng + rng.gaussian(0, 0.05);
            const areaCoord = { x: areaLng, y: areaLat }; // Store as x=lng, y=lat for now (Project later? No, store raw)

            // Actually, existing types expect x/y. Let's store Lat/Long in x/y for now
            // But Map expects 0-800? NO.
            // PLAN CHANGE: Store normalized Lat/Long or Real Lat/Long?
            // If I store Real Lat/Long, I need to project them in the Component.
            // Yes, let's store Real Lat/Long in x/y field. x=Lng, y=Lat.

            const branchCount = rng.int(8, 20); // 8-20 branches per area
            const branches: Branch[] = [];

            for (let i = 0; i < branchCount; i++) {
                const prefix = rng.pick(branchPrefixes);
                const branchId = `${areaId}-B${i + 1}`;
                const branchCode = `${prefix}${String(branchCounter).padStart(4, '0')}`;

                // Volume class distribution: 20% High, 50% Medium, 30% Low
                const volumeRoll = rng.next();
                const volumeClass: Branch['volumeClass'] =
                    volumeRoll < 0.2 ? 'High' : volumeRoll < 0.7 ? 'Medium' : 'Low';

                // Status based on some randomness with regional tendencies
                const statusRoll = rng.next();
                // Some regions perform better than others
                const regionBonus = regionIdx === 0 ? 0.1 : regionIdx === 3 ? -0.1 : 0;
                const status: Branch['status'] =
                    statusRoll < 0.35 + regionBonus ? 'Improving' :
                        statusRoll < 0.7 + regionBonus ? 'Stagnant' : 'Declining';

                branchCounter++;

                // Add coords (jitter around area)
                // 0.05 deg ~ 5km
                branches.push({
                    id: branchId,
                    code: branchCode,
                    name: `${areaName} ${i + 1}`,
                    areaId,
                    regionId,
                    volumeClass,
                    status,
                    coordinates: {
                        x: areaLng + rng.gaussian(0, 0.02), // Longitude
                        y: areaLat + rng.gaussian(0, 0.02), // Latitude
                    }
                });
            }

            areas.push({
                id: areaId,
                name: areaName,
                regionId,
                branches,
                coordinates: areaCoord,
            });
        });

        regions.push({
            id: regionId,
            name: regionName,
            areas,
        });
    });

    return regions;
}

// Generate daily metrics for a branch
function generateDailyMetrics(branch: Branch, date: string, dayIndex: number): DailyMetrics {
    // Base values depend on volume class
    const volumeMultiplier = branch.volumeClass === 'High' ? 1.5 : branch.volumeClass === 'Medium' ? 1.0 : 0.6;

    // Trend factor - improving branches get better over time
    const trendFactor = branch.status === 'Improving' ? -0.002 * dayIndex :
        branch.status === 'Declining' ? 0.003 * dayIndex : 0;

    // Day of week effect (weekdays busier)
    const dayOfWeek = new Date(date).getDay();
    const weekdayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1.0;

    // Base queue time (in minutes)
    const baseQueueTime = 12 + rng.gaussian(0, 3) + trendFactor * 100;
    const avgQueueTime = Math.max(2, Math.min(35, baseQueueTime * volumeMultiplier * weekdayFactor));

    // Queue percentiles
    const queueP50 = avgQueueTime * rng.range(0.7, 0.9);
    const queueP80 = avgQueueTime * rng.range(1.2, 1.6);

    // SLA (15 min threshold) - inversely correlated with queue time
    const slaMet = Math.max(50, Math.min(99, 100 - (avgQueueTime - 10) * 3 + rng.gaussian(0, 5)));

    // Service Failure Rate (lower is better - 1% to 15%)
    const serviceFailureRate = Math.max(1, Math.min(15, 5 + rng.gaussian(0, 3) + trendFactor * 50));

    // Transactions
    const baseTransactions = branch.volumeClass === 'High' ? 450 : branch.volumeClass === 'Medium' ? 280 : 150;
    const totalTransactions = Math.round(baseTransactions * weekdayFactor * rng.range(0.8, 1.2));

    // Staff metrics
    const counterCount = branch.volumeClass === 'High' ? 6 : branch.volumeClass === 'Medium' ? 4 : 2;
    const staffCount = counterCount * 1.5;

    return {
        date,
        branchId: branch.id,
        avgQueueTime: Math.round(avgQueueTime * 10) / 10,
        slaMet: Math.round(slaMet * 10) / 10,
        queueP50: Math.round(queueP50 * 10) / 10,
        queueP80: Math.round(queueP80 * 10) / 10,
        queueDistribution: {
            under5: Math.round(rng.range(0.1, 0.25) * 100),
            from5to15: Math.round(rng.range(0.35, 0.5) * 100),
            from15to30: Math.round(rng.range(0.15, 0.3) * 100),
            over30: Math.round(rng.range(0.05, 0.15) * 100),
        },
        csQueueTime: Math.round(avgQueueTime * rng.range(0.9, 1.1) * 10) / 10,
        tellerQueueTime: Math.round(avgQueueTime * rng.range(0.8, 1.0) * 10) / 10,
        serviceFailureRate: Math.round(serviceFailureRate * 10) / 10,
        serviceSpread: Math.round((queueP80 - queueP50) * 10) / 10,
        totalTransactions,
        transactionsPerCounter: Math.round(totalTransactions / counterCount),
        transactionsPerStaff: Math.round(totalTransactions / staffCount),
        avgServiceTime: Math.round(rng.range(4, 8) * 10) / 10,
        utilisationRate: Math.round(Math.min(100, rng.range(60, 95))),
        cashTransactions: Math.round(totalTransactions * rng.range(0.3, 0.5)),
        nonCashTransactions: Math.round(totalTransactions * rng.range(0.5, 0.7)),
        digitalEligibleOffline: Math.round(totalTransactions * rng.range(0.1, 0.25)),
    };
}

// Generate monthly metrics for a branch
function generateMonthlyMetrics(branch: Branch, month: string, monthIndex: number): MonthlyMetrics {
    const trendFactor = branch.status === 'Improving' ? -0.05 * monthIndex :
        branch.status === 'Declining' ? 0.08 * monthIndex : 0;

    const volumeMultiplier = branch.volumeClass === 'High' ? 1.3 : branch.volumeClass === 'Medium' ? 1.0 : 0.7;

    // SES inversely correlated with queue time
    const baseQueueTime = 12 + trendFactor * 10;
    const sesBase = 4.2 - (baseQueueTime - 10) * 0.05;
    const sesScore = Math.max(2.5, Math.min(5, sesBase + rng.gaussian(0, 0.2)));

    // NPS correlates with SES
    const npsScore = Math.round((sesScore - 3) * 50 + rng.gaussian(0, 15));

    // NSI
    const nsiScore = Math.round(70 + (sesScore - 3.5) * 20 + rng.gaussian(0, 5));

    return {
        month,
        branchId: branch.id,
        avgQueueTime: Math.round((12 + trendFactor * 10) * volumeMultiplier * 10) / 10,
        slaMet: Math.round((85 - trendFactor * 20) * 10) / 10,
        consistencyRate: Math.round((5 + trendFactor * 8) * 10) / 10, // Keep for MonthlyMetrics if still needed
        avgTransactionsPerDay: Math.round(250 * volumeMultiplier),
        sesScore: Math.round(sesScore * 100) / 100,
        npsScore: Math.max(-100, Math.min(100, npsScore)),
        nsiScore: Math.max(0, Math.min(100, nsiScore)),
        complaintsByCategory: {
            queueTime: rng.int(2, 15),
            staffBehavior: rng.int(1, 8),
            systemIssues: rng.int(0, 5),
            productInfo: rng.int(1, 6),
            other: rng.int(0, 4),
        },
        googleReviewScore: Math.round((sesScore * 0.8 + rng.range(0.5, 1)) * 10) / 10,
    };
}

// Generate time series data
function generateDates(startDate: string, days: number): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

function generateMonths(startMonth: string, count: number): string[] {
    const months: string[] = [];
    const [year, month] = startMonth.split('-').map(Number);
    for (let i = 0; i < count; i++) {
        const m = (month - 1 + i) % 12 + 1;
        const y = year + Math.floor((month - 1 + i) / 12);
        months.push(`${y}-${String(m).padStart(2, '0')}`);
    }
    return months;
}

// Generate all data
export function generateAllData() {
    const regions = generateHierarchy();

    // Flatten branches
    const allBranches: Branch[] = [];
    regions.forEach(r => r.areas.forEach(a => allBranches.push(...a.branches)));

    // Generate 6 months of daily data (180 days)
    const dates = generateDates('2025-07-01', 180);
    const dailyMetrics: DailyMetrics[] = [];

    allBranches.forEach(branch => {
        dates.forEach((date, idx) => {
            dailyMetrics.push(generateDailyMetrics(branch, date, idx));
        });
    });

    // Generate 12 months of monthly data
    const months = generateMonths('2025-01', 12);
    const monthlyMetrics: MonthlyMetrics[] = [];

    allBranches.forEach(branch => {
        months.forEach((month, idx) => {
            monthlyMetrics.push(generateMonthlyMetrics(branch, month, idx));
        });
    });

    return {
        regions,
        branches: allBranches,
        dailyMetrics,
        monthlyMetrics,
    };
}

// Aggregation functions
export function aggregateByArea(
    regions: Region[],
    dailyMetrics: DailyMetrics[],
    monthlyMetrics: MonthlyMetrics[]
): AreaSummary[] {
    const summaries: AreaSummary[] = [];

    regions.forEach(region => {
        region.areas.forEach((area, areaIdx) => {
            const branchIds = area.branches.map(b => b.id);

            // Get recent daily metrics (last 30 days)
            const recentDaily = dailyMetrics
                .filter(m => branchIds.includes(m.branchId))
                .slice(-30 * branchIds.length);

            // Get recent monthly metrics
            const recentMonthly = monthlyMetrics
                .filter(m => branchIds.includes(m.branchId))
                .slice(-branchIds.length);

            const avgQueueTime = recentDaily.reduce((s, m) => s + m.avgQueueTime, 0) / recentDaily.length || 0;
            const slaMet = recentDaily.reduce((s, m) => s + m.slaMet, 0) / recentDaily.length || 0;
            const serviceFailureRate = recentDaily.reduce((s, m) => s + m.serviceFailureRate, 0) / recentDaily.length || 0;
            const serviceSpread = recentDaily.reduce((s, m) => s + m.serviceSpread, 0) / recentDaily.length || 0;
            const avgServiceTime = recentDaily.reduce((s, m) => s + m.avgServiceTime, 0) / recentDaily.length || 0;
            const avgTransactions = recentDaily.reduce((s, m) => s + m.totalTransactions, 0) / area.branches.length || 0;

            const sesScore = recentMonthly.reduce((s, m) => s + m.sesScore, 0) / recentMonthly.length || 0;
            const npsScore = recentMonthly.reduce((s, m) => s + m.npsScore, 0) / recentMonthly.length || 0;

            // Count branch statuses
            const improving = area.branches.filter(b => b.status === 'Improving').length;
            const stagnant = area.branches.filter(b => b.status === 'Stagnant').length;
            const declining = area.branches.filter(b => b.status === 'Declining').length;

            summaries.push({
                areaId: area.id,
                areaName: area.name,
                regionId: region.id,
                regionName: region.name,
                branchCount: area.branches.length,
                avgQueueTime: Math.round(avgQueueTime * 10) / 10,
                slaMet: Math.round(slaMet * 10) / 10,
                serviceFailureRate: Math.round(serviceFailureRate * 10) / 10,
                serviceSpread: Math.round(serviceSpread * 10) / 10,
                avgServiceTime: Math.round(avgServiceTime * 10) / 10,
                avgTransactionsPerBranch: Math.round(avgTransactions),
                sesScore: Math.round(sesScore * 100) / 100,
                npsScore: Math.round(npsScore),
                queueTimeTrend: avgQueueTime < 11 ? 'down' : avgQueueTime > 14 ? 'up' : 'stable',
                slaTrend: slaMet > 85 ? 'up' : slaMet < 75 ? 'down' : 'stable',
                perceptionTrend: sesScore > 4 ? 'up' : sesScore < 3.5 ? 'down' : 'stable',
                branchesImproving: improving,
                branchesStagnant: stagnant,
                branchesDeclining: declining,
                performanceRank: areaIdx + 1,
                percentDeclining: Math.round((declining / area.branches.length) * 100),
                coordinates: area.coordinates,
            });
        });
    });

    // Sort by performance and assign ranks
    summaries.sort((a, b) => b.slaMet - a.slaMet);
    summaries.forEach((s, i) => s.performanceRank = i + 1);

    return summaries;
}

export function aggregateByRegion(
    regions: Region[],
    areaSummaries: AreaSummary[]
): RegionSummary[] {
    return regions.map(region => {
        const regionAreas = areaSummaries.filter(a => a.regionId === region.id);
        const branchCount = region.areas.reduce((s, a) => s + a.branches.length, 0);

        const avgQueueTime = regionAreas.reduce((s, a) => s + a.avgQueueTime * a.branchCount, 0) / branchCount;
        const slaMet = regionAreas.reduce((s, a) => s + a.slaMet * a.branchCount, 0) / branchCount;
        const serviceFailureRate = regionAreas.reduce((s, a) => s + a.serviceFailureRate * a.branchCount, 0) / branchCount;
        const avgTransactions = regionAreas.reduce((s, a) => s + a.avgTransactionsPerBranch, 0) / regionAreas.length;
        const sesScore = regionAreas.reduce((s, a) => s + a.sesScore * a.branchCount, 0) / branchCount;
        const npsScore = regionAreas.reduce((s, a) => s + a.npsScore * a.branchCount, 0) / branchCount;

        return {
            regionId: region.id,
            regionName: region.name,
            areaCount: region.areas.length,
            branchCount,
            avgQueueTime: Math.round(avgQueueTime * 10) / 10,
            slaMet: Math.round(slaMet * 10) / 10,
            serviceFailureRate: Math.round(serviceFailureRate * 10) / 10,
            avgTransactionsPerBranch: Math.round(avgTransactions),
            sesScore: Math.round(sesScore * 100) / 100,
            npsScore: Math.round(npsScore),
            queueTimeTrend: avgQueueTime < 11 ? 'down' : avgQueueTime > 14 ? 'up' : 'stable',
            perceptionTrend: sesScore > 4 ? 'up' : sesScore < 3.5 ? 'down' : 'stable',
            branchesImproving: regionAreas.reduce((s, a) => s + a.branchesImproving, 0),
            branchesStagnant: regionAreas.reduce((s, a) => s + a.branchesStagnant, 0),
            branchesDeclining: regionAreas.reduce((s, a) => s + a.branchesDeclining, 0),
        };
    });
}

// Generate time series for charts
export function generateTimeSeries(
    dailyMetrics: DailyMetrics[],
    branchIds: string[],
    metric: keyof DailyMetrics,
    aggregation: 'daily' | 'weekly' | 'monthly' = 'daily'
): TimeSeriesPoint[] {
    const filtered = dailyMetrics.filter(m => branchIds.includes(m.branchId));

    // Group by date
    const byDate: Record<string, number[]> = {};
    filtered.forEach(m => {
        const key = aggregation === 'daily' ? m.date :
            aggregation === 'weekly' ? getWeekKey(m.date) :
                m.date.substring(0, 7);
        if (!byDate[key]) byDate[key] = [];
        const val = m[metric];
        if (typeof val === 'number') byDate[key].push(val);
    });

    return Object.entries(byDate)
        .map(([date, values]) => ({
            date,
            value: Math.round(values.reduce((s, v) => s + v, 0) / values.length * 10) / 10,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function getWeekKey(date: string): string {
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
