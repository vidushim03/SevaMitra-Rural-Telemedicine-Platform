# SevaMitra — Architecture

This document describes the system design of SevaMitra, a low-bandwidth, offline-capable rural
telemedicine platform. It explains *why* the system is shaped the way it is, so the engineering
decisions are auditable.

## System overview

```
┌────────────────────────────────┐         ┌─────────────────────────────────────┐
│  React SPA (Vite + TypeScript) │  HTTP   │  telemed-backend (Node + Express)    │
│  ────────────────────────────  │  + WS   │  ─────────────────────────────────   │
│  App shell (routing, auth,     │────────▶│  Socket.IO signaling server           │
│    language, app-data context) │         │   · register / call lifecycle        │
│  WebRTC media + signaling      │         │   · offer / answer / ICE relay       │
│  Offline sync queue            │         │   · chat-message relay                │
│  Room onboarding (QR / code)   │         │  REST endpoints                       │
│  Triage, EMR, pharmacy, admin  │         │   · POST /api/sync  (offline flush)   │
└────────────────────────────────┘         │   · GET  /api/health (ops counter)    │
        │                                   └─────────────────────────────────────┘
        │ localStorage (device-authoritative offline store)
        ▼
   survives disconnects; reconciles on reconnect
```

Two transports are used for different jobs:

| Transport | Purpose |
|-----------|---------|
| **WebSocket (Socket.IO)** | Real-time signaling: call setup, ICE candidates, chat. Latency-sensitive, not durable. |
| **HTTP (REST)** | Durable data hand-off: the offline sync queue flushes batches via `POST /api/sync`. A dropped request is retried by the queue. |

The split matters: WebRTC media itself is peer-to-peer and never touches the server; the server only
exchanges the *metadata* needed to establish the P2P connection.

## 1. WebRTC media path

- `src/services/webrtc-service.ts` wraps `RTCPeerConnection` with two STUN servers
(`stun.l.google.com`, `stun1.l.google.com`) plus an optional TURN relay supplied via
`VITE_TURN_URL`/`VITE_TURN_USERNAME`/`VITE_TURN_PASSWORD` for strict-NAT fallback.
- Media flows **peer-to-peer**; the signaling server only relays `webrtc-offer`, `webrtc-answer`,
  and `ice-candidate` messages between the two socket clients in the same call.
- `telemed-backend/server.js` routes signaling by looking up the **other party** of the call
  (`call.doctorId` / `call.patientId`) and emitting to that user's socket. This keeps the relay
  stateless w.r.t. media while holding only the tiny call map in memory.
- Connection state changes (`connected` / `disconnected` / `failed`) surface to the UI as a quality
  indicator; call teardown (`end-call`) notifies both peers and releases the room.

**Why P2P + relayed signaling:** on rural 2G/3G the bottleneck is often the relay, not the peers.
Keeping media off the server means the server can't become the bottleneck; the signaling relay is
tiny JSON messages that fit in the smallest of pipes.

## 2. Offline sync queue

`src/services/sync-queue.ts` implements a durable, retrying, flush-on-reconnect queue.

- Every app mutation (`appointment.created`, `record.created`, `prescription.created`,
  `payment.created`, `message.created`, status updates) is written **twice**:
  1. to `localStorage` immediately (device stays authoritative while offline), and
  2. into the sync queue as a `QueuedOperation`.
- On the browser `online` event (or explicitly), `flush()`:
  - guards against concurrent flushes (`flushing` flag),
  - sends a batch (≤50 ops) to `POST /api/sync`,
  - on success removes acked ops from the queue; on failure increments `attempts` and retries later.
- The queue persists across reloads (same `localStorage` key), so a patient who loses connectivity
  mid-consultation doesn't lose the record they created.

**Why a queue and not a direct call:** direct calls fail on flaky networks with no memory of what
failed. A persistent queue turns "the network is down" from a user-facing error into a background
reconcile. This is the core SIH25018 requirement (poor connectivity) done properly.

## 3. Room onboarding (QR / room-code)

`src/services/room-service.ts` generates a 6-character code from an unambiguous alphabet
(excludes `0/O` and `1/I`) and persists active rooms in `localStorage`.

