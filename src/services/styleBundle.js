import {
  CARTO_DARK_MATTER_STYLE_URL,
  CARTO_POSITRON_STYLE_URL,
  OPEN_FREEMAP_GLYPHS_URL,
  OPEN_FREEMAP_STYLE_URL
} from '../config/endpoints.js';
import {
  SATELLITE_SOURCE_ID,
  TERRAIN_SOURCE_ID,
  createSatelliteSource,
  createTerrainSource
} from '../config/sources.js';

const BUILDINGS_LAYER_ID = 'osm-3d-buildings';

export const VIEW = {
  SATELLITE: 'satellite',
  POSITRON: 'positron',
  DARK: 'dark'
};

export async function createStyleBundle(view, initialVisibility = true) {
  if (view === VIEW.POSITRON) {
    return buildVectorBasemapBundle(CARTO_POSITRON_STYLE_URL, initialVisibility);
  }
  if (view === VIEW.DARK) {
    return buildVectorBasemapBundle(CARTO_DARK_MATTER_STYLE_URL, initialVisibility);
  }
  return buildSatelliteHybridBundle(initialVisibility);
}

async function buildSatelliteHybridBundle(initialVisibility) {
  try {
    const referenceStyle = await fetchJson(OPEN_FREEMAP_STYLE_URL);
    return buildHybridStyle(referenceStyle, OPEN_FREEMAP_STYLE_URL, initialVisibility);
  } catch (error) {
    console.warn('Falling back to satellite + terrain only:', error);
    return {
      ...buildFallbackStyle(),
      statusMessage:
        'OpenStreetMap cartography is unavailable right now, so this view is satellite + terrain only.'
    };
  }
}

async function buildVectorBasemapBundle(styleUrl, initialVisibility) {
  const baseStyle = await fetchJson(styleUrl);
  const terrainSource = createTerrainSource();

  const style = {
    ...baseStyle,
    sources: {
      ...(baseStyle.sources ?? {}),
      [TERRAIN_SOURCE_ID]: terrainSource
    }
  };

  const inspectableLayerIds = computeInspectableLayers(style.layers ?? []);

  return {
    style,
    overlayLayerIds: [],
    inspectableLayerIds,
    supportsCartographyToggle: false
  };
}

function buildHybridStyle(referenceStyle, baseUrl, initialVisibility) {
  const satelliteSource = createSatelliteSource();
  const terrainSource = createTerrainSource();

  const vectorEntries = Object.entries(referenceStyle.sources ?? {}).filter(
    ([, source]) => source?.type === 'vector'
  );
  const [vectorSourceId, rawVectorSource] = vectorEntries[0] ?? [];
  const vectorSource = rawVectorSource
    ? absolutizeSource(rawVectorSource, baseUrl)
    : null;

  const overlayLayers = (referenceStyle.layers ?? [])
    .filter((layer) => layer.source === vectorSourceId)
    .filter((layer) => keepOverlayLayer(layer))
    .map((layer) => {
      const tuned = tuneOverlayLayer(layer);
      return {
        ...tuned,
        layout: {
          ...(tuned.layout ?? {}),
          visibility: initialVisibility ? 'visible' : 'none'
        }
      };
    });

  const lineLayers = overlayLayers.filter((layer) => layer.type === 'line');
  const symbolLayers = overlayLayers.filter((layer) => layer.type !== 'line');
  const overlayLayerIds = [...overlayLayers.map((layer) => layer.id)];
  const inspectableLayerIds = computeInspectableLayers(symbolLayers);

  const buildingsLayer = createBuildingsLayer(vectorSourceId);
  // Buildings are NOT dependent on cartography toggle, so they stay visible
  buildingsLayer.layout = {
    ...(buildingsLayer.layout ?? {}),
    visibility: 'visible'
  };

  return {
    style: {
      version: 8,
      name: 'Twin Earth Hybrid',
      glyphs: ensureGlyphsUrl(referenceStyle.glyphs, baseUrl),
      sprite: ensureStringUrl(referenceStyle.sprite, baseUrl),
      sources: {
        [SATELLITE_SOURCE_ID]: satelliteSource,
        [TERRAIN_SOURCE_ID]: terrainSource,
        ...(vectorSource ? { [vectorSourceId]: vectorSource } : {})
      },
      layers: [
        {
          id: SATELLITE_SOURCE_ID,
          type: 'raster',
          source: SATELLITE_SOURCE_ID,
          paint: {
            'raster-saturation': 0.08,
            'raster-contrast': 0.06
          }
        },
        ...lineLayers,
        ...(vectorSource ? [buildingsLayer] : []),
        ...symbolLayers
      ]
    },
    overlayLayerIds,
    inspectableLayerIds: [BUILDINGS_LAYER_ID, ...inspectableLayerIds],
    supportsCartographyToggle: true
  };
}

