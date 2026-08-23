# SevaMitra — Telemedicine Access for Rural Healthcare in Nabha

SevaMitra is a low-bandwidth, offline-capable telemedicine platform built for rural communities where
medical infrastructure is thin and connectivity is unreliable. It connects patients, doctors, health
workers, and pharmacies through video consultations, a symptom triage assistant, electronic medical
records, and medicine delivery — in English, Hindi, and Punjabi.

This project was built as a response to the **Smart India Hackathon 2025 problem statement
SIH25018 ("Telemedicine Access for Rural Healthcare in Nabha", Government of Punjab)**: rural Nabha
faces a shortage of qualified doctors, poor internet connectivity, and low digital literacy. The
platform's core design decisions — offline sync, QR-based onboarding, multilingual UI, low-bandwidth
video — all trace back to that problem statement.

The repo also carries an **operations analytics** workstream: a reproducible simulated dataset, SQL
KPI queries, an EDA notebook, and an in-app analytics dashboard that measure the platform the way it
would measure itself in production (consultation volume, wait time, doctor utilization, pharmacy
stock risk, language & specialist access). Everything is explicitly labeled **simulated** — no real
impact numbers are claimed.

---

## The problem

Nabha and surrounding villages face a compound healthcare gap:

- **Doctor shortage** — a few specialists serve a large rural population; travel to a town clinic is
  costly and time-consuming.
- **Poor connectivity** — rural 2G/3G networks drop frequently; patients cannot rely on always-on
  internet.
- **Language barrier** — the primary care network serves Hindi and Punjabi speakers; health
  information must not assume English.
- **Low digital literacy** — onboarding must be as simple as showing a QR code or entering a short
  room code, not filling registration forms on a PC.

## The users

| Role | Needs |
|------|-------|
| **Patient** (rural, Hindi/Punjabi) | Speak to a doctor without travelling; do it on a phone with flaky internet |
| **Doctor** (urban or sub-centre) | See patients remotely, review records, issue prescriptions, track queue |
| **Health worker / ASHA** | Help patients onboard and join consultations; work with low connectivity |
| **Pharmacist** | See prescriptions, manage stock, alert patients when a medicine is unavailable nearby |

## The workflow

```
Symptom check / complaint → Room code or QR onboarding → Video consultation
        → Electronic medical record + prescription → Pharmacy stock lookup & delivery
```

1. A patient describes symptoms using the **triage assistant**, which suggests a specialist and an
   urgency level (low / medium / high / emergency).
2. A doctor shares a **QR code or 6-character room code**; the patient scans or types it to join the
   live consultation — no accounts or app-store signup required.
3. During the call the doctor updates vitals, writes notes, and issues a **prescription**.
4. The prescription drives the **pharmacy tracker**: nearby pharmacies, stock levels, and opening
   hours, so the patient knows where the medicine is available.

## Design constraints (from SIH25018)

- **Low bandwidth** — video works on degraded networks; the call can fall back to audio-only.
- **Offline first** — appointments, records, messages, and prescription updates made offline are
  queued on the device and **flushed automatically when connectivity returns**.
- **Phone-only** — the UI is a responsive mobile-first web app; no desktop workflows assumed.
- **Multilingual** — full English / Hindi / Punjabi interface.
- **QR / room-code onboarding** — a patient with low digital literacy joins via a scan or a short code.

## What's inside

### Features
- **Live video/audio consultations** with WebRTC (`RTCPeerConnection` + STUN) and a Socket.IO
  signaling server for offer/answer/ICE exchange.
- **Symptom triage assistant** — rule-based specialist + urgency recommendation in three languages.
- **Offline sync queue** — every data mutation (appointment, record, prescription, payment, message)
  is persisted locally and enqueued; a `SyncQueue` flushes the batch to the backend on reconnect.
- **QR / room-code onboarding** — doctors create a consultation room (QR + code), patients join by
  scanning or typing the code.
- **EMR + prescription builder** — vitals, diagnosis, notes, and structured prescriptions.
- **Pharmacy tracker** — nearby pharmacy lookup with stock levels, opening hours, and distance sort.
- **Admin view** — platform health: users, appointments, payment success, queue depth, sync status.
- **Operations analytics dashboard** (admin) — simulated-traffic KPIs in the demand → doctor
  capacity → consultation outcomes → pharmacy availability chain: consults/day, wait time, doctor
  utilization, completion/no-show/cancellation rates, language mix, symptom mix, pharmacy stock-out
  rate, medicine availability, and rural vs specialist access.

### Architecture

```
┌─────────────────────────────┐        ┌────────────────────────────────────┐
│  React SPA (Vite + TS)      │        │  telemed-backend (Python + FastAPI)│
│  ─────────────────────      │  WS    │  ────────────────────────────────  │
│  WebRTC service             │───────▶│  Socket.IO signaling (offer/answer/│
│  SyncQueue (offline queue)  │  HTTP  │  ICE, call lifecycle)              │
│  Room onboarding (QR/code)  │───────▶│  POST /api/sync (offline flush)    │
│  Triage (AI), EMR, i18n     │        │  POST /api/triage (Gemini AI)      │
└─────────────────────────────┘        └────────────────────────────────────┘
        │ localStorage (offline persistence + sync queue)
        ▼
   device-local data that survives disconnects
```

