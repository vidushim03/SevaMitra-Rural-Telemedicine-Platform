import { io } from "socket.io-client";

export class WebRTCService {
  localStream = null;
  remoteStream = null;
  currentCallId = "";

  constructor() {
    const serverUrl = this.getSignalingServerUrl();
    console.log("Initializing WebRTC service with signaling URL:", serverUrl);

    this.socket = io(serverUrl, {
      transports: ["polling", "websocket"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.peerConnection = this.createPeerConnection();
    this.setupPeerConnection();
    this.setupSocketListeners();
  }

  getSignalingServerUrl() {
    const envUrl = import.meta.env.VITE_SIGNALING_SERVER_URL;
    if (envUrl) {
      return envUrl;
    }

    if (typeof window !== "undefined" && window.location?.hostname) {
      return `http://${window.location.hostname}:4001`;
    }

    return "http://localhost:4001";
  }

  createPeerConnection() {
    const iceServers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUser = import.meta.env.VITE_TURN_USERNAME;
    const turnCredential = import.meta.env.VITE_TURN_PASSWORD;

    if (turnUrl) {
      const server = { urls: turnUrl };
      if (turnUser && turnCredential) {
        server.username = turnUser;
        server.credential = turnCredential;
      }
      iceServers.push(server);
    }

    return new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: "all",
    });
  }

  setupPeerConnection() {
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(this.remoteStream);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !this.currentCallId) return;

      this.socket.emit("ice-candidate", {
        callId: this.currentCallId,
        candidate: event.candidate,
      });
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      this.onConnectionStateChange?.(state);

      if (state === "disconnected" || state === "failed") {
        this.onCallEnded?.();
      }
    };
  }

  setupSocketListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to signaling server:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from signaling server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Signaling connection error:", error);
    });

    this.socket.on("webrtc-offer", async ({ offer }) => {
      try {
        await this.peerConnection.setRemoteDescription(offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.socket.emit("webrtc-answer", {
          callId: this.currentCallId,
          answer,
        });
      } catch (error) {
        console.error("Error handling WebRTC offer:", error);
      }
    });

    this.socket.on("webrtc-answer", async ({ answer }) => {
      try {
        await this.peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error("Error handling WebRTC answer:", error);
      }
    });

    this.socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    });

    this.socket.on("call-ended", () => {
      this.cleanup();
      this.onCallEnded?.();
    });

    this.socket.on("chat-message", (data) => {
      this.onChatMessage?.({
        ...data,
        timestamp: new Date(data.timestamp),
      });
    });
  }

  register(userId, userType, userInfo) {
    this.socket.emit("register", { userId, userType, userInfo });
  }

  async startLocalStream(videoEnabled = true, audioEnabled = true) {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: videoEnabled ? { width: 640, height: 480 } : false,
      audio: audioEnabled,
    });

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    return this.localStream;
  }

  async initiateCall(callId) {
    this.currentCallId = callId;

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit("webrtc-offer", {
        callId,
        offer,
      });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  callDoctor(doctorId, patientId, patientInfo) {
    this.socket.emit("initiate-call", {
      doctorId,
      patientId,
      patientInfo,
    });
  }

  acceptCall(callId) {
    this.currentCallId = callId;
    this.socket.emit("accept-call", { callId });
  }

  rejectCall(callId) {
    this.socket.emit("reject-call", { callId });
  }

  toggleVideo(enabled) {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled;
    }
  }

  toggleAudio(enabled) {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled;
    }
  }

  endCall() {
    this.socket.emit("end-call", { callId: this.currentCallId });
    this.cleanup();
  }

  sendMessage(text) {
    if (!this.currentCallId) return;
    const message = {
      callId: this.currentCallId,
      text,
      timestamp: new Date(),
    };
    this.socket.emit("chat-message", message);
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = this.createPeerConnection();
      this.setupPeerConnection();
    }

    this.currentCallId = "";
    this.remoteStream = null;
  }

  disconnect() {
    this.cleanup();
    this.socket.disconnect();
  }

  getSocket() {
    return this.socket;
  }
}
