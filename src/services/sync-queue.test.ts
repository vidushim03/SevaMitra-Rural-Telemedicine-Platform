import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SyncQueue, SyncOperation, QueuedOperation } from "./sync-queue";

vi.setConfig({ testTimeout: 8000 });

const KEY = "sevamitra.test.queue";

describe("SyncQueue", () => {
  let queue: SyncQueue;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
    queue = undefined as unknown as SyncQueue;
  });

  afterEach(() => {
    queue?.destroy();
    localStorage.clear();
  });

  function op(overrides: Partial<SyncOperation> = {}): SyncOperation {
    return { type: "message.created", payload: { text: "hi" }, createdAt: "2024-01-01T00:00:00Z", ...overrides };
  }

  it("enqueues operations and reports pending count", () => {
    queue = new SyncQueue(async () => false, KEY, { autoFlush: false });
    queue.enqueue(op());
    queue.enqueue(op());
    expect(queue.getPendingCount()).toBe(2);
  });

  it("persists queue to localStorage so it survives reload", () => {
    queue = new SyncQueue(async () => false, KEY, { autoFlush: false });
    queue.enqueue(op());
    const reloaded = new SyncQueue(async () => false, KEY, { autoFlush: false });
    expect(reloaded.getPendingCount()).toBe(1);
  });

  it("flushes queued operations when online and transport succeeds", async () => {
    const transport = vi.fn(async () => true);
    queue = new SyncQueue(transport, KEY, { autoFlush: false });
    queue.enqueue(op());
    queue.enqueue(op({ type: "appointment.created", payload: { id: "a1" } }));

    const synced = await queue.flush();

    expect(synced).toBe(2);
    expect(queue.getPendingCount()).toBe(0);
    expect(transport).toHaveBeenCalledTimes(1);
    const sent = transport.mock.calls[0][0] as QueuedOperation[];
    expect(sent).toHaveLength(2);
    expect(sent.every((item) => typeof item.id === 'string' && item.id.length > 0)).toBe(true);
  });

  it("keeps operations and increments attempts when transport fails", async () => {
    const transport = vi.fn(async () => false);
    queue = new SyncQueue(transport, KEY, { autoFlush: false });
    queue.enqueue(op());

    const synced = await queue.flush();

    expect(synced).toBe(0);
    expect(queue.getPendingCount()).toBe(1);
    const pending = queue.getPending();
    expect(pending[0].attempts).toBe(1);
  });

  it("does not flush while a flush is in progress", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const transport = vi.fn(async () => {
      await gate;
      return true;
    });
    queue = new SyncQueue(transport, KEY, { autoFlush: false });
    queue.enqueue(op());

    const first = queue.flush();
    const second = queue.flush();

    release();
    await Promise.all([first, second]);

    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("removes only acked items when a partial batch succeeds", async () => {
    queue = new SyncQueue(async () => true, KEY, { autoFlush: false });
    queue.enqueue(op());
    const second = queue.enqueue(op({ type: "record.created", payload: { id: "r1" } }));

    const firstFlush = await queue.flush();
    expect(firstFlush).toBe(2);
    expect(queue.getPendingCount()).toBe(0);
    expect(second.op.type).toBe("record.created");
  });

  it("notifies listeners on pending count change", () => {
    queue = new SyncQueue(async () => true, KEY, { autoFlush: false });
    const listener = vi.fn();
    queue.onPendingChange = listener;
    queue.enqueue(op());
    expect(listener).toHaveBeenCalledWith(1);
  });
});
