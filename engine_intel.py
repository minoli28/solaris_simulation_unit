
# engine_intel.py
import uuid
from datetime import datetime
from typing import Optional
from models import Encounter, Alert
from data_seeds import CLINICAL_RULES, SAFETY_KEYWORDS

class IntelligenceEngine:
    def __init__(self):
        self.respiratory_history = []

    def audit_encounter(self, encounter: Encounter) -> Optional[Alert]:
        # 1. Check Clinical Rules (CTAS mismatch)
        for rule in CLINICAL_RULES:
            if rule["symptom"] == encounter.symptom:
                if encounter.assigned_ctas != rule["required_ctas"]:
                    return Alert(
                        id=str(uuid.uuid4()),
                        encounter_id=encounter.id,
                        rule_violated=rule["rule_id"],
                        severity=rule["risk_level"],
                        timestamp=datetime.now(),
                        explanation=f"Patient P-{encounter.id[-4:]} ({encounter.symptom}) assigned CTAS {encounter.assigned_ctas}. Protocol requires CTAS {rule['required_ctas']}."
                    )

        # 2. Check Safety Keywords
        found_keyword = False
        for keyword in SAFETY_KEYWORDS:
            if keyword.lower() in encounter.clinical_notes.lower():
                found_keyword = True
                break
        
        if found_keyword and not encounter.is_serious:
             return Alert(
                id=str(uuid.uuid4()),
                encounter_id=encounter.id,
                rule_violated="R-SAFETY-01",
                severity="CRITICAL",
                timestamp=datetime.now(),
                explanation=f"Safety keyword detected in notes but is_serious is False."
            )
        
        # 3. Public Health Signal (Respiratory Cluster)
        # Check > 3 cases in < 60 mins (Simulated Time). 
        # Since sim runs at 60x speed, 60 mins = 6 seconds real-time.
        from datetime import timedelta
        if encounter.symptom == "Difficulty Breathing":
            self.respiratory_history.append(datetime.now())
        
        # Prune old cases (> 6 seconds real time = > 60 mins sim time)
        cutoff = datetime.now() - timedelta(seconds=6)
        self.respiratory_history = [t for t in self.respiratory_history if t > cutoff]
        
        if len(self.respiratory_history) > 3:
             return Alert(
                id=str(uuid.uuid4()),
                encounter_id=encounter.id,
                rule_violated="R-BIO-01",
                severity="CRITICAL",
                timestamp=datetime.now(),
                explanation=f"BIO_SIGNAL_DETECTED: >3 Respiratory Distress cases in <60 mins."
            )

        return None
