import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  Calendar, Clock, Star, User, Activity, Users,
  Stethoscope, FileText, Search, Filter, Wifi, WifiOff,
  Timer, TrendingUp, Heart, BarChart,
  History
} from "lucide-react";
import { useTranslation } from "./translations";
import { VitalsDashboard } from "./vitals-dashboard";
import { PrescriptionBuilder } from "./prescription-builder";
import { WebRTCService } from "../services/webrtc-service";
import { SessionUser } from "../types/app";
import { useAppData } from "../contexts/AppDataContext";

interface DoctorDashboardProps {
  language: string;
  user: SessionUser;
}

export function DoctorDashboard({ language, user }: DoctorDashboardProps) {
  const t = useTranslation(language);
  const { data } = useAppData();

  // Existing dashboard state
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null); // New state for selected patient

  // Video call state
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor'>('good');
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);

  // WebRTC service and video refs
  const [webrtcService, setWebrtcService] = useState<WebRTCService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const doctorInitiatedCallRef = useRef(false);

  // The logged-in doctor drives identity — no hardcoded doctor_1 fallback
  const currentDoctor = {
    id: user.id, // e.g. 'doctor_1'
    name: user.name,
    specialty: 'General Medicine'
  };

  // Dashboard data
  const myQueue = data.queue.filter((q) => q.doctorId === user.id);
  const waiting = myQueue.filter((q) => q.status === 'waiting' || q.status === 'ongoing').length;
  const myRecords = data.records.filter((r) => r.doctorId === user.id);
  const todaysStats = {
    totalPatients: myQueue.length,
    waiting,
    avgConsultationTime: 15,
    satisfaction: 4.8
  };

  // Build the doctor's today list from the real queue + appointments
  const todaysPatients = myQueue
    .map((q) => {
      const apt = data.appointments.find((a) => a.id === q.appointmentId);
      const rec = data.records.find((r) => r.patientId === q.patientId);
      const patientName = data.users.find((u) => u.id === q.patientId)?.name || q.patientId;
      return {
        id: q.id,
        patientUserId: q.patientId,
        name: patientName,
        age: 30,
        gender: 'M',
        appointmentTime: apt ? `${apt.date} ${apt.time}` : new Date(q.joinedAt).toLocaleTimeString(),
        condition: apt?.reason || 'General consultation',
        symptoms: rec?.diagnosis || 'No notes',
        lastVisit: rec ? new Date(rec.date).toLocaleDateString() : null,
        waitTime: 0,
        status: (q.status === 'ongoing' ? 'ongoing' : q.status === 'finished' ? 'completed' : 'waiting') as 'waiting' | 'ongoing' | 'completed',
      };
    })
    .sort((a, b) => (a.status === 'waiting' ? -1 : 1));

  const consultationCalls = myQueue
    .filter((q) => q.status === 'ongoing')
    .map((q, i) => ({
      id: i + 1,
      patientName: data.users.find((u) => u.id === q.patientId)?.name || q.patientId,
      status: 'ongoing' as const,
      duration: 0
    }));

  // Video call setup
  useEffect(() => {
    let service: WebRTCService;
    try {
      service = new WebRTCService();
      setWebrtcService(service);
    } catch (err) {
      setError(t.videoServiceInitFailed);
      return;
    }

    // Register the real logged-in doctor so incoming calls route to them
    service.register(currentDoctor.id, 'doctor', {
      name: currentDoctor.name,
      specialty: currentDoctor.specialty
    });

    // Setup event listeners
    const socket = service.getSocket();

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setError(null);
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
      setError(t.connectionFailedRefresh);
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('incoming-call', ({ callId, patientId, patientInfo }) => {
      setIncomingCall({ callId, patientId, patientInfo });
    });

    // Patient declined a doctor-initiated call
    socket.on('call-rejected', () => {
      doctorInitiatedCallRef.current = false;
      endVideoCall();
    });

    // Patient isn't online for a doctor-initiated call
    socket.on('patient-unavailable', () => {
      doctorInitiatedCallRef.current = false;
      endVideoCall();
      alert(t.patientUnavailable);
    });

    socket.on('call-accepted', async ({ callId }) => {
      // The patient accepted a doctor-initiated call: kick off WebRTC offer.
      try {
        if (service && doctorInitiatedCallRef.current) {
          await service.initiateCall(callId);
          doctorInitiatedCallRef.current = false;
        }
      } catch (err) {
        console.error('Error initiating call after patient accepted:', err);
      }
    });

    service.onRemoteStream = (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    service.onCallEnded = () => {
      endVideoCall();
    };

    service.onConnectionStateChange = (state) => {
      setConnectionQuality(state === 'connected' ? 'good' : 'poor');
    };

    // Test connection after 10 seconds to avoid premature timeout errors on slow starts
    const timer = setTimeout(() => { if (!socket.connected) { setError(t.connectionTimeout); } }, 10000);

    return () => { 
      clearTimeout(timer); 
      service.disconnect(); 
    };
  }, []);

  // Video call functions
  const acceptCall = async () => {
    if (incomingCall && webrtcService) {
      try {
        // Start local stream
        const localStream = await webrtcService.startLocalStream(isVideoEnabled, isAudioEnabled);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Accept the call
        webrtcService.acceptCall(incomingCall.callId);

        setIsInVideoCall(true);
        setCurrentPatient(incomingCall.patientInfo);
        setIncomingCall(null);
      } catch (error) {
        alert(t.cameraAccessFailed);
      }
    }
  };

  const rejectCall = () => {
    if (incomingCall && webrtcService) {
      webrtcService.rejectCall(incomingCall.callId);
      setIncomingCall(null);
    }
  };

  const endVideoCall = () => {
    if (webrtcService) {
      webrtcService.endCall();
    }
    setIsInVideoCall(false);
    setCurrentPatient(null);

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (webrtcService) {
      const newState = !isVideoEnabled;
      setIsVideoEnabled(newState);
      webrtcService.toggleVideo(newState);
    }
  };

  // Start a video consult for the given patient (their real user id, e.g. patient_demo)
  const startVideoCall = async (patient: { patientUserId?: string; id?: string; name: string; condition?: string }) => {
    if (!webrtcService) return;
    const patientUserId = patient.patientUserId || patient.id || '';
    setCurrentPatient({ ...patient, id: patientUserId });
    try {
      const localStream = await webrtcService.startLocalStream(isVideoEnabled, isAudioEnabled);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      // Notify the signaling server that this doctor is opening a consult with the patient.
      doctorInitiatedCallRef.current = true;
      const socket = webrtcService.getSocket();
      socket.emit('doctor-initiate-call', {
        doctorId: currentDoctor.id,
        patientId: patientUserId,
        patientInfo: { name: patient.name, condition: patient.condition || 'General consultation' },
      });
      setIsInVideoCall(true);
    } catch {
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const toggleAudio = () => {
    if (webrtcService) {
      const newState = !isAudioEnabled;
      setIsAudioEnabled(newState);
      webrtcService.toggleAudio(newState);
    }
  };

  // Show error message
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardContent className="p-8">
            <div className="text-red-500 mb-4 text-4xl">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-red-600">{t.doctorDashboardError}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
              {t.refreshPage}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Video call interface
  if (isInVideoCall) {
    return (
      <div className="min-h-screen bg-black relative">
        {/* Remote video (patient) - main screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Local video (doctor) - small overlay */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>

        {/* Patient info overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg min-w-64">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">{t.consultationInProgress}</span>
          </div>
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-300">{t.patientLabel}</span> {currentPatient?.name}</div>
            <div><span className="text-gray-300">{t.ageLabel}</span> {currentPatient?.age} {t.years}</div>
            <div><span className="text-gray-300">{t.conditionLabel}</span> {currentPatient?.condition}</div>
          </div>
          <div className="flex items-center gap-2 mt-3">
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
            onClick={endVideoCall}
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

  // Main dashboard interface
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Incoming call modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl animate-pulse">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-10 w-10 text-green-600 animate-bounce" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-600">
                📞 {t.incomingCall || 'Incoming Video Call'}
              </h3>
              <div className="space-y-2 mb-6 text-left">
                <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg space-y-1">
                  <p><span className="font-medium text-gray-600 dark:text-gray-300">{t.patientLabel}</span> {incomingCall.patientInfo.name}</p>
                  <p><span className="font-medium text-gray-600 dark:text-gray-300">{t.ageLabel}</span> {incomingCall.patientInfo.age} {t.years}</p>
                  <p><span className="font-medium text-gray-600 dark:text-gray-300">{t.conditionLabel}</span> {incomingCall.patientInfo.condition}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={acceptCall}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Video className="h-4 w-4 mr-2" />
                  {t.acceptCall}
                </Button>
                <Button
                  onClick={rejectCall}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  {t.decline}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t.doctorDashboard || "Doctor Dashboard"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">{t.welcomeBack.replace('{name}', currentDoctor.name)}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className={connectionStatus === 'connected' ?
                  "text-green-600 border-green-600" :
                  "text-red-600 border-red-600"
                }
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-50 dark:bg-green-900/200 animate-pulse' : 'bg-red-500'
                  }`}></div>
                {connectionStatus === 'connected' ? t.availableForCalls : t.connectionIssue}
              </Badge>
              <Avatar>
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="bg-blue-600 text-white">
                  {currentDoctor.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-zinc-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: t.dashboard || 'Dashboard', icon: Activity },
              { id: 'patients', label: t.patients || 'Patients', icon: Users },
              { id: 'appointments', label: t.appointments || 'Appointments', icon: Calendar },
              { id: 'records', label: t.records || 'Records', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedTab(id);
                  setSelectedPatient(null); // Clear selected patient when changing tabs
                }}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${selectedTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:border-gray-300'
                  }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Connection Status Debug */}
            {connectionStatus !== 'connected' && (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Wifi className="h-5 w-5" />
                    <span>{t.connectionStatusLabel} {connectionStatus}</span>
                    {connectionStatus === 'connecting' && <span className="animate-spin">⟳</span>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {t.todaysPatients || "Today's Patients"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todaysStats.totalPatients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {t.waitingPatients || "Waiting"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todaysStats.waiting}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                      <Timer className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {t.avgTime || "Avg Time"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todaysStats.avgConsultationTime}m</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {t.satisfaction || "Rating"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{todaysStats.satisfaction}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Calls */}
            {consultationCalls.some(call => call.status === 'ongoing' || call.status === 'incoming') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    {t.activeConsultations}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {consultationCalls
                      .filter(call => call.status === 'ongoing' || call.status === 'incoming')
                      .map((call) => (
                        <div key={call.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full mr-3 animate-pulse"></div>
                            <div>
                              <p className="font-medium">{call.patientName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {call.status === 'ongoing' ? `${t.duration || 'Duration'}: ${call.duration}m` :
                                  call.status === 'incoming' ? t.incomingCall || 'Incoming Call' :
                                    t.missedCall || 'Missed Call'}
                              </p>
                            </div>
                          </div>
                             <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Video className="h-4 w-4 mr-2" />
                            {call.status === 'incoming' ? t.answer : t.join}
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Patients */}
            <Card>
              <CardHeader>
                <CardTitle>{t.todaysPatientQueue}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{patient.appointmentTime}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {patient.age} {patient.age > 1 ? t.years || 'years' : t.year || 'year'} • {patient.gender === 'M' ? t.male || 'Male' : t.female || 'Female'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{patient.condition}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{patient.appointmentTime}</p>
                        {patient.waitTime > 0 && (
                          <Badge variant="outline" className="text-yellow-600">
                            {t.waiting || 'Waiting'}: {patient.waitTime}m
                          </Badge>
                        )}
                      </div>
                      <div className="text-right max-w-xs">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{patient.symptoms}</p>
                        {patient.lastVisit && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t.lastVisit || 'Last Visit'}: {patient.lastVisit}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedTab('records')}>
                          <FileText className="h-4 w-4 mr-2" />
                          {t.records}
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => startVideoCall(patient)}>
                          <Video className="h-4 w-4 mr-2" />
                          {t.consult}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Patients Tab Content */}
        {selectedTab === 'patients' && (
          <Card>
            <CardHeader>
              <CardTitle>{t.patientManagement}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Patient List */}
                <div className="md:col-span-1 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{t.myPatients}</h3>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                      <Filter className="h-4 w-4 mr-2" /> {t.filter}
                    </Button>
                  </div>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPatients}
                    className="w-full mb-3 rounded-lg border px-3 py-2 text-sm"
                  />
                  {todaysPatients
                    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((patient) => (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-100 ${selectedPatient?.id === patient.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' : ''
                        }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{patient.condition}</p>
                        </div>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <Badge className="bg-blue-100 dark:bg-blue-900/40">{t.selected}</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Patient Detail View */}
                {selectedPatient ? (
                  <div className="md:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{t.patientOverview.replace('{name}', selectedPatient.name)}</span>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTab('records')}>
                            <History className="h-4 w-4 mr-2" /> {t.viewHistory}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p><span className="font-medium">{t.ageLabel}</span> {selectedPatient.age} {t.years}</p>
                        <p><span className="font-medium">{t.genderLabel}</span> {selectedPatient.gender === 'M' ? t.male : t.female}</p>
                        <p><span className="font-medium">{t.conditionLabel}</span> {selectedPatient.condition}</p>
                        <p><span className="font-medium">{t.symptomsLabel}</span> {selectedPatient.symptoms}</p>
                        <p><span className="font-medium">{t.lastVisit}:</span> {selectedPatient.lastVisit || t.notAvailable}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => startVideoCall(selectedPatient)}>
                            <Video className="h-4 w-4 mr-2" /> {t.startConsultation}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedTab('records')}>
                            <FileText className="h-4 w-4 mr-2" /> {t.fullRecords}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <VitalsDashboard language={language} />

                    <div className="animate-in delay-200">
                      <PrescriptionBuilder
                        patientName={selectedPatient.name}
                        patientId={selectedPatient.id}
                        doctorId={user.id}
                        doctorName={user.name}
                        specialty={(user as any).specialty ?? 'General Physician'}
                        appointmentId={data.appointments.find(a => a.patientId === selectedPatient.id && a.doctorId === user.id)?.id}
                        language={language}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2 flex items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-zinc-900 rounded-lg border border-dashed text-gray-500 dark:text-gray-400">
                    <p className="text-center p-4">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      {t.selectPatientFromList}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other tabs content */}
        {selectedTab === 'appointments' && (
          <Card>
            <CardHeader>
              <CardTitle>{t.appointments}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                {t.manageAppointments || "Manage your upcoming and past appointments."}
              </p>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'records' && (
          <Card>
            <CardHeader>
              <CardTitle>{t.medicalRecords}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                {t.accessPatientRecords || "Access comprehensive patient records and consultation history"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
