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

interface DoctorDashboardProps {
  language: string;
}

export function DoctorDashboard({ language }: DoctorDashboardProps) {
  const t = useTranslation(language);

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
  const [webrtcService] = useState(() => {
    try {
      console.log('🔧 Creating WebRTC service for doctor...');
      return new WebRTCService();
    } catch (err) {
      console.error('❌ Failed to create WebRTC service:', err);
      setError('Failed to initialize video call service');
      return null;
    }
  });
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Sample doctor info - IMPORTANT: This must match what patient is calling
  const currentDoctor = {
    id: 'doctor_1', // This creates the ID that patient calls
    name: 'Dr. Priya Sharma',
    specialty: 'General Medicine'
  };

  // Dashboard data
  const todaysStats = {
    totalPatients: 12,
    waiting: 3,
    avgConsultationTime: 15,
    satisfaction: 4.8
  };

  const todaysPatients = [
    {
      id: 1,
      name: "Rajesh Kumar",
      age: 45,
      gender: 'M',
      appointmentTime: "09:00 AM",
      condition: "Diabetes Follow-up",
      symptoms: "Blood sugar monitoring",
      lastVisit: "2 weeks ago",
      waitTime: 0,
      status: "completed"
    },
    {
      id: 2,
      name: "Priya Singh",
      age: 32,
      gender: 'F',
      appointmentTime: "10:30 AM",
      condition: "Hypertension",
      symptoms: "High BP, headaches",
      lastVisit: "1 month ago",
      waitTime: 15,
      status: "waiting"
    },
    {
      id: 3,
      name: "Amit Sharma",
      age: 28,
      gender: 'M',
      appointmentTime: "11:00 AM",
      condition: "General Checkup",
      symptoms: "Annual health screening",
      lastVisit: null,
      waitTime: 45,
      status: "waiting"
    },
    {
      id: 4,
      name: "Anjali Devi",
      age: 58,
      gender: 'F',
      appointmentTime: "11:30 AM",
      condition: "Arthritis Management",
      symptoms: "Joint pain, stiffness",
      lastVisit: "3 months ago",
      waitTime: 0,
      status: "completed"
    },
    {
      id: 5,
      name: "Sanjay Gupta",
      age: 62,
      gender: 'M',
      appointmentTime: "12:00 PM",
      condition: "Cardiac Review",
      symptoms: "Chest discomfort, fatigue",
      lastVisit: "1 week ago",
      waitTime: 10,
      status: "waiting"
    }
  ];

  const consultationCalls = [
    {
      id: 1,
      patientName: "Rajesh Kumar",
      status: "completed",
      duration: 18
    },
    {
      id: 2,
      patientName: "Priya Singh",
      status: "ongoing",
      duration: 12
    }
  ];

  // Video call setup
  useEffect(() => {
    console.log('🏥 Doctor Dashboard mounting...');

    if (!webrtcService) {
      console.error('❌ WebRTC service not available');
      setError('Video call service not available');
      return;
    }

    try {
      console.log('📝 Registering doctor:', currentDoctor.id);

      // Register as doctor
      webrtcService.register(currentDoctor.id, 'doctor', {
        name: currentDoctor.name,
        specialty: currentDoctor.specialty
      });

      // Setup event listeners
      const socket = webrtcService.getSocket();

      socket.on('connect', () => {
        console.log('✅ Doctor connected to server:', socket.id);
        setConnectionStatus('connected');
        setError(null);
      });

      socket.on('connect_error', (err) => {
        console.error('🚫 Doctor connection error:', err);
        setConnectionStatus('disconnected');
        setError('Failed to connect to server. Please refresh the page.');
      });

      socket.on('disconnect', () => {
        console.log('❌ Doctor disconnected from server');
        setConnectionStatus('disconnected');
      });

      // Listen for incoming calls - THIS IS THE KEY EVENT
      socket.on('incoming-call', ({ callId, patientId, patientInfo }) => {
        console.log('📞 INCOMING CALL RECEIVED:', { callId, patientId, patientInfo });
        console.log('🔔 Setting incoming call state...');
        setIncomingCall({ callId, patientId, patientInfo });
      });

      // Add more detailed logging for debugging
      socket.on('call-initiated', (data) => {
        console.log('📞 Call initiated event received:', data);
      });

      socket.on('call-accepted', (data) => {
        console.log('✅ Call accepted event:', data);
      });

      socket.on('call-rejected', (data) => {
        console.log('❌ Call rejected event:', data);
      });

      // Handle remote stream
      webrtcService.onRemoteStream = (stream) => {
        console.log('📹 Received remote stream from patient');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      // Handle call ended
      webrtcService.onCallEnded = () => {
        console.log('📞 Call ended');
        endVideoCall();
      };

      // Handle connection state changes
      webrtcService.onConnectionStateChange = (state) => {
        console.log('🔗 Connection state changed:', state);
        setConnectionQuality(state === 'connected' ? 'good' : 'poor');
      };

      // Debug: Log all events
      const originalEmit = socket.emit;
      socket.emit = function (...args) {
        console.log('📤 Doctor sending:', args[0], args.slice(1));
        return originalEmit.apply(socket, args);
      };

      // Test connection after 2 seconds
      setTimeout(() => {
        if (socket.connected) {
          console.log('✅ Doctor connection verified');
        } else {
          console.log('❌ Doctor not connected after timeout');
          setError('Connection timeout. Please refresh the page.');
        }
      }, 3000);

    } catch (err) {
      console.error('❌ Error setting up doctor dashboard:', err);
      setError('Error setting up video call. Please refresh the page.');
    }

    return () => {
      console.log('🧹 Doctor dashboard cleanup');
      if (webrtcService) {
        webrtcService.disconnect();
      }
    };
  }, [webrtcService]);

  // Video call functions
  const acceptCall = async () => {
    if (incomingCall && webrtcService) {
      console.log('✅ Doctor accepting call from patient');

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

        console.log('✅ Call accepted successfully');
      } catch (error) {
        console.error('❌ Failed to accept call:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
      }
    }
  };

  const rejectCall = () => {
    if (incomingCall && webrtcService) {
      console.log('❌ Doctor rejecting call from patient');
      webrtcService.rejectCall(incomingCall.callId);
      setIncomingCall(null);
    }
  };

  const endVideoCall = () => {
    console.log('🔚 Ending video call');
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
            <h3 className="text-xl font-semibold mb-2 text-red-600">Doctor Dashboard Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
              Refresh Page
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
        <div className="absolute top-4 left-4 bg-black bg-opacity70 text-white p-4 rounded-lg min-w-64">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">Consultation in Progress</span>
          </div>
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-300">Patient:</span> {currentPatient?.name}</div>
            <div><span className="text-gray-300">Age:</span> {currentPatient?.age} years</div>
            <div><span className="text-gray-300">Condition:</span> {currentPatient?.condition}</div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {connectionQuality === 'good' ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm">
              {connectionQuality === 'good' ? 'Good connection' : 'Poor connection'}
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
    <div className="min-h-screen bg-gray-50">
      {/* Incoming call modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl animate-pulse">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-10 w-10 text-green-600 animate-bounce" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-600">
                📞 {t.incomingCall || 'Incoming Video Call'}
              </h3>
              <div className="space-y-2 mb-6 text-left">
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  <p><span className="font-medium text-gray-600">Patient:</span> {incomingCall.patientInfo.name}</p>
                  <p><span className="font-medium text-gray-600">Age:</span> {incomingCall.patientInfo.age} years</p>
                  <p><span className="font-medium text-gray-600">Condition:</span> {incomingCall.patientInfo.condition}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={acceptCall}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Accept Call
                </Button>
                <Button
                  onClick={rejectCall}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t.doctorDashboard || "Doctor Dashboard"}
              </h1>
              <p className="text-gray-600">Welcome back, {currentDoctor.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className={connectionStatus === 'connected' ?
                  "text-green-600 border-green-600" :
                  "text-red-600 border-red-600"
                }
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                {connectionStatus === 'connected' ? 'Available for calls' : 'Connection issue'}
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
      <div className="bg-white border-b">
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Wifi className="h-5 w-5" />
                    <span>Connection Status: {connectionStatus}</span>
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
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {t.todaysPatients || "Today's Patients"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{todaysStats.totalPatients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {t.waitingPatients || "Waiting"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{todaysStats.waiting}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Timer className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {t.avgTime || "Avg Time"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{todaysStats.avgConsultationTime}m</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {t.satisfaction || "Rating"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{todaysStats.satisfaction}</p>
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
                    Active Consultations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {consultationCalls
                      .filter(call => call.status === 'ongoing' || call.status === 'incoming')
                      .map((call) => (
                        <div key={call.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                            <div>
                              <p className="font-medium">{call.patientName}</p>
                              <p className="text-sm text-gray-600">
                                {call.status === 'ongoing' ? `${t.duration || 'Duration'}: ${call.duration}m` :
                                  call.status === 'incoming' ? t.incomingCall || 'Incoming Call' :
                                    t.missedCall || 'Missed Call'}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Video className="h-4 w-4 mr-2" />
                            {call.status === 'incoming' ? 'Answer' : 'Join'}
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
                <CardTitle>Today's Patient Queue</CardTitle>
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
                          <p className="text-sm text-gray-600">{patient.appointmentTime}</p>
                          <p className="text-sm text-gray-500">
                            {patient.age} {patient.age > 1 ? t.years || 'years' : t.year || 'year'} • {patient.gender === 'M' ? t.male || 'Male' : t.female || 'Female'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{patient.condition}</p>
                        <p className="text-sm text-gray-600">{patient.appointmentTime}</p>
                        {patient.waitTime > 0 && (
                          <Badge variant="outline" className="text-yellow-600">
                            {t.waiting || 'Waiting'}: {patient.waitTime}m
                          </Badge>
                        )}
                      </div>
                      <div className="text-right max-w-xs">
                        <p className="text-sm text-gray-600">{patient.symptoms}</p>
                        {patient.lastVisit && (
                          <p className="text-xs text-gray-500">
                            {t.lastVisit || 'Last Visit'}: {patient.lastVisit}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Records
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Video className="h-4 w-4 mr-2" />
                          Consult
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
              <CardTitle>Patient Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Patient List */}
                <div className="md:col-span-1 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">My Patients</h3>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" /> Filter
                    </Button>
                  </div>
                  {todaysPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-100 ${selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-300' : ''
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
                          <p className="text-sm text-gray-600">{patient.condition}</p>
                        </div>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <Badge className="bg-blue-500">Selected</Badge>
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
                          <span>{selectedPatient.name}'s Overview</span>
                          <Button variant="outline" size="sm">
                            <History className="h-4 w-4 mr-2" /> View History
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p><span className="font-medium">Age:</span> {selectedPatient.age} years</p>
                        <p><span className="font-medium">Gender:</span> {selectedPatient.gender === 'M' ? 'Male' : 'Female'}</p>
                        <p><span className="font-medium">Condition:</span> {selectedPatient.condition}</p>
                        <p><span className="font-medium">Symptoms:</span> {selectedPatient.symptoms}</p>
                        <p><span className="font-medium">Last Visit:</span> {selectedPatient.lastVisit || 'N/A'}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm">
                            <Video className="h-4 w-4 mr-2" /> Start Consultation
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" /> Full Records
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <VitalsDashboard language={language} />

                    <div className="animate-in delay-200">
                      <PrescriptionBuilder
                        patientName={selectedPatient.name}
                        language={language}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2 flex items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg border border-dashed text-gray-500">
                    <p className="text-center p-4">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      Select a patient from the list to view their details and manage their care.
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
              <CardTitle>Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {t.manageAppointments || "Manage your upcoming and past appointments."}
              </p>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'records' && (
          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {t.accessPatientRecords || "Access comprehensive patient records and consultation history"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}