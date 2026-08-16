# SevaMitra — Operations Analytics

Simulated **operations** dataset and analytics for the SevaMitra telemedicine platform,
modeled on rural Nabha, Punjab (SIH2025 PS SIH25018). This extends the earlier
consultation-only EDA into an operational view: **demand → doctor capacity →
consultation outcomes → pharmacy availability**, exactly the KPI chain the platform
would measure in production.

> Everything here is **synthetic** — a stand-in for real traffic. The dashboards in the
> app render the same aggregates, so nothing claims impact numbers that were never measured.

## Files

| File | Purpose |
|------|---------|
| `generate_operations.py` | Reproducible seeded generator (4,200 appointments, 8 doctors, 150 pharmacy stock rows) |
| `doctors.csv` | Doctor roster (specialty, daily consultation capacity) |
| `appointments.csv` | Every scheduled appointment: wait time, outcome (completed/cancelled/no-show), village, language, urgency, symptom, connectivity, pharmacy shortage, rating |
| `pharmacy_stock.csv` | Per pharmacy × medicine stock-check availability rates |
| `schema.sql` | SQLite schema for the three tables |
| `analytics_queries.sql` | The 11 KPI queries (volume, wait, utilization, completion, no-show, language, symptom, stock-out, availability, rural vs specialist access) |
| `consultations.csv` / `eda_consultations.ipynb` | Original consultation-only EDA (kept for continuity) |

The aggregate output the app dashboard reads is generated into
`../src/lib/operations-analytics.json` (pre-computed KPIs + chart series).

## Reproduce

```bash
python generate_operations.py          # writes the 3 CSVs + src/lib/operations-analytics.json
python build_eda.py                    # original consultation EDA notebook (unchanged)
```

### SQL (the 11 KPIs)

```bash
# load the CSVs into SQLite, then run analytics_queries.sql
sqlite3 sevamitra.db < schema.sql
sqlite3 sevamitra.db -csv '.import doctors.csv doctors' \
  '.import appointments.csv appointments' '.import pharmacy_stock.csv pharmacy_stock'
sqlite3 sevamitra.db < analytics_queries.sql
```

Every query is annotated in the file. Highlights:

- **Q1–Q2** — consultation volume per day / per week
- **Q3** — average wait time (16.5 min on completed consults)
- **Q4** — doctor utilization (completed/day ÷ daily capacity, ≈0.52 average)
- **Q5–Q6** — completion (84.6%), no-show (7.8%), cancellation (7.6%)
- **Q7** — patient language mix (English/Hindi/Punjabi, roughly even)
- **Q8** — top symptoms
- **Q9** — pharmacy stock-out rate by specialty (psychiatry 24.9%, cardiology 24.2%)
- **Q10** — medicine availability by specialty (72–86%)
- **Q11** — rural vs specialist access (89% of rural consults reach a specialist)

## Key findings (operations)

1. **Volume is ~10 consults/day across 12 villages; peak load is 11:00** — capacity planning
   follows demand, not averages.
2. **Wait time averages 16.5 min** but the tail (21–60 min buckets) is where experience
   degrades — queue visibility matters most under peak load.
3. **Doctors run at ~52% utilization** — there is headroom before a second panel is needed.
4. **~16% of appointments never happen** (no-show + cancellation ≈ 15.4%) — a strong
   candidate for reminder nudges in the health-worker workflow.
5. **Chronic-medicine stock risk clusters in psychiatry and cardiology** (24–25% stock-out),
   matching the consultation EDA — the stock-alert feature should prioritize these.
6. **Rural users reach specialists 89% of the time** — the core telemedicine value prop
   (specialist access without travel) holds in the simulation.

## Dashboard

`../src/components/operations-analytics.tsx` renders `operations-analytics.json`:
KPI cards, the demand→capacity→outcomes→pharmacy flow, and charts (daily demand,
hour-of-day demand, wait-time buckets, utilization by specialty, urgency mix,
language mix, symptom mix, stock-risk by specialty, rural vs specialist access).
It is mounted in the Admin view and is explicitly labeled simulated data.
