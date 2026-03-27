import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Search,
  FileText,
  Calendar,
  User,
  Clock,
  Stethoscope,
  Pill,
  Activity,
  Download,
  Eye,
  Filter,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useTranslation } from "./translations";

interface DoctorRecordsProps {
  language: string;
}

interface PatientRecord {
  id: number;
  patientName: string;
  age: number;
  gender: string;
  consultationDate: string;
  diagnosis: string;
  prescription: string[];
  vitals: {
    bloodPressure: string;
    temperature: string;
    heartRate: string;
    oxygenSaturation: string;
  };
  notes: string;
  followUpRequired: boolean;
  status: 'completed' | 'ongoing' | 'follow-up-needed';
  priority: 'low' | 'medium' | 'high';
}

export function DoctorRecords({ language }: DoctorRecordsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  const t = useTranslation(language);

  // Mock patient records data with multilingual support
  const getPatientRecords = (): PatientRecord[] => [
    {
      id: 1,
      patientName: language === 'en' ? "Rahul Sharma" : language === 'pa' ? "ਰਾਹੁਲ ਸ਼ਰਮਾ" : "राहुल शर्मा",
      age: 35,
      gender: "M",
      consultationDate: "2024-01-15",
      diagnosis: language === 'en' ? "Upper Respiratory Infection" : language === 'pa' ? "ਉਪਰਲੇ ਸਾਹ ਦੇ ਰਸਤੇ ਦੀ ਬਿਮਾਰੀ" : "ऊपरी श्वसन संक्रमण",
      prescription: [
        language === 'en' ? "Paracetamol 500mg - 3 times daily" : language === 'pa' ? "ਪੈਰਾਸਿਟਾਮੋਲ 500mg - ਦਿਨ ਵਿੱਚ 3 ਵਾਰ" : "पैरासिटामोल 500mg - दिन में 3 बार",
        language === 'en' ? "Amoxicillin 250mg - 2 times daily" : language === 'pa' ? "ਐਮੋਕਸਿਸਿਲਿਨ 250mg - ਦਿਨ ਵਿੱਚ 2 ਵਾਰ" : "एमोक्सिसिलिन 250mg - दिन में 2 बार"
      ],
      vitals: {
        bloodPressure: "120/80",
        temperature: "101.2°F",
        heartRate: "88 bpm",
        oxygenSaturation: "98%"
      },
      notes: language === 'en' ? "Patient complained of fever and cough for 3 days. Prescribed antibiotics and rest." : language === 'pa' ? "ਮਰੀਜ਼ ਨੇ 3 ਦਿਨਾਂ ਤੋਂ ਬੁਖਾਰ ਅਤੇ ਖੰਘ ਦੀ ਸ਼ਿਕਾਇਤ ਕੀਤੀ। ਐਂਟੀਬਾਇਓਟਿਕ ਅਤੇ ਆਰਾਮ ਦੀ ਸਲਾਹ ਦਿੱਤੀ।" : "मरीज़ ने 3 दिनों से बुखार और खांसी की शिकायत की। एंटीबायोटिक्स और आराम की सलाह दी।",
      followUpRequired: true,
      status: 'follow-up-needed',
      priority: 'medium'
    },
    {
      id: 2,
      patientName: language === 'en' ? "Sunita Devi" : language === 'pa' ? "ਸੁਨੀਤਾ ਦੇਵੀ" : "सुनीता देवी",
      age: 42,
      gender: "F",
      consultationDate: "2024-01-14",
      diagnosis: language === 'en' ? "Type 2 Diabetes - Regular Checkup" : language === 'pa' ? "ਟਾਈਪ 2 ਸ਼ੂਗਰ - ਨਿਯਮਤ ਚੈਕਅਪ" : "टाइप 2 मधुमेह - नियमित जांच",
      prescription: [
        language === 'en' ? "Metformin 500mg - Morning & Evening" : language === 'pa' ? "ਮੈਟਫਾਰਮਿਨ 500mg - ਸਵੇਰ ਅਤੇ ਸ਼ਾਮ" : "मेटफॉर्मिन 500mg - सुबह और शाम",
        language === 'en' ? "Continue current diet plan" : language === 'pa' ? "ਮੌਜੂਦਾ ਖੁਰਾਕ ਯੋਜਨਾ ਜਾਰੀ ਰੱਖੋ" : "वर्तमान आहार योजना जारी रखें"
      ],
      vitals: {
        bloodPressure: "130/85",
        temperature: "98.6°F",
        heartRate: "72 bpm",
        oxygenSaturation: "99%"
      },
      notes: language === 'en' ? "Blood sugar levels well controlled. Continue medication and diet. Next check in 3 months." : language === 'pa' ? "ਖੂਨ ਵਿੱਚ ਸ਼ੂਗਰ ਦਾ ਪੱਧਰ ਚੰਗੀ ਤਰ੍ਹਾਂ ਕੰਟਰੋਲ ਹੈ। ਦਵਾਈ ਅਤੇ ਖੁਰਾਕ ਜਾਰੀ ਰੱਖੋ। 3 ਮਹੀਨਿਆਂ ਵਿੱਚ ਅਗਲੀ ਜਾਂਚ।" : "रक्त शर्करा का स्तर अच्छी तरह नियंत्रित है। दवा और आहार जारी रखें। 3 महीने में अगली जांच।",
      followUpRequired: true,
      status: 'completed',
      priority: 'low'
    },
    {
      id: 3,
      patientName: language === 'en' ? "Amit Kumar" : language === 'pa' ? "ਅਮਿਤ ਕੁਮਾਰ" : "अमित कुमार",
      age: 28,
      gender: "M",
      consultationDate: "2024-01-13",
      diagnosis: language === 'en' ? "Acute Gastritis" : language === 'pa' ? "ਤੀਬਰ ਪੇਟ ਦੀ ਸੋਜ" : "तीव्र गैस्ट्राइटिस",
      prescription: [
        language === 'en' ? "Omeprazole 20mg - Before meals" : language === 'pa' ? "ਓਮੇਪ੍ਰਾਜ਼ੋਲ 20mg - ਖਾਣੇ ਤੋਂ ਪਹਿਲਾਂ" : "ओमेप्राजोल 20mg - खाने से पहले",
        language === 'en' ? "Avoid spicy food for 1 week" : language === 'pa' ? "1 ਹਫ਼ਤੇ ਤਕ ਮਸਾਲੇਦਾਰ ਖਾਣਾ ਨਾ ਖਾਓ" : "1 सप्ताह तक मसालेदार खाना न खाएं"
      ],
      vitals: {
        bloodPressure: "115/75",
        temperature: "98.4°F",
        heartRate: "76 bpm",
        oxygenSaturation: "99%"
      },
      notes: language === 'en' ? "Patient had severe stomach pain and nausea. Advised dietary changes and medication." : language === 'pa' ? "ਮਰੀਜ਼ ਨੂੰ ਪੇਟ ਵਿੱਚ ਤੇਜ਼ ਦਰਦ ਅਤੇ ਮਤਲੀ ਸੀ। ਖੁਰਾਕ ਵਿੱਚ ਬਦਲਾਅ ਅਤੇ ਦਵਾਈ ਦੀ ਸਲਾਹ ਦਿੱਤੀ।" : "मरीज़ को पेट में तेज़ दर्द और मतली थी। आहार में बदलाव और दवा की सलाह दी।",
      followUpRequired: false,
      status: 'completed',
      priority: 'medium'
    }
  ];

  const patientRecords = getPatientRecords();

  const filteredRecords = patientRecords.filter(record => {
    const matchesSearch = record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || record.priority === filterPriority;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'follow-up' && record.followUpRequired) ||
                      (activeTab === 'completed' && record.status === 'completed');
    
    return matchesSearch && matchesPriority && matchesTab;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'follow-up-needed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.patientRecords || 'Patient Records'}</h1>
          <p className="text-muted-foreground mt-1">
            {t.managePatientRecords || 'Manage and view your patient consultation records'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t.searchRecords || "Search patient records..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">{t.allPriorities || 'All Priorities'}</option>
            <option value="high">{t.high || 'High'}</option>
            <option value="medium">{t.medium || 'Medium'}</option>
            <option value="low">{t.low || 'Low'}</option>
          </select>
          
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            {t.filter || 'Filter'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">{t.allRecords || 'All Records'}</TabsTrigger>
          <TabsTrigger value="follow-up">{t.followUpRequired || 'Follow-up'}</TabsTrigger>
          <TabsTrigger value="completed">{t.completed || 'Completed'}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{record.patientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {record.age} {record.age > 1 ? t.years || 'years' : t.year || 'year'} • 
                          {record.gender === 'M' ? t.male || 'Male' : t.female || 'Female'}
                        </p>
                        <p className="text-sm font-medium text-blue-600 mt-1">{record.diagnosis}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(record.status)}>
                            {record.status === 'completed' ? t.completed || 'Completed' :
                             record.status === 'ongoing' ? t.ongoing || 'Ongoing' :
                             t.followUpNeeded || 'Follow-up Needed'}
                          </Badge>
                          <Badge className={getPriorityColor(record.priority)}>
                            {record.priority === 'high' ? t.high || 'High' :
                             record.priority === 'medium' ? t.medium || 'Medium' :
                             t.low || 'Low'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(record.consultationDate).toLocaleDateString()}
                        </p>
                        {record.followUpRequired && (
                          <p className="text-xs text-orange-600 flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {t.followUpRequired || 'Follow-up Required'}
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.view || 'View'}
                      </Button>
                    </div>
                  </div>

                  {selectedRecord?.id === record.id && (
                    <div className="mt-6 pt-6 border-t bg-gray-50 -mx-6 px-6 rounded-b-lg">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Vitals */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <Activity className="h-4 w-4 mr-2" />
                            {t.vitals || 'Vitals'}
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t.bloodPressure || 'BP'}:</span>
                              <span className="ml-2 font-medium">{record.vitals.bloodPressure}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t.temperature || 'Temp'}:</span>
                              <span className="ml-2 font-medium">{record.vitals.temperature}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t.heartRate || 'HR'}:</span>
                              <span className="ml-2 font-medium">{record.vitals.heartRate}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t.oxygenSaturation || 'SpO2'}:</span>
                              <span className="ml-2 font-medium">{record.vitals.oxygenSaturation}</span>
                            </div>
                          </div>
                        </div>

                        {/* Prescription */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <Pill className="h-4 w-4 mr-2" />
                            {t.prescription || 'Prescription'}
                          </h4>
                          <div className="space-y-2">
                            {record.prescription.map((med, index) => (
                              <div key={index} className="text-sm bg-white p-2 rounded border">
                                {med}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {t.doctorNotes || 'Doctor Notes'}
                        </h4>
                        <p className="text-sm text-muted-foreground bg-white p-3 rounded border">
                          {record.notes}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          {t.downloadReport || 'Download'}
                        </Button>
                        <Button size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          {t.scheduleFollowUp || 'Schedule Follow-up'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg mb-2">{t.noRecordsFound || 'No Records Found'}</h3>
                <p className="text-muted-foreground">
                  {t.noRecordsMessage || 'No patient records match your current search criteria.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}