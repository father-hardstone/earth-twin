import { TERRAIN_SOURCE_ID } from '../config/sources.js';

export function updateTerrainForZoom(ctx) {
  const { map, state } = ctx;
  if (!map.getSource(TERRAIN_SOURCE_ID)) {
    return;
  }

  const zoom = map.getZoom();
  const shouldEnable = zoom >= 2.8;

  if (shouldEnable === state.terrainEnabled) {
    return;
  }

  try {
    if (shouldEnable) {
      map.setTerrain({
        source: TERRAIN_SOURCE_ID,
        exaggeration: state.terrainExaggeration
      });
    } else {
      map.setTerrain(null);
    }
    state.terrainEnabled = shouldEnable;
  } catch (error) {
    console.warn('Terrain toggle failed:', error);
  }
}

export function scheduleTerrainUpdate(ctx) {
  const { map, state } = ctx;
  if (!state.terrainEnabled) {
    return;
  }

  if (state.pendingTerrainUpdateRaf) {
    return;
  }

  state.pendingTerrainUpdateRaf = window.requestAnimationFrame(() => {
    state.pendingTerrainUpdateRaf = null;
    try {
      map.setTerrain({
        source: TERRAIN_SOURCE_ID,
        exaggeration: state.terrainExaggeration
      });
    } catch (error) {
      console.warn('Terrain update failed:', error);
    }
  });
}
