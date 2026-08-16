"""
Generate a synthetic operations dataset for the SevaMitra analytics dashboard.

This extends the consultation-only EDA dataset into an operations view:
  doctors, appointments (with wait time + outcome), pharmacy stock events.

The data is modeled on rural Nabha, Punjab (SIH2025 PS SIH25018). It is
SIMULATED — a stand-in for what the platform would measure in production.

Outputs:
  doctors.csv             doctor roster (id, specialty, capacity)
  appointments.csv        one row per appointment (incl. cancelled/no-show)
  pharmacy_stock.csv      stock events per pharmacy x medicine x specialty
  ../src/lib/operations-analytics.json
                          pre-computed aggregates consumed by the app dashboard
"""
import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

random = np.random.RandomState(42)

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_JSON = os.path.normpath(os.path.join(OUT_DIR, "..", "src", "lib", "operations-analytics.json"))

N_APPOINTMENTS = 4200
START = datetime(2025, 1, 1)
END = datetime(2025, 12, 31)

# ---------------------------------------------------------------- building blocks
VILLAGES = [
    "Nabha City", "Bhadson", "Amargarh", "Kal Majra", "Rampur", "Kot Bakhtu",
    "Dhanaula", "Khuban", "Mehdoodan", "Sangatpura", "Jatana", "Karamgarh",
]
HUB_VILLAGES = {"Nabha City", "Bhadson"}  # town/sub-centre hubs

LANGUAGES = ["en", "hi", "pa"]
SPECIALTIES = [
    "general", "cardiology", "pediatrics", "neurology", "orthopedics",
    "dermatology", "ent", "psychiatry",
]
SPECIALIST_SPECIALTIES = {s for s in SPECIALTIES if s != "general"}

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

DOCTOR_CAPACITY = {
    "general": 5, "cardiology": 2, "pediatrics": 3, "neurology": 2,
    "orthopedics": 2, "dermatology": 3, "ent": 2, "psychiatry": 2,
}

PHARMACY_NAMES = [
    "Nabha Chemists", "Bhadson Medical Hall", "Amargarh Pharmacy", "Dhanaula Store",
    "Kal Majra Clinic Store", "SevaMitra Hub Pharmacy",
]


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


# ---------------------------------------------------------------- doctor roster
doctors = []
for i, specialty in enumerate(SPECIALTIES):
    doctors.append(
        {
            "doctor_id": f"doctor_{i+1}",
            "specialty": specialty,
            "capacity_per_day": DOCTOR_CAPACITY[specialty],
        }
    )
doctor_df = pd.DataFrame(doctors)

# ---------------------------------------------------------------- appointments
# Schedule a realistic stream of appointments; most complete, some cancelled/no-show.
rows = []
capacity = dict(zip(doctor_df["doctor_id"], doctor_df["capacity_per_day"]))
completed_by_doctor = Counter()

n = N_APPOINTMENTS
hour = random.randint(7, 22, size=n)
# more demand mid-morning / early evening
demand_boost = np.select(
    [hour >= 10, hour >= 17], [1.35, 1.2], default=1.0
)
# start all times uniformly; outcome determined per-row
days = random.randint(0, 364, size=n)
start = START + pd.to_timedelta(days, unit="D")
ts = start + pd.to_timedelta(hour, unit="h") + pd.to_timedelta(random.randint(0, 59, size=n), unit="m")

