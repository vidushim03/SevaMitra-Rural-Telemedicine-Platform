import { FormEvent, useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

export function PrescriptionsPage() {
  const { data, addPrescription } = useAppData();
  const { user } = useAuth();
  const [medicine, setMedicine] = useState('Levocetirizine');
  const [dosage, setDosage] = useState('1 tab');
  const [frequency, setFrequency] = useState('Night');
  const [duration, setDuration] = useState('7 days');
  const [instructions, setInstructions] = useState('Take after dinner');

  const prescriptions = useMemo(() => {
    if (!user) return [];
    return data.prescriptions.filter((p) => user.role === 'admin' || p.patientId === user.id || p.doctorId === user.id);
  }, [data.prescriptions, user]);

  if (!user) return null;

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    addPrescription({
      patientId: user.role === 'patient' ? user.id : 'patient_demo',
      doctorId: user.role === 'doctor' ? user.id : 'doctor_1',
      medicines: [{ name: medicine, dosage, frequency, duration }],
      instructions,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">E-Prescriptions</h2>
      <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 rounded-2xl border bg-card p-4">
        <input value={medicine} onChange={(e) => setMedicine(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Medicine" />
        <input value={dosage} onChange={(e) => setDosage(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Dosage" />
        <input value={frequency} onChange={(e) => setFrequency(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Frequency" />
        <input value={duration} onChange={(e) => setDuration(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Duration" />
        <input value={instructions} onChange={(e) => setInstructions(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Instructions" />
        <button className="rounded-lg bg-blue-600 text-white px-4 py-2">Generate Rx</button>
      </form>

      <div className="space-y-3">
        {prescriptions.map((p) => (
          <div key={p.id} className="rounded-2xl border p-4 bg-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Prescription #{p.id}</p>
              <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleString()}</p>
            </div>
            <ul className="mt-2 text-sm list-disc pl-5">
              {p.medicines.map((m, idx) => (
                <li key={idx}>{m.name} - {m.dosage} - {m.frequency} - {m.duration}</li>
              ))}
            </ul>
            <p className="text-sm mt-2"><span className="font-medium">Instructions:</span> {p.instructions}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
