import * as Cesium from 'cesium';

export async function loadTerrain(viewer, waterMaskEnabled = true) {
  try {
    viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
      requestVertexNormals: true,
      requestWaterMask: waterMaskEnabled
    });
  } catch (e) {
    console.warn('Terrain load failed:', e);
  }
}

export async function loadBuildings(viewer) {
  try {
    const buildings = await Cesium.Cesium3DTileset.fromIonAssetId(96188, {
      maximumScreenSpaceError: 32.0,
      dynamicScreenSpaceError: true,
      dynamicScreenSpaceErrorFactor: 4.0,
      dynamicScreenSpaceErrorDensity: 0.0027,
      dynamicScreenSpaceErrorHeightFalloff: 0.25
    });
    viewer.scene.primitives.add(buildings);
    return buildings;
  } catch (e) {
    console.warn('Buildings failed to load:', e);
    return null;
  }
}

export function updateTerrainExaggeration(viewer, exaggeration) {
  if (viewer.scene.globe) {
    viewer.scene.globe.terrainExaggeration = exaggeration;
  }
}
