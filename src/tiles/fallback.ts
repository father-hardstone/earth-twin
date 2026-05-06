import type { TileKey } from './tileKey';
import { parentKey, tileKeyToString } from './tileKey';
import { PLACEHOLDER_CONTENT_TYPE, PLACEHOLDER_PNG } from './placeholder';

export type TileBytes = { data: ArrayBuffer; contentType: string };

export type FallbackLookup = {
  getExact: (k: string) => TileBytes | undefined;
  getLastKnownGood: (k: string) => TileBytes | undefined;
};

export function resolveImmediateTile(key: TileKey, lookup: FallbackLookup): TileBytes {
  const exactKey = tileKeyToString(key);
  const exact = lookup.getExact(exactKey);
  if (exact) return exact;

  const lkg = lookup.getLastKnownGood(exactKey);
  if (lkg) return lkg;

  let p = parentKey(key);
  while (p) {
    const pk = tileKeyToString(p);
    const parent = lookup.getExact(pk) ?? lookup.getLastKnownGood(pk);
    if (parent) return parent;
    p = parentKey(p);
  }

  return { data: PLACEHOLDER_PNG, contentType: PLACEHOLDER_CONTENT_TYPE };
}

