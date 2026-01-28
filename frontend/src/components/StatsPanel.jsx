import React, { useMemo } from 'react';
import { Activity, Users, AlertTriangle, AlertCircle, Clock, TrendingUp, TrendingDown, Minus, Truck } from 'lucide-react';

const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
};

const StatsCard = ({ title, value, subtext, icon: Icon, color, status, target, trend }) => {
    // Determine border color based on status (simulating thresholds)
    let borderColor = "border-slate-200 dark:border-slate-700";
    let statusBadge = null;

    if (status === 'critical') {
        borderColor = "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
        statusBadge = <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 px-1.5 py-0.5 rounded">CRITICAL</span>;
    } else if (status === 'watch') {
        borderColor = "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]";
        statusBadge = <span className="text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100 px-1.5 py-0.5 rounded">WATCH</span>;
    } else if (status === 'ok') {
        borderColor = "border-green-500/50";
        statusBadge = <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 px-1.5 py-0.5 rounded">OK</span>;
    }

    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg border ${borderColor} shadow-md flex flex-col justify-between transition-all duration-300 relative overflow-hidden`}>
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-opacity-20 ${color}`}>
                    <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                </div>
                {statusBadge}
            </div>

            <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
                <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{value}</h3>
                    {trend && (
                        <div className={`mb-1 ${trend === 'up' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                            <TrendIcon trend={trend} />
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-end mt-2 border-t border-slate-100 dark:border-slate-700/50 pt-2">
                    <div className="flex flex-col">
                        {target && <span className="text-[10px] text-slate-500">Target: {target}</span>}
                        {subtext && <p className="text-[10px] text-slate-400">{subtext}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BreathingCurve = ({ history, capacity }) => {
    if (!history || history.length === 0) return null;

    // Safety defaults
    const physBeds = capacity?.total_physical || 200;
    const surgeCap = capacity?.total_surge || 260;

    // Scale Dimensions
    const height = 120;
    const width = 400; // viewBox width
    // Y-Axis Scale (0 to Critical + 20%)
    const maxY = surgeCap * 1.2;

    const points = history.map((h, i) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - (h.active / maxY) * height; // Invert Y
        return `${x},${y}`;
    }).join(' ');

    const getY = (val) => height - (val / maxY) * height;

    const safeY = getY(physBeds * 0.85);
    const surgeY = getY(physBeds);
    const critY = getY(surgeCap);

    // Current State Annotation
    const currentActive = history[history.length - 1]?.active || 0;
    let annotation = "";
    if (currentActive > surgeCap) annotation = "CRITICAL OVERLOAD";
    else if (currentActive > physBeds) annotation = "SURGE CAPACITY";
    else if (currentActive > physBeds * 0.85) annotation = "ABOVE SAFE LIMIT";

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md mt-6 relative transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-slate-800 dark:text-white text-sm uppercase font-bold tracking-wider">Occupancy "Breathing Curve"</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">24-Hour Patient Census Trend</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{currentActive}</span>
                    <span className="text-xs text-slate-500 block">Total Patients</span>
                    {annotation && <span className="text-xs font-bold text-red-500 dark:text-red-400 animate-pulse">{annotation}</span>}
                </div>
            </div>

            <div className="relative w-full h-32">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines & Labels */}

                    {/* Safe Capacity (85%) */}
                    <line x1="0" y1={safeY} x2={width} y2={safeY} stroke="#22c55e" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                    <text x="5" y={safeY - 4} fill="#22c55e" fontSize="10" opacity="0.8">SAFE TARGET ({Math.round(physBeds * 0.85)})</text>

                    {/* Physical Capacity (100%) */}
                    <line x1="0" y1={surgeY} x2={width} y2={surgeY} stroke="#eab308" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                    <text x="5" y={surgeY - 4} fill="#eab308" fontSize="10" opacity="0.8">PHYSICAL CAPACITY ({physBeds})</text>

                    {/* Surge Capacity */}
                    <line x1="0" y1={critY} x2={width} y2={critY} stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
                    <text x="5" y={critY - 4} fill="#ef4444" fontSize="10" fontWeight="bold">MAX SURGE ({surgeCap})</text>

                    {/* Chart Line */}
                    <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={`M0,${height} ${points} V${height} H0`} fill="url(#gradient)" />
                    <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                </svg>
            </div>
        </div>
    );
};

export default function StatsPanel({ status }) {
    // Helper to calculate simple rate
    // Note: status.processed accumulates. status.lwbs accumulates. 
    // Rate ~ LWBS / (Processed + Active) is a decent approximation for "Total Throughput" denominator
    // Or just LWBS / Processed if Processed includes LWBS? logic says Processed increments on arrival. 
    // Let's use LWBS / Processed.

    const processed = status.processed || 1;
    const lwbsCount = status.lwbs || 0;
    const lwbsRate = ((lwbsCount / processed) * 100).toFixed(1);

    // Boarding Logic
    const boardingCount = (status.patients || []).filter(p => p.stage === 'BOARDING').length;

    // Status Logic
    const getLWBSStatus = (rate) => {
        if (rate > 5.0) return 'critical';
        if (rate > 3.0) return 'watch';
        return 'ok';
    };

    const getLOSStatus = (los) => {
        if (los > 6.0) return 'critical';
        if (los > 4.5) return 'watch';
        return 'ok';
    };

    const getBoardingStatus = (count) => {
        if (count > 8) return 'critical';
        if (count > 4) return 'watch';
        return 'ok';
    }

    const getNEDOCSStatus = (score) => {
        if (score >= 5) return 'critical';
        if (score >= 3) return 'watch';
        return 'ok';
    };

    // Derived Values
    const nedocs = status.nedocs || 1;
    const avgLos = status.avg_los || 0;

    const colors = {
        nedocs: getNEDOCSStatus(nedocs),
        los: getLOSStatus(avgLos),
        lwbs: getLWBSStatus(lwbsRate),
        boarding: getBoardingStatus(boardingCount)
    };

    return (
        <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard
                    title="Active Patients"
                    value={status.census ? Object.values(status.census).reduce((a, b) => a + b, 0) : 0}
                    icon={Users}
                    color="bg-blue-500 text-blue-500"
                    subtext="Currently in ED"
                />
                <StatsCard
                    title="Admitted Boarding"
                    value={boardingCount}
                    status={colors.boarding}
                    target="< 5"
                    icon={Truck}
                    color="bg-indigo-500 text-indigo-500"
                    subtext="Waiting for Bed"
                    trend={boardingCount > 4 ? 'up' : 'stable'}
                />
                <StatsCard
                    title="Avg LOS"
                    value={`${avgLos}h`}
                    target="< 4.0h"
                    status={colors.los}
                    icon={Clock}
                    color="bg-pink-500 text-pink-500"
                    subtext="Moving Avg"
                    trend={avgLos > 4.5 ? 'up' : 'down'}
                />
                <StatsCard
                    title="LWBS Rate"
                    value={`${lwbsRate}%`}
                    target="< 3.0%"
                    status={colors.lwbs}
                    icon={AlertCircle}
                    color="bg-orange-500 text-orange-500"
                    subtext={`${lwbsCount} Patients Left`}
                    trend={lwbsRate > 3 ? 'up' : 'down'}
                />
                <StatsCard
                    title="NEDOCS Score"
                    value={nedocs}
                    target="< 3"
                    status={colors.nedocs}
                    icon={AlertTriangle}
                    color={nedocs >= 5 ? "bg-red-600 text-red-600" : (nedocs >= 3 ? "bg-yellow-500 text-yellow-500" : "bg-green-500 text-green-500")}
                    subtext={nedocs >= 5 ? "DANGEROUS" : (nedocs >= 3 ? "OVERCROWDED" : "NORMAL")}
                    trend={nedocs > 3 ? 'up' : 'stable'}
                />
            </div>

            <BreathingCurve history={status.history} capacity={status.capacity_thresholds} />
        </div>
    );
}
