import { FormEvent, useMemo, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../components/translations';

export const Appointments = () => {
  const { data, doctors, patients, addAppointment, updateAppointmentStatus } = useAppData();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? 'doctor_1');
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [fee, setFee] = useState(0);

  const appointments = useMemo(() => {
    if (!user) return [];
    return data.appointments.filter((a) => user.role === 'admin' || a.patientId === user.id || a.doctorId === user.id);
  }, [data.appointments, user]);

  if (!user) return null;

  const isDoctor = user.role === 'doctor' || user.role === 'admin';

  const getPatientName = (id: string) => {
    const p = patients.find((p) => p.id === id);
    return p ? p.name : id;
  };

  const getDoctorName = (id: string) => {
    const d = doctors.find((d) => d.id === id);
    return d ? d.name : id;
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    addAppointment({
      patientId: isDoctor ? (patientId || patients[0]?.id || 'patient_demo') : user.id,
      doctorId: isDoctor ? user.id : doctorId,
      date,
      time,
      reason,
      fee,
    });
    setReason('');
    setTime('');
    setFee(0);
    setPatientId('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t.appointmentSystem}</h2>

      <form onSubmit={onCreate} className="rounded-2xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          {isDoctor ? t.scheduleForPatient : t.bookWithDoctor}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          {isDoctor ? (
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
          ) : (
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="border rounded-lg px-3 py-2 col-span-2"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-lg px-3 py-2" required />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border rounded-lg px-3 py-2" required />
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="border rounded-lg px-3 py-2" placeholder={t.reason} required />
          <input type="number" value={fee || ''} onChange={(e) => setFee(Number(e.target.value))} className="border rounded-lg px-3 py-2" placeholder={t.fee} min={0} />
        </div>
        <button className="rounded-lg bg-blue-600 text-white px-6 py-2 font-medium">{t.book}</button>
      </form>

      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {isDoctor && <th className="p-3 text-left">{t.patient}</th>}
              {!isDoctor && <th className="p-3 text-left">{t.doctor}</th>}
              <th className="p-3 text-left">{t.when}</th>
              <th className="p-3 text-left">{t.reason}</th>
              <th className="p-3 text-left">{t.fee}</th>
              <th className="p-3 text-left">{t.status}</th>
              <th className="p-3 text-left">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground text-sm">{t.noAppointmentsYet}</td>
              </tr>
            )}
            {appointments.map((a) => (
              <tr key={a.id} className="border-t">
                {isDoctor && <td className="p-3 font-medium">{getPatientName(a.patientId)}</td>}
                {!isDoctor && <td className="p-3">{getDoctorName(a.doctorId)}</td>}
                <td className="p-3">{a.date} {a.time}</td>
                <td className="p-3">{a.reason}</td>
                <td className="p-3">₹{a.fee}</td>
                <td className="p-3 capitalize">{a.status}</td>
                <td className="p-3 flex gap-2">
                  {(user.role === 'doctor' || user.role === 'admin') && (
                    <>
                      <button onClick={() => updateAppointmentStatus(a.id, 'in-progress')} className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40">{t.start}</button>
                      <button onClick={() => updateAppointmentStatus(a.id, 'completed')} className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40">{t.complete}</button>
                    </>
                  )}
                  <button onClick={() => updateAppointmentStatus(a.id, 'cancelled')} className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-900/40">{t.cancel}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
