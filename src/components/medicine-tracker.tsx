import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  Pill, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Calendar,
  Timer,
  Bell,
  Trash2
} from "lucide-react";
import { useTranslation } from "./translations";

interface MedicineTrackerProps {
  language: string;
}

export function MedicineTracker({ language }: MedicineTrackerProps) {
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const t = useTranslation(language);

  const medicines = [
    {
      id: 1,
      name: "Paracetamol",
      dosage: "500mg",
      frequency: "3 times daily",
      timings: ["08:00", "14:00", "20:00"],
      duration: "5 days",
      startDate: "2024-01-20",
      endDate: "2024-01-25",
      totalDoses: 15,
      takenDoses: 12,
      missedDoses: 1,
      nextDose: "20:00",
      status: "active",
      instructions: "Take with food",
      sideEffects: "Nausea if taken on empty stomach"
    },
    {
      id: 2,
      name: "Amlodipine",
      dosage: "5mg",
      frequency: "Once daily",
      timings: ["08:00"],
      duration: "30 days",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      totalDoses: 30,
      takenDoses: 25,
      missedDoses: 2,
      nextDose: "08:00",
      status: "active",
      instructions: "Take at the same time daily",
      sideEffects: "May cause dizziness"
    },
    {
      id: 3,
      name: "Cough Syrup",
      dosage: "10ml",
      frequency: "3 times daily",
      timings: ["08:00", "14:00", "20:00"],
      duration: "7 days",
      startDate: "2024-01-15",
      endDate: "2024-01-22",
      totalDoses: 21,
      takenDoses: 21,
      missedDoses: 0,
      nextDose: null,
      status: "completed",
      instructions: "Shake well before use",
      sideEffects: "May cause drowsiness"
    }
  ];

  const todaysDoses = [
    {
      medicineId: 1,
      medicine: "Paracetamol",
      dosage: "500mg",
      scheduledTime: "08:00",
      status: "taken",
      takenTime: "08:15"
    },
    {
      medicineId: 1,
      medicine: "Paracetamol", 
      dosage: "500mg",
      scheduledTime: "14:00",
      status: "taken",
      takenTime: "14:10"
    },
    {
      medicineId: 1,
      medicine: "Paracetamol",
      dosage: "500mg", 
      scheduledTime: "20:00",
      status: "pending",
      takenTime: null
    },
    {
      medicineId: 2,
      medicine: "Amlodipine",
      dosage: "5mg",
      scheduledTime: "08:00", 
      status: "taken",
      takenTime: "08:00"
    }
  ];

  const markDoseTaken = (medicineId: number, scheduledTime: string) => {
    console.log("Marking dose taken:", medicineId, scheduledTime);
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const calculateCompliance = (medicine: any) => {
    const totalExpected = medicine.takenDoses + medicine.missedDoses;
    return totalExpected > 0 ? Math.round((medicine.takenDoses / totalExpected) * 100) : 0;
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl mb-2">{t.medicines}</h1>
            <p className="text-muted-foreground">{t.trackSchedule}</p>
          </div>
          
          <Button size="lg" onClick={() => setShowAddForm(true)}>
            <Plus className="w-5 h-5 mr-2" />
            {t.addMedicine}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">{t.todaysDoses}</TabsTrigger>
                <TabsTrigger value="medicines">{t.myMedicines}</TabsTrigger>
                <TabsTrigger value="history">{t.history}</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-6 h-6" />
                      {t.todaysSchedule}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {todaysDoses.map((dose, index) => (
                        <Card key={index} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full bg-purple-100">
                                  <Pill className="w-6 h-6 text-purple-600" />
                                </div>
                                
                                <div>
                                  <h3 className="font-medium">{dose.medicine}</h3>
                                  <p className="text-sm text-muted-foreground">{dose.dosage}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Timer className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{dose.scheduledTime}</span>
                                    {dose.status === 'taken' && dose.takenTime && (
                                      <span className="text-sm text-green-600">
                                        ({t.takenAt} {dose.takenTime})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {dose.status === 'taken' ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {t.taken}
                                  </Badge>
                                ) : (
                                  <Button 
                                    size="lg"
                                    onClick={() => markDoseTaken(dose.medicineId, dose.scheduledTime)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    {t.markTaken}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="medicines" className="mt-6">
                <div className="space-y-4">
                  {medicines.map((medicine) => {
                    const compliance = calculateCompliance(medicine);
                    
                    return (
                      <Card 
                        key={medicine.id}
                        className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                          selectedMedicine?.id === medicine.id ? 'border-primary' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedMedicine(medicine)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-purple-100">
                                <Pill className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-medium">{medicine.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {medicine.dosage} • {medicine.frequency}
                                </p>
                              </div>
                            </div>
                            
                            <Badge 
                              variant={medicine.status === 'active' ? 'default' : 'secondary'}
                              className={medicine.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                            >
                              {medicine.status === 'active' ? t.active : t.completed}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{t.compliance}</span>
                              <span className={getComplianceColor(compliance)}>
                                {compliance}%
                              </span>
                            </div>
                            <Progress value={compliance} className="h-2" />
                            
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{t.taken}: {medicine.takenDoses}/{medicine.totalDoses}</span>
                              <span>{t.missed}: {medicine.missedDoses}</span>
                            </div>
                          </div>
                          
                          {medicine.nextDose && (
                            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 text-sm text-blue-700">
                                <Bell className="w-4 h-4" />
                                <span>{t.nextDose} {medicine.nextDose}</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.medicationHistory}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      {t.detailedHistory}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Medicine Details / Add Form */}
          <div className="lg:col-span-1">
            {showAddForm ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>{t.addNewMedicine}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="medicineName">{t.medicineName}</Label>
                    <Input id="medicineName" placeholder="e.g., Paracetamol" className="border-2" />
                  </div>
                  
                  <div>
                    <Label htmlFor="dosage">{t.dosage}</Label>
                    <Input id="dosage" placeholder="e.g., 500mg" className="border-2" />
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency">{t.frequency}</Label>
                    <Input id="frequency" placeholder="e.g., 3 times daily" className="border-2" />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">{t.duration}</Label>
                    <Input id="duration" placeholder="e.g., 5 days" className="border-2" />
                  </div>
                  
                  <div>
                    <Label htmlFor="instructions">{t.instructions}</Label>
                    <Input id="instructions" placeholder="e.g., Take with food" className="border-2" />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => setShowAddForm(false)} className="flex-1">
                      {t.addMedicine}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedMedicine ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t.medicineDetails}</span>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Medicine</Label>
                    <p className="text-lg font-medium">{selectedMedicine.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">{t.dosage} & {t.frequency}</Label>
                    <p>{selectedMedicine.dosage} • {selectedMedicine.frequency}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">{t.timings}</Label>
                    <div className="flex gap-2 mt-1">
                      {selectedMedicine.timings.map((time: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">{t.duration}</Label>
                    <p>{selectedMedicine.duration}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMedicine.startDate} to {selectedMedicine.endDate}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">{t.progress}</Label>
                    <div className="mt-2">
                      <Progress value={calculateCompliance(selectedMedicine)} className="h-3" />
                      <div className="flex justify-between text-sm mt-1">
                        <span>{t.taken}: {selectedMedicine.takenDoses}</span>
                        <span>{t.missed}: {selectedMedicine.missedDoses}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">{t.instructions}</Label>
                    <p className="text-sm">{selectedMedicine.instructions}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">{t.sideEffects}</Label>
                    <p className="text-sm text-orange-600">{selectedMedicine.sideEffects}</p>
                  </div>
                  
                  {selectedMedicine.nextDose && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Bell className="w-4 h-4" />
                          <div>
                            <p className="text-sm font-medium">{t.nextDoseAt}</p>
                            <p className="text-lg">{selectedMedicine.nextDose}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg mb-2">{t.selectMedicine}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t.clickMedicine}
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t.addMedicine}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}