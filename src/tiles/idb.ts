import type { TileKey } from './tileKey';
import { tileKeyToString } from './tileKey';

type TileRecord = {
  key: string;
  updatedAt: number;
  contentType: string;
  data: ArrayBuffer;
};

const DB_NAME = 'earthTwinTiles';
const DB_VERSION = 2;
const STORE = 'tiles';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Schema v2: reset the store to purge any previously-cached invalid bytes.
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE);
      }
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
  return dbPromise;
}

export async function idbGet(key: string): Promise<TileRecord | null> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as TileRecord) ?? null);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB get failed'));
  });
}

export async function idbPutTile(tileKey: TileKey, data: ArrayBuffer, contentType: string) {
  const db = await openDb();
  const rec: TileRecord = {
    key: tileKeyToString(tileKey),
    updatedAt: Date.now(),
    contentType,
    data
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB put tx failed'));
    tx.objectStore(STORE).put(rec);
  });
}

export async function idbWarmToMemory(
  keys: string[],
  onHit: (key: string, data: ArrayBuffer, contentType: string) => void
) {
  // Best-effort: run gets sequentially to avoid hammering IDB.
  for (const k of keys) {
    try {
      const rec = await idbGet(k);
      if (rec?.data) onHit(k, rec.data, rec.contentType);
    } catch (e) {
      // ignore; still satisfies non-blocking requirement
    }
  }
}

