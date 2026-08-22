import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Calendar, Clock, Star, User, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "./translations";
import { WebRTCService } from "../services/webrtc-service";
import { SessionUser } from "../types/app";

interface DoctorConsultationProps {
  language: string;
  user: SessionUser;
}

export function DoctorConsultation({ language, user }: DoctorConsultationProps) {
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor'>('good');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const [webrtcService, setWebrtcService] = useState<WebRTCService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // True when this patient is answering a doctor-initiated call (doctor creates the offer)
  const patientInitiatedCallRef = useRef(true);

  const t = useTranslation(language);

  // The logged-in patient drives identity — no more hardcoded "John Doe"
  const currentPatient = {
    id: user.id,
    name: user.name,
    age: 30,
    condition: 'General consultation'
  };

  const availableDoctors = [
    {
      id: 1,
      name: t.drPriyaSharma,
      specialty: t.generalMedicine,
      rating: 4.8,
      experience: `15 ${t.years}`,
      languages: [t.hindi, t.english, t.punjabi],
      available: true,
      consultationFee: "₹300"
    },
    {
      id: 2,
      name: t.drRajeshKumar,
      specialty: t.pediatrics,
      rating: 4.9,
      experience: `12 ${t.years}`,
      languages: [t.hindi, t.english],
      available: true,
      consultationFee: "₹400"
    },
    {
      id: 3,
      name: t.drManjeetSingh,
      specialty: t.cardiology,
      rating: 4.7,
      experience: `20 ${t.years}`,
      languages: [t.punjabi, t.hindi, t.english],
      available: false,
      consultationFee: "₹600"
    }
  ];

  useEffect(() => {
    const service = new WebRTCService();
    setWebrtcService(service);

    // Register the real patient so the doctor's signaling server sees them
    service.register(currentPatient.id, 'patient', {
      name: currentPatient.name,
      age: currentPatient.age,
      condition: currentPatient.condition
    });

    // Setup event listeners
    const socket = service.getSocket();

    socket.on('call-initiated', ({ callId }) => {
      setCurrentCallId(callId);
      setCallStatus('ringing');
    });

    socket.on('call-accepted', async ({ callId }) => {
      // When the doctor initiated the call, this patient already started the
      // stream + accepted in the incoming-call UI — nothing further to do here.
      if (!patientInitiatedCallRef.current) return;

      setCallStatus('connected');
      setIsInCall(true);

      try {
        // Start local stream and initiate WebRTC
        const localStream = await service.startLocalStream(isVideoEnabled, isAudioEnabled);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Initiate WebRTC call
        await service.initiateCall(callId);
      } catch (error) {
        alert(t.cameraAccessFailed);
      }
    });

    socket.on('call-rejected', () => {
      alert(t.doctorUnavailable);
      setCallStatus('idle');
      setCurrentCallId(null);
    });

    socket.on('doctor-unavailable', () => {
      alert(t.doctorUnavailable);
      setCallStatus('idle');
    });

    // A doctor can also initiate a call to this patient (from the doctor dashboard)
    socket.on('incoming-call', ({ callId, doctorId, patientInfo }) => {
      patientInitiatedCallRef.current = false;
      setIncomingCall({ callId, doctorId, patientInfo });
    });

    // Handle remote stream
    service.onRemoteStream = (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Handle call ended
    service.onCallEnded = () => {
      endCall();
    };

    // Handle connection state changes
    service.onConnectionStateChange = (state) => {
      setConnectionQuality(state === 'connected' ? 'good' : 'poor');
    };

    return () => {
      service.disconnect();
    };
  }, []);

  const startConsultation = async (doctorId: number) => {
    if (callStatus !== 'idle') return;

    patientInitiatedCallRef.current = true;
    setCallStatus('calling');

    // Ring the real seeded doctor account (doctor_1, doctor_2, ...) using the
    // logged-in patient's identity
    webrtcService.callDoctor(
      `doctor_${doctorId}`,
      currentPatient.id,
      {
        name: currentPatient.name,
        age: currentPatient.age,
        condition: currentPatient.condition
      }
    );
  };

  const endCall = () => {
    webrtcService.endCall();
    setIsInCall(false);
    setCallStatus('idle');
    setCurrentCallId(null);

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Answer a doctor-initiated call
  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      const localStream = await webrtcService.startLocalStream(isVideoEnabled, isAudioEnabled);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      // Sets currentCallId + tells the signaling server the call is accepted
      webrtcService.acceptCall(incomingCall.callId);
      setCurrentCallId(incomingCall.callId);
      setIncomingCall(null);
      setCallStatus('connected');
      setIsInCall(true);
    } catch (error) {
      alert(t.cameraAccessFailed);
    }
  };

  // Decline a doctor-initiated call
  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    webrtcService.rejectCall(incomingCall.callId);
    setIncomingCall(null);
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    webrtcService.toggleVideo(newState);
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    webrtcService.toggleAudio(newState);
  };

  // Video call interface
  if (isInCall) {
    return (
      <div className="min-h-screen bg-black relative">
        {/* Remote video (doctor) - main screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />

        {/* Local video (patient) - small overlay */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />
        </div>

        {/* Call info overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>{t.connectedWithDoctor}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {connectionQuality === 'good' ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm">
              {connectionQuality === 'good' ? t.goodConnection : t.poorConnection}
            </span>
          </div>
        </div>

        {/* Call controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <Button
            onClick={toggleVideo}
            size="lg"
            variant={isVideoEnabled ? "default" : "destructive"}
            className="rounded-full h-14 w-14"
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>

          <Button
            onClick={toggleAudio}
            size="lg"
            variant={isAudioEnabled ? "default" : "destructive"}
            className="rounded-full h-14 w-14"
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          <Button
            onClick={endCall}
            size="lg"
            variant="destructive"
            className="rounded-full h-14 w-14 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  // Calling/Ringing interface
  if (callStatus === 'calling' || callStatus === 'ringing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardContent className="p-8">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-12 w-12 text-green-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {callStatus === 'calling' ? t.callingDoctor : t.doctorBeingNotified}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {callStatus === 'calling'
                ? t.pleaseWaitConnect
                : t.pleaseWaitAccept
              }
            </p>
            <Button onClick={() => {
              setCallStatus('idle');
              setCurrentCallId(null);
            }} variant="outline">
              {t.cancelCall}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main consultation interface (existing code with updated button)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-950 dark:to-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.consultWithDoctor}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t.selectAvailableDoctor}</p>
        </div>

        {incomingCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-96 text-center">
              <CardContent className="p-8">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-12 w-12 text-green-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.incomingDoctorCall}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {incomingCall.patientInfo?.name || t.yourDoctor} would like to start a video consultation with you.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={rejectIncomingCall}
                    variant="destructive"
                    className="rounded-full h-14 w-14"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                  <Button
                    onClick={acceptIncomingCall}
                    className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDoctors.map((doctor) => (
            <Card key={doctor.id} className={`transition-all duration-200 hover:shadow-lg ${!doctor.available ? 'opacity-60' : 'hover:scale-105'}`}>
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={`/api/placeholder/80/80`} />
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{doctor.name}</CardTitle>
                <p className="text-gray-600 dark:text-gray-300">{doctor.specialty}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t.rating}</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium">{doctor.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t.experience}</span>
                    <span className="font-medium">{doctor.experience}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t.fee}</span>
                    <span className="font-bold text-green-600">{doctor.consultationFee}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t.languages}:</p>
                  <div className="flex flex-wrap gap-1">
                    {doctor.languages.map((lang, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {doctor.available ? (
                  <Button
                    onClick={() => startConsultation(doctor.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={callStatus !== 'idle'}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {callStatus !== 'idle' ? t.connecting : t.startVideoCall}
                  </Button>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="destructive" className="mb-2">{t.unavailable}</Badge>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.allDoctorsBusy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
