import { FormEvent, useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../components/translations';

export function PrescriptionsPage() {
  const { data, patients, addPrescription, deletePrescription } = useAppData();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const [patientId, setPatientId] = useState('');
  const [medicine, setMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');

  const prescriptions = useMemo(() => {
    if (!user) return [];
    return data.prescriptions.filter((p) => user.role === 'admin' || p.patientId === user.id || p.doctorId === user.id);
  }, [data.prescriptions, user]);

  if (!user) return null;

  const isDoctor = user.role === 'doctor' || user.role === 'admin';

  const getPatientName = (id: string) => {
    const p = patients.find((p) => p.id === id);
    return p ? p.name : id;
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!medicine.trim()) return;
    addPrescription({
      patientId: isDoctor ? (patientId || patients[0]?.id || 'patient_demo') : user.id,
      doctorId: user.role === 'doctor' ? user.id : 'doctor_1',
      medicines: [{ name: medicine, dosage, frequency, duration }],
      instructions,
    });
    setMedicine('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setInstructions('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t.ePrescriptions}</h2>

      {isDoctor && (
        <form onSubmit={onCreate} className="rounded-2xl border bg-card p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{t.issuePrescription}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="border rounded-lg px-3 py-2 col-span-2"
              required
            >
              <option value="">{t.selectPatient}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input value={medicine} onChange={(e) => setMedicine(e.target.value)} className="border rounded-lg px-3 py-2" placeholder={t.medicineNamePlaceholder} required />
            <input value={dosage} onChange={(e) => setDosage(e.target.value)} className="border rounded-lg px-3 py-2" placeholder={t.dosagePlaceholder} />
            <input value={frequency} onChange={(e) => setFrequency(e.target.value)} className="border rounded-lg px-3 py-2" placeholder={t.frequencyPlaceholder} />
            <input value={duration} onChange={(e) => setDuration(e.target.value)} className="border rounded-lg px-3 py-2" placeholder={t.durationPlaceholder} />
          </div>
          <div className="flex gap-3">
            <input value={instructions} onChange={(e) => setInstructions(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" placeholder={t.specialInstructions} />
            <button className="rounded-lg bg-blue-600 text-white px-6 py-2 font-medium">{t.generateRx}</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {prescriptions.length === 0 && (
          <p className="text-muted-foreground text-sm">{t.noPrescriptionsYet}</p>
        )}
        {prescriptions.map((p) => (
          <div key={p.id} className="rounded-2xl border p-4 bg-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{t.prescription} #{p.id}</p>
                {isDoctor && (
                  <p className="text-xs text-blue-600 mt-0.5">{t.patientLabel} {getPatientName(p.patientId)}</p>
                )}
                <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleString()}</p>
              </div>
              {isDoctor && (
                <button
                  onClick={() => deletePrescription(p.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title={t.deletePrescription}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <ul className="mt-2 text-sm list-disc pl-5">
              {p.medicines.map((m, idx) => (
                <li key={idx}>{m.name} - {m.dosage} - {m.frequency} - {m.duration}</li>
              ))}
            </ul>
            <p className="text-sm mt-2"><span className="font-medium">{t.instructions}:</span> {p.instructions}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
