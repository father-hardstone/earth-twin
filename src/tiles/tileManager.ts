import type { TileKey } from './tileKey';
import { normalizeZxy, tileKeyToString } from './tileKey';
import { LruCache } from './lru';
import { idbGet, idbPutTile } from './idb';
import { fetchTileWithRetry, satelliteUrlFromKey } from './fetcher';
import { type TileBytes } from './fallback';
import { looksLikeImage } from './magic';

export type TileManagerOptions = {
  memoryMaxBytes: number;
  maxFetchConcurrency: number;
};

type InFlight = {
  controller: AbortController;
  promise: Promise<void>;
};

export class TileManager {
  private memory: LruCache<string, TileBytes>;
  private lastKnownGood: LruCache<string, TileBytes>;
  private inFlight = new Map<string, InFlight>();
  private queue: string[] = [];
  private activeFetches = 0;
  private maxFetchConcurrency: number;
  private onTileUpdated?: (keyStr: string) => void;
  private failUntilByKey = new Map<string, number>();
  private hostFailUntil = new Map<string, number>();

  constructor(opts: TileManagerOptions) {
    this.memory = new LruCache<string, TileBytes>(opts.memoryMaxBytes);
    // Keep a smaller LKG cache so failures don't create holes.
    this.lastKnownGood = new LruCache<string, TileBytes>(Math.floor(opts.memoryMaxBytes * 0.35));
    this.maxFetchConcurrency = Math.max(1, Math.floor(opts.maxFetchConcurrency));
  }

  setOnTileUpdated(cb: (keyStr: string) => void) {
    this.onTileUpdated = cb;
  }

  /**
   * Returns the exact cached tile for this Z/X/Y only (no parent walk).
   * Used by the protocol handler — MapLibre cannot use a different zoom's tile.
   */
  getExactCachedTile(z: number, x: number, y: number): TileBytes | undefined {
    const key = normalizeZxy(z, x, y);
    const keyStr = tileKeyToString(key);
    return this.safeGet(this.memory, keyStr) ?? this.safeGet(this.lastKnownGood, keyStr);
  }

  /**
   * Fetches a tile over the network, caches it, and returns valid image bytes.
   * On failure returns a parent/LKG tile or throws.
   */
  async fetchTile(z: number, x: number, y: number, signal: AbortSignal): Promise<TileBytes> {
    const key = normalizeZxy(z, x, y);
    const keyStr = tileKeyToString(key);

    // Try IDB first.
    try {
      const rec = await idbGet(keyStr);
      if (rec?.data && rec.data.byteLength > 0 && looksLikeImage(rec.data)) {
        const bytes: TileBytes = { data: rec.data, contentType: rec.contentType };
        this.putMemory(keyStr, bytes);
        this.putLastKnownGood(keyStr, bytes);
        return bytes;
      }
    } catch { /* ignore */ }

    // Network fetch.
    try {
      const url = satelliteUrlFromKey(key);
      const { data, contentType } = await fetchTileWithRetry(url, signal);
      const bytes: TileBytes = { data, contentType };
      this.putMemory(keyStr, bytes);
      this.putLastKnownGood(keyStr, bytes);
      void idbPutTile(key, data, contentType);
      this.failUntilByKey.delete(keyStr);
      return bytes;
    } catch (e) {
      this.failUntilByKey.set(keyStr, Date.now() + 2500);
      // Return any exact-match fallback we can find.
      const fallback = this.getExactCachedTile(z, x, y);
      if (fallback) return fallback;
      throw e;
    }
  }

  ensureTileAsync(z: number, x: number, y: number) {
    const key = normalizeZxy(z, x, y);
    const keyStr = tileKeyToString(key);
    if (this.memory.has(keyStr)) return;
    if (this.inFlight.has(keyStr)) return;

    const now = Date.now();
    const failUntil = this.failUntilByKey.get(keyStr);
    if (failUntil && failUntil > now) return;

    // Quick async attempt to hydrate from IDB first.
    const controller = new AbortController();
    const promise = (async () => {
      try {
        const rec = await idbGet(keyStr);
        if (rec?.data && rec.data.byteLength > 0 && looksLikeImage(rec.data)) {
          const bytes: TileBytes = { data: rec.data, contentType: rec.contentType };
          this.putMemory(keyStr, bytes);
          this.putLastKnownGood(keyStr, bytes);
          this.onTileUpdated?.(keyStr);
          return;
        }
      } catch {
        // ignore
      }

      // Enqueue network fetch (concurrency-limited).
      this.queue.push(keyStr);
      this.pumpQueue();
    })();

    this.inFlight.set(keyStr, { controller, promise });
    promise.finally(() => {
      // If it was just IDB hydrate, it finishes quickly.
      // If it enqueued, inFlight will be replaced by fetch stage below.
      const cur = this.inFlight.get(keyStr);
      if (cur?.promise === promise) this.inFlight.delete(keyStr);
    });
  }

