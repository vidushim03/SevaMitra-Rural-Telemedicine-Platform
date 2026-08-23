const STORAGE_KEY = "sevamitra.rooms.v1";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export function roomJoinPayload(code) {
  return `sevamitra://join/${code.toUpperCase()}`;
}

function loadRooms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRooms(rooms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export function createRoom(doctorId, doctorName) {
  const rooms = loadRooms();
  const existing = rooms.find(
    (r) => r.doctorId === doctorId && r.status !== "closed",
  );
  if (existing) return existing;

  let code = generateRoomCode();
  while (rooms.some((r) => r.code === code && r.status !== "closed")) {
    code = generateRoomCode();
  }

  const room = {
    code,
    doctorId,
    doctorName,
    createdAt: new Date().toISOString(),
    status: "active",
  };

  saveRooms([room, ...rooms]);
  return room;
}

export function getRoom(code) {
  return loadRooms().find((r) => r.code === code.toUpperCase());
}

export function listRooms(doctorId) {
  const rooms = loadRooms();
  return doctorId ? rooms.filter((r) => r.doctorId === doctorId) : rooms;
}

export function joinRoom(code, patientId, patientName) {
  const rooms = loadRooms();
  const room = rooms.find((r) => r.code === code.toUpperCase());

  if (!room) {
    throw new Error("ROOM_NOT_FOUND");
  }
  if (room.status === "closed") {
    throw new Error("ROOM_CLOSED");
  }

  const updated = {
    ...room,
    patientId,
    patientName,
    status: "in-consult",
  };

  saveRooms(rooms.map((r) => (r.code === updated.code ? updated : r)));
  return updated;
}

export function closeRoom(code) {
  const rooms = loadRooms();
  saveRooms(
    rooms.map((r) =>
      r.code === code.toUpperCase() ? { ...r, status: "closed" } : r,
    ),
  );
}
