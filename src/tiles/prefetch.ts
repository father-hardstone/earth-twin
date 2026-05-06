import { lonLatToTileXY, normalizeZxy } from './tileKey';

export type PrefetchOptions = {
  padTiles: number;
};

const DEFAULTS: PrefetchOptions = { padTiles: 1 };

function tileRangeForBounds(bounds: { west: number; south: number; east: number; north: number }, z: number) {
  const nw = lonLatToTileXY(bounds.west, bounds.north, z);
  const se = lonLatToTileXY(bounds.east, bounds.south, z);
  const minX = Math.floor(Math.min(nw.x, se.x));
  const maxX = Math.floor(Math.max(nw.x, se.x));
  const minY = Math.floor(Math.min(nw.y, se.y));
  const maxY = Math.floor(Math.max(nw.y, se.y));
  return { minX, maxX, minY, maxY };
}

export function computePrefetchKeysForView(
  map: any,
  opts: Partial<PrefetchOptions> = {}
): Array<{ z: number; x: number; y: number }> {
  const o = { ...DEFAULTS, ...opts };
  const zoom = map.getZoom?.() ?? 0;
  const z = Math.max(0, Math.min(19, Math.floor(zoom)));
  const nextZ = Math.min(19, z + 1);
  const b = map.getBounds?.();
  if (!b) return [];
  const bounds = {
    west: b.getWest(),
    south: b.getSouth(),
    east: b.getEast(),
    north: b.getNorth()
  };

  const keys: Array<{ z: number; x: number; y: number }> = [];

  // Current zoom + next zoom (for zoom-in readiness).
  for (const targetZ of [z, nextZ]) {
    const r = tileRangeForBounds(bounds, targetZ);
    const pad = o.padTiles;
    for (let y = r.minY - pad; y <= r.maxY + pad; y++) {
      for (let x = r.minX - pad; x <= r.maxX + pad; x++) {
        const k = normalizeZxy(targetZ, x, y);
        keys.push(k);
      }
    }
  }

  // Parent zooms down to z0 (for zoom-out readiness).
  // At lower zooms there are very few tiles so this is cheap.
  for (let pz = z - 1; pz >= 0; pz--) {
    const r = tileRangeForBounds(bounds, pz);
    for (let y = r.minY; y <= r.maxY; y++) {
      for (let x = r.minX; x <= r.maxX; x++) {
        keys.push(normalizeZxy(pz, x, y));
      }
    }
  }

  return keys;
}

