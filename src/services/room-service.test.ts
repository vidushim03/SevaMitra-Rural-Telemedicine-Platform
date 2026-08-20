import { beforeEach, describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 8000 });

import {
  closeRoom,
  createRoom,
  generateRoomCode,
  getRoom,
  joinRoom,
  listRooms,
  roomJoinPayload,
} from "./room-service";

describe("room-service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("generates room codes of expected length from unambiguous alphabet", () => {
    const codes = Array.from({ length: 100 }, () => generateRoomCode());
    codes.forEach((c) => {
      expect(c).toHaveLength(6);
      expect(c).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    });
    // No collisions across 100 draws
    expect(new Set(codes).size).toBe(100);
  });

  it("creates a room and persists it", () => {
    const room = createRoom("doctor_1", "Dr. Priya");
    expect(room.code).toBeTruthy();
    expect(room.doctorId).toBe("doctor_1");
    expect(room.status).toBe("active");
    expect(getRoom(room.code)).toEqual(room);
  });

  it("returns the existing open room for a doctor instead of duplicating", () => {
    const first = createRoom("doctor_1");
    const second = createRoom("doctor_1");
    expect(second.code).toBe(first.code);
    expect(listRooms("doctor_1")).toHaveLength(1);
  });

  it("allows a patient to join an active room", () => {
    const room = createRoom("doctor_1");
    const joined = joinRoom(room.code, "patient_1", "Rohan");
    expect(joined.status).toBe("in-consult");
    expect(joined.patientId).toBe("patient_1");
  });

  it("throws ROOM_NOT_FOUND for an unknown code", () => {
    expect(() => joinRoom("ZZZZZZ", "patient_1")).toThrow("ROOM_NOT_FOUND");
  });

  it("throws ROOM_CLOSED after a room is closed", () => {
    const room = createRoom("doctor_1");
    closeRoom(room.code);
    expect(() => joinRoom(room.code, "patient_1")).toThrow("ROOM_CLOSED");
  });

  it("normalizes codes to uppercase", () => {
    const room = createRoom("doctor_1");
    expect(joinRoom(room.code.toLowerCase(), "patient_1").code).toBe(room.code);
  });

  it("builds a scannable join payload", () => {
    expect(roomJoinPayload("ab3k9q")).toBe("sevamitra://join/AB3K9Q");
  });
});
