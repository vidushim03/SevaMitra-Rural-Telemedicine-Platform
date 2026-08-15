const STORAGE_KEY = 'sevamitra.rooms.v1';

export type RoomStatus = 'active' | 'in-consult' | 'closed';

export interface ConsultationRoom {
  code: string;
  doctorId: string;
  doctorName?: string;
  patientId?: string;
  patientName?: string;
  createdAt: string;
  status: RoomStatus;
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export function roomJoinPayload(code: string): string {
  return `sevamitra://join/${code.toUpperCase()}`;
}

function loadRooms(): ConsultationRoom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsultationRoom[]) : [];
  } catch {
    return [];
  }
}

function saveRooms(rooms: ConsultationRoom[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export function createRoom(doctorId: string, doctorName?: string): ConsultationRoom {
  const rooms = loadRooms();
  const existing = rooms.find((r) => r.doctorId === doctorId && r.status !== 'closed');
  if (existing) return existing;

  let code = generateRoomCode();
  while (rooms.some((r) => r.code === code && r.status !== 'closed')) {
    code = generateRoomCode();
  }

  const room: ConsultationRoom = {
    code,
    doctorId,
    doctorName,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  saveRooms([room, ...rooms]);
  return room;
}

export function getRoom(code: string): ConsultationRoom | undefined {
  return loadRooms().find((r) => r.code === code.toUpperCase());
}

export function listRooms(doctorId?: string): ConsultationRoom[] {
  const rooms = loadRooms();
  return doctorId ? rooms.filter((r) => r.doctorId === doctorId) : rooms;
}

export function joinRoom(code: string, patientId: string, patientName?: string): ConsultationRoom {
  const rooms = loadRooms();
  const room = rooms.find((r) => r.code === code.toUpperCase());

  if (!room) {
    throw new Error('ROOM_NOT_FOUND');
  }
  if (room.status === 'closed') {
    throw new Error('ROOM_CLOSED');
  }

  const updated: ConsultationRoom = {
    ...room,
    patientId,
    patientName,
    status: 'in-consult',
  };

  saveRooms(rooms.map((r) => (r.code === updated.code ? updated : r)));
  return updated;
}

export function closeRoom(code: string): void {
  const rooms = loadRooms();
  saveRooms(
    rooms.map((r) => (r.code === code.toUpperCase() ? { ...r, status: 'closed' as RoomStatus } : r)),
  );
}
