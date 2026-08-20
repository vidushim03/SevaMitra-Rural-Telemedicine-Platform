import React, { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../components/translations';
import { DoctorConsultation } from '../components/doctor-consultation';
import { DoctorDashboard } from '../components/doctor-dashboard';
import { RoomOnboarding } from '../components/room-onboarding';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export const Consultations = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useAuth();
  const { data, addMessage, setQueueStatus, pendingSyncCount, flushSync } = useAppData();
  const [message, setMessage] = useState('');
  const [isFlushing, setIsFlushing] = useState(false);
  if (!user) return null;
  const isDoctor = user.role === 'doctor';
  const consultationId = 'live_consultation_1';

  const messages = useMemo(
    () => data.chats.filter((m) => m.consultationId === consultationId).slice(-20),
    [data.chats],
  );

  const queueItems = useMemo(
    () => data.queue.filter((q) => q.doctorId === user.id && (q.status === 'waiting' || q.status === 'ongoing')),
    [data.queue, user],
  );

  const sendMessage = () => {
    if (!user || !message.trim()) return;
    addMessage({ consultationId, senderId: user.id, text: message });
    setMessage('');
  };

  return (
    <div className="space-y-6 w-full">
      <div className="rounded-2xl border bg-card p-4">
        <h2 className="text-2xl font-bold">{t.consultationWorkspace}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isDoctor
            ? t.doctorConsultDesc
            : t.patientConsultDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <div>{isDoctor ? <DoctorDashboard language={language} user={user} /> : <DoctorConsultation language={language} user={user} />}</div>

        <div className="space-y-4">
          <RoomOnboarding
            language={language}
            userId={user?.id || 'guest'}
            userName={user?.name || 'Guest'}
            role={user?.role === 'doctor' ? 'doctor' : 'patient'}
          />

          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t.offlineSync}</h3>
              {pendingSyncCount === 0 ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <Wifi size={14} /> {t.synced}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <WifiOff size={14} /> {pendingSyncCount} {t.pending}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t.offlineChangesDesc}
            </p>
            {pendingSyncCount > 0 && (
              <button
                onClick={async () => {
                  setIsFlushing(true);
                  await flushSync();
                  setIsFlushing(false);
                }}
                disabled={isFlushing}
                className="mt-3 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={isFlushing ? 'animate-spin' : ''} />
                {isFlushing ? t.syncing : t.syncNow}
              </button>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <h3 className="font-semibold">{t.waitingQueue}</h3>
            <div className="space-y-2 mt-3">
              {queueItems.length === 0 && <p className="text-sm text-muted-foreground">{t.noActiveQueue}</p>}
              {queueItems.map((q) => (
                <div key={q.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{q.appointmentId}</p>
                  <p className="text-xs text-muted-foreground mb-2">{q.status}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setQueueStatus(q.id, 'ongoing')} className="text-xs px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40">{t.markOngoing}</button>
                    <button onClick={() => setQueueStatus(q.id, 'finished')} className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40">{t.finish}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <h3 className="font-semibold">{t.consultationChatFiles}</h3>
            <div className="h-56 mt-3 rounded-xl border p-2 overflow-auto space-y-2 bg-muted/20">
              {messages.length === 0 && <p className="text-xs text-muted-foreground">{t.noMessagesYet}</p>}
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-white dark:bg-zinc-800 p-2 border text-sm">
                  <p className="font-medium text-xs">{m.senderId}</p>
                  <p>{m.text}</p>
                  {m.attachmentName && <p className="text-xs text-blue-600">{t.attachment} {m.attachmentName}</p>}
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.chatPlaceholder}
                className="w-full rounded-lg border px-3 py-2"
              />
              <div className="flex gap-2">
                <button onClick={sendMessage} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">{t.send}</button>
                <button
                  onClick={() => {
                    if (!user) return;
                    addMessage({ consultationId, senderId: user.id, text: 'Shared report', attachmentName: 'lab-report.pdf' });
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-sm"
                >
                  {t.shareFile}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
