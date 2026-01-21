
# data_seeds.py

FACILITIES = [
    {"id": "SBK", "name": "Sunnybrook Health Sciences", "lat": 43.722, "lon": -79.375, "capacity": 45},
    {"id": "UHN-TGH", "name": "Toronto General Hospital", "lat": 43.659, "lon": -79.390, "capacity": 50},
    {"id": "SMH", "name": "St. Michaels Hospital", "lat": 43.653, "lon": -79.379, "capacity": 40},
    {"id": "NYGH", "name": "North York General", "lat": 43.769, "lon": -79.363, "capacity": 35},
    {"id": "MSH", "name": "Mount Sinai Hospital", "lat": 43.658, "lon": -79.391, "capacity": 38}
]

FACILITY_RESOURCES = {
    "SBK": {
        "name": "Sunnybrook Health Sciences",
        "type": "Level 1 Trauma",
        "physical_beds": 45,  # Official funded spots
        "surge_capacity": 60, # Including hallway stretchers
        "staffing": {
            "day_shift": {"md_count": 10, "rn_count": 28},
            "evening_shift": {"md_count": 12, "rn_count": 30}, # Busiest time
            "night_shift": {"md_count": 4, "rn_count": 15}
        }
    },
    "UHN-TGH": {
        "name": "Toronto General Hospital",
        "type": "Academic/Transplant",
        "physical_beds": 50,
        "surge_capacity": 65,
        "staffing": {
            "day_shift": {"md_count": 8, "rn_count": 24},
            "evening_shift": {"md_count": 10, "rn_count": 26},
            "night_shift": {"md_count": 3, "rn_count": 12}
        }
    },
    "SMH": {
        "name": "St. Michaels Hospital",
        "type": "Level 1 Trauma (Urban)",
        "physical_beds": 40,
        "surge_capacity": 55,
        "staffing": {
            "day_shift": {"md_count": 9, "rn_count": 25},
            "evening_shift": {"md_count": 11, "rn_count": 28},
            "night_shift": {"md_count": 4, "rn_count": 14}
        }
    },
    "NYGH": {
        "name": "North York General",
        "type": "High Volume Community",
        "physical_beds": 35, # Note: NYGH is extremely efficient despite fewer beds
        "surge_capacity": 50,
        "staffing": {
            "day_shift": {"md_count": 12, "rn_count": 30}, # Heavy Fast-Track staffing
            "evening_shift": {"md_count": 14, "rn_count": 32},
            "night_shift": {"md_count": 5, "rn_count": 16}
        }
    },
    "MSH": {
        "name": "Mount Sinai Hospital",
        "type": "Academic",
        "physical_beds": 38,
        "surge_capacity": 48,
        "staffing": {
            "day_shift": {"md_count": 6, "rn_count": 18},
            "evening_shift": {"md_count": 8, "rn_count": 20},
            "night_shift": {"md_count": 3, "rn_count": 10}
        }
    }
}

CLINICAL_RULES = [
    {
        "rule_id": "RULE_001",
        "symptom": "Chest Pain",
        "required_ctas": 2,
        "risk_level": "HIGH",
        "explanation": "Potential cardiac event requires rapid assessment (CTAS 2)."
    },
    {
        "rule_id": "RULE_002",
        "symptom": "Difficulty Breathing",
        "required_ctas": 1,
        "risk_level": "CRITICAL",
        "explanation": "Respiratory distress is a life-threatening emergency (CTAS 1)."
    },
    {
        "rule_id": "RULE_003",
        "symptom": "Minor Laceration",
        "required_ctas": 4,
        "risk_level": "LOW",
        "explanation": "Stable laceration requires suture but not immediate resuscitation (CTAS 4)."
    },
    {
        "rule_id": "RULE_004",
        "symptom": "Lower Abdominal Pain",
        "required_ctas": 3,
        "risk_level": "MODERATE",
        "explanation": "Abdominal pain in elderly or immunocompromised requires CTAS 2/3."
    }
]

SAFETY_KEYWORDS = ["hospitalization", "admit", "ICU"]
