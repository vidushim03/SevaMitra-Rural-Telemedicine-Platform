import os
import time
import socket
from datetime import datetime
from collections import OrderedDict
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import socketio
import uvicorn
import asyncio
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for REST endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store operations flushed from clients' offline sync queues
syncedOperations: List[Dict[str, Any]] = []

# Idempotency registry
seenOpIds = OrderedDict()
MAX_SEEN_IDS = 10000

def is_duplicate(op: Dict[str, Any]) -> bool:
    op_id = op.get("id")
    if not op_id:
        return False
    return op_id in seenOpIds

def remember_op(op: Dict[str, Any]):
    op_id = op.get("id")
    if not op_id:
        return
    if op_id not in seenOpIds and len(seenOpIds) >= MAX_SEEN_IDS:
        seenOpIds.popitem(last=False)  # pop oldest
    seenOpIds[op_id] = time.time()

@app.get("/api/health")
def health():
    return {"status": "ok", "pendingOps": len(syncedOperations)}

@app.post("/api/sync")
async def sync(request: Request):
    data = await request.json()
    operations = data.get("operations", [])
    
    if not operations or not isinstance(operations, list) or len(operations) == 0:
        return {"error": "No operations provided"}, 400

    accepted = 0
    skipped_duplicates = 0
    for op in operations:
        if is_duplicate(op):
            skipped_duplicates += 1
            continue
        remember_op(op)
        op_copy = dict(op)
        op_copy["receivedAt"] = datetime.utcnow().isoformat() + "Z"
        syncedOperations.append(op_copy)
        accepted += 1

    print(f"Sync received {len(operations)} operation(s) ({skipped_duplicates} duplicate); total {len(syncedOperations)}")
    return {"accepted": accepted, "skipped": skipped_duplicates}

class TriageRequest(BaseModel):
    symptoms: str

@app.post("/api/triage")
async def triage(request: TriageRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are a medical triage assistant for a rural telemedicine platform. 
    Analyze the following patient symptoms: "{request.symptoms}"
    
    Return a JSON object with exactly these fields:
    - specialist: The recommended doctor specialist (e.g. "Cardiologist", "General Physician").
    - specialtyCode: The code for the specialty (e.g. "cardiology", "general").
    - urgency: One of "low", "medium", "high", or "emergency".
    - likelihood: A float between 0 and 1 indicating confidence.
    - reasoning: A brief 1-2 sentence reasoning for this recommendation in the same language as the symptoms (English, Hindi, or Punjabi).
    
    Return ONLY valid JSON.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return Response(content=response.text, media_type="application/json")
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"error": str(e)}, 500

# Setup Socket.IO
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio, other_asgi_app=app)

# Store active calls and user sessions
activeCalls: Dict[str, Dict[str, Any]] = {}
userSessions: Dict[str, Dict[str, Any]] = {}

RING_TIMEOUT_MS = 60 * 1000
ringTimeouts: Dict[str, asyncio.TimerHandle] = {}

async def expire_ringing_call(callId: str):
    call = activeCalls.get(callId)
    if not call or call.get("status") != "ringing":
        return
    
    print(f"Call {callId} expired (not answered)")
    doctor = userSessions.get(call["doctorId"])
    patient = userSessions.get(call["patientId"])
    
    if patient:
        await sio.emit("call-rejected", room=patient["socketId"])
    if doctor:
        await sio.emit("call-ended", room=doctor["socketId"])
        
    if callId in activeCalls:
        del activeCalls[callId]
    if callId in ringTimeouts:
        del ringTimeouts[callId]

async def cleanup_call_participant(userId: str):
    calls_to_delete = []
    for callId, call in activeCalls.items():
        if call["doctorId"] != userId and call["patientId"] != userId:
            continue
        
        otherId = call["patientId"] if call["doctorId"] == userId else call["doctorId"]
        other = userSessions.get(otherId)
        if other:
            await sio.emit("call-ended", room=other["socketId"])
        
        calls_to_delete.append(callId)
        
        t = ringTimeouts.get(callId)
        if t:
            t.cancel()
            
    for callId in calls_to_delete:
        if callId in activeCalls:
            del activeCalls[callId]
        if callId in ringTimeouts:
            del ringTimeouts[callId]

@sio.event
async def connect(sid, environ):
    print('User connected:', sid)

@sio.event
async def register(sid, data):
    userId = data.get("userId")
    userType = data.get("userType")
    userInfo = data.get("userInfo")
    
    print(f"Registering {userType}: {userId}")
    
    # Store session info on the socket context using environ or a dict, 
    # but here we use a global dict keyed by sid for quick access
    async with sio.session(sid) as session:
        session['userId'] = userId
        session['userType'] = userType

    userSessions[userId] = {
        "socketId": sid,
        "userType": userType,
        "userInfo": userInfo,
        "status": "available"
    }
    
    print('Active users:', list(userSessions.keys()))

@sio.event
async def initiate_call(sid, data):
    # Matches 'initiate-call' in JS
    doctorId = data.get("doctorId")
    patientId = data.get("patientId")
    patientInfo = data.get("patientInfo")
    
    print(f"Call initiated from patient {patientId} to doctor {doctorId}")
    doctor = userSessions.get(doctorId)
    
    if doctor and doctor["status"] == "available":
        callId = f"call_{int(time.time() * 1000)}"
        
        activeCalls[callId] = {
            "doctorId": doctorId,
            "patientId": patientId,
            "status": "ringing",
            "createdAt": datetime.utcnow()
        }
        
        loop = asyncio.get_event_loop()
        ringTimeouts[callId] = loop.call_later(RING_TIMEOUT_MS / 1000.0, lambda: asyncio.create_task(expire_ringing_call(callId)))
        
        print("Notifying doctor of incoming call")
        await sio.emit("incoming-call", {
            "callId": callId,
            "patientId": patientId,
            "patientInfo": patientInfo
        }, room=doctor["socketId"])
        
        await sio.emit("call-initiated", {"callId": callId}, room=sid)
    else:
        print("Doctor unavailable")
        await sio.emit("doctor-unavailable", room=sid)

