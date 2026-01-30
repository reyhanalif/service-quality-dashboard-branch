import { GlassCard } from '../components/ui';
import { HelpCircle } from 'lucide-react';

interface MetricDefinition {
    id: string;
    name: string;
    description: string;
}

const metrics: Record<string, MetricDefinition[]> = {
    "Metrics": [
        {
            id: "ses",
            name: "SES Score",
            description: "Service Experience Survey Score"
        },
        {
            id: "nps",
            name: "NPS Score",
            description: "Net Promoter Score"
        },
        {
            id: "nsi",
            name: "NSI",
            description: "Net Sentiment Index, customer sentiment from scraping social media post. NSI = ((Positive - Negative)/Total Post) *100"
        },
        {
            id: "queue_time",
            name: "Avg Queue Time",
            description: "Average customer waiting time from obtaining ticket to before transacting"
        },
        {
            id: "sla",
            name: "SLA Compliance Rate",
            description: "% of transactions completed within SLA"
        },
        {
            id: "svc_time",
            name: "Avg service time",
            description: "Average time customer completed their transaction"
        },
        {
            id: "trx_fte",
            name: "Trx / FTE",
            description: "Average number of transactions handled by a single staff member per day."
        },
        {
            id: "digital",
            name: "Digital Rate",
            description: "Digital-eligible transactions handled offline"
        },
        {
            id: "fail_rate",
            name: "Service Failure Rate",
            description: "Percentage of transactions that exceeded the maximum acceptable service time."
        },
        {
            id: "spread",
            name: "Service spread",
            description: "Measure of variability in service times, calculated by compare P50 and P80 queue time"
        },
        {
            id: "sqi",
            name: "Service Quality Index (SQI)",
            description: "Comprehensive score (0-100) ranking branch performance across all dimensions. Derived from average of normalized Queue time, Service Time, SLA%, Service Spread, Failure Rate, NPS."
        },
        {
            id: "sqi_decline",
            name: "SQI Decline",
            description: "Percentage drop in SQI compared to the previous period."
        }
    ]
};

export function MetricDefinitions() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Metric Definitions</h2>
                <p className="text-slate-500 mt-1">
                    Glossary of metrics and their descriptions.
                </p>
            </div>

            <GlassCard className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="py-4 px-6 text-sm font-semibold text-slate-600 uppercase tracking-wider w-1/3">Metric Name</th>
                            <th className="py-4 px-6 text-sm font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {metrics["Metrics"].map((metric) => (
                            <tr key={metric.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2 font-medium text-slate-800">
                                        <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                                        {metric.name}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-slate-600 leading-relaxed">
                                    {metric.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassCard>
        </div>
    );
}
