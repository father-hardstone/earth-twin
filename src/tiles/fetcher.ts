import type { TileKey } from './tileKey';

export type FetchResult = {
  data: ArrayBuffer;
  contentType: string;
};

export type FetchPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const DEFAULT_POLICY: FetchPolicy = {
  maxAttempts: 3,
  baseDelayMs: 400,
  maxDelayMs: 4000
};

function sleep(ms: number, signal?: AbortSignal) {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);
    if (signal) {
      if (signal.aborted) {
        window.clearTimeout(t);
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      } else {
        signal.addEventListener(
          'abort',
          () => {
            window.clearTimeout(t);
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
          },
          { once: true }
        );
      }
    }
  });
}

export async function fetchTileWithRetry(
  url: string,
  abortSignal: AbortSignal,
  policy: FetchPolicy = DEFAULT_POLICY
): Promise<FetchResult> {
  const attempts = Math.max(1, Math.floor(policy.maxAttempts));
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fetch(url, { signal: abortSignal, cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const contentType = (resp.headers.get('content-type') ?? 'application/octet-stream').toLowerCase();
      const data = await resp.arrayBuffer();
      if (!data || data.byteLength === 0) {
        throw new Error('Empty tile response');
      }
      // ArcGIS (and some proxies) can return HTML/JSON error pages with 200.
      // Never store or forward non-image bytes to MapLibre.
      if (!contentType.startsWith('image/')) {
        throw new Error(`Unexpected content-type: ${contentType}`);
      }
      return { data, contentType };
    } catch (e) {
      lastErr = e;
      if (abortSignal.aborted) throw e;
      const delay = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** i);
      await sleep(delay, abortSignal);
    }
  }
  throw lastErr ?? new Error('Tile fetch failed');
}

export function satelliteUrlFromKey(key: TileKey): string {
  // Matches `src/config/endpoints.js` ESRI URL template.
  return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${key.z}/${key.y}/${key.x}`;
}

