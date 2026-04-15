import type { TileManager } from './tileManager';

const PROTOCOL = 'tilemgr';

let registered = false;

function parseUrl(url: string) {
  // tilemgr://sat/{z}/{x}/{y}
  const cleaned = url.replace(/^[a-z]+:\/\//i, '');
  const parts = cleaned.split('/').filter(Boolean);
  const z = Number(parts[1]);
  const x = Number(parts[2]);
  const y = Number(parts[3]);
  return { z, x, y };
}

export function registerTileMgrProtocol(maplibregl: any, tileManager: TileManager) {
  if (!maplibregl || registered) return;
  registered = true;

  maplibregl.addProtocol(PROTOCOL, async (params: any, abortController: AbortController) => {
    const { z, x, y } = parseUrl(params.url);

    // Fast path: return the EXACT cached tile only (never a parent).
    const cached = tileManager.getExactCachedTile(z, x, y);
    if (cached) {
      // Kick off prefetch for neighbors in the background.
      tileManager.ensureTileAsync(z, x, y);
      return { data: cached.data.slice(0) };
    }

    // Slow path: fetch the exact tile over the network.
    const fetched = await tileManager.fetchTile(z, x, y, abortController.signal);
    return { data: fetched.data.slice(0) };
  });
}
