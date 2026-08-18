import { FormEvent, useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

export const Appointments = () => {
  const { data, doctors, addAppointment, updateAppointmentStatus } = useAppData();
  const { user } = useAuth();

  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? 'doctor_1');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [reason, setReason] = useState('General consultation');
  const [fee, setFee] = useState(400);

  const appointments = useMemo(() => {
    if (!user) return [];
    return data.appointments.filter((a) => user.role === 'admin' || a.patientId === user.id || a.doctorId === user.id);
  }, [data.appointments, user]);

  if (!user) return null;

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    addAppointment({
      patientId: user.role === 'patient' ? user.id : 'patient_demo',
      doctorId,
      date,
      time,
      reason,
      fee,
    });
    setReason('Follow-up consultation');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Appointment System</h2>

      <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 rounded-2xl border bg-card p-4">
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="border rounded-lg px-3 py-2">
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-lg px-3 py-2" />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border rounded-lg px-3 py-2" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Reason" />
        <input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} className="border rounded-lg px-3 py-2" min={100} />
        <button className="rounded-lg bg-blue-600 text-white px-4 py-2">Book</button>
      </form>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-left">When</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Fee</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.date} {a.time}</td>
                <td className="p-3">{a.reason}</td>
                <td className="p-3">₹{a.fee}</td>
                <td className="p-3 capitalize">{a.status}</td>
                <td className="p-3 flex gap-2">
                  {(user.role === 'doctor' || user.role === 'admin') && (
                    <>
                      <button onClick={() => updateAppointmentStatus(a.id, 'in-progress')} className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40">Start</button>
                      <button onClick={() => updateAppointmentStatus(a.id, 'completed')} className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40">Complete</button>
                    </>
                  )}
                  <button onClick={() => updateAppointmentStatus(a.id, 'cancelled')} className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-900/40">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
