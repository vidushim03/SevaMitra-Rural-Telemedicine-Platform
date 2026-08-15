const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Stores operations flushed from clients' offline sync queues
const syncedOperations = [];

// Idempotency registry: de-duplicates retried sync posts. An operation that was
// acknowledged but whose response was lost is retried by the client with the same
// stable `id`; we keep a bounded set of seen ids so the retry is a no-op instead
// of double-applying. In-memory by design (see ARCHITECTURE.md) - use Redis or a
// DB table in production.
const seenOpIds = new Map();
const MAX_SEEN_IDS = 10000;

function isDuplicate(op) {
    if (!op || !op.id) return false;
    return seenOpIds.has(op.id);
}

function rememberOp(op) {
    if (!op || !op.id) return;
    if (!seenOpIds.has(op.id) && seenOpIds.size >= MAX_SEEN_IDS) {
        const oldestKey = seenOpIds.keys().next().value;
        seenOpIds.delete(oldestKey);
    }
    seenOpIds.set(op.id, Date.now());
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', pendingOps: syncedOperations.length });
});

app.post('/api/sync', (req, res) => {
    const operations = Array.isArray(req.body?.operations) ? req.body.operations : [];
    if (operations.length === 0) {
        return res.status(400).json({ error: 'No operations provided' });
    }

    let accepted = 0;
    let skippedDuplicates = 0;
    for (const op of operations) {
        if (isDuplicate(op)) {
            skippedDuplicates += 1;
            continue;
        }
        rememberOp(op);
        syncedOperations.push({
            ...op,
            receivedAt: new Date().toISOString()
        });
        accepted += 1;
    }

    console.log(`Sync received ${operations.length} operation(s) (${skippedDuplicates} duplicate); total ${syncedOperations.length}`);
    res.json({ accepted, skipped: skippedDuplicates });
});

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for local testing
        methods: ["GET", "POST"]
    }
});

// Store active calls and user sessions
const activeCalls = new Map();
const userSessions = new Map();

// Auto-expire calls that were never answered, so a ringing call cannot linger
// in the in-memory map forever after a participant drops.
const RING_TIMEOUT_MS = 60 * 1000;
const ringTimeouts = new Map();

function expireRingingCall(callId) {
    const call = activeCalls.get(callId);
    if (!call || call.status !== 'ringing') return;
    console.log(`Call ${callId} expired (not answered)`);
    const doctor = userSessions.get(call.doctorId);
    const patient = userSessions.get(call.patientId);
    if (patient) io.to(patient.socketId).emit('call-rejected');
    if (doctor) io.to(doctor.socketId).emit('call-ended');
    activeCalls.delete(callId);
    ringTimeouts.delete(callId);
}

function cleanupCallParticipant(userId) {
    for (const [callId, call] of activeCalls) {
        if (call.doctorId !== userId && call.patientId !== userId) continue;
        const otherId = call.doctorId === userId ? call.patientId : call.doctorId;
        const other = userSessions.get(otherId);
        if (other) io.to(other.socketId).emit('call-ended');
        activeCalls.delete(callId);
        const t = ringTimeouts.get(callId);
        if (t) clearTimeout(t);
        ringTimeouts.delete(callId);
    }
}