for i in range(n):
    specialty = random.choice(SPECIALTIES)
    doctor_id = f"doctor_{SPECIALTIES.index(specialty)+1}"

    village = random.choice(VILLAGES)
    language = random.choice(LANGUAGES)
    age = int(np.clip(random.normal(38, 18), 1, 92))

    # outcome: ~84% completed, ~8% cancelled, ~8% no-show
    r = random.rand()
    if r < 0.84:
        outcome = "completed"
    elif r < 0.92:
        outcome = "cancelled"
    else:
        outcome = "no_show"

    # wait time: longer when demand is high or connectivity poor
    wait_min = int(
        np.clip(
            random.normal(12 * demand_boost[i], 6) + (8 if random.rand() < 0.2 else 0),
            0,
            60,
        )
    )

    # connectivity drives media fallback for completed consults
    connectivity = random.choice(["good", "fair", "poor"])
    if connectivity == "poor":
        media = random.choice(["video", "audio"] * 35 + ["audio"] * 65)
    elif connectivity == "fair":
        media = random.choice(["video", "audio"] * 60 + ["audio"] * 40)
    else:
        media = "video"

    duration_min = int(np.clip(random.normal(14, 6), 3, 45)) if outcome == "completed" else 0
    rating = int(np.clip(random.normal(4.3, 0.5), 1, 5)) if outcome == "completed" else 0

    urgency_r = random.random()
    if urgency_r < 0.06:
        urgency = "emergency"
    elif urgency_r < 0.30:
        urgency = "high"
    else:
        urgency = "routine"

    symptom = random.choice(SYMPTOM_BY_SPECIALTY[specialty])
    rx_issued = int((random.random() < (0.72 if specialty == "psychiatry" else 0.86)) and outcome == "completed")
    stock_shortage = int(random.random() < PHARMACY_STOCK_RISK[specialty])
    follow_up = int((random.random() < 0.22 + (urgency != "routine") * 0.10 + (connectivity == "poor") * 0.08) and outcome == "completed")

    if outcome == "completed":
        completed_by_doctor[doctor_id] += 1

    rows.append(
        {
            "appointment_id": f"A{i+1:05d}",
            "doctor_id": doctor_id,
            "specialty": specialty,
            "village": village,
            "language": language,
            "patient_age": age,
            "age_group": age_bucket(age),
            "scheduled_time": ts[i].to_pydatetime().isoformat(sep=" "),
            "outcome": outcome,
            "wait_min": wait_min,
            "symptom": symptom,
            "urgency": urgency,
            "duration_min": duration_min,
            "connectivity": connectivity,
            "media_type": media if outcome == "completed" else None,
            "prescription_issued": int(rx_issued),
            "medicine_prescribed": random.choice(MEDICINE_BY_SPECIALTY[specialty]) if rx_issued else None,
            "pharmacy_stock_shortage": int(stock_shortage),
            "follow_up_required": int(follow_up),
            "rating": rating,
        }
    )

apt_df = pd.DataFrame(rows)
apt_df["scheduled_time"] = pd.to_datetime(apt_df["scheduled_time"])
apt_df["date"] = apt_df["scheduled_time"].dt.date
apt_df["hour"] = apt_df["scheduled_time"].dt.hour
apt_df["weekday"] = apt_df["scheduled_time"].dt.day_name()
apt_df["is_rural"] = (~apt_df["village"].isin(HUB_VILLAGES)).astype(int)
apt_df["is_specialist"] = (apt_df["specialty"].isin(SPECIALIST_SPECIALTIES)).astype(int)

completed = apt_df[apt_df["outcome"] == "completed"]
no_show = apt_df[apt_df["outcome"] == "no_show"]
cancelled = apt_df[apt_df["outcome"] == "cancelled"]

# ---------------------------------------------------------------- pharmacy stock
pharmacy_rows = []
for specialty in SPECIALTIES:
    meds = MEDICINE_BY_SPECIALTY[specialty]
    risk = PHARMACY_STOCK_RISK[specialty]
    for pharmacy in PHARMACY_NAMES:
        for med in meds:
            stock_events = 90  # daily-ish stock checks
            shortages = int(stock_events * risk)
            available = stock_events - shortages
            pharmacy_rows.append(
                {
                    "pharmacy": pharmacy,
                    "specialty": specialty,
                    "medicine": med,
                    "stock_checks": stock_events,
                    "stock_shortages": shortages,
                    "availability_rate": round(available / stock_events, 3),
                }
            )
stock_df = pd.DataFrame(pharmacy_rows)

