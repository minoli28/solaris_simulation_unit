import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import StatsPanel from './StatsPanel';
import FacilityMap from './FacilityMap';
import AlertStream from './AlertStream';
import PatientBoard from './PatientBoard';
import DriversPanel from './DriversPanel';
import HighRiskPanel from './HighRiskPanel';
import ActionsPanel from './ActionsPanel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard() {
    const [status, setStatus] = useState({});
    const [facilities, setFacilities] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [session, setSession] = useState(localStorage.getItem('solar_session_id') || null);
    const [tempName, setTempName] = useState("");
    const [activeDriver, setActiveDriver] = useState(null);

    const handleLogin = (e) => {
        e.preventDefault();
        if (!tempName) return;
        const newSession = tempName.trim().replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        localStorage.setItem('solar_session_id', newSession);
        setSession(newSession);
    };

    const fetchData = async () => {
        if (!session) return;
        try {
            const [statusRes, facilitiesRes, alertsRes] = await Promise.all([
                axios.get(`${API_URL}/status?session_id=${session}`),
                axios.get(`${API_URL}/facilities?session_id=${session}`),
                axios.get(`${API_URL}/alerts?session_id=${session}`)
            ]);

            setStatus(statusRes.data);
            setFacilities(facilitiesRes.data);
            setAlerts(alertsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        if (session) {
            fetchData();
            const interval = setInterval(fetchData, 1000);
            return () => clearInterval(interval);
        }
    }, [session]);

    // Filter Patients based on Driver Selection
    const filteredPatients = useMemo(() => {
        const pts = status.patients || [];
        if (!activeDriver) return pts;

        return pts.filter(p => {
            // Drivers
            if (activeDriver === 'boarding') return p.stage === 'BOARDING';
            if (activeDriver === 'labs') return p.stage === 'TESTING' || p.status === 'WAITING_FOR_RESULTS';
            if (activeDriver === 'intake') return p.status === 'WAITING';
            if (activeDriver === 'bed_block') return p.status === 'ADMITTED_NO_BED';

            // High Risk
            if (activeDriver === 'risk_ctas1') return p.assigned_ctas === 1 && p.status === 'WAITING' && p.wait_time_remaining > 10;
            if (activeDriver === 'risk_ctas2') return p.assigned_ctas === 2 && p.status === 'WAITING' && p.wait_time_remaining > 30;

            return true;
        });
    }, [status.patients, activeDriver]);

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 w-full max-w-md text-center shadow-lg">
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">
                        SOLARIS <span className="text-blue-500">LOGIN</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Enter a unique Team member Name to start your simulation session.</p>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Select your team profile to start simulation.</p>
                    <div className="mb-6">
                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white text-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center"
                                placeholder="Enter Your Name"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!tempName}
                                className={`w-full py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${tempName ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                                    }`}
                            >
                                Start Simulation
                            </button>
                        </form>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Session ID will be generated from your name.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
            <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        SOLARIS <span className="text-blue-500">CLINICAL INTELLIGENCE</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Real-time GTA Hospital Simulation & Safety Monitoring</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Session Active</div>
                        <div className="text-xl font-mono text-green-600 dark:text-green-400 font-bold">{session}</div>
                        <button
                            onClick={() => { localStorage.removeItem('solar_session_id'); window.location.reload(); }}
                            className="text-xs text-red-500 hover:text-red-400 underline mt-1"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <StatsPanel status={status} />

            <HighRiskPanel
                patients={status.patients || []}
                activeFilter={activeDriver}
                onFilterSelect={setActiveDriver}
            />

            <ActionsPanel status={status} />

            <DriversPanel
                patients={status.patients || []}
                activeDriver={activeDriver}
                onDriverSelect={setActiveDriver}
            />

            <div className="mt-8 mb-8">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                    {activeDriver ? `Patient Stream (Filtered: ${activeDriver.toUpperCase()})` : "Live Patient Stream"}
                </h2>
                <PatientBoard patients={filteredPatients} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Facility Status Map</h2>
                    <FacilityMap facilities={facilities} />
                </div>

                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Intelligence Alerts</h2>
                    <AlertStream alerts={alerts} />
                </div>
            </div>
        </div>
    );
}