function buildFallbackStyle() {
  const satelliteSource = createSatelliteSource();
  const terrainSource = createTerrainSource();

  return {
    style: {
      version: 8,
      name: 'Twin Earth Fallback',
      sources: {
        [SATELLITE_SOURCE_ID]: satelliteSource,
        [TERRAIN_SOURCE_ID]: terrainSource
      },
      layers: [
        {
          id: SATELLITE_SOURCE_ID,
          type: 'raster',
          source: SATELLITE_SOURCE_ID
        }
      ]
    },
    overlayLayerIds: [],
    inspectableLayerIds: [],
    supportsCartographyToggle: false
  };
}

function computeInspectableLayers(layers) {
  return layers
    .filter((layer) => layer?.type === 'symbol')
    .filter((layer) => typeof layer.id === 'string')
    .filter((layer) => /(place|settlement|country|state|road|street|water)/i.test(layer.id))
    .map((layer) => layer.id)
    .slice(0, 18);
}

function createBuildingsLayer(sourceId) {
  return {
    id: BUILDINGS_LAYER_ID,
    type: 'fill-extrusion',
    source: sourceId,
    'source-layer': 'building',
    minzoom: 13.5,
    filter: [
      '>',
      ['to-number', ['coalesce', ['get', 'render_height'], ['get', 'height'], 0]],
      0
    ],
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['to-number', ['coalesce', ['get', 'render_height'], ['get', 'height'], 0]],
        0,
        '#d8e3ef',
        24,
        '#c7d4e0',
        80,
        '#9db0c3',
        180,
        '#6f879e'
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13.5,
        0,
        14.2,
        ['to-number', ['coalesce', ['get', 'render_height'], ['get', 'height'], 8]]
      ],
      'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13.5,
        0,
        14.2,
        ['to-number', ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]]
      ],
      'fill-extrusion-opacity': 0.92,
      'fill-extrusion-vertical-gradient': true
    }
  };
}

function keepOverlayLayer(layer) {
  if (!layer?.source || !layer.type || typeof layer.id !== 'string') {
    return false;
  }

  const id = layer.id.toLowerCase();

  if (layer.type === 'line') {
    return /(road|street|motorway|path|rail|bridge|tunnel|boundary|admin|coast|waterway)/i.test(
      id
    );
  }

  if (layer.type === 'symbol') {
    return !/(poi|housenumber|aeroway|landcover|natural-point|transit)/i.test(id);
  }

  return false;
}

function tuneOverlayLayer(layer) {
  const cloned = deepClone(layer);
  const id = cloned.id.toLowerCase();

  if (cloned.type === 'line') {
    cloned.minzoom = Math.max(cloned.minzoom ?? 0, id.includes('boundary') ? 2 : 7);
  }

  if (cloned.type === 'symbol') {
    cloned.paint = {
      ...cloned.paint,
      'text-halo-color': '#06111f',
      'text-halo-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        3,
        0.8,
        8,
        1.1,
        14,
        1.8
      ],
      'text-halo-blur': 0.4
    };

    if (/(road|street|transport)/i.test(id)) {
      cloned.minzoom = Math.max(cloned.minzoom ?? 0, 11);
    }
  }

  return cloned;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function absolutizeSource(source, baseUrl) {
  const cloned = deepClone(source);

  if (cloned.url) {
    cloned.url = absolutizeUrl(cloned.url, baseUrl);
  }

  if (Array.isArray(cloned.tiles)) {
    cloned.tiles = cloned.tiles.map((tileUrl) => absolutizeUrl(tileUrl, baseUrl));
  }

  return cloned;
}

function absolutizeUrl(url, baseUrl) {
  if (!url) {
    return url;
  }

  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function ensureStringUrl(url, baseUrl) {
  if (typeof url !== 'string' || !url.trim()) {
    return undefined;
  }
  return absolutizeUrl(url, baseUrl);
}

function ensureGlyphsUrl(glyphsUrl, baseUrl) {
  const candidate = ensureStringUrl(glyphsUrl, baseUrl);
  if (
    typeof candidate === 'string' &&
    candidate.includes('{fontstack}') &&
    candidate.includes('{range}')
  ) {
    return candidate;
  }
  return OPEN_FREEMAP_GLYPHS_URL;
}
