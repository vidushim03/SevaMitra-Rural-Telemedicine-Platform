import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { FileText, Plus, Trash2, Send, Languages, CreditCard, CheckCircle } from "lucide-react";
import { useAppData } from '../contexts/AppDataContext';
import { getMedicinePrice, getConsultationFee, MEDICINE_PRICES } from '../services/pricing-config';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface PrescriptionBuilderProps {
  patientName: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  appointmentId?: string;
  language: string;
}

export function PrescriptionBuilder({ patientName, patientId, doctorId, doctorName, specialty, appointmentId, language }: PrescriptionBuilderProps) {
  const { addPrescription, addPayment } = useAppData();
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: '1', name: 'Paracetamol', dosage: '500mg', frequency: 'Twice a day', duration: '5 days', notes: 'After meals' }
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [billCreated, setBillCreated] = useState(false);

  const consultationFee = getConsultationFee(specialty);

  const calculateMedicineTotal = () => {
    let total = 0;
    for (const med of medicines) {
      if (!med.name) continue;
      const priceInfo = getMedicinePrice(med.name);
      if (priceInfo) {
        total += priceInfo.pricePerStrip;
      } else {
        total += 10;
      }
    }
    return total;
  };

  const medicineTotal = calculateMedicineTotal();
  const grandTotal = consultationFee + medicineTotal;

  const addMedicine = () => {
    const newMed: Medicine = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    };
    setMedicines([...medicines, newMed]);
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const handleUpdate = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleTranslate = () => {
    setIsTranslating(true);
    setTimeout(() => {
      setMedicines(medicines.map(m => ({
        ...m,
        notes: language === 'hi' ? `${m.notes} (भोजन के बाद)` : m.notes
      })));
      setIsTranslating(false);
    }, 1000);
  };

  const handleSendPrescription = () => {
    addPrescription({
      patientId,
      doctorId,
      appointmentId,
      medicines: medicines.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
      })),
      instructions: diagnosis,
    });
    setSaved(true);
  };

  const handleCreateBill = () => {
    if (!saved) {
      handleSendPrescription();
    }

    const lineItems = [
      { description: `Consultation - ${specialty}`, quantity: 1, unitPrice: consultationFee, total: consultationFee },
      ...medicines.filter(m => m.name).map(med => {
        const priceInfo = getMedicinePrice(med.name);
        const price = priceInfo?.pricePerStrip ?? 10;
        return { description: `${med.name} ${med.dosage} (${priceInfo?.stripSize ?? 10} strips)`, quantity: 1, unitPrice: price, total: price };
      }),
    ];

    addPayment({
      appointmentId: appointmentId ?? `apt_${Date.now()}`,
      patientId,
      doctorId,
      consultationFee,
      medicineTotal,
      amount: grandTotal,
      lineItems,
      status: 'pending',
      method: 'cash',
      notes: `Bill created by ${doctorName} for consultation + ${medicines.filter(m => m.name).length} medicines`,
    });
    setBillCreated(true);
  };

  return (
    <Card className="glass-card overflow-hidden border-none shadow-2xl">
      <CardHeader className="premium-gradient text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText size={24} />
              Digital Prescription
            </CardTitle>
            <p className="opacity-80 text-sm mt-1">Patient: {patientName} | Doctor: {doctorName}</p>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-md">
            Consultation: ₹{consultationFee}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Medications (Jan Aushadhi Prices)</h3>
          <Button onClick={addMedicine} variant="outline" size="sm" className="rounded-xl border-primary/30 hover:bg-primary/5">
            <Plus size={16} className="mr-2" />
            Add Medicine
          </Button>
        </div>

        <div className="space-y-4">
          {medicines.map((med) => {
            const priceInfo = getMedicinePrice(med.name);
            return (
              <div key={med.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-3 relative group">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase ml-1">Medicine Name</label>
                    <select
                      value={med.name}
                      onChange={(e) => handleUpdate(med.id, 'name', e.target.value)}
                      className="w-full rounded-xl border-none shadow-sm bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                    >
                      <option value="">Select medicine...</option>
                      {MEDICINE_PRICES.map(m => (
                        <option key={m.name} value={m.name}>{m.name} {m.strength} (₹{m.pricePerStrip})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase ml-1">Dosage</label>
                    <Input 
                      value={med.dosage} 
                      onChange={(e) => handleUpdate(med.id, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="rounded-xl border-none shadow-sm bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase ml-1">Frequency</label>
                    <Input 
                      value={med.frequency} 
                      onChange={(e) => handleUpdate(med.id, 'frequency', e.target.value)}
                      placeholder="e.g. 1-0-1"
                      className="rounded-xl border-none shadow-sm bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase ml-1">Duration</label>
                    <Input 
                      value={med.duration} 
                      onChange={(e) => handleUpdate(med.id, 'duration', e.target.value)}
                      placeholder="e.g. 5 days"
                      className="rounded-xl border-none shadow-sm bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>
                {priceInfo && (
                  <p className="text-xs text-muted-foreground ml-1">
                    Jan Aushadhi price: ₹{priceInfo.pricePerStrip} per strip of {priceInfo.stripSize} {priceInfo.form.toLowerCase()}s
                  </p>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase ml-1">Special Instructions</label>
                  <Textarea 
                    value={med.notes} 
                    onChange={(e) => handleUpdate(med.id, 'notes', e.target.value)}
                    placeholder="Additional notes for the patient..."
                    className="rounded-xl border-none shadow-sm bg-white dark:bg-zinc-800 resize-none"
                    rows={2}
                  />
                </div>
                
                {medicines.length > 1 && (
                  <button 
                    onClick={() => removeMedicine(med.id)}
                    className="absolute -right-2 -top-2 p-1.5 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
          <label className="text-sm font-semibold mb-2 block">General Advice / Diagnosis</label>
          <Textarea 
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter general diagnosis and advice for the patient..."
            className="rounded-2xl border-none shadow-sm bg-slate-50 dark:bg-zinc-900 resize-none"
            rows={4}
          />
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 space-y-2">
          <h4 className="font-semibold text-sm">Bill Summary (Govt Hospital Rates)</h4>
          <div className="flex justify-between text-sm">
            <span>Consultation ({specialty})</span>
            <span className="font-medium">₹{consultationFee}</span>
          </div>
          {medicines.filter(m => m.name).map(med => {
            const priceInfo = getMedicinePrice(med.name);
            return (
              <div key={med.id} className="flex justify-between text-sm text-muted-foreground">
                <span>{med.name} {med.dosage}</span>
                <span>₹{priceInfo?.pricePerStrip ?? 10}</span>
              </div>
            );
          })}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">₹{grandTotal}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap gap-3">
        <Button onClick={handleTranslate} disabled={isTranslating} variant="secondary" className="rounded-xl transition-all duration-300">
          <Languages size={18} className={`mr-2 ${isTranslating ? 'animate-spin' : ''}`} />
          {isTranslating ? 'Translating...' : 'Translate Notes'}
        </Button>
        <div className="flex-1" />
        {saved ? (
          <Button disabled variant="outline" className="rounded-xl border-green-500 text-green-600">
            <CheckCircle size={18} className="mr-2" />
            Prescription Sent
          </Button>
        ) : (
          <Button onClick={handleSendPrescription} variant="outline" className="rounded-xl border-primary hover:bg-primary/5">
            <Send size={18} className="mr-2" />
            Send to Patient
          </Button>
        )}
        {billCreated ? (
          <Button disabled className="rounded-xl bg-green-600 text-white">
            <CheckCircle size={18} className="mr-2" />
            Bill Created (₹{grandTotal})
          </Button>
        ) : (
          <Button onClick={handleCreateBill} className="rounded-xl premium-gradient border-none hover:shadow-xl transition-all">
            <CreditCard size={18} className="mr-2" />
            Create Bill (₹{grandTotal})
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
