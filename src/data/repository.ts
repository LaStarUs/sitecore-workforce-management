import type { WorkforceData } from '../domain/types';
import { createSeedData } from './seed';

/**
 * Storage boundary for the app. The UI only talks to this interface, so the
 * browser-storage version can be swapped for an API or database adapter
 * without touching components.
 */
export interface WorkforceRepository {
  load(): Promise<WorkforceData>;
  save(data: WorkforceData): Promise<void>;
  reset(): Promise<WorkforceData>;
}

const STORAGE_KEY = 'siteready:v2';

export class LocalStorageRepository implements WorkforceRepository {
  private readonly storage: Storage | undefined;
  private readonly key: string;

  constructor(storage: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage, key = STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
  }

  async load(): Promise<WorkforceData> {
    try {
      const raw = this.storage?.getItem(this.key);
      if (raw) return JSON.parse(raw) as WorkforceData;
    } catch {
      // Corrupt or blocked storage: fall back to fresh demo data.
    }
    return this.reset();
  }

  async save(data: WorkforceData): Promise<void> {
    try {
      this.storage?.setItem(this.key, JSON.stringify(data));
    } catch {
      // Storage full or unavailable (private mode). The app keeps working in memory.
    }
  }

  async reset(): Promise<WorkforceData> {
    const data = createSeedData();
    await this.save(data);
    return data;
  }
}

/** In-memory adapter, used by tests. */
export class MemoryRepository implements WorkforceRepository {
  private data: WorkforceData;

  constructor(data: WorkforceData = createSeedData()) {
    this.data = data;
  }
  async load() {
    return structuredClone(this.data);
  }
  async save(data: WorkforceData) {
    this.data = structuredClone(data);
  }
  async reset() {
    this.data = createSeedData();
    return structuredClone(this.data);
  }
}
