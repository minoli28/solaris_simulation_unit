
import React from 'react';
import { Building2, User } from 'lucide-react';
import clsx from 'clsx';

const FacilityCard = ({ facility }) => {
    const percentage = Math.min(100, Math.round((facility.current_census / facility.capacity) * 100));

    // Color based on occupancy
    const barColor = clsx({
        'bg-green-500': percentage < 70,
        'bg-yellow-500': percentage >= 70 && percentage < 90,
        'bg-red-500': percentage >= 90
    });

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md transition-colors duration-300">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <h3 className="font-bold text-slate-800 dark:text-white">{facility.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 ml-6">{facility.id}</p>
                </div>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                    {facility.current_census} / {facility.capacity}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                <div
                    className={`h-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-right text-xs text-slate-400 mt-1">{percentage}% Full</p>
        </div>
    );
};

export default function FacilityMap({ facilities }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map(fac => (
                <FacilityCard key={fac.id} facility={fac} />
            ))}
        </div>
    );
}
