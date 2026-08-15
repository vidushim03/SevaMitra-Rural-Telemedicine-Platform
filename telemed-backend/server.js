const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Stores operations flushed from clients' offline sync queues
const syncedOperations = [];

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', pendingOps: syncedOperations.length });
});

app.post('/api/sync', (req, res) => {
    const operations = Array.isArray(req.body?.operations) ? req.body.operations : [];
    if (operations.length === 0) {
        return res.status(400).json({ error: 'No operations provided' });
    }
    syncedOperations.push(...operations.map((op) => ({
        ...op,
        receivedAt: new Date().toISOString()
    })));
    console.log(`Sync received ${operations.length} operation(s); total ${syncedOperations.length}`);
    res.json({ accepted: operations.length });
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
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.userId) {
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
