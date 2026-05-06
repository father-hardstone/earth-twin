export type TileKey = {
  z: number;
  x: number;
  y: number;
};

export function normalizeZxy(z: number, x: number, y: number): TileKey {
  const zz = Math.max(0, Math.floor(z));
  const n = 2 ** zz;
  const xx = ((Math.floor(x) % n) + n) % n;
  const yy = Math.max(0, Math.min(n - 1, Math.floor(y)));
  return { z: zz, x: xx, y: yy };
}

export function tileKeyToString(key: TileKey): string {
  return `${key.z}/${key.x}/${key.y}`;
}

export function parentKey(key: TileKey): TileKey | null {
  if (key.z <= 0) return null;
  return normalizeZxy(key.z - 1, Math.floor(key.x / 2), Math.floor(key.y / 2));
}

export function lonLatToTileXY(lonDeg: number, latDeg: number, z: number): { x: number; y: number } {
  const lat = Math.max(-85.05112878, Math.min(85.05112878, latDeg));
  const n = 2 ** z;
  const x = ((lonDeg + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  return { x, y };
}

