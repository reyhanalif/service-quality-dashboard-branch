import { useMemo, useState } from 'react';
import { Clock, CheckCircle, Zap, Heart, AlertTriangle, BarChart2, Users, Smartphone, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { GlassCard, KPICard, Select, StatusBadge } from '../components/ui';
import { LineChart, StackedBarChart, SimpleBarChart, IndonesiaMap } from '../components/charts';
import {
    regions,
    areas,
    branches,
    recentDailyMetrics,
    dailyMetrics,
    monthlyMetrics,
    monthlyLabels,
    computePeriodComparison,
} from '../data/mockData';
import { Branch } from '../data/types';

export function OBODashboard() {
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedVolumeClass, setSelectedVolumeClass] = useState<string>('');
    const [selectedServiceType, setSelectedServiceType] = useState<string>('');

    // Filtered options
    const filteredAreas = useMemo(() => {
        if (!selectedRegion) return areas;
        return areas.filter(a => a.regionId === selectedRegion);
    }, [selectedRegion]);

    const filteredBranches = useMemo(() => {
        let result = branches;
        if (selectedRegion) result = result.filter(b => b.regionId === selectedRegion);
        if (selectedArea) result = result.filter(b => b.areaId === selectedArea);
        if (selectedVolumeClass) result = result.filter(b => b.volumeClass === selectedVolumeClass);
        return result;
    }, [selectedRegion, selectedArea, selectedVolumeClass]);

    // Get selected branch data or aggregate
    const currentBranch: Branch | null = useMemo(() => {
        if (selectedBranch) return branches.find(b => b.id === selectedBranch) || null;
        return null;
    }, [selectedBranch]);

    // Filter daily metrics
    const filteredDailyMetrics = useMemo(() => {
        const branchIds = selectedBranch
            ? [selectedBranch]
            : filteredBranches.map(b => b.id);
        return recentDailyMetrics.filter(m => branchIds.includes(m.branchId));
    }, [selectedBranch, filteredBranches]);

    // Previous month metrics for comparison
    const prevMonthMetrics = useMemo(() => {
        return {
            avgQueueTime: 13.5, // Mock previous month avg
            slaMet: 89.5,
            serviceFailureRate: 4.5, // Previous month mock - lower is better
            serviceSpread: 4.8,
            avgServiceTime: 6.2,
            csTrxPerStaff: 20,
            tellerTrxPerStaff: 18,
            customersPerStaff: 75,
            tellerQueueTime: 5.5,
            csQueueTime: 16.0,
        };
    }, [selectedBranch, filteredBranches]);

    // Aggregate current metrics
    const currentMetrics = useMemo(() => {
        const metrics = filteredDailyMetrics;
        const count = metrics.length || 1;

        return {
            avgQueueTime: Math.round(metrics.reduce((s, m) => s + m.avgQueueTime, 0) / count * 10) / 10,
            slaMet: Math.round(metrics.reduce((s, m) => s + m.slaMet, 0) / count * 10) / 10,
            serviceFailureRate: Math.round(metrics.reduce((s, m) => s + m.serviceFailureRate, 0) / count * 10) / 10,
            serviceSpread: Math.round(metrics.reduce((s, m) => s + m.serviceSpread, 0) / count * 10) / 10,
            transactionsPerCounter: Math.round(metrics.reduce((s, m) => s + m.transactionsPerCounter, 0) / count),
            avgServiceTime: Math.round(metrics.reduce((s, m) => s + m.avgServiceTime, 0) / count * 10) / 10,
            utilisationRate: Math.round(metrics.reduce((s, m) => s + m.utilisationRate, 0) / count),
            cashTransactions: Math.round(metrics.reduce((s, m) => s + m.cashTransactions, 0) / count),
            nonCashTransactions: Math.round(metrics.reduce((s, m) => s + m.nonCashTransactions, 0) / count),
            digitalEligibleOffline: Math.round(metrics.reduce((s, m) => s + m.digitalEligibleOffline, 0) / count),
            csQueueTime: Math.round(metrics.reduce((s, m) => s + m.csQueueTime, 0) / count * 10) / 10,
            tellerQueueTime: Math.round(metrics.reduce((s, m) => s + m.tellerQueueTime, 0) / count * 10) / 10,
            queueDistribution: {
                under5: Math.round(metrics.reduce((s, m) => s + m.queueDistribution.under5, 0) / count),
                from5to15: Math.round(metrics.reduce((s, m) => s + m.queueDistribution.from5to15, 0) / count),
                from15to30: Math.round(metrics.reduce((s, m) => s + m.queueDistribution.from15to30, 0) / count),
                over30: Math.round(metrics.reduce((s, m) => s + m.queueDistribution.over30, 0) / count),
            },
        };
    }, [filteredDailyMetrics]);

    // Queue time trend by day
    const queueTrendData = useMemo(() => {
        const byDate: Record<string, number[]> = {};
        filteredDailyMetrics.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = [];
            byDate[m.date].push(m.avgQueueTime);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                queueTime: Math.round(values.reduce((s, v) => s + v, 0) / values.length * 10) / 10,
            }))
            .slice(-15);
    }, [filteredDailyMetrics]);

    // SLA trend
    const slaTrendData = useMemo(() => {
        const byDate: Record<string, number[]> = {};
        filteredDailyMetrics.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = [];
            byDate[m.date].push(m.slaMet);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                slaMet: Math.round(values.reduce((s, v) => s + v, 0) / values.length * 10) / 10,
            }))
            .slice(-15);
    }, [filteredDailyMetrics]);

    // Hourly visitors data (horizontal bar chart) - More detailed hours
    const hourlyVisitorsData = useMemo(() => {
        const hours = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00'
        ];
        return hours.map((h, i) => {
            const base = 8;
            const isPeak = i >= 4 && i <= 8; // 10:00 - 12:00
            const peak = isPeak ? 20 : 5;
            return {
                name: h,
                value: Math.round(base + peak + Math.random() * 8),
                color: isPeak ? '#f59e0b' : '#60a5fa',
            };
        });
    }, []);

    // Queue distribution over time (DAILY - last 15 days)
    const queueDistOverTimeData = useMemo(() => {
        const byDate: Record<string, { under5: number[], from5to15: number[], from15to30: number[], over30: number[] }> = {};
        filteredDailyMetrics.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = { under5: [], from5to15: [], from15to30: [], over30: [] };
            byDate[m.date].under5.push(m.queueDistribution.under5);
            byDate[m.date].from5to15.push(m.queueDistribution.from5to15);
            byDate[m.date].from15to30.push(m.queueDistribution.from15to30);
            byDate[m.date].over30.push(m.queueDistribution.over30);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                '<5 min': Math.round(values.under5.reduce((s, v) => s + v, 0) / values.under5.length),
                '5-15 min': Math.round(values.from5to15.reduce((s, v) => s + v, 0) / values.from5to15.length),
                '15-30 min': Math.round(values.from15to30.reduce((s, v) => s + v, 0) / values.from15to30.length),
                '>30 min': Math.round(values.over30.reduce((s, v) => s + v, 0) / values.over30.length),
            }))
            .slice(-15);
    }, [filteredDailyMetrics]);

    // Queue by Service Type - Daily Trend
    const serviceTypeQueueTrendData = useMemo(() => {
        const byDate: Record<string, { teller: number[], cs: number[] }> = {};
        filteredDailyMetrics.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = { teller: [], cs: [] };
            byDate[m.date].teller.push(m.tellerQueueTime);
            byDate[m.date].cs.push(m.csQueueTime);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                teller: Math.round(values.teller.reduce((s, v) => s + v, 0) / values.teller.length * 10) / 10,
                cs: Math.round(values.cs.reduce((s, v) => s + v, 0) / values.cs.length * 10) / 10,
            }))
            .slice(-15);
    }, [filteredDailyMetrics]);

    // Benchmarks based on previous month
    const benchmarks = {
        queueTime: prevMonthMetrics.avgQueueTime,
        sla: 92.0, // Target
        teller: prevMonthMetrics.tellerQueueTime,
        cs: prevMonthMetrics.csQueueTime,
        failure: 5.0, // Target: ≤5% service failure rate
        spread: prevMonthMetrics.serviceSpread,
        serviceTime: prevMonthMetrics.avgServiceTime,
        csTrxPerStaff: prevMonthMetrics.csTrxPerStaff,
        tellerTrxPerStaff: prevMonthMetrics.tellerTrxPerStaff,
        customersPerStaff: prevMonthMetrics.customersPerStaff,
    };

    // Calculate diffs vs previous month
    const queueDiff = currentMetrics.avgQueueTime - benchmarks.queueTime;
    const queueDiffPercent = Math.round(Math.abs(queueDiff) / benchmarks.queueTime * 100 * 10) / 10;

    const slaDiff = currentMetrics.slaMet - benchmarks.sla;
    const slaTrendValue = `${Math.abs(Math.round(slaDiff * 10) / 10)}% vs Target`;

    // Service Type comparisons vs prev month
    const tellerDiff = currentMetrics.tellerQueueTime - benchmarks.teller;
    const csDiff = currentMetrics.csQueueTime - benchmarks.cs;

    // Service Failure Rate calculations - lower is better
    const failureDiff = currentMetrics.serviceFailureRate - benchmarks.failure;
    const failureTrendValue = `${Math.abs(Math.round(failureDiff * 10) / 10)}% vs Prev Month`;

    const spreadDiff = currentMetrics.serviceSpread - benchmarks.spread;
    const spreadTrendValue = `${Math.abs(Math.round(spreadDiff * 10) / 10)} min vs Prev Month`;

    // Efficiency calculations
    const totalManpower = 5; // 3 Tellers, 2 CS
    const csManpower = 2;
    const tellerManpower = 3;
    const totalTransactions = currentMetrics.cashTransactions + currentMetrics.nonCashTransactions;

    const serviceTimeDiff = currentMetrics.avgServiceTime - benchmarks.serviceTime;
    const serviceTimeTrendValue = `${Math.abs(Math.round(serviceTimeDiff * 10) / 10)} min vs Prev Month`;

    // CS and Teller Transactions per staff
    const csTrx = Math.round(totalTransactions * 0.4);
    const tellerTrx = Math.round(totalTransactions * 0.6);
    const csTrxPerStaff = Math.round(csTrx / csManpower);
    const tellerTrxPerStaff = Math.round(tellerTrx / tellerManpower);

    // Customers per Staff per Day (how many customers 1 staff handles per day)
    const customersPerStaff = Math.round(totalTransactions / totalManpower);
    const customersPerStaffDiff = customersPerStaff - benchmarks.customersPerStaff;

    // Digital Rate calculation
    const digitalRate = Math.round(currentMetrics.digitalEligibleOffline / totalTransactions * 100);

    // Service Failure Rate Trend Data
    const serviceFailureTrendData = useMemo(() => {
        return filteredDailyMetrics.slice(-15).map(m => ({
            date: m.date.slice(5),
            value: m.serviceFailureRate,
        }));
    }, [filteredDailyMetrics]);

    // Branch Performance Metrics for FAST Section Table
    const branchFastMetrics = useMemo(() => {
        if (currentBranch) return [];

        return filteredBranches.map(branch => {
            const queueMetrics = computePeriodComparison(recentDailyMetrics, [branch.id], 'avgQueueTime', 7);
            const slaMetrics = computePeriodComparison(recentDailyMetrics, [branch.id], 'slaMet', 7);

            return {
                id: branch.id,
                name: branch.name,
                queueTime: queueMetrics.current,
                queueDelta: queueMetrics.changePercent,
                sla: slaMetrics.current,
                slaDelta: slaMetrics.changePercent
            };
        }).sort((a, b) => b.queueTime - a.queueTime); // Default sort: Slowest queue first
    }, [filteredBranches, currentBranch, recentDailyMetrics]);

    // Branch Metrics for CONSISTENT Section Table
    const branchConsistentMetrics = useMemo(() => {
        if (currentBranch) return [];

        return filteredBranches.map(branch => {
            const failureMetrics = computePeriodComparison(recentDailyMetrics, [branch.id], 'serviceFailureRate', 7);

            // Calculate spread delta manually (7-day avg vs prev 7-day avg)
            const branchDaily = recentDailyMetrics.filter(m => m.branchId === branch.id);
            const currentPeriod = branchDaily.slice(-7);
            const prevPeriod = branchDaily.slice(-14, -7);

            const currSpread = currentPeriod.length ? currentPeriod.reduce((s, m) => s + m.serviceSpread, 0) / currentPeriod.length : 0;
            const prevSpread = prevPeriod.length ? prevPeriod.reduce((s, m) => s + m.serviceSpread, 0) / prevPeriod.length : 0;
            const spreadDelta = prevSpread ? ((currSpread - prevSpread) / prevSpread) * 100 : 0;

            return {
                id: branch.id,
                name: branch.name,
                failureRate: failureMetrics.current,
                failureDelta: failureMetrics.change, // Absolute change for percentage points
                spread: Math.round(currSpread * 10) / 10,
                spreadDelta: Math.round(spreadDelta * 10) / 10
            };
        }).sort((a, b) => b.failureRate - a.failureRate);
    }, [filteredBranches, currentBranch, recentDailyMetrics]);

    // Branch Metrics for EFFICIENT Section Table
    const branchEfficientMetrics = useMemo(() => {
        if (currentBranch) return [];

        return filteredBranches.map(branch => {
            const branchDaily = recentDailyMetrics.filter(m => m.branchId === branch.id);
            const currentPeriod = branchDaily.slice(-7);
            const prevPeriod = branchDaily.slice(-14, -7);

            const calcMetrics = (periodData: typeof recentDailyMetrics) => {
                if (!periodData.length) return { serviceTime: 0, csTrx: 0, tellerTrx: 0, custPerStaff: 0 };
                const avgSvc = periodData.reduce((s, m) => s + m.avgServiceTime, 0) / periodData.length;

                // Trx averages
                const totalTrx = periodData.reduce((s, m) => s + m.cashTransactions + m.nonCashTransactions, 0) / periodData.length;
                const csTrx = totalTrx * 0.4 / csManpower;
                const tellerTrx = totalTrx * 0.6 / tellerManpower;
                const custPerStaff = totalTrx / totalManpower;

                return { serviceTime: avgSvc, csTrx, tellerTrx, custPerStaff };
            };

            const curr = calcMetrics(currentPeriod);
            const prev = calcMetrics(prevPeriod);

            return {
                id: branch.id,
                name: branch.name,
                serviceTime: Math.round(curr.serviceTime * 10) / 10, // 1 decimal
                svcDelta: prev.serviceTime ? Math.round(((curr.serviceTime - prev.serviceTime) / prev.serviceTime) * 100) : 0,

                csTrx: Math.round(curr.csTrx),
                csTrxDelta: prev.csTrx ? Math.round(((curr.csTrx - prev.csTrx) / prev.csTrx) * 100) : 0,

                tellerTrx: Math.round(curr.tellerTrx),
                tellerTrxDelta: prev.tellerTrx ? Math.round(((curr.tellerTrx - prev.tellerTrx) / prev.tellerTrx) * 100) : 0,

                custPerStaff: Math.round(curr.custPerStaff),
                custDelta: prev.custPerStaff ? Math.round(((curr.custPerStaff - prev.custPerStaff) / prev.custPerStaff) * 100) : 0,
            };
        }).sort((a, b) => b.serviceTime - a.serviceTime);
    }, [filteredBranches, currentBranch, recentDailyMetrics]);

    // Branch Metrics for PERCEPTION Section Table
    const branchPerceptionMetrics = useMemo(() => {
        if (currentBranch) return [];

        const currMonth = monthlyLabels[monthlyLabels.length - 1];
        const prevMonth = monthlyLabels[monthlyLabels.length - 2];

        return filteredBranches.map(branch => {
            const currData = monthlyMetrics.find(m => m.branchId === branch.id && m.month === currMonth);
            const prevData = monthlyMetrics.find(m => m.branchId === branch.id && m.month === prevMonth);

            const getTotal = (d: typeof currData) => d?.complaintsByCategory ? Object.values(d.complaintsByCategory).reduce((a, b) => a + b, 0) : 0;
            const currTotal = getTotal(currData);
            const prevTotal = getTotal(prevData);

            const complaints = currData?.complaintsByCategory || { queueTime: 0, staffBehavior: 0, systemIssues: 0, productInfo: 0, other: 0 };
            const divisor = currTotal || 1;

            return {
                id: branch.id,
                name: branch.name,

                totalVol: currTotal,
                volDelta: prevTotal ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) : 0,

                queue: Math.round(complaints.queueTime / divisor * 100),
                queueCount: complaints.queueTime,

                staff: Math.round(complaints.staffBehavior / divisor * 100),
                staffCount: complaints.staffBehavior,

                system: Math.round(complaints.systemIssues / divisor * 100),
                systemCount: complaints.systemIssues,

                product: Math.round(complaints.productInfo / divisor * 100),
                productCount: complaints.productInfo,

                other: Math.round(complaints.other / divisor * 100),
                otherCount: complaints.other,
            };
        }).sort((a, b) => b.totalVol - a.totalVol);
    }, [filteredBranches, currentBranch, monthlyMetrics]);

    // Service Spread Trend Data
    const spreadTrendData = useMemo(() => {
        return filteredDailyMetrics.slice(-15).map(m => ({
            date: m.date.slice(5),
            value: m.serviceSpread,
        }));
    }, [filteredDailyMetrics]);

    // Service Time Trend Data
    const serviceTimeTrendData = useMemo(() => {
        const byDate: Record<string, number[]> = {};
        filteredDailyMetrics.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = [];
            byDate[m.date].push(m.avgServiceTime);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                serviceTime: Math.round(values.reduce((s, v) => s + v, 0) / values.length * 10) / 10,
            }))
            .slice(-15);
    }, [filteredDailyMetrics]);

    // Productivity Trend Data (CS/Teller transactions per staff over time)
    const productivityTrendData = useMemo(() => {
        const byDate: Record<string, { cash: number[], nonCash: number[] }> = {};
        filteredDailyMetrics.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = { cash: [], nonCash: [] };
            byDate[m.date].cash.push(m.cashTransactions);
            byDate[m.date].nonCash.push(m.nonCashTransactions);
        });
        return Object.entries(byDate)
            .map(([date, values]) => {
                const totalTrx = (values.cash.reduce((s, v) => s + v, 0) + values.nonCash.reduce((s, v) => s + v, 0)) / (values.cash.length || 1);
                return {
                    date: date.slice(5),
                    csTrx: Math.round(totalTrx * 0.4 / csManpower),
                    tellerTrx: Math.round(totalTrx * 0.6 / tellerManpower),
                };
            })
            .slice(-15);
    }, [filteredDailyMetrics]);

    // Customers per Staff Trend Data (1 staff handles X customers per day)
    const customersPerStaffTrendData = useMemo(() => {
        const byDate: Record<string, number[]> = {};
        filteredDailyMetrics.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = [];
            const totalTrx = m.cashTransactions + m.nonCashTransactions;
            const perStaff = totalTrx / totalManpower;
            byDate[m.date].push(perStaff);
        });
        return Object.entries(byDate)
            .map(([date, values]) => ({
                date: date.slice(5),
                customers: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
            }))
            .slice(-15);
    }, [filteredDailyMetrics]);

    // Complaint Time Series Data (Stacked)
    const complaintTrendData = useMemo(() => {
        return monthlyMetrics.slice(-6).map(m => ({
            month: m.month.slice(5),
            'Queue Time': m.complaintsByCategory.queueTime,
            'Staff Behavior': m.complaintsByCategory.staffBehavior,
            'System Issues': m.complaintsByCategory.systemIssues,
            'Product Info': m.complaintsByCategory.productInfo,
            'Other': m.complaintsByCategory.other,
        }));
    }, []);

    // Get monthly perception data with NSI
    const perceptionData = useMemo(() => {
        const branchIds = selectedBranch
            ? [selectedBranch]
            : filteredBranches.map(b => b.id);

        return monthlyLabels.slice(-6).map(month => {
            const data = monthlyMetrics.filter(
                m => m.month === month && branchIds.includes(m.branchId)
            );
            const count = data.length || 1;
            const nps = Math.round(data.reduce((s, m) => s + m.npsScore, 0) / count);
            const ses = Math.round(data.reduce((s, m) => s + m.sesScore, 0) / count * 100) / 100;
            const nsi = Math.round(((ses / 5) * 100 + (nps + 100) / 2) / 2);
            return {
                month: month.slice(5),
                ses,
                nps,
                nsi,
            };
        });
    }, [selectedBranch, filteredBranches]);

    // Branch prioritization table
    // Branch Intervention & SQI Ranking Data
    const branchSqiData = useMemo(() => {
        return filteredBranches.map(branch => {
            // Get last 7 days metrics
            const branchDaily = dailyMetrics.filter(m => m.branchId === branch.id);
            const dates = [...new Set(branchDaily.map(m => m.date))].sort();
            const last7Days = dates.slice(-7);
            const prev7Days = dates.slice(-14, -7);

            const currentMetrics = branchDaily.filter(m => last7Days.includes(m.date));
            const prevMetrics = branchDaily.filter(m => prev7Days.includes(m.date));

            // Helpers for averaging
            const avg = (data: typeof dailyMetrics, key: keyof typeof dailyMetrics[0]) =>
                data.length ? data.reduce((s, m) => s + (m[key] as number), 0) / data.length : 0;

            // 1. Queue Score
            const avgQueue = avg(currentMetrics, 'avgQueueTime');
            const queueScore = Math.max(0, Math.min(100, 100 - (avgQueue - 5) * 5));

            // 2. SLA Score
            const avgSla = avg(currentMetrics, 'slaMet');
            const slaScore = avgSla;

            // 3. Spread Score
            const avgSpread = avg(currentMetrics, 'serviceSpread');
            const spreadScore = Math.max(0, Math.min(100, 100 - (avgSpread - 2) * 12.5));

            // 4. Failure Score
            const avgFailure = avg(currentMetrics, 'serviceFailureRate');
            const failureScore = Math.max(0, Math.min(100, 100 - avgFailure * 6.67));

            // 5. Service Time Score
            const avgServiceTime = avg(currentMetrics, 'avgServiceTime');
            const serviceTimeScore = Math.max(0, Math.min(100, 100 - (avgServiceTime - 4) * 16.67));

            // 6. NPS Score (Monthly)
            const branchMonthly = monthlyMetrics.filter(m => m.branchId === branch.id);
            const latestMonth = branchMonthly.length ? branchMonthly[branchMonthly.length - 1] : null;
            const nps = latestMonth ? latestMonth.npsScore : 0;
            const npsScore = Math.max(0, Math.min(100, (nps + 100) / 2));

            // Total SQI
            const sqi = Math.round((queueScore + slaScore + spreadScore + failureScore + serviceTimeScore + npsScore) / 6);

            // Calculate Previous SQI for Trend
            const prevQueue = avg(prevMetrics, 'avgQueueTime');
            const prevSla = avg(prevMetrics, 'slaMet');
            const prevSpread = avg(prevMetrics, 'serviceSpread');
            const prevFailure = avg(prevMetrics, 'serviceFailureRate');
            const prevServiceTime = avg(prevMetrics, 'avgServiceTime');
            // Previous month NPS
            const prevMonth = branchMonthly.length > 1 ? branchMonthly[branchMonthly.length - 2] : null;
            const prevNps = prevMonth ? prevMonth.npsScore : nps;

            const prevQueueScore = Math.max(0, Math.min(100, 100 - (prevQueue - 5) * 5));
            const prevSlaScore = prevSla;
            const prevSpreadScore = Math.max(0, Math.min(100, 100 - (prevSpread - 2) * 12.5));
            const prevFailureScore = Math.max(0, Math.min(100, 100 - prevFailure * 6.67));
            const prevServiceTimeScore = Math.max(0, Math.min(100, 100 - (prevServiceTime - 4) * 16.67));
            const prevNpsScore = Math.max(0, Math.min(100, (prevNps + 100) / 2));

            const prevSqi = Math.round((prevQueueScore + prevSlaScore + prevSpreadScore + prevFailureScore + prevServiceTimeScore + prevNpsScore) / 6);

            const sqiDelta = prevSqi ? Math.round(((sqi - prevSqi) / prevSqi) * 100) : 0;

            const calcChange = (curr: number, prev: number) => prev !== 0 ? Math.round(((curr - prev) / prev) * 100) : 0;

            return {
                id: branch.id,
                name: branch.name,
                code: branch.code,
                sqi,
                sqiDelta,

                // Metrics
                queueTime: Math.round(avgQueue * 10) / 10,
                sla: Math.round(avgSla * 10) / 10,
                spread: Math.round(avgSpread * 10) / 10,
                failureRate: Math.round(avgFailure * 10) / 10,
                serviceTime: Math.round(avgServiceTime * 10) / 10,
                nps: Math.round(nps),

                // Trends (vs previous period)
                // Note: For queue, spread, failure, serviceTime - Positive change is BAD (red)
                // For SLA, NPS - Positive change is GOOD (green)
                queueChange: calcChange(avgQueue, prevQueue),
                slaChange: calcChange(avgSla, prevSla),
                spreadChange: calcChange(avgSpread, prevSpread),
                failureChange: calcChange(avgFailure, prevFailure),
                serviceTimeChange: calcChange(avgServiceTime, prevServiceTime),
            };
        })
            .sort((a, b) => a.sqi - b.sqi); // Sort by SQI ascending (worst first)
    }, [filteredBranches]);

    // Map Data (Branch SQI)
    const mapPoints = useMemo(() => {
        return filteredBranches.map(branch => {
            const branchMetrics = recentDailyMetrics
                .filter(m => m.branchId === branch.id)
                .slice(-7);

            const count = branchMetrics.length || 1;

            const avgQueue = branchMetrics.reduce((s, m) => s + m.avgQueueTime, 0) / count;
            const sla = branchMetrics.reduce((s, m) => s + m.slaMet, 0) / count;
            const serviceFailure = branchMetrics.reduce((s, m) => s + m.serviceFailureRate, 0) / count;
            // Invert failure rate for SQI calculation: 100 - (failureRate * 5) to get score
            const failureScore = Math.max(0, Math.min(100, 100 - serviceFailure * 5));

            const monthly = monthlyMetrics.find(m => m.branchId === branch.id && m.month === monthlyLabels[monthlyLabels.length - 1]);
            const nps = monthly ? (monthly.npsScore + 100) / 2 : 75;

            const qScore = Math.max(0, Math.min(100, 100 - (avgQueue - 5) * 5));
            const index = Math.round((qScore + sla + failureScore + nps) / 4);

            return {
                id: branch.id,
                x: branch.coordinates?.x || 50,
                y: branch.coordinates?.y || 50,
                value: index,
                label: branch.name,
                subLabel: `SQI: ${index}`,
                radius: 3,
                color: index >= 85 ? '#10b981' : index >= 70 ? '#f59e0b' : '#ef4444',
                details: {
                    queue: Math.round(avgQueue * 10) / 10,
                    sla: Math.round(sla * 10) / 10,
                    nps: nps
                }
            };
        });
    }, [filteredBranches, recentDailyMetrics, monthlyMetrics, monthlyLabels]);

    return (
        <div className="space-y-6" >
            {/* Header with Filters */}
            < div className="space-y-4" >
                <GlassCard>
                    <div className="mb-4">
                        <h2 className="text-2xl font-semibold text-slate-800">
                            Tactical Service Quality Dashboard (OBO)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Operational diagnostics and branch-level insights
                        </p>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        <Select
                            label="REGION"
                            value={selectedRegion}
                            onChange={(val) => {
                                setSelectedRegion(val);
                                setSelectedArea('');
                                setSelectedBranch('');
                            }}
                            options={regions.map(r => ({ value: r.id, label: r.name }))}
                            placeholder="All Regions"
                        />
                        <Select
                            label="AREA"
                            value={selectedArea}
                            onChange={(val) => {
                                setSelectedArea(val);
                                setSelectedBranch('');
                            }}
                            options={filteredAreas.map(a => ({ value: a.id, label: a.name }))}
                            placeholder="All Areas"
                        />
                        <Select
                            label="BRANCH"
                            value={selectedBranch}
                            onChange={setSelectedBranch}
                            options={filteredBranches.map(b => ({ value: b.id, label: b.name }))}
                            placeholder="All Branches"
                        />
                        <Select
                            label="VOLUME CLASS"
                            value={selectedVolumeClass}
                            onChange={setSelectedVolumeClass}
                            options={[
                                { value: 'High', label: 'High' },
                                { value: 'Medium', label: 'Medium' },
                                { value: 'Low', label: 'Low' },
                            ]}
                            placeholder="All Classes"
                        />
                        <Select
                            label="SERVICE TYPE"
                            value={selectedServiceType}
                            onChange={setSelectedServiceType}
                            options={[
                                { value: 'All', label: 'All Types' },
                                { value: 'CS', label: 'Customer Service' },
                                { value: 'Teller', label: 'Teller' },
                            ]}
                            placeholder="All Types"
                        />
                    </div>
                </GlassCard>

                {/* Geographic View */}
                <GlassCard>
                    <div className="flex justify-between items-center mb-0">
                        <h3 className="text-sm font-medium text-slate-600">Geographic Distribution (Branch SQI)</h3>
                    </div>
                    <IndonesiaMap
                        points={mapPoints}
                        height={300}
                        onPointClick={(pt: any) => setSelectedBranch(pt.id)}
                    />
                </GlassCard >
            </div >

            {/* Current Branch/Area Status Card */}
            {
                currentBranch && (
                    <GlassCard variant="strong" padding="sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-50">
                                    <BarChart2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">{currentBranch.code} - {currentBranch.name}</h3>
                                    <p className="text-sm text-slate-500">
                                        {areas.find(a => a.id === currentBranch.areaId)?.name} • {currentBranch.volumeClass} Volume
                                    </p>
                                </div>
                            </div>
                            <StatusBadge status={currentBranch.status} size="md" />
                        </div>
                    </GlassCard>
                )
            }

            {/* FAST Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-slate-700">FAST</h3>
                    <span className="text-sm text-slate-400">Speed of service delivery</span>
                </div>

                <div className="space-y-4">
                    {/* Top Section: Branch Table (Left) + Charts (Right) */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* LEFT SIDE: Branch Table (Area View) or KPI Cards (Branch View) */}
                        <div className={!currentBranch ? "col-span-12 lg:col-span-8 h-[432px]" : "col-span-12 lg:col-span-3 space-y-4"}>
                            {!currentBranch ? (
                                // AREA VIEW: Branch Performance Table
                                <GlassCard className="h-full flex flex-col">
                                    <div className="mb-3 flex justify-between items-center">
                                        <h3 className="text-sm font-medium text-slate-700">Branch Performance</h3>
                                        <span className="text-xs text-slate-400">Week over Week</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-slate-400 font-medium border-b border-slate-100 sticky top-0 bg-white z-10">
                                                <tr>
                                                    <th className="pb-2 text-left font-normal pl-1">Branch</th>
                                                    <th className="pb-2 text-right font-normal">Queue Time</th>
                                                    <th className="pb-2 text-right font-normal pr-1">SLA</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {branchFastMetrics.map((branch) => (
                                                    <tr
                                                        key={branch.id}
                                                        onClick={() => setSelectedBranch(branch.id)}
                                                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                    >
                                                        <td className="py-2.5 pl-1">
                                                            <div className="font-medium text-slate-700 truncate max-w-[120px]" title={branch.name}>
                                                                {branch.name}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className={`font-medium ${branch.queueTime > 15 ? 'text-red-600' : 'text-slate-700'}`}>
                                                                    {branch.queueTime}m
                                                                </span>
                                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                                    {branch.queueDelta < 0 ? (
                                                                        <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                                                                    ) : branch.queueDelta > 0 ? (
                                                                        <ArrowUpRight className="w-3 h-3 text-red-500" />
                                                                    ) : <Minus className="w-3 h-3 text-slate-300" />}
                                                                    <span className={`text-[10px] ${branch.queueDelta < 0 ? 'text-emerald-600' : branch.queueDelta > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                                        {Math.abs(branch.queueDelta)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 pr-1 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className={`font-medium ${branch.sla < 85 ? 'text-red-600' : 'text-slate-700'}`}>
                                                                    {branch.sla}%
                                                                </span>
                                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                                    {branch.slaDelta > 0 ? (
                                                                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                                                    ) : branch.slaDelta < 0 ? (
                                                                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                                                                    ) : <Minus className="w-3 h-3 text-slate-300" />}
                                                                    <span className={`text-[10px] ${branch.slaDelta > 0 ? 'text-emerald-600' : branch.slaDelta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                                        {Math.abs(branch.slaDelta)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            ) : (
                                // BRANCH VIEW: KPI Cards
                                <>
                                    <KPICard
                                        title="Avg Queue Time"
                                        value={currentMetrics.avgQueueTime}
                                        unit="min"
                                        trend={currentMetrics.avgQueueTime < benchmarks.queueTime ? 'down' : 'up'}
                                        trendValue={`${queueDiffPercent}% vs Prev Month`}
                                        invertTrendColor
                                        color="blue"
                                        icon={<Clock className="w-5 h-5" />}
                                    />
                                    <KPICard
                                        title="SLA Compliance"
                                        value={currentMetrics.slaMet}
                                        unit="%"
                                        trend={currentMetrics.slaMet > benchmarks.sla ? 'up' : 'down'}
                                        trendValue={slaTrendValue}
                                        color="cyan"
                                        icon={<CheckCircle className="w-5 h-5" />}
                                    />
                                </>
                            )}
                        </div>

                        {/* RIGHT SIDE: Charts (Spans 4 cols in Area View) */}
                        <div className={!currentBranch ? "col-span-12 lg:col-span-4 space-y-4" : "col-span-12 lg:col-span-9 space-y-4"}>
                            {/* Chart 1: Queue Time */}
                            <LineChart
                                title="Queue Time Trend (Last 15 Days)"
                                data={queueTrendData}
                                xAxisKey="date"
                                lines={[{ dataKey: 'queueTime', color: '#3b82f6', name: 'Queue (min)' }]}
                                height={140}
                                referenceLines={[{ y: benchmarks.queueTime, label: 'Prev Month', color: '#94a3b8' }]}
                            />

                            {/* Chart 2: SLA */}
                            <LineChart
                                title="SLA Trend"
                                data={slaTrendData}
                                xAxisKey="date"
                                lines={[{ dataKey: 'slaMet', color: '#06b6d4', name: 'SLA %' }]}
                                height={140}
                                yAxisDomain={[50, 100]}
                                referenceLines={[{ y: benchmarks.sla, label: 'Target', color: '#10b981' }]}
                            />
                        </div>
                    </div>

                    {/* Row 3: Hourly Visitors (Horizontal Bar) + Queue Distribution Daily */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* Visitors per Hour - Horizontal Bar with all hours */}
                        <div className="col-span-4">
                            <SimpleBarChart
                                title="Jumlah Pengunjung per Jam"
                                data={hourlyVisitorsData}
                                height={280}
                            />
                        </div>
                        {/* Queue Distribution Over Time (DAILY) */}
                        <div className="col-span-8">
                            <StackedBarChart
                                title="Queue Distribution (Daily)"
                                data={queueDistOverTimeData}
                                xAxisKey="date"
                                bars={[
                                    { dataKey: '<5 min', color: '#10b981', name: '<5 min' },
                                    { dataKey: '5-15 min', color: '#06b6d4', name: '5-15 min' },
                                    { dataKey: '15-30 min', color: '#f59e0b', name: '15-30 min' },
                                    { dataKey: '>30 min', color: '#ef4444', name: '>30 min' },
                                ]}
                                height={280}
                                stacked
                                showLegend
                            />
                        </div>
                    </div>

                    {/* Row 4: Queue by Service Type - Cards + Daily Line Chart */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                            <GlassCard>
                                <h3 className="text-sm font-medium text-slate-600 mb-3">Queue by Service Type</h3>
                                <div className="space-y-3">
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Teller</span>
                                            <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tellerDiff <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {tellerDiff > 0 ? '+' : ''}{Math.round(tellerDiff * 10) / 10} vs Prev Month
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-bold text-blue-700">{currentMetrics.tellerQueueTime}</span>
                                            <span className="text-sm text-blue-600">min</span>
                                        </div>
                                    </div>
                                    <div className="bg-violet-50 rounded-lg p-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">CS</span>
                                            <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${csDiff <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {csDiff > 0 ? '+' : ''}{Math.round(csDiff * 10) / 10} vs Prev Month
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-bold text-violet-700">{currentMetrics.csQueueTime}</span>
                                            <span className="text-sm text-violet-600">min</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                        <div className="col-span-9">
                            <LineChart
                                title="Queue by Service Type Trend (Daily)"
                                data={serviceTypeQueueTrendData}
                                xAxisKey="date"
                                lines={[
                                    { dataKey: 'teller', color: '#3b82f6', name: 'Teller' },
                                    { dataKey: 'cs', color: '#8b5cf6', name: 'CS' },
                                ]}
                                height={180}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CONSISTENT Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-slate-700">CONSISTENT</h3>
                    <span className="text-sm text-slate-400">Service reliability and uniformity</span>
                </div>

                <div className="space-y-4">
                    {/* Top Section: Branch Reliability Table (Left) + Charts (Right) */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* LEFT SIDE: Branch Table (Area View) or KPI Cards (Branch View) */}
                        <div className={!currentBranch ? "col-span-12 lg:col-span-8 h-[432px]" : "col-span-12 lg:col-span-3 space-y-4"}>
                            {!currentBranch ? (
                                // AREA VIEW: Branch Reliability Table
                                <GlassCard className="h-full flex flex-col">
                                    <div className="mb-3 flex justify-between items-center">
                                        <h3 className="text-sm font-medium text-slate-700">Branch Reliability</h3>
                                        <div className="flex gap-2 text-xs text-slate-400">
                                            <span>Week over Week</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-slate-400 font-medium border-b border-slate-100 sticky top-0 bg-white z-10">
                                                <tr>
                                                    <th className="pb-2 text-left font-normal pl-1">Branch</th>
                                                    <th className="pb-2 text-right font-normal">Failure Rate</th>
                                                    <th className="pb-2 text-right font-normal pr-1">Service Spread</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {branchConsistentMetrics.map((branch) => (
                                                    <tr
                                                        key={branch.id}
                                                        onClick={() => setSelectedBranch(branch.id)}
                                                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                    >
                                                        <td className="py-2.5 pl-1">
                                                            <div className="font-medium text-slate-700 truncate max-w-[120px]" title={branch.name}>
                                                                {branch.name}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className={`font-medium ${branch.failureRate > 5 ? 'text-red-600' : 'text-slate-700'}`}>
                                                                    {branch.failureRate}%
                                                                </span>
                                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                                    {branch.failureDelta < 0 ? (
                                                                        <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                                                                    ) : branch.failureDelta > 0 ? (
                                                                        <ArrowUpRight className="w-3 h-3 text-red-500" />
                                                                    ) : <Minus className="w-3 h-3 text-slate-300" />}
                                                                    <span className={`text-[10px] ${branch.failureDelta < 0 ? 'text-emerald-600' : branch.failureDelta > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                                        {Math.abs(branch.failureDelta)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 pr-1 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-medium text-slate-700">
                                                                    {branch.spread}m
                                                                </span>
                                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                                    {branch.spreadDelta < 0 ? (
                                                                        <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                                                                    ) : branch.spreadDelta > 0 ? (
                                                                        <ArrowUpRight className="w-3 h-3 text-red-500" />
                                                                    ) : <Minus className="w-3 h-3 text-slate-300" />}
                                                                    <span className={`text-[10px] ${branch.spreadDelta < 0 ? 'text-emerald-600' : branch.spreadDelta > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                                        {Math.abs(branch.spreadDelta)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            ) : (
                                // BRANCH VIEW: KPI Cards
                                <>
                                    <KPICard
                                        title="Service Failure Rate"
                                        value={currentMetrics.serviceFailureRate}
                                        unit="%"
                                        trend={currentMetrics.serviceFailureRate < benchmarks.failure ? 'down' : 'up'}
                                        trendValue={failureTrendValue}
                                        color="red"
                                        icon={<AlertTriangle className="w-5 h-5" />}
                                    />
                                    <div className="mt-2 text-xs text-slate-500 text-center">
                                        Target: ≤{benchmarks.failure}%
                                    </div>

                                    <KPICard
                                        title="Service Spread"
                                        subtitle="P80 - P50"
                                        value={currentMetrics.serviceSpread}
                                        unit="min"
                                        trend={currentMetrics.serviceSpread < benchmarks.spread ? 'down' : 'up'}
                                        trendValue={spreadTrendValue}
                                        invertTrendColor
                                        color="purple"
                                    />
                                    <div className="mt-2 text-xs text-slate-500 text-center">
                                        Prev: {benchmarks.spread} min
                                    </div>
                                </>
                            )}
                        </div>

                        {/* RIGHT SIDE: Charts */}
                        <div className={!currentBranch ? "col-span-12 lg:col-span-4 space-y-4" : "col-span-12 lg:col-span-9 space-y-4"}>
                            <LineChart
                                title="Service Failure Trend"
                                data={serviceFailureTrendData}
                                xAxisKey="date"
                                lines={[{ dataKey: 'value', color: '#ef4444', name: 'Failure %' }]}
                                height={140}
                                yAxisDomain={[0, 20]}
                                referenceLines={[{ y: benchmarks.failure, label: 'Target', color: '#10b981' }]}
                            />

                            <LineChart
                                title="Service Spread Trend"
                                data={spreadTrendData}
                                xAxisKey="date"
                                lines={[{ dataKey: 'value', color: '#a855f7', name: 'Spread (min)' }]}
                                height={140}
                                referenceLines={[{ y: benchmarks.spread, label: 'Prev Month', color: '#94a3b8' }]}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* EFFICIENT Section - 4 Rows */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-5 h-5 text-cyan-500" />
                    <h3 className="text-lg font-semibold text-slate-700">EFFICIENT</h3>
                    <span className="text-sm text-slate-400">Productivity and resource utilization</span>
                </div>

                <div className="space-y-4">
                    {/* Top Section: Branch Efficiency Table (Left) + Charts (Right) */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* LEFT SIDE: Branch Table (Area View) or KPI Cards (Branch View) */}
                        <div className={!currentBranch ? "col-span-12 lg:col-span-8 h-[567px]" : "col-span-12 lg:col-span-3 space-y-4"}>
                            {!currentBranch ? (
                                // AREA VIEW: Branch Efficiency Table
                                <GlassCard className="h-full flex flex-col">
                                    <div className="mb-3 flex justify-between items-center">
                                        <h3 className="text-sm font-medium text-slate-700">Branch Efficiency</h3>
                                        <div className="flex gap-2 text-xs text-slate-400">
                                            <span>Week over Week</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                        <table className="w-full text-xs">
                                            <thead className="text-xs text-slate-400 font-medium border-b border-slate-100 sticky top-0 bg-white z-10">
                                                <tr>
                                                    <th className="pb-2 text-left font-normal pl-1">Branch</th>
                                                    <th className="pb-2 text-right font-normal">Svc Time</th>
                                                    <th className="pb-2 text-right font-normal">Trx/Staff (CS / Teller)</th>
                                                    <th className="pb-2 text-right font-normal pr-1">Cust/Stf</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {branchEfficientMetrics.map((branch) => (
                                                    <tr
                                                        key={branch.id}
                                                        onClick={() => setSelectedBranch(branch.id)}
                                                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                    >
                                                        <td className="py-2.5 pl-1">
                                                            <div className="font-medium text-slate-700 truncate max-w-[80px]" title={branch.name}>
                                                                {branch.name}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-medium text-slate-700">{branch.serviceTime}m</span>
                                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                                    {branch.svcDelta < 0 ? (
                                                                        <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                                                                    ) : branch.svcDelta > 0 ? (
                                                                        <ArrowUpRight className="w-3 h-3 text-red-500" />
                                                                    ) : <Minus className="w-3 h-3 text-slate-300" />}
                                                                    <span className={`text-[10px] ${branch.svcDelta < 0 ? 'text-emerald-600' : branch.svcDelta > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                                        {Math.abs(branch.svcDelta)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 text-right">
                                                            <div className="flex justify-end gap-3">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[10px] text-slate-400 mb-0.5">CS</span>
                                                                    <span className="font-medium text-slate-700">{branch.csTrx}</span>
                                                                    <span className={`text-[9px] ${branch.csTrxDelta > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                        {branch.csTrxDelta > 0 ? '+' : ''}{branch.csTrxDelta}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[10px] text-slate-400 mb-0.5">Teller</span>
                                                                    <span className="font-medium text-slate-700">{branch.tellerTrx}</span>
                                                                    <span className={`text-[9px] ${branch.tellerTrxDelta > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                        {branch.tellerTrxDelta > 0 ? '+' : ''}{branch.tellerTrxDelta}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 pr-1 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-medium text-slate-700">{branch.custPerStaff}</span>
                                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                                    <span className={`text-[10px] ${branch.custDelta > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                        {branch.custDelta > 0 ? '+' : ''}{branch.custDelta}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            ) : (
                                // BRANCH VIEW: KPI Cards
                                <>
                                    <KPICard
                                        title="Avg Service Time"
                                        value={currentMetrics.avgServiceTime}
                                        unit="min"
                                        trend={currentMetrics.avgServiceTime < benchmarks.serviceTime ? 'down' : 'up'}
                                        trendValue={serviceTimeTrendValue}
                                        invertTrendColor
                                        color="cyan"
                                        icon={<Clock className="w-5 h-5" />}
                                    />
                                    <div className="mt-2 text-xs text-slate-500 text-center">
                                        Prev: {benchmarks.serviceTime} min
                                    </div>

                                    <GlassCard>
                                        <h3 className="text-sm font-medium text-slate-600 mb-3">Jumlah Trx per Staff</h3>
                                        <div className="space-y-2">
                                            <div className="bg-cyan-50 rounded-lg p-2.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Teller</span>
                                                    <div className={`text-[9px] font-medium px-1 py-0.5 rounded ${tellerTrxPerStaff >= benchmarks.tellerTrxPerStaff ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {tellerTrxPerStaff >= benchmarks.tellerTrxPerStaff ? '+' : ''}{tellerTrxPerStaff - benchmarks.tellerTrxPerStaff} vs Prev
                                                    </div>
                                                </div>
                                                <div className="text-xl font-bold text-cyan-700">{tellerTrxPerStaff} <span className="text-xs font-normal text-cyan-600">trx/day</span></div>
                                            </div>
                                            <div className="bg-violet-50 rounded-lg p-2.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">CS</span>
                                                    <div className={`text-[9px] font-medium px-1 py-0.5 rounded ${csTrxPerStaff >= benchmarks.csTrxPerStaff ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {csTrxPerStaff >= benchmarks.csTrxPerStaff ? '+' : ''}{csTrxPerStaff - benchmarks.csTrxPerStaff} vs Prev
                                                    </div>
                                                </div>
                                                <div className="text-xl font-bold text-violet-700">{csTrxPerStaff} <span className="text-xs font-normal text-violet-600">trx/day</span></div>
                                            </div>
                                        </div>
                                    </GlassCard>

                                    <KPICard
                                        title="Customers per Staff"
                                        subtitle="per day"
                                        value={customersPerStaff}
                                        unit="customers"
                                        trend={customersPerStaff > benchmarks.customersPerStaff ? 'up' : 'down'}
                                        trendValue={`${Math.abs(customersPerStaffDiff)} vs Prev Month`}
                                        color="cyan"
                                        icon={<Users className="w-5 h-5" />}
                                    />
                                </>
                            )}
                        </div>

                        {/* RIGHT SIDE: Charts */}
                        <div className={!currentBranch ? "col-span-12 lg:col-span-4 space-y-4" : "col-span-12 lg:col-span-9 space-y-4"}>
                            <LineChart
                                title="Service Time Trend (Last 15 Days)"
                                data={serviceTimeTrendData}
                                xAxisKey="date"
                                lines={[{ dataKey: 'serviceTime', color: '#06b6d4', name: 'Service Time (min)' }]}
                                height={140}
                                referenceLines={[{ y: benchmarks.serviceTime, label: 'Prev Month', color: '#94a3b8' }]}
                            />

                            <LineChart
                                title="Productivity Trend (Trx per Staff per Day)"
                                data={productivityTrendData}
                                xAxisKey="date"
                                lines={[
                                    { dataKey: 'tellerTrx', color: '#06b6d4', name: 'Teller Trx/Staff' },
                                    { dataKey: 'csTrx', color: '#8b5cf6', name: 'CS Trx/Staff' },
                                ]}
                                height={140}
                            />

                            <LineChart
                                title="Customers per Staff Trend (Daily)"
                                data={customersPerStaffTrendData}
                                xAxisKey="date"
                                lines={[{ dataKey: 'customers', color: '#0891b2', name: 'Customers/Staff' }]}
                                height={120} // Slightly smaller top fit
                                referenceLines={[{ y: benchmarks.customersPerStaff, label: 'Prev Month', color: '#94a3b8' }]}
                            />
                        </div>
                    </div>

                    {/* Row 4: Digital Rate Focus */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                            <GlassCard className="h-full bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                                        <Smartphone className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-700">Digital Rate</h3>
                                </div>
                                <p className="text-3xl font-bold text-amber-700 tabular-nums">
                                    {digitalRate}%
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {currentMetrics.digitalEligibleOffline} of {totalTransactions} txns
                                </p>
                                <div className="mt-3 h-2 bg-amber-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all"
                                        style={{ width: `${digitalRate}%` }}
                                    />
                                </div>
                            </GlassCard>
                        </div>
                        <div className="col-span-9">
                            <GlassCard>
                                <h3 className="text-sm font-medium text-slate-600 mb-3">Top Transactions Eligible for Digital Migration</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold">a</div>
                                            <span className="text-xs font-medium text-slate-700">Setor/Tarik Tunai</span>
                                        </div>
                                        <p className="text-lg font-bold text-amber-700">{Math.round(currentMetrics.digitalEligibleOffline * 0.45)}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">&lt;10 jt, dapat dilayani CRM</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">b</div>
                                            <span className="text-xs font-medium text-slate-700">Ganti Kartu</span>
                                        </div>
                                        <p className="text-lg font-bold text-blue-700">{Math.round(currentMetrics.digitalEligibleOffline * 0.25)}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Jika cabang memiliki CSM</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">c</div>
                                            <span className="text-xs font-medium text-slate-700">Buka Rekening</span>
                                        </div>
                                        <p className="text-lg font-bold text-emerald-700">{Math.round(currentMetrics.digitalEligibleOffline * 0.30)}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Non Livin users</p>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </section>

            {/* PERCEPTION Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-semibold text-slate-700">PERCEPTION</h3>
                    <span className="text-sm text-slate-400">Customer experience and feedback</span>
                </div>
                <div className="grid grid-cols-12 gap-4">
                    {/* LEFT SIDE: Branch Table (Area View) or KPI Cards/Original View (Branch View) */}
                    <div className={!currentBranch ? "col-span-12 lg:col-span-8 h-[594px]" : "col-span-12 space-y-4"}>
                        {!currentBranch ? (
                            // AREA VIEW: Branch Complaint Breakdown Table
                            <GlassCard className="h-full flex flex-col">
                                <div className="mb-3 flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-slate-700">Complaint Breakdown</h3>
                                    <div className="flex gap-2 text-xs text-slate-400">
                                        <span>Current Month</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                    <table className="w-full text-xs">
                                        <thead className="text-xs text-slate-400 font-medium border-b border-slate-100 sticky top-0 bg-white z-10">
                                            <tr>
                                                <th className="pb-2 text-left font-normal pl-1 w-[80px]">Branch</th>
                                                <th className="pb-2 text-right font-normal">Total</th>
                                                <th className="pb-2 text-right font-normal" title="Queue Time">Queue Time</th>
                                                <th className="pb-2 text-right font-normal" title="Staff Behavior">Staff Behavior</th>
                                                <th className="pb-2 text-right font-normal" title="System Issues">System Issues</th>
                                                <th className="pb-2 text-right font-normal" title="Product Info">Product Info</th>
                                                <th className="pb-2 text-right font-normal pr-1" title="Other">Other</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {branchPerceptionMetrics.map((branch) => (
                                                <tr
                                                    key={branch.id}
                                                    onClick={() => setSelectedBranch(branch.id)}
                                                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                >
                                                    <td className="py-2.5 pl-1">
                                                        <div className="font-medium text-slate-700 truncate max-w-[80px]" title={branch.name}>
                                                            {branch.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-medium text-slate-700">{branch.totalVol}</span>
                                                            <span className={`text-[9px] ${branch.volDelta > 0 ? 'text-red-500' : branch.volDelta < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                {branch.volDelta > 0 ? '+' : ''}{branch.volDelta}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] text-slate-700">{branch.queueCount}</span>
                                                            <span className="text-[9px] text-slate-400">({branch.queue}%)</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] text-slate-700">{branch.staffCount}</span>
                                                            <span className="text-[9px] text-slate-400">({branch.staff}%)</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] text-slate-700">{branch.systemCount}</span>
                                                            <span className="text-[9px] text-slate-400">({branch.system}%)</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] text-slate-700">{branch.productCount}</span>
                                                            <span className="text-[9px] text-slate-400">({branch.product}%)</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 pr-1 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] text-slate-700">{branch.otherCount}</span>
                                                            <span className="text-[9px] text-slate-400">({branch.other}%)</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        ) : null}
                    </div>

                    {/* RIGHT SIDE: Charts (Spans 4 cols in Area View, 12 cols in Branch View) */}
                    <div className={!currentBranch ? "col-span-12 lg:col-span-4 space-y-4" : "col-span-12 grid grid-cols-12 gap-4"}>
                        {/* Complaint Bar Chart - Width adjusts based on view */}
                        {!currentBranch ? null : (
                            <div className="col-span-6">
                                <StackedBarChart
                                    title="Complaint Composition Over Time"
                                    data={complaintTrendData}
                                    xAxisKey="month"
                                    bars={[
                                        { dataKey: 'Queue Time', color: '#ef4444', name: 'Queue Time' },
                                        { dataKey: 'Staff Behavior', color: '#f59e0b', name: 'Staff Behavior' },
                                        { dataKey: 'System Issues', color: '#8b5cf6', name: 'System Issues' },
                                        { dataKey: 'Product Info', color: '#3b82f6', name: 'Product Info' },
                                        { dataKey: 'Other', color: '#94a3b8', name: 'Other' },
                                    ]}
                                    height={360}
                                    stacked
                                    showLegend
                                />
                            </div>
                        )}

                        {/* Trends Column (NPS, SES, NSI) */}
                        <div className={!currentBranch ? "col-span-12 grid grid-cols-1 gap-4" : "col-span-6 flex flex-col gap-3"}>
                            <div className="col-span-1">
                                <LineChart
                                    title="NPS Trend"
                                    data={perceptionData}
                                    xAxisKey="month"
                                    lines={[{ dataKey: 'nps', color: '#8b5cf6', name: 'NPS' }]}
                                    height={!currentBranch ? 140 : 110}
                                />
                            </div>
                            <div className="col-span-1">
                                <LineChart
                                    title="SES Score Trend"
                                    data={perceptionData}
                                    xAxisKey="month"
                                    lines={[{ dataKey: 'ses', color: '#10b981', name: 'SES Score' }]}
                                    height={!currentBranch ? 140 : 110}
                                    yAxisDomain={[3, 5]}
                                />
                            </div>
                            <div className="col-span-1">
                                <LineChart
                                    title="NSI (Net Satisfaction Index)"
                                    data={perceptionData}
                                    xAxisKey="month"
                                    lines={[{ dataKey: 'nsi', color: '#f59e0b', name: 'NSI' }]}
                                    height={!currentBranch ? 140 : 110}
                                    yAxisDomain={[0, 100]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="relative py-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-slate-50 px-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Branch Performance Detail</span>
                </div>
            </div>

            {/* Branch Intervention & SQI Ranking Section */}
            <section className="grid grid-cols-12 gap-6 w-full mb-8">
                {/* LEFT TABLE: Where to Intervene (Declining Trends) */}
                <div className="col-span-12 xl:col-span-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-700">Where to Intervene</h3>
                            <span className="text-sm text-slate-400">Areas with SQI decline vs last week, ranked by % decline</span>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <GlassCard className="flex-1">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200/50 sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
                                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase">Branch</th>
                                        <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase">SQI</th>
                                        <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase">Queue</th>
                                        <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase">SLA</th>
                                        <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase">Spread</th>
                                        <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase">Fail%</th>
                                        <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase">Svc.T</th>
                                        <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase">SQI Δ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branchSqiData
                                        .filter(b => b.sqiDelta < 0) // Only declining
                                        .sort((a, b) => a.sqiDelta - b.sqiDelta) // Largest decline (most negative) first
                                        .slice(0, 50)
                                        .map((branch) => (
                                            <tr
                                                key={branch.id}
                                                className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedBranch(branch.id)}
                                            >
                                                <td className="py-3 px-3 font-medium text-slate-700">{branch.name}</td>
                                                <td className={`py-3 px-3 text-center font-bold ${branch.sqi >= 85 ? 'text-emerald-600' : branch.sqi >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {branch.sqi}
                                                </td>
                                                {/* Metric Trends: Red is BAD for Queue/Spread/Fail/SvcTime, Green is GOOD. For SLA/NPS, Green is GOOD. */}
                                                <td className="py-3 px-3 text-center">
                                                    <div className={`flex items-center justify-center gap-0.5 text-xs font-medium ${branch.queueChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {branch.queueChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(branch.queueChange)}%
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className={`flex items-center justify-center gap-0.5 text-xs font-medium ${branch.slaChange < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {branch.slaChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(branch.slaChange)}%
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className={`flex items-center justify-center gap-0.5 text-xs font-medium ${branch.spreadChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {branch.spreadChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(branch.spreadChange)}%
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className={`flex items-center justify-center gap-0.5 text-xs font-medium ${branch.failureChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {branch.failureChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(branch.failureChange)}%
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className={`flex items-center justify-center gap-0.5 text-xs font-medium ${branch.serviceTimeChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {branch.serviceTimeChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(branch.serviceTimeChange)}%
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center gap-1 mx-auto w-fit">
                                                        <ArrowDownRight className="w-3 h-3" />
                                                        {Math.abs(branch.sqiDelta)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>

                {/* RIGHT TABLE: SQI Ranking by Branch (Best First) */}
                <div className="col-span-12 xl:col-span-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-700">SQI Ranking by Branch</h3>
                            <span className="text-sm text-slate-400">All branches ranked by Service Quality Index (highest first)</span>
                        </div>
                        <div className="flex gap-1 text-[10px]">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">≥85 Excellent</span>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-medium">70-84 Good</span>
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">&lt;70 Needs Work</span>
                        </div>
                    </div>
                    <GlassCard className="flex-1">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200/50 sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
                                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase w-8">#</th>
                                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase">Branch</th>
                                        <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase">SQI</th>
                                        <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase">Queue</th>
                                        <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase">SLA</th>
                                        <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase">Spread</th>
                                        <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase">Fail%</th>
                                        <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase">Svc.T</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...branchSqiData]
                                        .sort((a, b) => b.sqi - a.sqi) // Highest SQI first
                                        .slice(0, 50)
                                        .map((branch, idx) => (
                                            <tr
                                                key={branch.id}
                                                className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedBranch(branch.id)}
                                            >
                                                <td className="py-3 px-3 font-medium text-slate-500">{idx + 1}</td>
                                                <td className="py-3 px-3 font-medium text-slate-700">{branch.name}</td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${branch.sqi >= 85 ? 'bg-emerald-100 text-emerald-700' : branch.sqi >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                        {branch.sqi}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right tabular-nums text-slate-600">{branch.queueTime}m</td>
                                                <td className="py-3 px-3 text-right tabular-nums text-slate-600">{branch.sla}%</td>
                                                <td className="py-3 px-3 text-right tabular-nums text-slate-600">{branch.spread}m</td>
                                                <td className="py-3 px-3 text-right tabular-nums text-slate-600">{branch.failureRate}%</td>
                                                <td className="py-3 px-3 text-right tabular-nums text-slate-600">{branch.serviceTime}m</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            </section>
        </div >
    );
}
