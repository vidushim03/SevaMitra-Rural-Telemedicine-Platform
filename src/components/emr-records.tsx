import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  FileText, 
  Download, 
  Upload, 
  Calendar, 
  User, 
  Stethoscope,
  Pill,
  TestTube,
  WifiOff,
  Wifi,
  Search,
  Plus
} from "lucide-react";
import { useTranslation } from "./translations";

interface EMRRecordsProps {
  language: string;
}

export function EMRRecords({ language }: EMRRecordsProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  
  const t = useTranslation(language);

  const getMedicalRecords = () => [
    {
      id: 1,
      date: "2024-01-15",
      type: "consultation",
      doctor: t.drPriyaSharma,
      diagnosis: t.commonColdDiagnosis,
      symptoms: t.feverCoughHeadache,
      prescription: [
        { medicine: t.paracetamol, dosage: "500mg", frequency: t.thriceDaily, duration: t.fiveDays },
        { medicine: t.coughSyrup, dosage: "10ml", frequency: t.thriceDaily, duration: t.sevenDays }
      ],
      notes: t.patientAdvisedRest,
      followUp: "2024-01-22",
      synced: true
    },
    {
      id: 2,
      date: "2024-01-20",
      type: "lab_test",
      doctor: t.drRajeshKumar, 
      testName: t.completBloodCount,
      results: {
        [t.hemoglobin]: "12.5 g/dL",
        [t.wbc]: "7500 cells/mcL",
        [t.platelets]: "250000 cells/mcL"
      },
      status: t.normal,
      synced: true
    },
    {
      id: 3,
      date: "2024-01-25",
      type: "consultation",
      doctor: t.drManjeetSingh,
      diagnosis: t.hypertensionFollowUp,
      symptoms: t.mildHeadacheTired,
      prescription: [
        { medicine: t.amlodipine, dosage: "5mg", frequency: t.onceDaily, duration: t.thirtyDays }
      ],
      bloodPressure: "140/90 mmHg",
      notes: t.continueLifestyleModifications,
      followUp: "2024-02-25",
      synced: false // Not synced yet (offline entry)
    }
  ];

  const medicalRecords = getMedicalRecords();

  const filteredRecords = medicalRecords.filter(record => 
    record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.testName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const syncOfflineData = () => {
    // Simulate syncing offline data
    console.log("Syncing offline data...");
  };

  const downloadRecord = (recordId: number) => {
    console.log("Downloading record:", recordId);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2">{t.records}</h1>
            <p className="text-muted-foreground">{t.completeMedicalHistory}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Offline/Online Status */}
            <Badge variant={isOffline ? "destructive" : "secondary"} className="gap-2">
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              {isOffline ? t.offlineMode : t.online}
            </Badge>
            
            {/* Sync Button */}
            {isOffline && (
              <Button onClick={syncOfflineData} variant="outline" size="lg">
                <Upload className="w-5 h-5 mr-2" />
                {t.syncData}
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder={t.searchRecordsPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-2"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Records List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t.medicalRecords}</span>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.addRecord}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRecords.map((record) => (
                    <Card 
                      key={record.id} 
                      className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                        selectedRecord?.id === record.id ? 'border-primary' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {record.type === 'consultation' ? (
                              <Stethoscope className="w-5 h-5 text-blue-500" />
                            ) : (
                              <TestTube className="w-5 h-5 text-green-500" />
                            )}
                            <h3 className="font-medium">
                              {record.diagnosis || record.testName}
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!record.synced && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                {t.offline}
                              </Badge>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadRecord(record.id);
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(record.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{record.doctor}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Record Details */}
          <div className="lg:col-span-1">
            {selectedRecord ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedRecord.type === 'consultation' ? (
                      <Stethoscope className="w-5 h-5 text-blue-500" />
                    ) : (
                      <TestTube className="w-5 h-5 text-green-500" />
                    )}
                    {t.recordDetails}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="overview">{t.overview}</TabsTrigger>
                      <TabsTrigger value="prescription">{t.treatment}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4 mt-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">{t.date}</Label>
                        <p>{new Date(selectedRecord.date).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">{t.doctor}</Label>
                        <p>{selectedRecord.doctor}</p>
                      </div>
                      
                      {selectedRecord.diagnosis && (
                        <div>
                          <Label className="text-sm text-muted-foreground">{t.diagnosis}</Label>
                          <p>{selectedRecord.diagnosis}</p>
                        </div>
                      )}
                      
                      {selectedRecord.symptoms && (
                        <div>
                          <Label className="text-sm text-muted-foreground">{t.symptoms}</Label>
                          <p>{selectedRecord.symptoms}</p>
                        </div>
                      )}
                      
                      {selectedRecord.bloodPressure && (
                        <div>
                          <Label className="text-sm text-muted-foreground">{t.bloodPressure}</Label>
                          <p>{selectedRecord.bloodPressure}</p>
                        </div>
                      )}
                      
                      {selectedRecord.results && (
                        <div>
                          <Label className="text-sm text-muted-foreground">{t.testResults}</Label>
                          <div className="space-y-1 text-sm">
                            {Object.entries(selectedRecord.results).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span>{key}:</span>
                                <span>{value as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedRecord.notes && (
                        <div>
                          <Label className="text-sm text-muted-foreground">{t.notes}</Label>
                          <p className="text-sm">{selectedRecord.notes}</p>
                        </div>
                      )}
                      
                      {selectedRecord.followUp && (
                        <div>
                          <Label className="text-sm text-muted-foreground">{t.followUp}</Label>
                          <p>{new Date(selectedRecord.followUp).toLocaleDateString()}</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="prescription" className="space-y-4 mt-4">
                      {selectedRecord.prescription ? (
                        <div className="space-y-3">
                          {selectedRecord.prescription.map((med: any, index: number) => (
                            <Card key={index}>
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Pill className="w-4 h-4 text-purple-500" />
                                  <h4 className="font-medium">{med.medicine}</h4>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span>{t.dosage}:</span>
                                    <span>{med.dosage}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{t.frequency}:</span>
                                    <span>{med.frequency}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{t.duration}:</span>
                                    <span>{med.duration}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          {t.noPrescriptionAvailable}
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg mb-2">{t.selectRecord}</h3>
                  <p className="text-muted-foreground">
                    {t.clickRecordToView}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}