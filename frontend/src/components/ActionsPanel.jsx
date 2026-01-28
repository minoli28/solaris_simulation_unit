import React from 'react';
import { ClipboardCheck, AlertTriangle, ArrowRightCircle } from 'lucide-react';

export default function ActionsPanel({ status }) {
    if (!status || !status.census) return null;

    const suggestions = [];
    const nedocs = status.nedocs || 1;
    const boarding = (status.patients || []).filter(p => p.stage === 'BOARDING').length;
    const lwbsRate = status.processed ? ((status.lwbs / status.processed) * 100) : 0;
    const activePatients = Object.values(status.census).reduce((a, b) => a + b, 0);

    // Rule Base
    if (boarding > 5) {
        suggestions.push({
            id: 'board_1',
            text: "Initiate Bed Management Huddle",
            subtext: `Boarding count (${boarding}) exceeds threshold.`,
            priority: 'high'
        });
    }

    if (nedocs >= 5) {
        suggestions.push({
            id: 'surge_1',
            text: "Activate Level 2 Surge Protocol",
            subtext: "NEDOCS indicates severe overcrowding.",
            priority: 'critical'
        });
    } else if (nedocs >= 4) {
        suggestions.push({
            id: 'surge_2',
            text: "Review waiting room for fast-track candidates",
            subtext: "Crowding logic triggered.",
            priority: 'medium'
        });
    }

    if (activePatients > 300) { // Arbitrary high number
        suggestions.push({
            id: 'staff_1',
            text: "Call in backup nursing staff",
            subtext: "Census exceeds safe staffing ratios.",
            priority: 'high'
        });
    }

    // Add logic for High Risk Delays if passed properly, or simplistic check
    // We can filter `status.patients` here too.
    const riskyCtas1 = (status.patients || []).filter(p => p.assigned_ctas === 1 && p.status === 'WAITING' && p.wait_time_remaining > 10).length;
    if (riskyCtas1 > 0) {
        suggestions.push({
            id: 'safety_1',
            text: `Immediate Assess: ${riskyCtas1} CTAS 1 Patient(s) Waiting`,
            subtext: "Prioritize over all other tasks.",
            priority: 'critical'
        });
    }

    if (suggestions.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mt-6">
                <div className="flex items-center text-green-600 dark:text-green-500">
                    <ClipboardCheck className="w-5 h-5 mr-2" />
                    <span className="font-bold">No High-Priority Actions Required</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mt-6 mb-8 transition-colors duration-300">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center">
                <ClipboardCheck className="w-5 h-5 mr-2 text-blue-500" />
                Recommended Actions
            </h3>
            <div className="space-y-2">
                {suggestions.map(action => (
                    <div
                        key={action.id}
                        className={`p-3 rounded border flex items-start justify-between
                            ${action.priority === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                action.priority === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                                    'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}
                        `}
                    >
                        <div>
                            <p className={`font-bold text-sm ${action.priority === 'critical' ? 'text-red-700 dark:text-red-300' : action.priority === 'high' ? 'text-orange-700 dark:text-orange-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                {action.text}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action.subtext}</p>
                        </div>
                        {action.priority === 'critical' && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
                        {action.priority !== 'critical' && <ArrowRightCircle className="w-5 h-5 text-slate-400" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
