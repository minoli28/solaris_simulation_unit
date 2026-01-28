import React from 'react';
import { Truck, Beaker, Users, AlertOctagon, ArrowRight } from 'lucide-react';

const DriverCard = ({ title, count, icon: Icon, color, onClick, isActive }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-slate-800 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg group
            ${isActive
                ? 'border-blue-500 ring-1 ring-blue-500 bg-slate-50 dark:bg-slate-750'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
        `}
    >
        <div className="flex justify-between items-start">
            <div className={`p-2 rounded-lg bg-opacity-20 ${color}`}>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div className={`text-2xl font-bold ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                {count}
            </div>
        </div>
        <div className="mt-3">
            <h4 className="text-slate-600 dark:text-slate-300 text-sm font-medium">{title}</h4>
            <div className="flex items-center mt-1 text-xs text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                <span>View Patients</span>
                <ArrowRight className="w-3 h-3 ml-1" />
            </div>
        </div>
    </div>
);

export default function DriversPanel({ patients = [], activeDriver, onDriverSelect }) {

    // Calculate Drivers
    const drivers = {
        boarding: patients.filter(p => p.stage === 'BOARDING').length,
        labs: patients.filter(p => p.stage === 'TESTING' || p.status === 'WAITING_FOR_RESULTS').length,
        intake: patients.filter(p => p.status === 'WAITING').length,
        bed_block: patients.filter(p => p.status === 'ADMITTED_NO_BED').length
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Bottleneck Drivers</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Click a driver to filter the patient stream</p>
                </div>
                {activeDriver && (
                    <button
                        onClick={() => onDriverSelect(null)}
                        className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline"
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DriverCard
                    title="Admit Boarding"
                    count={drivers.boarding}
                    icon={Truck}
                    color="bg-red-500 text-red-500"
                    isActive={activeDriver === 'boarding'}
                    onClick={() => onDriverSelect(activeDriver === 'boarding' ? null : 'boarding')}
                />
                <DriverCard
                    title="Imaging/Labs Delay"
                    count={drivers.labs}
                    icon={Beaker}
                    color="bg-yellow-500 text-yellow-500"
                    isActive={activeDriver === 'labs'}
                    onClick={() => onDriverSelect(activeDriver === 'labs' ? null : 'labs')}
                />
                <DriverCard
                    title="Intake Backlog"
                    count={drivers.intake}
                    icon={Users}
                    color="bg-orange-500 text-orange-500"
                    isActive={activeDriver === 'intake'}
                    onClick={() => onDriverSelect(activeDriver === 'intake' ? null : 'intake')}
                />
                <DriverCard
                    title="Bed Blocked (Hallway)"
                    count={drivers.bed_block}
                    icon={AlertOctagon}
                    color="bg-purple-500 text-purple-500"
                    isActive={activeDriver === 'bed_block'}
                    onClick={() => onDriverSelect(activeDriver === 'bed_block' ? null : 'bed_block')}
                />
            </div>
        </div>
    );
}
