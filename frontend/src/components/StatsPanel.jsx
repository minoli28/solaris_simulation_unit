
import React from 'react';
import { Activity, Users, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

const StatsCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-opacity-20 ${color}`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
        </div>
    </div>
);

const BreathingCurve = ({ history }) => {
    if (!history || history.length === 0) return null;

    // Simple SVG Sparkline
    const height = 40;
    const width = 100;
    const maxVal = Math.max(...history.map(h => h.active), 1);

    const points = history.map((h, i) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - (h.active / maxVal) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-md mt-4">
            <div className="flex justify-between mb-2">
                <h4 className="text-slate-400 text-xs uppercase font-bold">Breathing Curve (24h Occupancy)</h4>
                <span className="text-xs text-slate-500">Current Load: {history[history.length - 1]?.active}</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 stroke-blue-500 fill-none stroke-2 overflow-visible">
                <polyline points={points} />
            </svg>
        </div>
    );
};

export default function StatsPanel({ status }) {
    // NEDOCS Color Logic
    const nedocs = status.nedocs || 1;
    let nedocsColor = "bg-green-500 text-green-500";
    let nedocsLabel = "Normal";
    if (nedocs >= 5) { nedocsColor = "bg-red-600 text-red-600"; nedocsLabel = "DANGEROUS"; }
    else if (nedocs >= 3) { nedocsColor = "bg-yellow-500 text-yellow-500"; nedocsLabel = "Overcrowded"; }

    return (
        <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard
                    title="Simulated Time"
                    value={`${status.sim_hour || "00"}:00`}
                    icon={Clock}
                    color="bg-purple-500 text-purple-500"
                />
                <StatsCard
                    title="Active Patients"
                    value={status.census ? Object.values(status.census).reduce((a, b) => a + b, 0) : 0}
                    icon={Users}
                    color="bg-blue-500 text-blue-500"
                />
                <StatsCard
                    title="Processed Total"
                    value={status.processed || 0}
                    icon={Activity}
                    color="bg-green-500 text-green-500"
                />
                <StatsCard
                    title="Avg LOS (Last 150)"
                    value={`${status.avg_los || 0} h`}
                    icon={Clock}
                    color="bg-pink-500 text-pink-500"
                    subtext="Simulated Time (Moving Avg)"
                />
                <StatsCard
                    title="LWBS (Walk-Away)"
                    value={status.lwbs || 0}
                    icon={AlertCircle}
                    color="bg-orange-500 text-orange-500"
                    subtext="Left due to wait times"
                />
                <StatsCard
                    title="NEDOCS Score"
                    value={nedocs}
                    subtext={nedocsLabel}
                    icon={AlertTriangle}
                    color={nedocsColor}
                />
            </div>

            <BreathingCurve history={status.history} />
        </div>
    );
}
