import React from 'react';
import { AlertOctagon, Clock, ChevronRight } from 'lucide-react';

const RiskCard = ({ title, count, maxWait, threshold, onClick, isActive }) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 flex justify-between items-center group
        ${isActive
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 ring-1 ring-red-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-400 hover:shadow-md'}
        `}
    >
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isActive ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200' : 'bg-red-100 dark:bg-slate-700 text-red-500 dark:text-slate-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-500'}`}>
                <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-lg">{title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Threshold: {threshold}m
                    </span>
                    {maxWait > 0 && (
                        <span className="font-medium text-red-500 dark:text-red-400">Max Wait: {maxWait}m</span>
                    )}
                </div>
            </div>
        </div>

        <div className="text-right">
            <div className={`text-3xl font-extrabold leading-none ${count > 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-300 dark:text-slate-600'}`}>
                {count}
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Patients</p>
        </div>
    </div>
);

export default function HighRiskPanel({ patients = [], activeFilter, onFilterSelect }) {
    // Logic: CTAS 1 > 10 min, CTAS 2 > 30 min (Example thresholds)
    // "wait_time_remaining" tracks MINUTES waiting.

    // CTAS 1 Analysis
    const ctas1_threshold = 10;
    const ctas1_risks = patients.filter(p => p.assigned_ctas === 1 && p.status === 'WAITING' && p.wait_time_remaining > ctas1_threshold);
    const ctas1_max = Math.max(0, ...ctas1_risks.map(p => p.wait_time_remaining));

    // CTAS 2 Analysis
    const ctas2_threshold = 30;
    const ctas2_risks = patients.filter(p => p.assigned_ctas === 2 && p.status === 'WAITING' && p.wait_time_remaining > ctas2_threshold);
    const ctas2_max = Math.max(0, ...ctas2_risks.map(p => p.wait_time_remaining));

    const totalRisks = ctas1_risks.length + ctas2_risks.length;

    if (totalRisks === 0) return null; // Hide if no risks? Or show empty state? User said "flags patients...". Keeping it visible but maybe subtle if 0? 
    // Actually, let's always show it if it's a key panel, or maybe only if counts > 0 to save space?
    // User said "Add a High-risk delays panel". Better to show consistently.

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-red-500 rounded-full"></div>
                Patient Safety: High Risk Delays
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RiskCard
                    title="CTAS 1 Critical Delay"
                    count={ctas1_risks.length}
                    maxWait={ctas1_max}
                    threshold={ctas1_threshold}
                    isActive={activeFilter === 'risk_ctas1'}
                    onClick={() => onFilterSelect(activeFilter === 'risk_ctas1' ? null : 'risk_ctas1')}
                />
                <RiskCard
                    title="CTAS 2 Serious Delay"
                    count={ctas2_risks.length}
                    maxWait={ctas2_max}
                    threshold={ctas2_threshold}
                    isActive={activeFilter === 'risk_ctas2'}
                    onClick={() => onFilterSelect(activeFilter === 'risk_ctas2' ? null : 'risk_ctas2')}
                />
            </div>
        </div>
    );
}
