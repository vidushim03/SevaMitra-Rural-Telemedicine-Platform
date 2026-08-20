export type SyncOperation =
  | { type: 'appointment.created'; payload: unknown; createdAt: string }
  | { type: 'appointment.updated'; id: string; status: string; createdAt: string }
  | { type: 'record.created'; payload: unknown; createdAt: string }
  | { type: 'prescription.created'; payload: unknown; createdAt: string }
  | { type: 'payment.created'; payload: unknown; createdAt: string }
  | { type: 'payment.updated'; id: string; status: string; createdAt: string }
  | { type: 'queue.updated'; id: string; status: string; createdAt: string }
  | { type: 'message.created'; payload: unknown; createdAt: string };

export interface QueuedOperation {
  id: string;
  op: SyncOperation;
  attempts: number;
  lastAttemptAt?: string;
}

const STORAGE_KEY = 'sevamitra.sync.queue.v1';

function isBrowserOnline(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;
}

export class SyncQueue {
  private queue: QueuedOperation[] = [];
  private flushing = false;
  private storageKey: string;
  private onOnlineHandler: () => void;

  public onPendingChange?: (pending: number) => void;
  public onSynced?: (count: number) => void;
  public transport: (operations: QueuedOperation[]) => Promise<boolean>;

  constructor(
    transport?: (operations: QueuedOperation[]) => Promise<boolean>,
    storageKey: string = STORAGE_KEY,
    options: { autoFlush?: boolean } = {},
  ) {
    this.transport =
      transport ||
      (async (operations) => {
        const res = await fetch(`${this.signalingBase()}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operations: operations.map(({ id, op }) => ({ id, ...op })),
          }),
        });
        return res.ok;
      });
    this.storageKey = storageKey;
    this.autoFlush = options.autoFlush !== false;
    this.onOnlineHandler = () => {
      if (isBrowserOnline()) {
        void this.flush();
      }
    };
    this.load();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onOnlineHandler);
    }
  }

  private autoFlush: boolean;

  private signalingBase(): string {
    const envUrl = (import.meta.env?.VITE_SIGNALING_SERVER_URL as string | undefined) ?? '';
    if (envUrl) return envUrl;
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:4001`;
    }
    return 'http://localhost:4001';
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.queue = raw ? (JSON.parse(raw) as QueuedOperation[]) : [];
    } catch {
      this.queue = [];
    }
    this.notifyPending();
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }

  private notifyPending() {
    this.onPendingChange?.(this.queue.length);
  }

  public enqueue(op: SyncOperation): QueuedOperation {
    const item: QueuedOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      op,
      attempts: 0,
    };
    this.queue.push(item);
    this.save();
    this.notifyPending();
    if (this.autoFlush && isBrowserOnline()) {
      void this.flush();
    }
    return item;
  }

  public getPending(): QueuedOperation[] {
    return [...this.queue];
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public isFlushing(): boolean {
    return this.flushing;
  }

  public async flush(): Promise<number> {
    if (this.flushing || this.queue.length === 0) return 0;
    if (!isBrowserOnline()) return 0;

    this.flushing = true;
    try {
      const batch = this.queue.slice(0, 50);
      let ok = false;
      try {
        ok = await this.transport(batch);
      } catch {
        ok = false;
      }

      if (ok) {
        const acked = new Set(batch.map((b) => b.id));
        this.queue = this.queue.filter((q) => !acked.has(q.id));
        this.save();
        this.notifyPending();
        this.onSynced?.(acked.size);
        return acked.size;
      }
      batch.forEach((b) => {
        b.attempts += 1;
        b.lastAttemptAt = new Date().toISOString();
      });
      this.save();
      return 0;
    } finally {
      this.flushing = false;
    }
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onOnlineHandler);
    }
  }
}

export const onlineStatus = isBrowserOnline;
