
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatsPanel from './StatsPanel';
import FacilityMap from './FacilityMap';
import AlertStream from './AlertStream';
import PatientBoard from './PatientBoard';

export default function Dashboard() {
    const [status, setStatus] = useState({});
    const [facilities, setFacilities] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [session, setSession] = useState(localStorage.getItem('solar_session_id') || null);
    const [tempName, setTempName] = useState("");

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
                axios.get(`http://localhost:8000/status?session_id=${session}`),
                axios.get(`http://localhost:8000/facilities?session_id=${session}`),
                axios.get(`http://localhost:8000/alerts?session_id=${session}`)
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

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 w-full max-w-md text-center">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                        SOLARIS <span className="text-blue-500">LOGIN</span>
                    </h1>
                    <p className="text-slate-400 mb-6">Enter a unique Team member Name to start your simulation session.</p>
                    <p className="text-slate-400 mb-6">Select your team profile to start simulation.</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {["Solaris", "Oli", "Makenna", "JL", "Langyue", "Zuhair", "Vishar"].map((name) => (
                            <button
                                key={name}
                                onClick={() => {
                                    const newSession = name.toLowerCase();
                                    localStorage.setItem('solar_session_id', newSession);
                                    setSession(newSession);
                                }}
                                className="bg-slate-700 hover:bg-blue-600 text-white font-bold py-3 rounded transition-colors border border-slate-600"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                        <p className="text-xs text-slate-500 mb-2">Or enter custom name:</p>
                        <form onSubmit={handleLogin} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                placeholder="Custom Name"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                            />
                            <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-4 rounded transition-colors">
                                GO
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">
                        SOLARIS <span className="text-blue-500">CLINICAL INTELLIGENCE</span>
                    </h1>
                    <p className="text-slate-400 mt-2">Real-time GTA Hospital Simulation & Safety Monitoring</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Session Active</div>
                    <div className="text-xl font-mono text-green-400 font-bold">{session}</div>
                    <button
                        onClick={() => { localStorage.removeItem('solar_session_id'); window.location.reload(); }}
                        className="text-xs text-red-500 hover:text-red-400 underline mt-1"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <StatsPanel status={status} />

            <div className="mt-8 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Live Patient Stream</h2>
                <PatientBoard patients={status.patients || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Facility Status Map</h2>
                    <FacilityMap facilities={facilities} />
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Intelligence Alerts</h2>
                    <AlertStream alerts={alerts} />
                </div>
            </div>
        </div>
    );
}
