# SevaMitra — Consultation Analytics

Python EDA on synthetic telemedicine consultations modeled on rural Nabha, Punjab
(SIH2025 PS SIH25018).

## Files

| File | Purpose |
|------|---------|
| `generate_consultations.py` | Reproducible synthetic dataset generator (seeded, 2,686 consultations) |
| `consultations.csv` | Generated dataset (one row per completed consultation) |
| `eda_consultations.ipynb` | Executed EDA notebook with charts + business narrative |
| `build_eda.py` | Builds and executes the notebook (nbformat + nbclient) |

## Reproduce

```bash
python generate_consultations.py   # writes consultations.csv
python build_eda.py                # writes + executes eda_consultations.ipynb
```

Requires: `pandas`, `numpy`, `matplotlib`, `seaborn`, `nbformat`, `nbclient`, `ipykernel`.

## Key findings (summary)

1. **Volume concentrates** in a few villages (Nabha City, Bhadson, Amargarh); peak load is
   mid-morning (~11:00) — capacity should follow demand.
2. **Emergency share ~6.3%**, concentrated in specific villages — candidates for on-site
   health-worker presence.
3. **Multilingual access works**: Hindi leads (45%), and follow-up rates do not degrade by language.
4. **Audio fallback is real**: poor connectivity → 65% audio (validates the low-bandwidth design).
5. **Pharmacy stock risk clusters in psychiatry (28%) and cardiology (23%)** — chronic meds run out
   most; the stock-alert feature should prioritize them.
6. **Prescription issuance is high** (ENT 86%, cardiology 86%) and lowest for psychiatry (70%).
7. **Older patients skew high-urgency** — 65+ triage should default to stricter follow-up.

The same metrics appear in the app's admin analytics dashboard (consultation volume, urgency mix,
symptom distribution, pharmacy stock alerts) — this notebook is the analytical proof behind them.
