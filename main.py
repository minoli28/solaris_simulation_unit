
# main.py
import asyncio
from typing import Dict
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from engine_sim import SimulationEngine
from data_seeds import FACILITIES

app = FastAPI(title="Solaris-ClearAE Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Multi-Tenant Session Store
# Format: { "session_id": SimulationEngine() }
active_sessions: Dict[str, SimulationEngine] = {}

def get_or_create_session(session_id: str) -> SimulationEngine:
    if session_id not in active_sessions:
        print(f"[SYSTEM] Creating new session: {session_id}")
        active_sessions[session_id] = SimulationEngine()
    return active_sessions[session_id]

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_simulation())

async def run_simulation():
    print("Starting Multi-Tenant Simulation Loop...")
    while True:
        # Tick all active sessions
        # We use list() to avoid runtime error if dict changes size during iteration
        for session_id in list(active_sessions.keys()):
            try:
                active_sessions[session_id].tick()
            except Exception as e:
                print(f"Error in session {session_id}: {e}")
        
        await asyncio.sleep(0.1) # 1 tick = 0.1s

@app.get("/status")
def get_status(session_id: str = Query(..., description="Unique Session ID")):
    sim = get_or_create_session(session_id)
    vitals = sim._get_vitals() 
    return {
        **vitals,
        "total_alerts": len(sim.alerts)
    }

@app.get("/alerts")
def get_alerts(session_id: str = Query(..., description="Unique Session ID")):
    sim = get_or_create_session(session_id)
    return sim.alerts

@app.get("/facilities")
def get_facilities(session_id: str = Query(..., description="Unique Session ID")):
    sim = get_or_create_session(session_id)
    
    census = {}
    for enc in sim.active_encounters.values():
        census[enc.facility_id] = census.get(enc.facility_id, 0) + 1
    
    response = []
    for fac in FACILITIES:
        fac_copy = fac.copy()
        fac_copy["current_census"] = census.get(fac["id"], 0)
        response.append(fac_copy)
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
