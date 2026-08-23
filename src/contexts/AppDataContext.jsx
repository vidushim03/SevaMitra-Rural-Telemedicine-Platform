import React, { createContext, useContext, useMemo, useState } from "react";
import { SyncQueue } from "../services/sync-queue";

const STORAGE_KEY = "sevamitra.data.v1";
const syncQueue = new SyncQueue();

const seedUsers = [
  // Patients
  {
    id: "patient_demo",
    name: "Rohan Verma",
    role: "patient",
    email: "rohan@demo.com",
  },
  {
    id: "patient_2",
    name: "Anjali Singh",
    role: "patient",
    email: "anjali@demo.com",
  },
  {
    id: "patient_3",
    name: "Mohan Yadav",
    role: "patient",
    email: "mohan@demo.com",
  },
  // Doctors (consultation fees based on Indian govt hospital / CGHS rates)
  {
    id: "doctor_1",
    name: "Dr. Priya Sharma",
    role: "doctor",
    email: "priya@demo.com",
    specialty: "General Physician",
    consultationFee: 50,
  },
  {
    id: "doctor_2",
    name: "Dr. Rajesh Kumar",
    role: "doctor",
    email: "rajesh@demo.com",
    specialty: "Cardiologist",
    consultationFee: 200,
  },
  {
    id: "doctor_3",
    name: "Dr. Meena Iyer",
    role: "doctor",
    email: "meena@demo.com",
    specialty: "Dermatologist",
    consultationFee: 100,
  },
  {
    id: "doctor_4",
    name: "Dr. Arjun Patel",
    role: "doctor",
    email: "arjun@demo.com",
    specialty: "Pediatrician",
    consultationFee: 100,
  },
  {
    id: "doctor_5",
    name: "Dr. Sunita Rao",
    role: "doctor",
    email: "sunita@demo.com",
    specialty: "Gynecologist",
    consultationFee: 150,
  },
  // Admin
  {
    id: "admin_1",
    name: "System Admin",
    role: "admin",
    email: "admin@demo.com",
  },
];

const seedState = {
  users: seedUsers,
  appointments: [
    {
      id: "apt_1",
      patientId: "patient_demo",
      doctorId: "doctor_1",
      date: new Date().toISOString().slice(0, 10),
      time: "11:30",
      reason: "Recurring migraine",
      status: "scheduled",
      fee: 50,
    },
  ],
  queue: [
    {
      id: "queue_1",
      appointmentId: "apt_1",
      patientId: "patient_demo",
      doctorId: "doctor_1",
      status: "waiting",
      joinedAt: new Date().toISOString(),
    },
  ],
  records: [
    {
      id: "rec_1",
      patientId: "patient_demo",
      doctorId: "doctor_1",
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      diagnosis: "Migraine with stress trigger",
      notes: "Hydration and sleep hygiene advised. Follow-up in 2 weeks.",
      vitals: { bp: "120/80", pulse: "78", temp: "98.6", spo2: "99" },
    },
  ],
  prescriptions: [
    {
      id: "rx_1",
      patientId: "patient_demo",
      doctorId: "doctor_1",
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      medicines: [
        {
          name: "Paracetamol",
          dosage: "500 mg",
          frequency: "SOS",
          duration: "5 days",
        },
        {
          name: "Magnesium",
          dosage: "1 tab",
          frequency: "Night",
          duration: "30 days",
        },
      ],
      instructions: "Avoid screen strain and maintain hydration.",
    },
  ],
  payments: [
    {
      id: "pay_1",
      appointmentId: "apt_1",
      patientId: "patient_demo",
      doctorId: "doctor_1",
      consultationFee: 50,
      medicineTotal: 8,
      amount: 58,
      lineItems: [
        {
          description: "Consultation - General Physician",
          quantity: 1,
          unitPrice: 50,
          total: 50,
        },
        {
          description: "Paracetamol 500mg (1 strip)",
          quantity: 1,
          unitPrice: 4,
          total: 4,
        },
        {
          description: "Cetirizine 10mg (1 strip)",
          quantity: 1,
          unitPrice: 3,
          total: 3,
        },
      ],
      status: "pending",
      method: "cash",
      date: new Date().toISOString(),
      notes: "Follow-up in 2 weeks",
    },
  ],
  chats: [],
};