console.log('Starting signaling server...');

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User registration (doctor or patient)
    socket.on('register', ({ userId, userType, userInfo }) => {
        console.log(`Registering ${userType}:`, userId);
        userSessions.set(userId, {
            socketId: socket.id,
            userType,
            userInfo,
            status: 'available'
        });
        socket.userId = userId;
        socket.userType = userType;

        console.log('Active users:', Array.from(userSessions.keys()));
    });

    // Patient initiates call to doctor
    socket.on('initiate-call', ({ doctorId, patientId, patientInfo }) => {
        console.log(`Call initiated from patient ${patientId} to doctor ${doctorId}`);
        const doctor = userSessions.get(doctorId);

        if (doctor && doctor.status === 'available') {
            const callId = `call_${Date.now()}`;

            activeCalls.set(callId, {
                doctorId,
                patientId,
                status: 'ringing',
                createdAt: new Date()
            });
            ringTimeouts.set(callId, setTimeout(() => expireRingingCall(callId), RING_TIMEOUT_MS));

            console.log('Notifying doctor of incoming call');
            // Notify doctor of incoming call
            io.to(doctor.socketId).emit('incoming-call', {
                callId,
                patientId,
                patientInfo
            });

            // Confirm call initiation to patient
            socket.emit('call-initiated', { callId });
        } else {
            console.log('Doctor unavailable');
            socket.emit('doctor-unavailable');
        }
    });

    // Doctor accepts call
    socket.on('accept-call', ({ callId }) => {
        console.log('Doctor accepting call:', callId);
        const call = activeCalls.get(callId);
        if (call) {
            call.status = 'accepted';
            const t = ringTimeouts.get(callId);
            if (t) clearTimeout(t);
            ringTimeouts.delete(callId);
            const patient = userSessions.get(call.patientId);

            if (patient) {
                io.to(patient.socketId).emit('call-accepted', { callId });
            }
        }
    });

    // Doctor rejects call
    socket.on('reject-call', ({ callId }) => {
        console.log('Doctor rejecting call:', callId);
        const call = activeCalls.get(callId);
        if (call) {
            const patient = userSessions.get(call.patientId);
            if (patient) {
                io.to(patient.socketId).emit('call-rejected');
            }
            activeCalls.delete(callId);
            const t = ringTimeouts.get(callId);
            if (t) clearTimeout(t);
            ringTimeouts.delete(callId);
        }
    });

    // WebRTC signaling
    socket.on('webrtc-offer', ({ callId, offer }) => {
        console.log('Received WebRTC offer for call:', callId);
        const call = activeCalls.get(callId);
        if (call) {
            const targetUser = socket.userType === 'patient'
                ? userSessions.get(call.doctorId)
                : userSessions.get(call.patientId);

            if (targetUser) {
                io.to(targetUser.socketId).emit('webrtc-offer', { offer });
            }
        }
    });

    socket.on('webrtc-answer', ({ callId, answer }) => {
        console.log('Received WebRTC answer for call:', callId);
        const call = activeCalls.get(callId);
        if (call) {
            const targetUser = socket.userType === 'doctor'
                ? userSessions.get(call.patientId)
                : userSessions.get(call.doctorId);

            if (targetUser) {
                io.to(targetUser.socketId).emit('webrtc-answer', { answer });
            }
        }
    });

    socket.on('ice-candidate', ({ callId, candidate }) => {
        const call = activeCalls.get(callId);
        if (call) {
            const targetUser = socket.userType === 'patient'
                ? userSessions.get(call.doctorId)
                : userSessions.get(call.patientId);

            if (targetUser) {
                io.to(targetUser.socketId).emit('ice-candidate', { candidate });
            }
        }
    });

    // End call
    socket.on('end-call', ({ callId }) => {
        console.log('Ending call:', callId);
        const call = activeCalls.get(callId);
        if (call) {
            const doctor = userSessions.get(call.doctorId);
            const patient = userSessions.get(call.patientId);

            if (doctor) io.to(doctor.socketId).emit('call-ended');
            if (patient) io.to(patient.socketId).emit('call-ended');

            activeCalls.delete(callId);
            const t = ringTimeouts.get(callId);
            if (t) clearTimeout(t);
            ringTimeouts.delete(callId);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.userId) {
            cleanupCallParticipant(socket.userId);
            userSessions.delete(socket.userId);
        }
    });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, '0.0.0.0', () => {  // '0.0.0.0' is crucial!
    console.log(`Signaling server running on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);

    // Get and display your actual IP
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                console.log(`Network access: http://${interface.address}:${PORT}`);
            }
        }
    }
});

// Graceful shutdown: stop accepting new work and drain in-flight state so a
// Ctrl+C restart behaves predictably. Call state and the idempotency registry
// are intentionally in-memory - a restart resets ringing calls (by design) and
// the de-dupe window; clients replay unsynced ops from their local queue on the
// next flush.
function shutdown() {
    console.log('Shutting down gracefully...');
    for (const t of ringTimeouts.values()) clearTimeout(t);
    io.close(() => {
        server.close(() => process.exit(0));
    });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
