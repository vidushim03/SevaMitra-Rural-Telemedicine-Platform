import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { FileText, Plus, Trash2, Download, Send, Languages } from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export function PrescriptionBuilder({ patientName, language }: { patientName: string; language: string }) {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: '1', name: 'Paracetamol', dosage: '500mg', frequency: 'Twice a day', duration: '5 days', notes: 'After meals' }
  ]);
  const [isTranslating, setIsTranslating] = useState(false);

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
      // Simulate translation to Hindi/Spanish/etc based on the current language
      setMedicines(medicines.map(m => ({
        ...m,
        notes: language === 'hi' ? `${m.notes} (भोजन के बाद)` : m.notes
      })));
      setIsTranslating(false);
    }, 1000);
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
            <p className="opacity-80 text-sm mt-1">Patient: {patientName}</p>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-md">
            ID: {Math.floor(100000 + Math.random() * 900000)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Medications</h3>
          <Button onClick={addMedicine} variant="outline" size="sm" className="rounded-xl border-primary/30 hover:bg-primary/5">
            <Plus size={16} className="mr-2" />
            Add Medicine
          </Button>
        </div>

        <div className="space-y-4">
          {medicines.map((med, index) => (
            <div key={med.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-3 relative group">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase ml-1">Medicine Name</label>
                  <Input 
                    value={med.name} 
                    onChange={(e) => handleUpdate(med.id, 'name', e.target.value)}
                    placeholder="e.g. Paracetamol"
                    className="rounded-xl border-none shadow-sm bg-white dark:bg-zinc-800"
                  />
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
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
          <label className="text-sm font-semibold mb-2 block">General Advice / Diagnosis</label>
          <Textarea 
            placeholder="Enter general diagnosis and advice for the patient..."
            className="rounded-2xl border-none shadow-sm bg-slate-50 dark:bg-zinc-900 resize-none"
            rows={4}
          />
        </div>
      </CardContent>

      <CardFooter className="p-6 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap gap-3">
        <Button onClick={handleTranslate} disabled={isTranslating} variant="secondary" className="rounded-xl transition-all duration-300">
          <Languages size={18} className={`mr-2 ${isTranslating ? 'animate-spin' : ''}`} />
          {isTranslating ? 'Translating...' : 'Translate Notes'}
        </Button>
        <div className="flex-1" />
        <Button variant="outline" className="rounded-xl border-primary hover:bg-primary/5">
          <Download size={18} className="mr-2" />
          Download PDF
        </Button>
        <Button className="rounded-xl premium-gradient border-none hover:shadow-xl transition-all">
          <Send size={18} className="mr-2" />
          Send to Patient
        </Button>
      </CardFooter>
    </Card>
  );
}
