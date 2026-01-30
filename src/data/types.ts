// Organizational hierarchy
export interface Region {
    id: string;
    name: string;
    areas: Area[];
}

export interface Area {
    id: string;
    name: string;
    regionId: string;
    branches: Branch[];
    coordinates?: { x: number; y: number };
}

export interface Branch {
    id: string;
    code: string;
    name: string;
    areaId: string;
    regionId: string;
    volumeClass: 'High' | 'Medium' | 'Low';
    status: 'Improving' | 'Stagnant' | 'Declining';
    coordinates?: { x: number; y: number };
}

// Time-series metrics
export interface DailyMetrics {
    date: string; // ISO date string
    branchId: string;

    // FAST
    avgQueueTime: number; // minutes
    slaMet: number; // percentage 0-100
    queueP50: number;
    queueP80: number;
    queueDistribution: {
        under5: number;
        from5to15: number;
        from15to30: number;
        over30: number;
    };

    // By service type
    csQueueTime: number;
    tellerQueueTime: number;

    // CONSISTENT
    serviceFailureRate: number; // percentage 0-100 (lower is better)
    serviceSpread: number; // P80 - P50 of queue time

    // EFFICIENT
    totalTransactions: number;
    transactionsPerCounter: number;
    transactionsPerStaff: number;
    avgServiceTime: number; // minutes
    utilisationRate: number; // percentage 0-100

    // Channel mix
    cashTransactions: number;
    nonCashTransactions: number;
    digitalEligibleOffline: number;
}

export interface MonthlyMetrics {
    month: string; // YYYY-MM
    branchId: string;

    // Aggregated operational
    avgQueueTime: number;
    slaMet: number;
    consistencyRate: number;
    avgTransactionsPerDay: number;

    // PERCEPTION
    sesScore: number; // 1-5 scale
    npsScore: number; // -100 to 100
    nsiScore: number; // percentage 0-100

    // Complaints
    complaintsByCategory: {
        queueTime: number;
        staffBehavior: number;
        systemIssues: number;
        productInfo: number;
        other: number;
    };

    googleReviewScore: number; // 1-5 scale
}

// Aggregated views for dashboard
export interface AreaSummary {
    areaId: string;
    areaName: string;
    regionId: string;
    regionName: string;
    branchCount: number;
    coordinates?: { x: number; y: number };

    // Current period metrics
    avgQueueTime: number;
    slaMet: number;
    serviceFailureRate: number;
    serviceSpread: number; // P80 - P50 queue time in minutes (lower is better)
    avgServiceTime: number; // avg service time in minutes (lower is better)
    avgTransactionsPerBranch: number;
    sesScore: number;
    npsScore: number;

    // Trends
    queueTimeTrend: 'up' | 'stable' | 'down';
    slaTrend: 'up' | 'stable' | 'down';
    perceptionTrend: 'up' | 'stable' | 'down';

    // Branch movement
    branchesImproving: number;
    branchesStagnant: number;
    branchesDeclining: number;

    // Rank info
    performanceRank: number;
    percentDeclining: number;
}

export interface RegionSummary {
    regionId: string;
    regionName: string;
    areaCount: number;
    branchCount: number;

    avgQueueTime: number;
    slaMet: number;
    serviceFailureRate: number;
    avgTransactionsPerBranch: number;
    sesScore: number;
    npsScore: number;

    queueTimeTrend: 'up' | 'stable' | 'down';
    perceptionTrend: 'up' | 'stable' | 'down';

    branchesImproving: number;
    branchesStagnant: number;
    branchesDeclining: number;
}

// Chart data types
export interface TimeSeriesPoint {
    date: string;
    value: number;
    label?: string;
}

export interface TrendData {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'stable' | 'down';
}

// Filter state
export interface DashboardFilters {
    dateRange: {
        start: string;
        end: string;
    };
    regionId: string | null;
    areaId: string | null;
    branchId: string | null;
    volumeClass: 'High' | 'Medium' | 'Low' | null;
    serviceType: 'CS' | 'Teller' | null;
}