# ---------------------------------------------------------------- aggregates for the app
consults_per_day = completed.groupby("date").size()
avg_consults_per_day = round(float(consults_per_day.mean()), 1)
avg_consults_per_week = round(float(consults_per_day.mean() * 7), 1)

completion_rate = round(len(completed) / n, 3)
no_show_rate = round(len(no_show) / n, 3)
cancellation_rate = round(len(cancelled) / n, 3)

avg_wait_min = round(float(completed["wait_min"].mean()), 1)
median_wait_min = int(completed["wait_min"].median())

# doctor utilization: completed consults per day / daily capacity
utilization = {}
for doctor_id, cap in capacity.items():
    util = completed_by_doctor[doctor_id] / (365 * cap)
    utilization[doctor_id] = round(float(np.clip(util, 0, 1)), 2)
avg_utilization = round(float(np.mean(list(utilization.values()))), 2)

rx_conversion = round(float(completed["prescription_issued"].mean()), 3)
follow_up_rate = round(float(completed["follow_up_required"].mean()), 3)
avg_rating = round(float(completed["rating"].mean()), 2)
emergency_share = round(float((completed["urgency"] == "emergency").mean()), 3)
stock_out_rate = round(float(completed["pharmacy_stock_shortage"].mean()), 3)
medicine_availability = round(float(stock_df["availability_rate"].mean()), 3)

rural_share = round(float(apt_df["is_rural"].mean()), 3)
# of rural consultations, what share reached a specialist?
rural = completed[completed["is_rural"].astype(bool)]
rural_specialist_share = round(float(rural["is_specialist"].mean()), 3)

# demand by day (last 14 days of completed)
by_day = completed.groupby("date").size()
last14 = by_day.tail(14)
demand_by_day = [{"date": str(d), "consults": int(v)} for d, v in last14.items()]

# demand by hour
demand_by_hour = [{"hour": int(h), "consults": int(v)} for h, v in completed.groupby("hour").size().items()]

# wait-time buckets (completed)
wait_buckets = []
bounds = [(0, 5), (6, 10), (11, 15), (16, 20), (21, 30), (31, 60)]
for lo, hi in bounds:
    wait_buckets.append({"bucket": f"{lo}-{hi}m", "count": int(((completed["wait_min"] >= lo) & (completed["wait_min"] <= hi)).sum())})

# utilization by specialty
util_by_spec = []
for doc in doctor_df.itertuples():
    util_by_spec.append({
        "specialty": doc.specialty.capitalize(),
        "utilization": utilization[doc.doctor_id] * 100,
    })

# stock risk by specialty
stock_risk_by_spec = []
for specialty in SPECIALTIES:
    sub = stock_df[stock_df["specialty"] == specialty]
    stock_risk_by_spec.append({
        "specialty": specialty.capitalize(),
        "rate": round(float(sub["stock_shortages"].sum() / sub["stock_checks"].sum() * 100), 1),
    })

# language mix (completed)
lang_counts = Counter(completed["language"])
lang_total = sum(lang_counts.values())
language_mix = [
    {"name": {"en": "English", "hi": "Hindi", "pa": "Punjabi"}[lang], "value": int(v)}
    for lang, v in lang_counts.most_common()
]

# symptom mix (completed)
symptom_counts = Counter(completed["symptom"])
symptom_mix = [{"name": s.title(), "value": int(v)} for s, v in symptom_counts.most_common(10)]

# urgency mix (completed)
urgency_counts = Counter(completed["urgency"])
urgency_mix = [{"name": u.title(), "value": int(v)} for u, v in urgency_counts.most_common()]

# rural vs specialist access (completed)
rural_spec = int(((completed["is_rural"].astype(bool)) & (completed["is_specialist"].astype(bool))).sum())
rural_gen = int(((completed["is_rural"].astype(bool)) & (~completed["is_specialist"].astype(bool))).sum())
hub_spec = int(((~completed["is_rural"].astype(bool)) & (completed["is_specialist"].astype(bool))).sum())
hub_gen = int(((~completed["is_rural"].astype(bool)) & (~completed["is_specialist"].astype(bool))).sum())
access_mix = [
    {"name": "Rural → Specialist", "value": rural_spec},
    {"name": "Rural → General", "value": rural_gen},
    {"name": "Hub → Specialist", "value": hub_spec},
    {"name": "Hub → General", "value": hub_gen},
]

