
import React from 'react';
import { AlertOctagon, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns'; // We might need to handle ISO date manually if date-fns not installed.

const AlertCard = ({ alert }) => {
    const isCritical = ['HIGH', 'CRITICAL'].includes(alert.severity);
    const Icon = isCritical ? AlertOctagon : Info;
    const color = isCritical ? 'text-red-500' : 'text-yellow-500';
    const border = isCritical ? 'border-red-900/50' : 'border-slate-700';
    const bg = isCritical ? 'bg-red-900/10' : 'bg-slate-800';

    return (
        <div className={clsx("p-3 rounded-md border mb-2", border, bg)}>
            <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                    <Icon className={clsx("w-5 h-5 flex-shrink-0 mt-0.5", color)} />
                    <div>
                        <p className="text-sm font-semibold text-slate-200">{alert.rule_violated}</p>
                        <p className="text-xs text-slate-400 mt-1">{alert.explanation}</p>
                    </div>
                </div>
                <span className={clsx("text-xs font-mono px-2 py-0.5 rounded border",
                    isCritical ? "bg-red-900/30 border-red-800 text-red-400" : "bg-yellow-900/30 border-yellow-800 text-yellow-400"
                )}>
                    {alert.severity}
                </span>
            </div>
            <p className="text-right text-[10px] text-slate-500 mt-2">
                {new Date(alert.timestamp).toLocaleTimeString()}
            </p>
        </div>
    );
};

export default function AlertStream({ alerts }) {
    if (alerts.length === 0) {
        return (
            <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
                <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">No active alerts detected.</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 h-[600px] flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Project Solaris Feed
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {[...alerts].reverse().map(alert => (
                    <AlertCard key={alert.id} alert={alert} />
                ))}
            </div>
        </div>
    );
}