const AppDataContext = createContext(undefined);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : seedState;
  } catch {
    return seedState;
  }
}

export function AppDataProvider({ children }) {
  const [data, setData] = useState(() => loadState());
  const [pendingSyncCount, setPendingSyncCount] = useState(() =>
    syncQueue.getPendingCount(),
  );

  const persist = (next) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const sync = (op) => {
    syncQueue.enqueue({ ...op, createdAt: new Date().toISOString() });
    setPendingSyncCount(syncQueue.getPendingCount());
  };

  const flushSync = async () => {
    const synced = await syncQueue.flush();
    setPendingSyncCount(syncQueue.getPendingCount());
    return synced;
  };

  const value = useMemo(() => {
    const doctors = data.users.filter((u) => u.role === "doctor");
    const patients = data.users.filter((u) => u.role === "patient");

    return {
      data,
      doctors,
      patients,
      pendingSyncCount,
      flushSync,
      ensureUser: (user) => {
        if (!data.users.find((u) => u.id === user.id)) {
          persist({ ...data, users: [...data.users, user] });
        }
      },
      addUser: (user) => {
        if (!data.users.find((u) => u.id === user.id)) {
          persist({ ...data, users: [...data.users, user] });
        }
      },
      removeUser: (id) => {
        persist({ ...data, users: data.users.filter((u) => u.id !== id) });
      },
      addAppointment: (payload) => {
        const id = `apt_${Date.now()}`;
        const appointment = { ...payload, id, status: "scheduled" };
        const queueItem = {
          id: `queue_${Date.now()}`,
          appointmentId: id,
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          status: "waiting",
          joinedAt: new Date().toISOString(),
        };
        persist({
          ...data,
          appointments: [appointment, ...data.appointments],
          queue: [queueItem, ...data.queue],
        });
        sync({ type: "appointment.created", payload: appointment });
        sync({
          type: "queue.updated",
          id: queueItem.id,
          status: queueItem.status,
        });
      },
      updateAppointmentStatus: (id, status) => {
        persist({
          ...data,
          appointments: data.appointments.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        });
        sync({ type: "appointment.updated", id, status });
      },
      addRecord: (payload) => {
        const rec = {
          ...payload,
          id: `rec_${Date.now()}`,
          date: new Date().toISOString(),
        };
        persist({ ...data, records: [rec, ...data.records] });
        sync({ type: "record.created", payload: rec });
      },
      deleteRecord: (id) => {
        persist({ ...data, records: data.records.filter((r) => r.id !== id) });
      },
      addPrescription: (payload) => {
        const rx = {
          ...payload,
          id: `rx_${Date.now()}`,
          date: new Date().toISOString(),
        };
        persist({ ...data, prescriptions: [rx, ...data.prescriptions] });
        sync({ type: "prescription.created", payload: rx });
      },
      deletePrescription: (id) => {
        persist({
          ...data,
          prescriptions: data.prescriptions.filter((p) => p.id !== id),
        });
      },
      addPayment: (payload) => {
        const payment = {
          ...payload,
          id: `pay_${Date.now()}`,
          date: new Date().toISOString(),
        };
        persist({ ...data, payments: [payment, ...data.payments] });
        sync({ type: "payment.created", payload: payment });
      },
      markPayment: (id, status) => {
        persist({
          ...data,
          payments: data.payments.map((p) =>
            p.id === id ? { ...p, status } : p,
          ),
        });
        sync({ type: "payment.updated", id, status });
      },
      setQueueStatus: (id, status) => {
        persist({
          ...data,
          queue: data.queue.map((q) => (q.id === id ? { ...q, status } : q)),
        });
        sync({ type: "queue.updated", id, status });
      },
      addMessage: (payload) => {
        const msg = {
          ...payload,
          id: `msg_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        persist({ ...data, chats: [...data.chats, msg] });
        sync({ type: "message.created", payload: msg });
      },
    };
  }, [data]);

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
