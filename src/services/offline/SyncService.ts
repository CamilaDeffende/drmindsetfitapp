/**
 * SyncService (offline/sync)
 * Implementação local (localStorage) — placeholder para backend real
 */
export type SyncItem = {
  id: string;
  type: "workout" | "measurement" | "nutrition";
  data: unknown;
  timestamp: number;
  synced: boolean;
  retries: number;
};

export type SyncConflict = {
  id: string;
  localData: unknown;
  remoteData: unknown;
  resolution?: "local" | "remote" | "merge";
};

class SyncService {
  private readonly STORAGE_KEY_QUEUE = "drmindsetfit:sync-queue";
  private readonly STORAGE_KEY_CONFLICTS = "drmindsetfit:sync-conflicts";
  private readonly MAX_RETRIES = 3;
  private isSyncing = false;

  addToQueue(type: SyncItem["type"], data: unknown): void {
    const queue = this.getQueue();
    const item: SyncItem = {
      id: `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
      retries: 0,
    };
    queue.push(item);
    this.saveQueue(queue);
  }

  private getQueue(): SyncItem[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_QUEUE);
    return raw ? (JSON.parse(raw) as SyncItem[]) : [];
  }

  private saveQueue(queue: SyncItem[]): void {
    localStorage.setItem(this.STORAGE_KEY_QUEUE, JSON.stringify(queue));
  }

  getConflicts(): SyncConflict[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_CONFLICTS);
    return raw ? (JSON.parse(raw) as SyncConflict[]) : [];
  }

  resolveConflict(conflictId: string, resolution: "local" | "remote" | "merge"): void {
    const conflicts = this.getConflicts();
    const found = conflicts.find((c) => c.id == conflictId);
    if (!found) return;
    found.resolution = resolution;
    const updated = conflicts.filter((c) => c.id !== conflictId);
    localStorage.setItem(this.STORAGE_KEY_CONFLICTS, JSON.stringify(updated));
  }

  getQueueStats(): { total: number; pending: number; synced: number; failed: number } {
    const queue = this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter((i) => !i.synced && i.retries < this.MAX_RETRIES).length,
      synced: queue.filter((i) => i.synced).length,
      failed: queue.filter((i) => i.retries >= this.MAX_RETRIES).length,
    };
  }

  clearSyncedItems(): void {
    const queue = this.getQueue().filter((i) => !i.synced);
    this.saveQueue(queue);
  }

  async startSync(): Promise<{ success: number; failed: number; conflicts: number }> {
    if (this.isSyncing) return { success: 0, failed: 0, conflicts: 0 };
    this.isSyncing = true;

    const queue = this.getQueue();
    const pending = queue.filter((i) => !i.synced && i.retries < this.MAX_RETRIES);

    let success = 0;
    let failed = 0;
  const conflicts = 0;

    for (const item of pending) {
      try {
        // placeholder: sucesso sempre
        await new Promise((r) => setTimeout(r, 50));
        item.synced = true;
        success += 1;
      } catch {
        item.retries += 1;
        failed += 1;
      }
    }

    this.saveQueue(queue.filter((i) => !i.synced));
    this.isSyncing = false;
    return { success, failed, conflicts };
  }
}

export const syncService = new SyncService();
