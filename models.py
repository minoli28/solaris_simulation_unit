
# models.py
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class Encounter(BaseModel):
    id: str
    facility_id: str
    patient_age: int
    symptom: str
    assigned_ctas: int
    arrival_time: datetime
    status: Literal["WAITING", "ROOMED", "WAITING_FOR_RESULTS", "ADMITTED_NO_BED", "LWBS", "DISCHARGED"] = "WAITING"
    resource_type: Literal["NONE", "BED", "CHAIR", "HALLWAY"] = "NONE"
    disposition: Optional[Literal["ADMIT", "DISCHARGE"]] = None
    stage: Optional[Literal["TRIAGE", "ASSESSING", "TESTING", "TREATING", "BOARDING"]] = "TRIAGE"
    lab_timer: int = 0
    is_serious: bool
    clinical_notes: str
    wait_time_remaining: int  # Added to track simulation progress
    treatment_time_remaining: int = 60 # Default treatment time (mins)
    discharged: bool = False

class Alert(BaseModel):
    id: str
    encounter_id: str
    rule_violated: str
    severity: str
    timestamp: datetime
    explanation: str
