import { FormEvent, useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';

export function RecordsPage() {
  const { data, patients, addRecord, deleteRecord } = useAppData();
  const { user } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');

  const records = useMemo(() => {
    if (!user) return [];
    return data.records.filter((r) => user.role === 'admin' || r.patientId === user.id || r.doctorId === user.id);
  }, [data.records, user]);

  if (!user) return null;

  const isDoctor = user.role === 'doctor' || user.role === 'admin';

  const getPatientName = (id: string) => {
    const p = patients.find((p) => p.id === id);
    return p ? p.name : id;
  };

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) return;
    addRecord({
      patientId: isDoctor ? (patientId || patients[0]?.id || 'patient_demo') : user.id,
      doctorId: user.role === 'doctor' ? user.id : 'doctor_1',
      diagnosis,
      notes,
      vitals: {
        bp: bp || '—',
        pulse: pulse || '—',
        temp: temp || '—',
        spo2: spo2 || '—',
      },
    });
    setDiagnosis('');
    setNotes('');
    setBp('');
    setPulse('');
    setTemp('');
    setSpo2('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">EMR Timeline</h2>

      {isDoctor && (
        <form onSubmit={onAdd} className="rounded-2xl border p-4 bg-card space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Add a new medical record for a patient</p>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Diagnosis *"
            required
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-24"
            placeholder="Clinical notes"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input value={bp} onChange={(e) => setBp(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="BP (e.g. 120/80)" />
            <input value={pulse} onChange={(e) => setPulse(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="Pulse (bpm)" />
            <input value={temp} onChange={(e) => setTemp(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="Temp (°F)" />
            <input value={spo2} onChange={(e) => setSpo2(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="SpO2 (%)" />
          </div>
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium">Add Record</button>
        </form>
      )}

      <div className="space-y-3">
        {records.length === 0 && (
          <p className="text-muted-foreground text-sm">No records found.</p>
        )}
        {records.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4 bg-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleString()}</p>
                {isDoctor && (
                  <p className="text-xs text-blue-600 mt-0.5">Patient: {getPatientName(r.patientId)}</p>
                )}
                <p className="font-semibold mt-1">{r.diagnosis}</p>
              </div>
              {isDoctor && (
                <button
                  onClick={() => deleteRecord(r.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title="Delete record"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p className="text-sm mt-1">{r.notes}</p>
            <p className="text-xs mt-2 text-muted-foreground">
              Vitals: BP {r.vitals.bp}, Pulse {r.vitals.pulse}, Temp {r.vitals.temp}, SpO2 {r.vitals.spo2}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
