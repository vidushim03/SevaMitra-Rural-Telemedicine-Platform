import React, { createContext, useContext, useMemo, useState } from 'react';
import { AppDataState, Appointment, ChatMessage, MedicalRecord, Payment, Prescription, QueueItem, SessionUser } from '../types/app';
import { SyncQueue, SyncOperation } from '../services/sync-queue';

const STORAGE_KEY = 'sevamitra.data.v1';
const syncQueue = new SyncQueue();

const seedUsers: SessionUser[] = [
  { id: 'patient_demo', name: 'Rohan Verma', role: 'patient', email: 'rohan@demo.com' },
  { id: 'doctor_1', name: 'Dr. Priya Sharma', role: 'doctor', email: 'priya@demo.com' },
  { id: 'doctor_2', name: 'Dr. Rajesh Kumar', role: 'doctor', email: 'rajesh@demo.com' },
  { id: 'admin_1', name: 'System Admin', role: 'admin', email: 'admin@demo.com' },
];

const seedState: AppDataState = {
  users: seedUsers,
  appointments: [
    {
      id: 'apt_1',
      patientId: 'patient_demo',
      doctorId: 'doctor_1',
      date: new Date().toISOString().slice(0, 10),
      time: '11:30',
      reason: 'Recurring migraine',
      status: 'scheduled',
      fee: 400,
    },
  ],
  queue: [
    {
      id: 'queue_1',
      appointmentId: 'apt_1',
      patientId: 'patient_demo',
      doctorId: 'doctor_1',
      status: 'waiting',
      joinedAt: new Date().toISOString(),
    },
  ],
  records: [
    {
      id: 'rec_1',
      patientId: 'patient_demo',
      doctorId: 'doctor_1',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      diagnosis: 'Migraine with stress trigger',
      notes: 'Hydration and sleep hygiene advised. Follow-up in 2 weeks.',
      vitals: { bp: '120/80', pulse: '78', temp: '98.6', spo2: '99' },
    },
  ],
  prescriptions: [
    {
      id: 'rx_1',
      patientId: 'patient_demo',
      doctorId: 'doctor_1',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      medicines: [
        { name: 'Paracetamol', dosage: '500 mg', frequency: 'SOS', duration: '5 days' },
        { name: 'Magnesium', dosage: '1 tab', frequency: 'Night', duration: '30 days' },
      ],
      instructions: 'Avoid screen strain and maintain hydration.',
    },
  ],
  payments: [
    {
      id: 'pay_1',
      appointmentId: 'apt_1',
      patientId: 'patient_demo',
      amount: 400,
      status: 'pending',
      method: 'upi',
      date: new Date().toISOString(),
    },
  ],
  chats: [],
};

interface AppDataContextValue {
  data: AppDataState;
  doctors: SessionUser[];
  patients: SessionUser[];
  pendingSyncCount: number;
  flushSync: () => Promise<number>;
  addAppointment: (payload: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  addRecord: (payload: Omit<MedicalRecord, 'id' | 'date'>) => void;
  addPrescription: (payload: Omit<Prescription, 'id' | 'date'>) => void;
  addPayment: (payload: Omit<Payment, 'id' | 'date'>) => void;
  markPayment: (id: string, status: Payment['status']) => void;
  setQueueStatus: (id: string, status: QueueItem['status']) => void;
  addMessage: (payload: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

function loadState(): AppDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppDataState) : seedState;
  } catch {
    return seedState;
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppDataState>(() => loadState());
  const [pendingSyncCount, setPendingSyncCount] = useState(() => syncQueue.getPendingCount());

  const persist = (next: AppDataState) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const sync = (op: Omit<SyncOperation, 'createdAt'>) => {
    syncQueue.enqueue({ ...op, createdAt: new Date().toISOString() });
    setPendingSyncCount(syncQueue.getPendingCount());
  };

  const flushSync = async () => {
    const synced = await syncQueue.flush();
    setPendingSyncCount(syncQueue.getPendingCount());
    return synced;
  };

  const value = useMemo<AppDataContextValue>(() => {
    const doctors = data.users.filter((u) => u.role === 'doctor');
    const patients = data.users.filter((u) => u.role === 'patient');

    return {
      data,
      doctors,
      patients,
      pendingSyncCount,
      flushSync,
      addAppointment: (payload) => {
        const id = `apt_${Date.now()}`;
        const appointment: Appointment = { ...payload, id, status: 'scheduled' };
        const queueItem: QueueItem = {
          id: `queue_${Date.now()}`,
          appointmentId: id,
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          status: 'waiting',
          joinedAt: new Date().toISOString(),
        };
        persist({
          ...data,
          appointments: [appointment, ...data.appointments],
          queue: [queueItem, ...data.queue],
        });
        sync({ type: 'appointment.created', payload: appointment });
        sync({ type: 'queue.updated', id: queueItem.id, status: queueItem.status });
      },
      updateAppointmentStatus: (id, status) => {
        persist({
          ...data,
          appointments: data.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        });
        sync({ type: 'appointment.updated', id, status });
      },
      addRecord: (payload) => {
        const rec: MedicalRecord = {
          ...payload,
          id: `rec_${Date.now()}`,
          date: new Date().toISOString(),
        };
        persist({ ...data, records: [rec, ...data.records] });
        sync({ type: 'record.created', payload: rec });
      },
      addPrescription: (payload) => {
        const rx: Prescription = {
          ...payload,
          id: `rx_${Date.now()}`,
          date: new Date().toISOString(),
        };
        persist({ ...data, prescriptions: [rx, ...data.prescriptions] });
        sync({ type: 'prescription.created', payload: rx });
      },
      addPayment: (payload) => {
        const payment: Payment = {
          ...payload,
          id: `pay_${Date.now()}`,
          date: new Date().toISOString(),
        };
        persist({ ...data, payments: [payment, ...data.payments] });
        sync({ type: 'payment.created', payload: payment });
      },
      markPayment: (id, status) => {
        persist({
          ...data,
          payments: data.payments.map((p) => (p.id === id ? { ...p, status } : p)),
        });
        sync({ type: 'payment.updated', id, status });
      },
      setQueueStatus: (id, status) => {
        persist({
          ...data,
          queue: data.queue.map((q) => (q.id === id ? { ...q, status } : q)),
        });
        sync({ type: 'queue.updated', id, status });
      },
      addMessage: (payload) => {
        const msg: ChatMessage = {
          ...payload,
          id: `msg_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        persist({ ...data, chats: [...data.chats, msg] });
        sync({ type: 'message.created', payload: msg });
      },
    };
  }, [data]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