payload = {
    "meta": {
        "title": "SevaMitra Operations Analytics",
        "label": "Simulated platform data (modeled on rural Nabha, SIH2025 PS SIH25018)",
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "source": "analysis/generate_operations.py",
        "period": f"{START.date()} to {END.date()}",
    },
    "kpis": {
        "consults_per_day": avg_consults_per_day,
        "consults_per_week": avg_consults_per_week,
        "avg_wait_min": avg_wait_min,
        "median_wait_min": median_wait_min,
        "doctor_utilization": avg_utilization,
        "completion_rate": completion_rate,
        "no_show_rate": no_show_rate,
        "cancellation_rate": cancellation_rate,
        "rx_conversion": rx_conversion,
        "follow_up_rate": follow_up_rate,
        "avg_rating": avg_rating,
        "emergency_share": emergency_share,
        "stock_out_rate": stock_out_rate,
        "medicine_availability": medicine_availability,
        "rural_share": rural_share,
        "rural_specialist_share": rural_specialist_share,
        "active_villages": apt_df["village"].nunique(),
        "doctors": len(doctor_df),
    },
    "flow": {
        "demand": {
            "label": "Patient demand",
            "consults_per_day": avg_consults_per_day,
            "emergency_per_day": round(emergency_share * avg_consults_per_day, 1),
            "active_villages": int(apt_df["village"].nunique()),
            "rural_share": rural_share,
        },
        "capacity": {
            "label": "Doctor capacity",
            "doctors": int(len(doctor_df)),
            "avg_utilization": avg_utilization,
            "peak_hour": int(completed.groupby("hour").size().idxmax()),
            "peak_share": round(float(completed.groupby("hour").size().max() / len(completed) * 100), 1),
        },
        "outcomes": {
            "label": "Consultation outcomes",
            "completion_rate": completion_rate,
            "avg_wait_min": avg_wait_min,
            "rx_conversion": rx_conversion,
            "avg_rating": avg_rating,
        },
        "pharmacy": {
            "label": "Pharmacy availability",
            "stock_out_rate": stock_out_rate,
            "medicine_availability": medicine_availability,
        },
    },
    "charts": {
        "demand_by_day": demand_by_day,
        "demand_by_hour": demand_by_hour,
        "wait_buckets": wait_buckets,
        "utilization_by_specialty": util_by_spec,
        "stock_risk_by_specialty": stock_risk_by_spec,
        "language_mix": language_mix,
        "symptom_mix": symptom_mix,
        "urgency_mix": urgency_mix,
        "access_mix": access_mix,
    },
}

os.makedirs(os.path.dirname(APP_JSON), exist_ok=True)
with open(APP_JSON, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2)

doctor_df.to_csv(os.path.join(OUT_DIR, "doctors.csv"), index=False)
apt_df.to_csv(os.path.join(OUT_DIR, "appointments.csv"), index=False)
stock_df.to_csv(os.path.join(OUT_DIR, "pharmacy_stock.csv"), index=False)

print(f"appointments: {len(apt_df)} (completed {len(completed)}, cancelled {len(cancelled)}, no-show {len(no_show)})")
print(f"doctors: {len(doctor_df)}, pharmacies: {len(stock_df)}")
print(f"consults/day ~ {avg_consults_per_day}, avg wait {avg_wait_min} min, completion {completion_rate}")
print(f"doctor utilization {avg_utilization}, stock-out {stock_out_rate}, medicine availability {medicine_availability}")
print(f"rural share {rural_share}, rural->specialist {rural_specialist_share}")
print(f"wrote {APP_JSON}")
