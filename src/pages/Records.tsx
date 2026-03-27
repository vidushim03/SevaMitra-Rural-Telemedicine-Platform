import { FormEvent, useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

export function RecordsPage() {
  const { data, addRecord } = useAppData();
  const { user } = useAuth();
  const [diagnosis, setDiagnosis] = useState('Seasonal allergy');
  const [notes, setNotes] = useState('Increase fluids and start anti-allergic medication.');

  const records = useMemo(() => {
    if (!user) return [];
    return data.records.filter((r) => user.role === 'admin' || r.patientId === user.id || r.doctorId === user.id);
  }, [data.records, user]);

  if (!user) return null;

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    addRecord({
      patientId: user.role === 'patient' ? user.id : 'patient_demo',
      doctorId: user.role === 'doctor' ? user.id : 'doctor_1',
      diagnosis,
      notes,
      vitals: { bp: '118/76', pulse: '80', temp: '98.4', spo2: '99' },
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">EMR Timeline</h2>
      <form onSubmit={onAdd} className="rounded-2xl border p-4 bg-card space-y-3">
        <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Diagnosis" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 h-24" placeholder="Clinical notes" />
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Add Record</button>
      </form>

      <div className="space-y-3">
        {records.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4 bg-card">
            <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleString()}</p>
            <p className="font-semibold mt-1">{r.diagnosis}</p>
            <p className="text-sm mt-1">{r.notes}</p>
            <p className="text-xs mt-2 text-muted-foreground">Vitals: BP {r.vitals.bp}, Pulse {r.vitals.pulse}, Temp {r.vitals.temp}, SpO2 {r.vitals.spo2}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