- **Frontend:** React 18, JavaScript, Vite, Tailwind CSS, Socket.IO client, WebRTC, shadcn/ui.
- **Backend:** Python, FastAPI, Socket.IO, Gemini API.
- **Persistence:** localStorage-backed offline queue (`src/services/sync-queue.ts`) with automatic
  flush on the `online` event.

## Running locally

```bash
# 1. Backend (terminal 1)
cd telemed-backend
python -m venv .venv
.venv\Scripts\activate      # On Windows
# source .venv/bin/activate # On macOS/Linux
pip install -r requirements.txt
set GEMINI_API_KEY=your_api_key_here  # Windows (or export on macOS/Linux)
python main.py              # http://localhost:4001

# 2. Frontend (terminal 2)
npm i
npm run dev                 # http://localhost:3000
```

- The frontend auto-detects the signaling server at `http://<host>:4001`.
- Override with `VITE_SIGNALING_SERVER_URL` for a deployed backend.

## Impact (targets)

For a rural block like Nabha, a platform like this is expected to move the needle on:

- **Travel cost** — patients no longer travel 20–40 km for a consultation that a video call covers.
- **Consult wait time** — queue management gives visibility into when a doctor is free.
- **Specialist access** — a patient can reach a specialist who would otherwise be out of reach.
- **Language access** — triage, records, and instructions available in the patient's own language.

> These are targets from the problem framing; the analytics tooling in this repo
> (`analysis/` notebook + admin dashboard) is built to measure consultation volume, symptom mix, and
> pharmacy stock risk once the platform sees real traffic.

## Analytics (operations)

SevaMitra's analytics layer shows how the platform would be measured in production. It is a
reproducible, seeded pipeline — Python generates a realistic synthetic operations dataset, SQL
computes the KPIs, and the app renders the same aggregates in an admin dashboard.

- **Dataset** (`analysis/generate_operations.py`) — 4,200 appointments across 12 villages and
  8 specialties, each with wait time, outcome (completed/cancelled/no-show), language, urgency,
  symptom, connectivity, and pharmacy stock events.
- **SQL** (`analysis/schema.sql`, `analysis/analytics_queries.sql`) — 11 annotated KPI queries:
  volume per day/week, avg wait time, doctor utilization, completion/no-show/cancellation rates,
  language distribution, symptom distribution, pharmacy stock-out rate, medicine availability, and
  rural vs specialist access.
- **EDA** (`analysis/eda_consultations.ipynb`) — executed notebook with charts and a business
  narrative.
- **Dashboard** (`src/components/operations-analytics.tsx`) — admin view showing KPI cards, the
  demand → capacity → outcomes → pharmacy flow, and charts; fed by
  `src/lib/operations-analytics.json`.

The dashboard labels every figure **simulated**. The SQL and notebook are the analytical proof;
the dashboard is where the numbers are surfaced in the product.

## Why this design

The interesting engineering problems here are the ones the problem statement *requires*:

1. **Offline sync is the hard part.** Everything else is CRUD; surviving a dropped 2G connection while
   a doctor is mid-consultation is the actual systems problem. The queue keeps the device authoritative
   while offline and reconciles on reconnect.
2. **QR onboarding is a UX constraint, not a gimmick.** Rural users with low digital literacy can't
   register with email + password on a phone. A scan or a 6-character code is the shortest path to a
   live consultation.
3. **Multilingual is not translation, it's infrastructure.** The triage rules, pharmacy lookup, and
   records are all language-aware from the start.

## Project structure

```
├── src/
│   ├── components/            # UI: consultations, triage, pharmacy, EMR, onboarding, i18n
│   │   └── ui/                # shadcn/ui primitives
│   ├── contexts/              # auth, language, app-data (with sync queue wiring)
│   ├── services/
│   │   ├── webrtc-service.ts  # WebRTC + Socket.IO signaling client
│   │   ├── sync-queue.ts      # offline→online operation queue
│   │   ├── room-service.ts    # QR/room-code creation & joining
│   │   └── ai-symptom-service.ts  # rule-based triage + urgency
│   ├── lib/
│   │   └── operations-analytics.json  # generated aggregates for the analytics dashboard
│   ├── pages/                 # router pages (dashboard, admin, etc.)
│   └── types/                 # shared domain types
├── telemed-backend/           # Python FastAPI + Socket.IO signaling + Gemini Triage
├── analysis/                  # operations analytics: generator, SQL, EDA notebook, CSVs
└── ARCHITECTURE.md            # deeper system write-up
```

---

*Built as a healthcare platform portfolio project grounded in SIH2025 PS SIH25018. See
`ARCHITECTURE.md` for the systems write-up and `analysis/` for the data/analytics work (simulated
dataset, SQL KPIs, EDA, and the in-app operations dashboard).*
