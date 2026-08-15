"""
Generate a realistic synthetic telemedicine consultation dataset for SevaMitra.

The data is modeled on rural Nabha, Punjab (SIH2025 PS SIH25018): a telemedicine
platform serving low-connectivity villages with patients in three languages.

Output: consultations.csv (one row per completed consultation)
"""
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

N_CONSULTATIONS = 3200
START = datetime(2025, 1, 1)
END = datetime(2025, 12, 31)

# ---------------------------------------------------------------- building blocks
VILLAGES = [
    "Nabha City", "Bhadson", "Amargarh", "Kal Majra", "Rampur", "Kot Bakhtu",
    "Dhanaula", "Khuban", "Mehdoodan", "Sangatpura", "Jatana", "Karamgarh",
]

LANGUAGES = ["en", "hi", "pa"]
SPECIALTIES = [
    "general", "cardiology", "pediatrics", "neurology", "orthopedics",
    "dermatology", "ent", "psychiatry",
]

SYMPTOM_BY_SPECIALTY = {
    "general": ["fever", "body ache", "general weakness", "vomiting", "diarrhoea", "cold"],
    "cardiology": ["chest pain", "palpitations", "shortness of breath", "bp high"],
    "pediatrics": ["child fever", "infant feeding", "vaccination", "child cough"],
    "neurology": ["headache", "dizziness", "numbness", "seizure", "migraine"],
    "orthopedics": ["back pain", "joint pain", "bone fracture", "knee pain"],
    "dermatology": ["skin rash", "itching", "acne", "fungal infection"],
    "ent": ["ear pain", "throat infection", "sinusitis", "nose block"],
    "psychiatry": ["anxiety", "insomnia", "stress", "low mood"],
}

MEDICINE_BY_SPECIALTY = {
    "general": ["Paracetamol", "ORS", "Antacid", "Cetirizine"],
    "cardiology": ["Amlodipine", "Aspirin", "Atorvastatin"],
    "pediatrics": ["Pediatric syrup", "ORS", "Paracetamol syrup"],
    "neurology": ["Paracetamol", "Propranolol", "Sumatriptan"],
    "orthopedics": ["Diclofenac gel", "Ibuprofen", "Calcium"],
    "dermatology": ["Clotrimazole cream", "Cetirizine", "Hydrocortisone cream"],
    "ent": ["Amoxicillin", "Cetirizine", "Saline drops"],
    "psychiatry": ["Sertraline", "Melatonin", "SSRI low dose"],
}

PHARMACY_STOCK_RISK = {
    "general": 0.08, "cardiology": 0.22, "pediatrics": 0.14, "neurology": 0.18,
    "orthopedics": 0.10, "dermatology": 0.15, "ent": 0.12, "psychiatry": 0.28,
}


def age_bucket(age: int) -> str:
    if age < 15:
        return "0-14"
    if age < 30:
        return "15-29"
    if age < 50:
        return "30-49"
    if age < 65:
        return "50-64"
    return "65+"


rows = []
for i in range(N_CONSULTATIONS):
    # truncated normal (7:00–22:00) without boundary pile-up from np.clip
    hour = int(np.round(np.random.normal(11, 3.2)))
    while hour < 7 or hour > 22:
        hour = int(np.round(np.random.normal(11, 3.2)))
    ts = START + timedelta(
        days=np.random.randint(0, 365),
        hours=hour,
        minutes=int(np.random.randint(0, 60)),
    )
    # Weekends quieter (rural clinics + home recovery)
    if ts.weekday() in (5, 6) and random.random() < 0.55:
        continue

    specialty = random.choices(
        SPECIALTIES,
        weights=[0.32, 0.10, 0.13, 0.08, 0.10, 0.12, 0.08, 0.07],
        k=1,
    )[0]
    village = random.choices(
        VILLAGES, weights=[0.20, 0.12, 0.10, 0.09, 0.08, 0.08, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03], k=1
    )[0]
    language = random.choices(LANGUAGES, weights=[0.35, 0.45, 0.20], k=1)[0]

    age = int(np.clip(np.random.normal(38, 18), 1, 92))
    symptom = random.choice(SYMPTOM_BY_SPECIALTY[specialty])

    # urgency: most routine, some high, few emergency
    urgency_r = random.random()
    if urgency_r < 0.06:
        urgency = "emergency"
    elif urgency_r < 0.30:
        urgency = "high"
    else:
        urgency = "routine"

    duration = int(np.clip(np.random.normal(14, 6), 3, 45))
    # rural connectivity: random network drops
    connectivity = random.choices(["good", "fair", "poor"], weights=[0.55, 0.30, 0.15], k=1)[0]

    # follow-up more likely for chronic/urgent/poor connectivity
    followup_p = 0.22 + (urgency != "routine") * 0.10 + (connectivity == "poor") * 0.08
    follow_up = random.random() < followup_p

    # prescription issued for most consults; weaker for psychiatry
    rx_p = 0.72 if specialty == "psychiatry" else 0.86
    rx_issued = random.random() < rx_p

    # pharmacy stock risk: cardiology & psychiatry meds run out most
    stock_risk = PHARMACY_STOCK_RISK[specialty]
    stock_shortage = random.random() < stock_risk

    # video vs audio: poor connectivity falls back to audio more
    if connectivity == "poor":
        media = random.choices(["video", "audio"], weights=[0.35, 0.65], k=1)[0]
    elif connectivity == "fair":
        media = random.choices(["video", "audio"], weights=[0.60, 0.40], k=1)[0]
    else:
        media = "video"

    rating = int(np.clip(np.random.normal(4.3, 0.5), 1, 5))

    rows.append(
        {
            "consultation_id": f"C{i+1:05d}",
            "timestamp": ts,
            "village": village,
            "language": language,
            "patient_age": age,
            "age_group": age_bucket(age),
            "specialty": specialty,
            "symptom": symptom,
            "urgency": urgency,
            "duration_min": duration,
            "connectivity": connectivity,
            "media_type": media,
            "prescription_issued": rx_issued,
            "medicine_prescribed": random.choice(MEDICINE_BY_SPECIALTY[specialty]) if rx_issued else None,
            "pharmacy_stock_shortage": stock_shortage,
            "follow_up_required": follow_up,
            "rating": rating,
        }
    )

df = pd.DataFrame(rows)
df = df.sort_values("timestamp").reset_index(drop=True)

# keep only completed consultations; add weekday/hour helpers
df["weekday"] = df["timestamp"].dt.day_name()
df["hour"] = df["timestamp"].dt.hour
df["month"] = df["timestamp"].dt.month

out = "consultations.csv"
df.to_csv(out, index=False)
print(f"wrote {len(df)} consultations -> {out}")
print(f"columns: {list(df.columns)}")
print(df.head(3).to_string(index=False))