  prefetch(keys: Array<{ z: number; x: number; y: number }>) {
    for (const k of keys) this.ensureTileAsync(k.z, k.x, k.y);
  }

  /**
   * Pre-seed zoom levels 0..maxZ so the globe always has base coverage.
   * z0=1, z1=4, z2=16, z3=64 = 85 tiles total — very manageable.
   */
  preseedBaseZooms(maxZ = 3) {
    for (let z = 0; z <= maxZ; z++) {
      const n = 2 ** z;
      for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
          this.ensureTileAsync(z, x, y);
        }
      }
    }
  }

  private pumpQueue() {
    while (this.activeFetches < this.maxFetchConcurrency && this.queue.length > 0) {
      const keyStr = this.queue.shift()!;
      if (this.memory.has(keyStr)) continue;
      if (this.inFlight.has(keyStr)) continue;
      this.activeFetches++;

      const controller = new AbortController();
      const promise = this.fetchAndStore(keyStr, controller.signal).finally(() => {
        this.activeFetches--;
        this.inFlight.delete(keyStr);
        this.pumpQueue();
      });
      this.inFlight.set(keyStr, { controller, promise });
    }
  }

  private async fetchAndStore(keyStr: string, signal: AbortSignal) {
    if (!navigator.onLine) {
      // backoff lightly when offline
      this.failUntilByKey.set(keyStr, Date.now() + 1500);
      return;
    }

    const [zS, xS, yS] = keyStr.split('/');
    const z = Number(zS);
    const x = Number(xS);
    const y = Number(yS);
    const key = normalizeZxy(z, x, y);

    try {
      const url = satelliteUrlFromKey(key);
      const host = new URL(url).host;
      const hostUntil = this.hostFailUntil.get(host);
      if (hostUntil && hostUntil > Date.now()) {
        this.failUntilByKey.set(keyStr, hostUntil);
        return;
      }
      const { data, contentType } = await fetchTileWithRetry(url, signal);
      const bytes: TileBytes = { data, contentType };
      this.putMemory(keyStr, bytes);
      this.putLastKnownGood(keyStr, bytes);
      void idbPutTile(key, data, contentType);
      this.onTileUpdated?.(keyStr);
      this.failUntilByKey.delete(keyStr);
      this.hostFailUntil.delete(host);
    } catch (e) {
      // Exponential-ish cooldown to avoid hammering.
      const until = Date.now() + 2500;
      this.failUntilByKey.set(keyStr, until);
      try {
        const url = satelliteUrlFromKey(key);
        const host = new URL(url).host;
        const cur = this.hostFailUntil.get(host) ?? 0;
        this.hostFailUntil.set(host, Math.max(cur, until));
      } catch {}
    }
  }

  private putMemory(keyStr: string, bytes: TileBytes) {
    const size = bytes.data.byteLength;
    this.memory.set(keyStr, bytes, size);
  }

  private putLastKnownGood(keyStr: string, bytes: TileBytes) {
    this.lastKnownGood.set(keyStr, bytes, bytes.data.byteLength);
  }

  private safeGet(cache: LruCache<string, TileBytes>, keyStr: string): TileBytes | undefined {
    const hit = cache.get(keyStr);
    if (!hit) return undefined;
    // ArrayBuffers can be detached if they were transferred to a worker.
    // Treat detached/empty buffers as cache misses and purge them.
    if (!hit.data || hit.data.byteLength === 0) {
      cache.delete(keyStr);
      return undefined;
    }
    // Never serve non-image bytes to MapLibre.
    if (!looksLikeImage(hit.data)) {
      cache.delete(keyStr);
      return undefined;
    }
    return hit;
  }
}

