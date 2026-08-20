export type UserRole = 'patient' | 'doctor' | 'admin';

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  specialty?: string;
  consultationFee?: number;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'in-progress';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  fee: number;
}

export interface QueueItem {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  status: 'waiting' | 'ongoing' | 'finished' | 'missed';
  joinedAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  diagnosis: string;
  notes: string;
  vitals: {
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
  };
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface BillLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  consultationFee: number;
  medicineTotal: number;
  amount: number;
  lineItems: BillLineItem[];
  status: PaymentStatus;
  method: 'upi' | 'card' | 'cash' | 'wallet';
  date: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  attachmentName?: string;
}

export interface AppDataState {
  users: SessionUser[];
  appointments: Appointment[];
  queue: QueueItem[];
  records: MedicalRecord[];
  prescriptions: Prescription[];
  payments: Payment[];
  chats: ChatMessage[];
}
