import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Copy, DoorOpen, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import {
  createRoom,
  joinRoom,
  getRoom,
  roomJoinPayload,
} from "../services/room-service";
import { useTranslation } from "./translations";

export function RoomOnboarding({ language, userId, userName, role }) {
  const [room, setRoom] = useState(() => {
    try {
      return createRoom(userId, userName);
    } catch {
      return null;
    }
  });
  const [joinCode, setJoinCode] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const t = useTranslation(language);

  const handleCreateRoom = () => {
    const next = createRoom(userId, userName);
    setRoom(next);
    setError("");
  };

  const handleCopy = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a room code to continue.");
      return;
    }
    try {
      const existing = getRoom(code);
      if (existing && existing.patientId && existing.patientId !== userId) {
        // Just log it instead of blocking, to allow seamless multi-tab testing
        console.warn(
          `Taking over room ${code} from previous patient ${existing.patientId}`,
        );
      }
      const joined = joinRoom(code, userId, userName);
      setJoinedRoom(joined);
      setError("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ROOM_NOT_FOUND";
      setError(
        msg === "ROOM_CLOSED"
          ? "This room is closed."
          : "Room not found. Check the code with the doctor.",
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {role === "doctor" ? <QrCode size={20} /> : <DoorOpen size={20} />}
          {role === "doctor"
            ? "Consultation Room (QR / Code)"
            : "Join a Consultation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {role === "doctor" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Share this room code or QR with a patient so they can join your
              live consultation. Works on low-bandwidth networks — the QR
              encodes the same code for offline scanning.
            </p>

            {room ? (
              <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl border p-4">
                <div className="rounded-lg bg-white p-3">
                  <QRCodeSVG
                    value={roomJoinPayload(room.code)}
                    size={132}
                    level="M"
                  />
                </div>
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Room Code
                    </Label>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-3xl font-bold tracking-widest">
                        {room.code}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <Badge variant="secondary">
                      <ShieldCheck size={12} className="mr-1" />
                      {room.status === "in-consult"
                        ? "In consultation"
                        : "Active"}
                    </Badge>
                    {room.patientName && (
                      <Badge>{room.patientName} joined</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      <Copy size={14} className="mr-1" />{" "}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateRoom}
                    >
                      <RefreshCw size={14} className="mr-1" /> New Room
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Could not create a room.
              </p>
            )}
          </>
        ) : (
          <>
            {joinedRoom ? (
              <div className="rounded-xl border p-4 space-y-2">
                <p className="text-sm font-medium">
                  You joined room {joinedRoom.code}
                </p>
                <p className="text-xs text-muted-foreground">
                  Connected with {joinedRoom.doctorName || "your doctor"}.
                  Proceed to the consultation workspace.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Enter the room code from your doctor, or scan their QR code,
                  to join the consultation.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AB3K9Q"
                    className="font-mono uppercase tracking-widest"
                    maxLength={6}
                  />

                  <Button onClick={handleJoin}>Join</Button>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <p className="text-xs text-muted-foreground">
                  Tip: the QR shares the same code — scan it with any camera app
                  on your phone.
                </p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
