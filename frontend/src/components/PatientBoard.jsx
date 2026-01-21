import React from 'react';

const FACILITIES = [
    { id: 'SBK', name: 'Sunnybrook' },
    { id: 'UHN-TGH', name: 'Toronto Gen' },
    { id: 'SMH', name: 'St. Michaels' },
    { id: 'NYGH', name: 'North York' },
    { id: 'MSH', name: 'Mount Sinai' },
];

const PatientBoard = ({ patients }) => {
    // Helper to color code statuses
    const getStatusColor = (p) => {
        if (p.status === 'LWBS') return 'bg-red-900/30 border-red-500 text-red-200';
        if (p.status === 'DISCHARGED') return 'bg-green-900/30 border-green-500 text-green-200';
        if (p.disposition === 'ADMIT') return 'bg-purple-900/30 border-purple-500 text-purple-200';
        if (p.status === 'ROOMED') return 'bg-blue-900/30 border-blue-500 text-blue-200';
        if (p.status === 'ADMITTED_NO_BED') return 'bg-orange-900/30 border-orange-500 text-orange-200'; // Hallway
        if (p.status === 'WAITING_FOR_RESULTS') return 'bg-teal-900/30 border-teal-500 text-teal-200'; // Internal Wait
        return 'bg-yellow-900/30 border-yellow-500 text-yellow-200'; // Waiting
    };

    const getStageLabel = (p) => {
        if (p.status === 'LWBS') return 'WALKED AWAY';
        if (p.status === 'DISCHARGED') return p.stage === 'HOME' ? 'DISCHARGED' : 'ADMITTED TO WARD';
        if (p.status === 'WAITING_FOR_RESULTS') return 'WAITING FOR RESULTS';
        if (p.stage) return p.stage;
        return p.status;
    };

    return (
        <div className="grid grid-cols-5 gap-4 h-[850px] overflow-hidden">
            {FACILITIES.map((fac) => {
                // Filter patients for this facility
                // Sort: Active first, then by Arrival? For now just reverse id (proxy for time)
                const facPatients = patients
                    .filter((p) => p.facility_id === fac.id)
                    .sort((a, b) => (a.ttl === -1 ? -1 : 1)); // Active on top

                return (
                    <div key={fac.id} className="flex flex-col bg-gray-900/50 rounded-lg border border-gray-700 h-full">
                        <div className="p-2 border-b border-gray-700 bg-gray-800 text-center font-bold text-gray-300 text-xs uppercase tracking-wider">
                            {fac.id}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
                            {facPatients.length === 0 && (
                                <div className="text-gray-600 text-xs text-center py-4">No Active Patients</div>
                            )}
                            {facPatients.map((p) => (
                                <div
                                    key={p.id}
                                    className={`p-2 rounded border text-xs relative ${getStatusColor(p)} ${p.ttl > 0 ? 'opacity-70' : 'opacity-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-mono font-bold">P-{p.id.slice(-4)}</span>
                                        <div className="flex space-x-1">
                                            {p.resource_type && p.resource_type !== "NONE" && p.resource_type !== "null" && (
                                                <span className="font-bold bg-white/20 px-1 rounded text-[9px]">{p.resource_type}</span>
                                            )}
                                            <span className="font-bold bg-black/40 px-1 rounded">CTAS {p.assigned_ctas}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] uppercase font-semibold tracking-tight opacity-90">
                                        {getStageLabel(p)}
                                    </div>
                                    {p.disposition && p.status !== 'LWBS' && p.status !== 'DISCHARGED' && (
                                        <div className="text-[9px] mt-1 italic opacity-75">
                                            Plan: {p.disposition}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PatientBoard;
