import React, { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { DoctorConsultation } from '../components/doctor-consultation';
import { DoctorDashboard } from '../components/doctor-dashboard';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';

export const Consultations = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data, addMessage, setQueueStatus } = useAppData();
  const [mode, setMode] = useState<'patient' | 'doctor'>('patient');
  const [message, setMessage] = useState('');
  const consultationId = 'live_consultation_1';

  const messages = useMemo(
    () => data.chats.filter((m) => m.consultationId === consultationId).slice(-20),
    [data.chats],
  );

  const queueItems = useMemo(
    () => data.queue.filter((q) => q.status === 'waiting' || q.status === 'ongoing'),
    [data.queue],
  );

  const sendMessage = () => {
    if (!user || !message.trim()) return;
    addMessage({ consultationId, senderId: user.id, text: message.trim() });
    setMessage('');
  };

  return (
    <div className="space-y-6 w-full">
      <div className="rounded-2xl border bg-card p-4">
        <h2 className="text-2xl font-bold">Consultation Workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">Video call + queue operations + in-consult chat and attachments.</p>
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => setMode('patient')}
            className={`px-4 py-2 rounded-lg border transition ${
              mode === 'patient' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            Patient View
          </button>
          <button
            type="button"
            onClick={() => setMode('doctor')}
            className={`px-4 py-2 rounded-lg border transition ${
              mode === 'doctor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            Doctor View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <div>{mode === 'patient' ? <DoctorConsultation language={language} /> : <DoctorDashboard language={language} />}</div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="font-semibold">Waiting Queue</h3>
            <div className="space-y-2 mt-3">
              {queueItems.length === 0 && <p className="text-sm text-muted-foreground">No active queue entries.</p>}
              {queueItems.map((q) => (
                <div key={q.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{q.appointmentId}</p>
                  <p className="text-xs text-muted-foreground mb-2">{q.status}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setQueueStatus(q.id, 'ongoing')} className="text-xs px-2 py-1 rounded bg-amber-100">Mark Ongoing</button>
                    <button onClick={() => setQueueStatus(q.id, 'finished')} className="text-xs px-2 py-1 rounded bg-emerald-100">Finish</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <h3 className="font-semibold">Consultation Chat & Files</h3>
            <div className="h-56 mt-3 rounded-xl border p-2 overflow-auto space-y-2 bg-muted/20">
              {messages.length === 0 && <p className="text-xs text-muted-foreground">No messages yet.</p>}
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-white p-2 border text-sm">
                  <p className="font-medium text-xs">{m.senderId}</p>
                  <p>{m.text}</p>
                  {m.attachmentName && <p className="text-xs text-blue-600">Attachment: {m.attachmentName}</p>}
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type update, advice, or attach note name"
                className="w-full rounded-lg border px-3 py-2"
              />
              <div className="flex gap-2">
                <button onClick={sendMessage} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Send</button>
                <button
                  onClick={() => {
                    if (!user) return;
                    addMessage({ consultationId, senderId: user.id, text: 'Shared report', attachmentName: 'lab-report.pdf' });
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-sm"
                >
                  Share File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
