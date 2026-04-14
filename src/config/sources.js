import { AWS_TERRARIUM_TILES, ESRI_WORLD_IMAGERY_TILES } from './endpoints.js';

export const SATELLITE_SOURCE_ID = 'satellite-imagery';
export const TERRAIN_SOURCE_ID = 'terrain-dem';

export function createSatelliteSource() {
  return {
    type: 'raster',
    tiles: ESRI_WORLD_IMAGERY_TILES,
    tileSize: 256,
    maxzoom: 19,
    attribution:
      'Imagery by Esri, Maxar, Earthstar Geographics, and the GIS user community'
  };
}

export function createTerrainSource() {
  return {
    type: 'raster-dem',
    encoding: 'terrarium',
    tiles: AWS_TERRARIUM_TILES,
    tileSize: 256,
    maxzoom: 15,
    attribution: 'Terrain by Mapzen and the AWS Public Dataset Program'
  };
}