# We have to register events with hyphens manually
@sio.on('initiate-call')
async def on_initiate_call(sid, data):
    await initiate_call(sid, data)

@sio.on('doctor-initiate-call')
async def on_doctor_initiate_call(sid, data):
    doctorId = data.get("doctorId")
    patientId = data.get("patientId")
    patientInfo = data.get("patientInfo")
    
    print(f"Call initiated from doctor {doctorId} to patient {patientId}")
    patient = userSessions.get(patientId)
    
    if patient and patient["status"] == "available":
        callId = f"call_{int(time.time() * 1000)}"
        
        activeCalls[callId] = {
            "doctorId": doctorId,
            "patientId": patientId,
            "status": "ringing",
            "createdAt": datetime.utcnow()
        }
        
        loop = asyncio.get_event_loop()
        ringTimeouts[callId] = loop.call_later(RING_TIMEOUT_MS / 1000.0, lambda: asyncio.create_task(expire_ringing_call(callId)))
        
        print("Notifying patient of incoming call")
        await sio.emit("incoming-call", {
            "callId": callId,
            "patientId": patientId,
            "patientInfo": patientInfo
        }, room=patient["socketId"])
        
        await sio.emit("call-initiated", {"callId": callId}, room=sid)
    else:
        print("Patient unavailable")
        await sio.emit("patient-unavailable", room=sid)

@sio.on('accept-call')
async def on_accept_call(sid, data):
    callId = data.get("callId")
    print("Doctor accepting call:", callId)
    call = activeCalls.get(callId)
    
    if call:
        call["status"] = "accepted"
        t = ringTimeouts.get(callId)
        if t:
            t.cancel()
            del ringTimeouts[callId]
            
        patient = userSessions.get(call["patientId"])
        doctor = userSessions.get(call["doctorId"])
        
        if patient:
            await sio.emit("call-accepted", {"callId": callId}, room=patient["socketId"])
        if doctor:
            await sio.emit("call-accepted", {"callId": callId}, room=doctor["socketId"])

@sio.on('reject-call')
async def on_reject_call(sid, data):
    callId = data.get("callId")
    print("Doctor rejecting call:", callId)
    call = activeCalls.get(callId)
    
    if call:
        patient = userSessions.get(call["patientId"])
        doctor = userSessions.get(call["doctorId"])
        
        if patient:
            await sio.emit("call-rejected", room=patient["socketId"])
        if doctor:
            await sio.emit("call-rejected", room=doctor["socketId"])
            
        if callId in activeCalls:
            del activeCalls[callId]
        
        t = ringTimeouts.get(callId)
        if t:
            t.cancel()
            del ringTimeouts[callId]

@sio.on('webrtc-offer')
async def on_webrtc_offer(sid, data):
    callId = data.get("callId")
    offer = data.get("offer")
    print("Received WebRTC offer for call:", callId)
    
    call = activeCalls.get(callId)
    if call:
        async with sio.session(sid) as session:
            userType = session.get("userType")
            
        targetUserId = call["doctorId"] if userType == "patient" else call["patientId"]
        targetUser = userSessions.get(targetUserId)
        
        if targetUser:
            await sio.emit("webrtc-offer", {"offer": offer}, room=targetUser["socketId"])

@sio.on('webrtc-answer')
async def on_webrtc_answer(sid, data):
    callId = data.get("callId")
    answer = data.get("answer")
    print("Received WebRTC answer for call:", callId)
    
    call = activeCalls.get(callId)
    if call:
        async with sio.session(sid) as session:
            userType = session.get("userType")
            
        targetUserId = call["patientId"] if userType == "doctor" else call["doctorId"]
        targetUser = userSessions.get(targetUserId)
        
        if targetUser:
            await sio.emit("webrtc-answer", {"answer": answer}, room=targetUser["socketId"])

@sio.on('ice-candidate')
async def on_ice_candidate(sid, data):
    callId = data.get("callId")
    candidate = data.get("candidate")
    
    call = activeCalls.get(callId)
    if call:
        async with sio.session(sid) as session:
            userType = session.get("userType")
            
        targetUserId = call["doctorId"] if userType == "patient" else call["patientId"]
        targetUser = userSessions.get(targetUserId)
        
        if targetUser:
            await sio.emit("ice-candidate", {"candidate": candidate}, room=targetUser["socketId"])

@sio.on('end-call')
async def on_end_call(sid, data):
    callId = data.get("callId")
    print("Ending call:", callId)
    
    call = activeCalls.get(callId)
    if call:
        doctor = userSessions.get(call["doctorId"])
        patient = userSessions.get(call["patientId"])
        
        if doctor:
            await sio.emit("call-ended", room=doctor["socketId"])
        if patient:
            await sio.emit("call-ended", room=patient["socketId"])
            
        if callId in activeCalls:
            del activeCalls[callId]
            
        t = ringTimeouts.get(callId)
        if t:
            t.cancel()
            del ringTimeouts[callId]

@sio.event
async def disconnect(sid):
    print('User disconnected:', sid)
    async with sio.session(sid) as session:
        userId = session.get("userId")
        if userId:
            await cleanup_call_participant(userId)
            if userId in userSessions:
                del userSessions[userId]

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 4001))
    print(f"Signaling server running on port {PORT}")
    print(f"Local access: http://localhost:{PORT}")
    
    # Run using uvicorn
    uvicorn.run("main:sio_app", host="0.0.0.0", port=PORT, log_level="info")
