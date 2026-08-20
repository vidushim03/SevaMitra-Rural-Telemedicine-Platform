import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Heart,
  Zap,
  Phone,
  Mic,
  MicOff,
  Upload,
  Download,
  Share,
  Calendar,
  Shield
} from "lucide-react";
import { useTranslation } from "./translations";
import { analyzeSymptoms as analyzeAI } from "../services/ai-symptom-service";
import type { SymptomAnalysis } from "../services/ai-symptom-service";

interface SymptomCheckerProps {
  language: string;
  onPageChange: (page: string) => void;
}

// FIXED: Properly declare Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

// FIXED: Proper typing with strict union types
interface AnalysisResults {
  urgencyLevel: 'emergency' | 'urgent' | 'routine';
  confidence: number;
  dataPointsUsed: number;
  possibleConditions: Array<{
    name: string;
    probability: number;
    description: string;
  }>;
  recommendations: string[];
  shouldSeeDoctor: boolean;
  isEmergency: boolean;
}

export function SymptomChecker({ language, onPageChange }: SymptomCheckerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [urgency, setUrgency] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<SymptomAnalysis | null>(null);

  // Enhanced features
  const [isListening, setIsListening] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [aiConfidence, setAiConfidence] = useState(85);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [severitySliderValue, setSeveritySliderValue] = useState(5);

  // NEW: Enhanced symptom selection
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomFilter, setSymptomFilter] = useState('');

  const t = useTranslation(language);

  // Emergency symptom detection
  const checkEmergencySymptoms = (symptoms: string) => {
    const emergencyKeywords = [
      'chest pain', 'difficulty breathing', 'severe headache', 'unconscious',
      'severe bleeding', 'stroke symptoms', 'heart attack', 'seizure',
      'गंभीर सीने में दर्द', 'सांस लेने में परेशानी', 'बेहोशी'
    ];

    return emergencyKeywords.some(keyword =>
      symptoms.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Enhanced common symptoms with categories - FIXED types
  const getSymptomCategories = () => ({
    respiratory: {
      name: t.respiratory || "Respiratory",
      symptoms: [
        { id: 'fever', label: t.fever, icon: Thermometer, color: 'bg-red-100 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:border-red-800 dark:hover:bg-red-900/50' },
        { id: 'cough', label: t.cough, icon: Zap, color: 'bg-orange-100 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:hover:bg-orange-900/50' },
        { id: 'breathing', label: t.breathingIssues, icon: Heart, color: 'bg-blue-100 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:hover:bg-blue-900/50' },
      ]
    },
    neurological: {
      name: t.neurological || "Neurological",
      symptoms: [
        { id: 'headache', label: t.headache, icon: Zap, color: 'bg-purple-100 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:hover:bg-purple-900/50' },
      ]
    },
    gastrointestinal: {
      name: t.gastrointestinal || "Gastrointestinal",
      symptoms: [
        { id: 'stomach', label: t.stomachPain, icon: AlertTriangle, color: 'bg-yellow-100 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:hover:bg-yellow-900/50' },
      ]
    },
    cardiovascular: {
      name: t.cardiovascular || "Cardiovascular",
      symptoms: [
        { id: 'chest', label: t.chestPain, icon: Heart, color: 'bg-red-100 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:border-red-800 dark:hover:bg-red-900/50' },
      ]
    }
  });

  // Enhanced symptom selection handler
  const handleSymptomToggle = (symptomId: string) => {
    const symptom = Object.values(getSymptomCategories())
      .flatMap(cat => cat.symptoms)
      .find(s => s.id === symptomId);

    if (symptom) {
      setSelectedSymptoms(prev => {
        if (prev.includes(symptomId)) {
          return prev.filter(id => id !== symptomId);
        } else {
          return [...prev, symptomId];
        }
      });

      // Update main symptoms state for form
      const allSelected = selectedSymptoms.includes(symptomId)
        ? selectedSymptoms.filter(id => id !== symptomId)
        : [...selectedSymptoms, symptomId];

      const symptomLabels = allSelected.map(id =>
        Object.values(getSymptomCategories())
          .flatMap(cat => cat.symptoms)
          .find(s => s.id === id)?.label
      ).filter(Boolean);

      setSymptoms(symptomLabels.join(', '));
    }
  };

  // FIXED: Filter symptoms based on search with proper typing
  const filteredCategories = () => {
    if (!symptomFilter) return getSymptomCategories();

    const filtered: Record<string, any> = {};
    Object.entries(getSymptomCategories()).forEach(([key, category]) => {
      const filteredSymptoms = category.symptoms.filter(symptom =>
        symptom.label.toLowerCase().includes(symptomFilter.toLowerCase())
      );
      if (filteredSymptoms.length > 0) {
        filtered[key] = { ...category, symptoms: filteredSymptoms };
      }
    });
    return filtered;
  };

  // Enhanced voice input functionality with better error handling
  const startVoiceInput = async () => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(t.speechNotSupported || 'Speech recognition is not supported in this browser. Please try Chrome, Safari, or Edge.');
      return;
    }

    // Check for microphone permissions first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up the stream
    } catch (permissionError) {
      console.error('❌ Microphone permission denied:', permissionError);
      
      // Show user-friendly permission instructions
      const permissionMessage = language === 'hi' 
        ? t.microphoneAccessRequired
        : language === 'pa'
        ? t.microphoneAccessRequired
        : t.microphoneAccessRequired;
      
      alert(permissionMessage);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('🎤 Speech recognition started');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        try {
          const transcript = event.results[0][0].transcript;
          setSymptoms(prev => prev ? `${prev} ${transcript}` : transcript);
          setIsListening(false);
          console.log('✅ Speech recognition result:', transcript);
          
          // Show success message
          const successMessage = language === 'hi' 
            ? t.voiceInputSuccessful
            : language === 'pa'
            ? t.voiceInputSuccessful
            : t.voiceInputSuccessful;
          
          // Could show a toast notification here instead of console
          console.log('✅', successMessage);
        } catch (error) {
          console.error('❌ Error processing speech result:', error);
          setIsListening(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = '';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = t.microphoneAccessDenied;
            break;
          case 'no-speech':
            errorMessage = t.noSpeechDetected;
            break;
          case 'audio-capture':
            errorMessage = t.microphoneNotAvailable;
            break;
          case 'network':
            errorMessage = t.networkErrorCheckConnection;
            break;
          default:
            errorMessage = t.speechRecognitionError;
        }
        
        alert(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('🎤 Speech recognition ended');
      };

      recognition.start();
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      
      const errorMessage = t.errorStartingVoiceInput;
      
      alert(errorMessage);
      setIsListening(false);
    }
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t.uploadImageOnly);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(t.imageSizeLimit);
        return;
      }

      setUploadedImage(file);
      console.log('📷 Image uploaded for symptom analysis:', file.name);
    }
  };

  // Enhanced: Analyze symptoms with AI Service
  const analyzeSymptoms = async () => {
    setIsAnalyzing(true);

    const isEmergency = checkEmergencySymptoms(symptoms);
    setShowEmergencyAlert(isEmergency);

    const aiRes = await analyzeAI(symptoms);
    setAiAnalysis(aiRes);

    setTimeout(() => {
      let urgencyLevel: 'emergency' | 'urgent' | 'routine';
      if (aiRes.urgency === 'emergency' || isEmergency) {
        urgencyLevel = 'emergency';
      } else if (aiRes.urgency === 'high' || aiRes.urgency === 'medium') {
        urgencyLevel = 'urgent';
      } else {
        urgencyLevel = 'routine';
      }

      const mockResults: AnalysisResults = {
        urgencyLevel,
        confidence: Math.round(aiRes.likelihood * 100),
        dataPointsUsed: 1247,
        possibleConditions: [
          { name: aiRes.specialist + ` ${t.consult}`, probability: Math.round(aiRes.likelihood * 100), description: aiRes.reasoning },
          { name: t.commonCold, probability: 75, description: t.commonColdDesc },
          { name: t.flu, probability: 60, description: t.fluDesc },
        ],
        recommendations: [
          `Consult a ${aiRes.specialist}`,
          t.drinkPlentyFluids,
          t.getAdequateRest,
          t.monitorSymptoms24to48Hours,
        ],
        shouldSeeDoctor: aiRes.urgency !== 'low',
        isEmergency
      };

      setResults(mockResults);
      setIsAnalyzing(false);
    }, 1500);
  };

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      symptoms: symptoms,
      severity: severitySliderValue,
      duration: duration,
      urgency: urgency,
      analysis: results,
      confidence: aiConfidence
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `symptom-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: t.healthAnalysisReport,
        text: `${t.symptomAnalysisUrgency}${results?.urgencyLevel}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`Health Analysis: ${results?.urgencyLevel} - ${symptoms}`)
        .then(() => alert(t.resultsCopiedToClipboard))
        .catch(() => console.error('Could not copy to clipboard'));
    }
  };

  const resetChecker = () => {
    setCurrentStep(1);
    setSymptoms('');
    setUrgency('');
    setDuration('');
    setSeverity('');
    setResults(null);
    setUploadedImage(null);
    setShowEmergencyAlert(false);
    setSeveritySliderValue(5);
    setSelectedSymptoms([]);
    setSymptomFilter('');
  };

  // Emergency Alert Component
  const EmergencyAlert = () => (
    <div className="bg-red-600 text-white p-4 rounded-lg animate-pulse mb-4 border-2 border-red-400">
      <div className="flex items-center mb-3">
        <AlertTriangle className="h-8 w-8 mr-3" />
        <div>
          <h3 className="font-bold text-lg">{t.emergencyDetected || 'Emergency Detected!'}</h3>
          <p className="text-sm">{t.callEmergencyNow || 'Call emergency services now!'}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button className="bg-white text-red-600 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-bold">
          📞 {t.call108}
        </Button>
        <Button
          onClick={() => onPageChange('consultation')}
          className="bg-yellow-500 text-red-800 hover:bg-yellow-400 font-bold"
        >
          🎥 {t.emergencyConsult}
        </Button>
      </div>
    </div>
  );

  // AI Confidence Display
  const AIConfidenceDisplay = () => {
    const confidence = results?.confidence ?? aiConfidence;
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2 flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          🤖 {t.aiAnalysisDetails || 'AI Analysis Details'}
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">{t.confidenceLevel || 'Confidence Level'}</span>
            <div className="flex items-center">
              <Progress value={confidence} className="w-20 mr-2" />
              <span className="text-sm font-medium">{confidence}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            {t.basedOnMedicalDatabase || 'Based on medical database:'} {results?.dataPointsUsed} {t.medicalReferences || 'medical references'}
          </p>
        </div>
      </div>
    );
  };

  // Doctor Recommendation Component
  const DoctorRecommendation = () => (
    <Card className="border-green-500 border-2 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-700 dark:text-green-300 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {t.recommendConsultation || 'Recommended: See a Doctor'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              {t.basedOnAnalysis || 'Based on your symptom analysis:'}
            </p>
            <p className="font-medium">
              {t.urgencyLevel || 'Urgency Level'}: {results?.urgencyLevel}
            </p>
          </div>
          <Button
            onClick={() => onPageChange('consultation')}
            className="bg-green-600 hover:bg-green-700"
          >
            🎥 {t.startVideoCall || 'Start Video Call'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Results display
  if (results) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              {t.analysisResults}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {showEmergencyAlert && <EmergencyAlert />}
            <AIConfidenceDisplay />

            <div className="flex items-center space-x-4">
              <Badge
                variant={results.urgencyLevel === 'emergency' ? 'destructive' :
                  results.urgencyLevel === 'urgent' ? 'default' : 'secondary'}
                className="text-lg px-4 py-2"
              >
                {results.urgencyLevel === 'emergency' ? t.emergency :
                  results.urgencyLevel === 'urgent' ? t.urgent : t.routine}
              </Badge>
            </div>

            {results.shouldSeeDoctor && <DoctorRecommendation />}

            <div>
              <h3 className="text-lg font-semibold mb-3">{t.possibleConditions}</h3>
              <div className="space-y-3">
                {results.possibleConditions.map((condition: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{condition.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{condition.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-3">
                          {condition.probability}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">{t.recommendations}</h3>
              <div className="space-y-2">
                {results.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <Button onClick={generateReport} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {t.downloadReport || 'Download Report'}
              </Button>
              <Button onClick={shareResults} variant="outline" className="flex-1">
                <Share className="h-4 w-4 mr-2" />
                {t.shareResults || 'Share Results'}
              </Button>
              <Button onClick={resetChecker} className="flex-1">
                {t.startNewAssessment}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced analyzing display
  if (isAnalyzing) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold mb-2">{t.analyzingSymptoms}</h2>
            <p className="text-gray-600 mb-4">{t.aiProcessingSymptoms}</p>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">🧠 {t.processingMedicalKnowledge}</div>
              <div className="text-sm text-gray-500">🔍 {t.analyzingSymptomPatterns}</div>
              <div className="text-sm text-gray-500">📊 {t.calculatingRiskAssessment}</div>
            </div>
            <Progress value={75} className="w-full mt-4" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t.mayTakeFewMoments}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stepText = t.stepOf?.replace('{current}', currentStep.toString()).replace('{total}', '4') || `Step ${currentStep} of 4`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-6 w-6 mr-2" />
            {t.checkSymptoms}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Progress value={(currentStep / 4) * 100} className="flex-1" />
            <span className="text-sm text-gray-600">{stepText}</span>
          </div>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {t.quickSymptomSelection}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t.selectOrDescribeSymptoms}
                </p>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t.searchSymptomsPlaceholder}
                  value={symptomFilter}
                  onChange={(e) => setSymptomFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Selected Symptoms Display */}
              {selectedSymptoms.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">{t.selectedSymptomsLabel}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map(symptomId => {
                      const symptom = Object.values(getSymptomCategories())
                        .flatMap(cat => cat.symptoms)
                        .find(s => s.id === symptomId);

                      if (!symptom) return null; // FIXED: Add null check

                      const IconComponent = symptom.icon; // FIXED: Rename to avoid JSX conflicts

                      return (
                        <div
                          key={symptomId}
                          className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          <IconComponent className="h-4 w-4" />
                          {symptom.label}
                          <button
                            onClick={() => handleSymptomToggle(symptomId)}
                            className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categorized Symptoms */}
              <div className="space-y-6">
                {Object.entries(filteredCategories()).map(([categoryKey, category]) => (
                  <div key={categoryKey}>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.symptoms.map((symptom: any) => {
                        const Icon = symptom.icon;
                        const isSelected = selectedSymptoms.includes(symptom.id);

                        return (
                          <button
                            key={symptom.id}
                            onClick={() => handleSymptomToggle(symptom.id)}
                            className={`
                              relative p-4 rounded-xl border-2 transition-all duration-200 
                              text-left group focus:outline-none focus:ring-2 focus:ring-blue-500
                              ${isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg transform scale-105'
                                : `${symptom.color} border-gray-200 text-gray-700 dark:text-gray-200 hover:shadow-md hover:transform hover:scale-105`
                              }
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`
                                p-2 rounded-lg ${isSelected ? 'bg-blue-700' : 'bg-white shadow-sm'}
                              `}>
                                <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                              </div>
                              <div className="flex-1">
                                <span className="font-medium text-sm block">
                                  {symptom.label}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Text Area */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {t.describeSymptoms}
                  </h4>
                  <div className="flex space-x-2">
                    <Button
                      onClick={startVoiceInput}
                      variant="outline"
                      size="sm"
                      disabled={isListening}
                      className="flex items-center space-x-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title={isListening ? t.listening : t.speakToType}
                    >
                      {isListening ? (
                        <>
                          <div className="animate-pulse h-2 w-2 bg-red-500 rounded-full"></div>
                          <MicOff className="h-4 w-4" />
                          <span>{t.listening}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          <span>{t.voiceInput}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Microphone Permission Help */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Mic className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-blue-800">
                      <p className="font-medium mb-1">
                        {t.toUseVoiceInput}
                      </p>
                      <p className="text-xs">
                        {t.voiceInputHelp}
                      </p>
                    </div>
                  </div>
                </div>

                <Textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={t.symptomsPlaceholder}
                  rows={4}
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors resize-none"
                />

                <div className="text-xs text-gray-500 text-right">
                  {symptoms.length}/500 {t.quantity}
                </div>
              </div>

              {/* Image Upload - Enhanced */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  📸 {t.visualSymptoms || 'Visual Symptoms'} ({t.optional || 'Optional'})
                </h4>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-gray-600 font-medium">
                          {t.uploadPhotoSymptoms || 'Upload photo of visible symptoms'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t.imageUploadHint || 'PNG, JPG up to 5MB • Helps with rashes, swelling, wounds'}
                        </p>
                      </div>
                    </div>
                  </label>
                  {uploadedImage && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          ✓ {t.imageUploaded || 'Image uploaded'}: {uploadedImage.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Helper Text */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  💡 {t.selectOrDescribeHelp || 'Select symptoms above or describe them in detail below'}
                </p>
              </div>

              {/* UPDATED: Navigation Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-6">
                <Button
                  variant="outline"
                  disabled
                  className="py-3 text-lg font-semibold rounded-xl opacity-50 cursor-not-allowed"
                >
                  {t.back || 'Back'}
                </Button>
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!symptoms.trim() && selectedSymptoms.length === 0}
                  className="py-3 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.next || 'Next'}
                  <span className="ml-2">→</span>
                </Button>
              </div>
            </div>
          )}

          {/* UPDATED: Step 2 with proper spacing and buttons */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {t.howLongSymptoms}
                </h3>
                <p className="text-gray-600">
                  {t.selectDurationOfSymptoms}
                </p>
              </div>

              <RadioGroup value={duration} onValueChange={setDuration} className="space-y-4">
                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="less-than-24h" id="less-than-24h" />
                  <Label htmlFor="less-than-24h" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold">{t.lessThan24Hours}</div>
                      <div className="text-sm text-gray-600">{t.recentOnsetSymptoms}</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="1-7-days" id="1-7-days" />
                  <Label htmlFor="1-7-days" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold">{t.days1to7}</div>
                      <div className="text-sm text-gray-600">{t.shortTermSymptoms}</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="more-than-week" id="more-than-week" />
                  <Label htmlFor="more-than-week" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold">{t.moreThanWeek}</div>
                      <div className="text-sm text-gray-600">{t.extendedDurationSymptoms}</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="chronic" id="chronic" />
                  <Label htmlFor="chronic" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold">{t.ongoingChronic}</div>
                      <div className="text-sm text-gray-600">{t.longTermRecurringSymptoms}</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="py-3 text-lg font-semibold rounded-xl"
                >
                  ← {t.back || 'Back'}
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={!duration}
                  className="py-3 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.next || 'Next'} →
                </Button>
              </div>
            </div>
          )}

          {/* UPDATED: Step 3 with proper spacing and buttons */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {t.howSevereSymptoms}
                </h3>
                <p className="text-gray-600">
                  {t.rateSeverityOfSymptoms}
                </p>
              </div>

              {/* Enhanced Severity Slider */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">{t.symptomSeverityScale}</Label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severitySliderValue}
                    onChange={(e) => setSeveritySliderValue(parseInt(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{t.mildScale}</span>
                    <span>{t.moderateScale}</span>
                    <span>{t.severeScale}</span>
                  </div>
                  <div className="text-center">
                    <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full text-lg font-bold">
                      {severitySliderValue}/10
                    </span>
                  </div>
                </div>
              </div>

              <RadioGroup value={severity} onValueChange={setSeverity} className="space-y-4">
                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="mild" id="mild" />
                  <Label htmlFor="mild" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-300">{t.mild}</div>
                      <div className="text-sm text-gray-600">{t.mildDescription}</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold text-yellow-700">{t.moderate}</div>
                      <div className="text-sm text-gray-600">{t.moderateDescription}</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="severe" id="severe" />
                  <Label htmlFor="severe" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold text-red-700">{t.severe}</div>
                      <div className="text-sm text-gray-600">{t.severeDescription}</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="py-3 text-lg font-semibold rounded-xl"
                >
                  ← {t.back || 'Back'}
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={!severity}
                  className="py-3 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.next || 'Next'} →
                </Button>
              </div>
            </div>
          )}

          {/* UPDATED: Step 4 with proper spacing and buttons */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {t.urgencyLevel}
                </h3>
                <p className="text-gray-600">
                  {t.howUrgentCondition}
                </p>
              </div>

              <RadioGroup value={urgency} onValueChange={setUrgency} className="space-y-4">
                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-300">{t.canWaitRegularAppointment || 'Can wait for regular appointment'}</div>
                      <div className="text-sm text-gray-600">{t.nonUrgentRoutine}</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold text-yellow-700">{t.shouldSeeDoctor1to2Days || 'Should see doctor in 1-2 days'}</div>
                      <div className="text-sm text-gray-600">{t.moderatelyUrgent}</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="flex-1 cursor-pointer text-lg">
                    <div>
                      <div className="font-semibold text-red-700">{t.needImmediateMedicalAttention || 'Need immediate medical attention'}</div>
                      <div className="text-sm text-gray-600">{t.urgentEmergencyCare}</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  className="py-3 text-lg font-semibold rounded-xl"
                >
                  ← {t.back || 'Back'}
                </Button>
                <Button
                  onClick={analyzeSymptoms}
                  disabled={!urgency}
                  className="py-3 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🧠 {t.analyzeSymptoms || 'Analyze Symptoms'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}