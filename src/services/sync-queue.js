const STORAGE_KEY = "sevamitra.sync.queue.v1";

function isBrowserOnline() {
  return typeof navigator !== "undefined" &&
    typeof navigator.onLine === "boolean"
    ? navigator.onLine
    : true;
}

export class SyncQueue {
  queue = [];
  flushing = false;

  constructor(transport, storageKey = STORAGE_KEY, options = {}) {
    this.transport =
      transport ||
      (async (operations) => {
        const res = await fetch(`${this.signalingBase()}/api/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.onOnlineHandler);
    }
  }

  signalingBase() {
    const envUrl = import.meta.env?.VITE_SIGNALING_SERVER_URL ?? "";
    if (envUrl) return envUrl;
    if (typeof window !== "undefined" && window.location?.hostname) {
      return `http://${window.location.hostname}:4001`;
    }
    return "http://localhost:4001";
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.queue = raw ? JSON.parse(raw) : [];
    } catch {
      this.queue = [];
    }
    this.notifyPending();
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
  }

  notifyPending() {
    this.onPendingChange?.(this.queue.length);
  }

  enqueue(op) {
    const item = {
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

  getPending() {
    return [...this.queue];
  }

  getPendingCount() {
    return this.queue.length;
  }

  isFlushing() {
    return this.flushing;
  }

  async flush() {
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

  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.onOnlineHandler);
    }
  }
}

export const onlineStatus = isBrowserOnline;
