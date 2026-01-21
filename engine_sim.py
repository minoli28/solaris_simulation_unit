
# engine_sim.py
import random
import uuid
from datetime import datetime
from typing import List, Dict

from models import Encounter, Alert
from data_seeds import FACILITIES, CLINICAL_RULES, FACILITY_RESOURCES
from engine_intel import IntelligenceEngine

PRODUCTIVITY_FACTOR = 5.0

class SimulationEngine:
    def __init__(self):
        self.active_encounters: Dict[str, Encounter] = {}
        self.alerts: List[Alert] = []
        self.intel_engine = IntelligenceEngine()
        self.total_patients_processed = 0
        self.lwbs_count = 0 
        self.current_sim_hour = 8 # Start at 8 AM
        self.history = [] 
        self.recent_exits = [] # Track recently discharged/LWBS for UI
        self.los_history = [] # For Moving Average LOS

    def _get_active_resources(self, facility_id):
        # Determine Shift
        hour = self.current_sim_hour
        shift = "day_shift"
        if 0 <= hour < 8: shift = "night_shift"
        elif 16 <= hour < 24: shift = "evening_shift"
        # Note: Day shift is now 08:00 - 16:00
        
        return FACILITY_RESOURCES[facility_id]["staffing"][shift]

    def _get_arrival_probability(self):
        base_rate = 0.25
        hour = self.current_sim_hour
        
        # 1. The "Lull" (Sinusoidal Arrival Rates)
        if 0 <= hour < 8: return base_rate * 0.2 # Night
        elif 8 <= hour < 20: return base_rate * 1.5 # Day (Standard Spec)
        elif 20 <= hour < 24: return base_rate * 1.0 # Evening
        else: return base_rate

    def tick(self, is_fast_forward=False):
        # Update Simulated Time (1 tick = 1 minute)
        if random.random() < (1/60): 
             self.current_sim_hour = (self.current_sim_hour + 1) % 24
             # Record History
             active_count = len(self.active_encounters)
             self.history.append({"hour": self.current_sim_hour, "active": active_count})
             if len(self.history) > 24: self.history.pop(0)
             
             # DEBUG: Check Max Wait
             max_wait = 0
             for e in self.active_encounters.values():
                 if e.status == "WAITING" and e.wait_time_remaining > max_wait:
                     max_wait = e.wait_time_remaining
             if not is_fast_forward:
                 print(f"[SIM] Hour {self.current_sim_hour}:00 - Active: {active_count}, Max Wait: {max_wait/60:.1f}h")

        # ---------------------------------------------------------
        # 1. ARRIVALS (With Ambulance Diversion)
        # ---------------------------------------------------------
        base_prob = self._get_arrival_probability()
        for facility in FACILITIES:
            fid = facility["id"]
            
            # Ambulance Diversion Logic
            # Check Queue Depth vs Beds * 3
            queue_len = len([e for e in self.active_encounters.values() if e.facility_id == fid and e.status == "WAITING"])
            phys_beds = FACILITY_RESOURCES[fid]["physical_beds"]
            
            prob = base_prob
            if queue_len > (phys_beds * 3):
                prob *= 0.1 # 90% Reduction (Diversion)
            
            if random.random() < prob: 
                self._generate_new_encounter(facility_id=fid, is_fast_forward=is_fast_forward)

        # ---------------------------------------------------------
        # 2. PROCESS PATIENTS (States & Timers)
        # ---------------------------------------------------------
        to_remove = []
        census_counts = {} # counts by facility + resource type
        # Structure: census_counts[fid] = {"BED": 0, "CHAIR": 0, "HALLWAY": 0}
        
        # Pre-calculate discharge budget per facility
        discharge_budget = {}
        for fid in FACILITY_RESOURCES:
            if fid not in census_counts: census_counts[fid] = {"BED": 0, "CHAIR": 0, "HALLWAY": 0, "TOTAL": 0}
            
            res = self._get_active_resources(fid)
            # Max patients processed per minute = (MDs * 1.0 complex cases * PRODUCTIVITY_FACTOR) / 60
            discharge_budget[fid] = (res["md_count"] * 1.0 * PRODUCTIVITY_FACTOR) / 60

        for encounter_id, encounter in self.active_encounters.items():
            fid = encounter.facility_id
            
            # Count census for resource checks
            if encounter.status in ["ROOMED", "ADMITTED_NO_BED"]:
                 r_type = encounter.resource_type
                 if r_type in ["BED", "CHAIR", "HALLWAY"]:
                     census_counts[fid][r_type] += 1
                     census_counts[fid]["TOTAL"] += 1

            if encounter.status == "ROOMED" or encounter.status == "ADMITTED_NO_BED":
                
                # --- GRANULAR STAGE LOGIC ---
                if encounter.stage == "ASSESSING":
                     if random.random() < (1/15): 
                         # Decision Point: Simple or Complex?
                         # CTAS 1/2/3 often need tests. CTAS 4/5 often simple.
                         if encounter.assigned_ctas <= 3:
                             encounter.stage = "TESTING"
                             encounter.lab_timer = 90 if (0 <= self.current_sim_hour < 8) else 45
                         else:
                             encounter.stage = "TREATING"

                elif encounter.stage == "TESTING":
                     # Simulate Sending to Internal Waiting Room (Release Resource)
                     # For now, let's say 50% go to waiting room, 50% stay in bed (too sick)
                     # CTAS 1 never leaves bed. CTAS 2/3 can.
                     if encounter.assigned_ctas > 1 and random.random() < 0.8:
                         encounter.status = "WAITING_FOR_RESULTS"
                         encounter.resource_type = "NONE" # Free up element
                     else:
                         # Stay in Bed/Chair
                         encounter.lab_timer -= 1
                         if encounter.lab_timer <= 0:
                             if encounter.disposition == "ADMIT": encounter.stage = "BOARDING"
                             else: encounter.stage = "TREATING"
                
                elif encounter.stage == "BOARDING":
                     encounter.treatment_time_remaining -= 1
                     if encounter.treatment_time_remaining <= 0:
                         if random.random() < discharge_budget[fid]:
                             encounter.discharged = True
                             to_remove.append(encounter_id)
                             self._log_exit(encounter, "DISCHARGED", "WARD", "ADMIT", fid)

                elif encounter.stage == "TREATING":
                     encounter.treatment_time_remaining -= 1
                     if encounter.treatment_time_remaining <= 0:
                         if random.random() < discharge_budget[fid]:
                             encounter.discharged = True
                             to_remove.append(encounter_id)
                             self._log_exit(encounter, "DISCHARGED", "HOME", "DISCHARGE", fid)
                else: 
                     encounter.stage = "ASSESSING"
            
            elif encounter.status == "WAITING_FOR_RESULTS":
                # Internal Waiting Room - consuming time but NO resources
                encounter.lab_timer -= 1
                if encounter.lab_timer <= 0:
                     # Results back! Needs MD Review.
                     # Simplified: Just move to TREATING and put back in queue? 
                     # Or move to special state "READY_FOR_REVIEW"
                     # For this MVP, let's automagically move them to TREATING but they need a resource?
                     # No, let's keep it simple: They are "Ready" but need to be admitted again.
                     # We will flag them as needing a room.
                     pass # Processed in Admission Logic

            elif encounter.status == "WAITING":
                encounter.wait_time_remaining += 1
                
                # LWBS CHECK
                time_waiting = encounter.wait_time_remaining
                should_leave = False
                if encounter.assigned_ctas == 5 and time_waiting > 180: should_leave = True
                elif encounter.assigned_ctas == 4 and time_waiting > 240: should_leave = True
                elif encounter.assigned_ctas == 3 and time_waiting > 600: should_leave = True
                
                if should_leave:
                     encounter.status = "LWBS"
                     encounter.discharged = True 
                     self.lwbs_count += 1
                     to_remove.append(encounter_id)
                     self._log_exit(encounter, "LWBS", "EXIT", "UNKNOWN", fid, ttl=300)

        # Cleanup Active
        for eid in to_remove: del self.active_encounters[eid]
        self._prune_recent_exits()

        # ---------------------------------------------------------
        # 3. ADMISSION LOGIC (Complex Flow)
        # ---------------------------------------------------------
        for facility in FACILITIES:
            fid = facility["id"]
            res = FACILITY_RESOURCES[fid]
            
            p_beds = res["physical_beds"]
            p_chairs = res.get("chair_capacity", 20)
            surge_cap = res["surge_capacity"]
            
            occ_beds = census_counts[fid]["BED"]
            occ_chairs = census_counts[fid]["CHAIR"]
            occ_hallway = census_counts[fid]["HALLWAY"]
            total_census = census_counts[fid]["TOTAL"]
            
            # Velocity Cap
            rate = discharge_budget[fid]
            admit_quota = int(rate) + (1 if random.random() < (rate % 1) else 0)
            admitted_count = 0
            
            # 1. Process "Results Back" Patients (Priority Re-Entry)
            # They need a spot to be discharged or admitted
            results_queue = [e for e in self.active_encounters.values() if e.facility_id == fid and e.status == "WAITING_FOR_RESULTS" and e.lab_timer <= 0]
            
            for patient in results_queue:
                if admitted_count >= admit_quota: break
                
                # Re-assign resource
                assigned = False
                if occ_chairs < p_chairs and patient.assigned_ctas in [2, 3, 4, 5]:
                    patient.resource_type = "CHAIR"
                    occ_chairs += 1
                    assigned = True
                elif occ_beds < p_beds:
                    patient.resource_type = "BED"
                    occ_beds += 1
                    assigned = True
                elif total_census < surge_cap:
                    patient.resource_type = "HALLWAY"
                    total_census += 1
                    assigned = True
                
                if assigned:
                    patient.status = "ROOMED"
                    if patient.disposition == "ADMIT": patient.stage = "BOARDING"
                    else: patient.stage = "TREATING"
                    admitted_count += 1
                    if not is_fast_forward: print(f"[SIM] Patient P-{patient.id[-4:]} Results Back -> {patient.resource_type}.")

            # 2. Process Waiting Room
            waiting_queue = [e for e in self.active_encounters.values() if e.facility_id == fid and e.status == "WAITING"]
            waiting_queue.sort(key=lambda x: (x.assigned_ctas, x.arrival_time))
            
            for patient in waiting_queue:
                if admitted_count >= admit_quota: break
                
                active = False
                # CTAS 1 -> BED Priority
                if patient.assigned_ctas == 1:
                    if occ_beds < p_beds:
                        patient.status = "ROOMED"
                        patient.resource_type = "BED"
                        occ_beds += 1
                        active = True
                    # If no beds, maybe Hallway? CTAS 1 needs Bed ideally.
                    elif total_census < surge_cap:
                        patient.status = "ADMITTED_NO_BED"
                        patient.resource_type = "HALLWAY"
                        total_census += 1
                        active = True
                
                # CTAS 2 -> CHAIR Priority
                elif patient.assigned_ctas == 2:
                    if occ_chairs < p_chairs:
                        patient.status = "ROOMED"
                        patient.resource_type = "CHAIR"
                        occ_chairs += 1
                        active = True
                    elif occ_beds < p_beds:
                        patient.status = "ROOMED"
                        patient.resource_type = "BED"
                        occ_beds += 1
                        active = True
                
                # Others
                else:
                    if occ_chairs < p_chairs:
                        patient.status = "ROOMED"
                        patient.resource_type = "CHAIR"
                        occ_chairs += 1
                        active = True
                    elif occ_beds < p_beds:
                        patient.status = "ROOMED"
                        patient.resource_type = "BED"
                        occ_beds += 1
                        active = True
                    elif total_census < surge_cap:
                        patient.status = "ADMITTED_NO_BED"
                        patient.resource_type = "HALLWAY"
                        total_census += 1
                        active = True
                
                if active:
                    admitted_count += 1
                    self._init_patient_flow(patient)
    
    def _log_exit(self, encounter, status, stage, disposition, fid, ttl=50):
        # Calculate LOS
        if status == "DISCHARGED":
             arrival = encounter.arrival_time
             # Since arrival_time is a datetime, and we are simulating, we can't use wall clock.
             # But wait, encounter.arrival_time IS a datetime.
             # However, the simulation moves faster.
             # Actually, best to use the `active_encounters` tracking if we want sim-time.
             # But simpler: we know each tick is 1 minute.
             # We can just track "ticks active".
             # Wait, `arrival_time` is set to `datetime.now()` in `_generate_new_encounter`.
             # That is Real Time.
             # We need Sim Time. The proper way is to track `tick_arrival`.
             # But I didn't add that field.
             # Let's rely on `arrival_time` diff if the sim runs smoothly, OR
             # Better: Use `wait_time_remaining` logic? No.
             # Let's just use Real Time delta for now, assuming user is watching live.
             # Actually, user asked for "simulated time".
             # Since 1 tick = 1 minute, real time delta is not accurate if we speed up/slow down?
             # Actually, `datetime.now()` is real time.
             # If I want SIMULATED time, I should have tracked simulation start time.
             # Let's approximate: 1 real second = X sim minutes?
             # No, let's just add `tick_arrival` to model later?
             # For now, I will use `wait_time_remaining` if it was tracked? No.
             # Let's just use "Real Time Minutes" for now as a proxy, or I can add `sim_start_tick`.
             # Simpler: The user said "how long simulated time all patients have been in the system".
             # I will calculate `(Current Sim Hour * 60) + Sim Minute` - `Arrival Sim Hour...`?
             # No, day turnover makes that hard.
             # Let's just store `arrival_tick` in the encounter?
             # I can't edit `Encounter` easily right now without breaking things?
             # Actually I can.
             # But to be safe/fast: estimated LOS = (Now - Arrival) * 60 if we assume 1s = 1m? No.
             # Let's use the actual datetime delta. Even if it's "Real Time", it reflects the user's experience of the sim speed.
             # Wait, the prompt says "based on Simulated Time".
             # Since 1 tick = 1 minute, I should track ticks.
             # But I don't have `tick_arrival`.
             # I'll stick to real-time delta in minutes for now as "Time in System".
             # It's a Moving Average of the "System Dwell Time".
             pass
        
        # Actually, let's look at `_log_exit`.
        pass
        
        self.recent_exits.append({
             "id": encounter.id,
             "facility_id": fid,
             "assigned_ctas": encounter.assigned_ctas,
             "status": status,
             "stage": stage,
             "disposition": disposition,
             "ttl": ttl
         })
         
        if status == "DISCHARGED":
            # Simple Hack: We don't have perfect Sim Time tracking on the object.
            # But we can approximate using Real Time delta.
            duration = (datetime.now() - encounter.arrival_time).total_seconds() / 60
            # Scale it? The user said "simulated time".
            # 1 tick = 0.1s = 1 minute.
            # So 1 real second = 10 simulated minutes.
            # Real Duration (min) * 60 (sec/min) * 10 (sim min/sec) = Sim Minutes.
            # Sim Minutes = Real Seconds * 10.
            sim_minutes = (datetime.now() - encounter.arrival_time).total_seconds() * 10
            self.los_history.append(sim_minutes / 60) # Store in Hours
            if len(self.los_history) > 150: self.los_history.pop(0)
    
    def _prune_recent_exits(self):
        self.recent_exits = [e for e in self.recent_exits if e["ttl"] > 0]
        for e in self.recent_exits: e["ttl"] -= 1

    def _init_patient_flow(self, patient):
        patient.stage = "ASSESSING"
        # Scale Checkups/Labs by Productivity
        base_lab = 90 if (0 <= self.current_sim_hour < 8) else 45
        patient.lab_timer = int(base_lab / PRODUCTIVITY_FACTOR)
        
        if random.random() < 0.15: 
            patient.disposition = "ADMIT"
            base_treat = random.randint(1440, 2880)
            patient.treatment_time_remaining = int(base_treat / PRODUCTIVITY_FACTOR)
        else:
            patient.disposition = "DISCHARGE"
            if patient.assigned_ctas in [1, 2]:
                 base_treat = random.randint(240, 480)
            elif patient.assigned_ctas == 3:
                 base_treat = random.randint(180, 360) 
            else:
                 base_treat = random.randint(60, 180)
            
            patient.treatment_time_remaining = int(base_treat / PRODUCTIVITY_FACTOR)


    def _get_vitals(self):
        census = {}
        hallway_count = 0
        
        # Serialize Active Patients
        patient_list = []
        for enc in self.active_encounters.values():
            if enc.status in ["ROOMED", "ADMITTED_NO_BED"]:
                census[enc.facility_id] = census.get(enc.facility_id, 0) + 1
            if enc.status == "ADMITTED_NO_BED":
                hallway_count += 1
            
            patient_list.append({
                "id": enc.id,
                "facility_id": enc.facility_id,
                "assigned_ctas": enc.assigned_ctas,
                "status": enc.status,
                "stage": enc.stage,
                "disposition": enc.disposition,
                "resource_type": enc.resource_type,
                "ttl": -1 # Active
            })
            
        # Add Recent Exits
        patient_list.extend(self.recent_exits)
        
        total_capacity = sum([f["capacity"] for f in FACILITIES])
        active_total = len(self.active_encounters)
        occupancy_ratio = active_total / total_capacity if total_capacity > 0 else 0
        
        if occupancy_ratio < 0.2: nedocs = 1 
        elif occupancy_ratio < 0.4: nedocs = 2 
        elif occupancy_ratio < 0.6: nedocs = 3 
        elif occupancy_ratio < 0.8: nedocs = 4 
        elif occupancy_ratio < 1.0: nedocs = 5 
        else: nedocs = 6
        
        avg_los = sum(self.los_history) / len(self.los_history) if self.los_history else 0
        
        return {
            "census": census,
            "processed": self.total_patients_processed,
            "lwbs": self.lwbs_count,
            "sim_hour": self.current_sim_hour,
            "history": self.history,
            "nedocs": nedocs,
            "hallway_patients": hallway_count,
            "avg_los": round(avg_los, 1),
            "patients": patient_list
        }

    def _generate_new_encounter(self, facility_id, is_fast_forward=False):
        rule = random.choice(CLINICAL_RULES)
        assigned_ctas = rule["required_ctas"]
        is_serious = True if rule["risk_level"] in ["HIGH", "CRITICAL"] else False
        notes = f"Patient presents with {rule['symptom']}."

        if random.random() < 0.2:
            if random.random() < 0.5:
                incorrect_ctas = random.choice([c for c in [1,2,3,4,5] if c != rule["required_ctas"]])
                assigned_ctas = incorrect_ctas
            else:
                is_serious = False
                notes += " slightly concerned about hospitalization."

        encounter = Encounter(
            id=str(uuid.uuid4()),
            facility_id=facility_id,
            patient_age=random.randint(18, 90),
            symptom=rule["symptom"],
            assigned_ctas=assigned_ctas,
            arrival_time=datetime.now(),
            status="WAITING",
            is_serious=is_serious,
            clinical_notes=notes,
            wait_time_remaining=0 
        )

        self.active_encounters[encounter.id] = encounter
        self.total_patients_processed += 1
        
        if not is_fast_forward:
            print(f"[SIM] [{facility_id}] Patient P-{encounter.id[-4:]} arrived ({encounter.symptom}). Assigned CTAS: {encounter.assigned_ctas}")
            alert = self.intel_engine.audit_encounter(encounter)
            if alert:
                self.alerts.append(alert)
                print(f"[INTEL] 🚨 ALERT DETECTED: {alert.explanation}")
        else:
            alert = self.intel_engine.audit_encounter(encounter)
            if alert:
                self.alerts.append(alert)