- **Doctor** creates a room → gets a `ConsultationRoom` (code + QR payload `sevamitra://join/<CODE>`).
- **Patient** enters the code or scans the QR (`room-onboarding.tsx` renders it via `qrcode.react`)
  → `joinRoom()` validates existence/status and binds the patient, moving the room to `in-consult`.
- `closeRoom()` prevents reuse.

**Why QR + code, not accounts:** rural users with low digital literacy cannot be expected to
register with email/password on a phone. A scan or a 6-character code is the shortest path to a live
consultation, and works entirely offline at the device level.

## 4. Data model & persistence

`src/types/app.ts` defines the domain: `SessionUser`, `Appointment`, `QueueItem`, `MedicalRecord`,
`Prescription`, `Payment`, `ChatMessage`.

`src/contexts/AppDataContext.tsx` is the single source of truth for the SPA:

- `loadState()` hydrates from `localStorage` (`sevamitra.data.v1`) or seeds demo data.
- Every mutator (`addAppointment`, `addRecord`, …) persists the new state **and** enqueues the
  corresponding sync operation in one step — so local state and the outbound queue can never drift.
- `pendingSyncCount` / `flushSync` are exposed to the UI (visible on the Consultations page).

## 5. Backend

`telemed-backend/server.js` (Express + Socket.IO):

| Route / event | Behavior |
|---------------|----------|
| `POST /api/sync` | Accepts a batch of offline operations; de-dupes by `op.id` (LRU-bounded), returns `{ accepted, skipped }`. |
| `GET /api/health` | Reports status + pending operation count (used by tests). |
| `register` | Binds a user id → socket id + availability. |
| `initiate-call` / `accept-call` / `reject-call` | Call lifecycle; relays to the relevant peer. |
| `webrtc-offer` / `webrtc-answer` / `ice-candidate` | Signaling relay. |
| `end-call` / `disconnect` | Teardown + session cleanup. |

The backend is deliberately small: media is P2P, state is device-local, and the server's only durable
responsibility is buffering sync flushes.

## 6. Multilingual support

`src/components/translations.tsx` holds full UI dictionaries for **English, Hindi, Punjabi**, and
`useTranslation(language)` returns the active dictionary. Triage rules and pharmacy data are
language-aware (keyword matching covers Hindi/Punjabi symptoms).

## 7. Testing

Unit tests (Vitest + jsdom) in `src/services/*.test.ts`:

- `sync-queue.test.ts` — enqueue, persistence across reloads, flush success/failure, in-flight
  guard, listener notification.
- `room-service.test.ts` — code generation (alphabet, no collisions), room lifecycle, error paths.
- `ai-symptom-service.test.ts` — specialist routing, urgency, multilingual keywords, likelihood cap.

Run: `npm test`.

## Design decisions at a glance

| Decision | Why |
|----------|-----|
| P2P media, relayed signaling | Server can't become a bandwidth bottleneck on 2G/3G |
| localStorage device-authoritative store | Survives drops; the PS demands offline-first |
| Persistent, retrying sync queue | Turns network failure into background reconcile |
| QR / 6-char room codes | Lowest-friction onboarding for low-digital-literacy users |
| No auth system for rooms | A room is a short-lived token; long-lived identity is a separate concern |
| Express stays small | Keeps the failure domain small; signals go over WS, durable data over HTTP |

## Known limitations

- **TURN is configurable, not bundled.** The client reads `VITE_TURN_URL` (+ optional
  `VITE_TURN_USERNAME`/`VITE_TURN_PASSWORD`); with no TURN configured it falls back to STUN-only and
  some calls behind strict symmetric NAT will fail. A production deployment must supply a TURN relay
  (self-hosted coturn or a managed provider).
- **Idempotency registry is in-memory and bounded.** `POST /api/sync` de-dupes by `op.id` with an
  LRU-bounded set (10k entries), so a retried batch whose response was lost is a no-op instead of a
  double-apply. After a server restart the dedupe window resets; a client that re-flushes a truly old
  batch could in principle replay it. Production would use a durable store (Redis or a DB table).
- **Call state is in-memory.** A server restart drops ringing/active call state. The server clears
  ring timeouts on restart and expires unanswered calls after 60s, and clients reconnect via
  Socket.IO auto-reconnect — but a call in flight at the exact moment of restart is lost and must be
  re-initiated.
