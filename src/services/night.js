import { SATELLITE_SOURCE_ID } from '../config/sources.js';

const CITY_LIGHTS_SOURCE_ID = 'gibs-city-lights';
const CITY_LIGHTS_LAYER_ID = 'gibs-city-lights-layer';

const LIGHTS_PROTOCOL = 'gibslights';

const TIME_BUCKET_MS = 2 * 60 * 1000;
let protocolRegistered = false;
let lastBucket = null;

export function applyLighting(ctx) {
  const { map, state } = ctx;
  if (!map) {
    return;
  }

  const zoom = map.getZoom();
  const orbital = zoom <= 5.2;

  // IMPORTANT: We never apply a dark "night filter" to the basemap.
  // Night mode is purely "lights overlay".
  setSatelliteNightPaint(ctx, false);

  const showLights = orbital && (state.realtimeLightingEnabled || state.lighting === 'night');
  if (showLights) {
    registerProtocols(ctx);
    refreshDynamicNightLayers(ctx);
    ensureCityLights(ctx);
    setLayerVisibility(map, CITY_LIGHTS_LAYER_ID, true);
  } else {
    setLayerVisibility(map, CITY_LIGHTS_LAYER_ID, false);
  }
}

export function removeCityLights(ctx) {
  const { map } = ctx;
  if (!map) {
    return;
  }
  if (map.getLayer(CITY_LIGHTS_LAYER_ID)) {
    map.removeLayer(CITY_LIGHTS_LAYER_ID);
  }
  if (map.getSource(CITY_LIGHTS_SOURCE_ID)) {
    map.removeSource(CITY_LIGHTS_SOURCE_ID);
  }
}

function refreshDynamicNightLayers(ctx) {
  const { map, state } = ctx;
  if (!map) return;

  const bucket = state.realtimeLightingEnabled
    ? Math.floor(Date.now() / TIME_BUCKET_MS) * TIME_BUCKET_MS
    : 0;
  if (bucket === lastBucket) return;
  lastBucket = bucket;

  // Force MapLibre to re-request tiles by changing the tile URLs (MapLibre caches by URL).
  if (map.getLayer(CITY_LIGHTS_LAYER_ID)) map.removeLayer(CITY_LIGHTS_LAYER_ID);
  if (map.getSource(CITY_LIGHTS_SOURCE_ID)) map.removeSource(CITY_LIGHTS_SOURCE_ID);
}

function ensureCityLights(ctx) {
  const { map } = ctx;
  if (!map || map.getLayer(CITY_LIGHTS_LAYER_ID) || map.getSource(CITY_LIGHTS_SOURCE_ID)) {
    return;
  }

  map.addSource(CITY_LIGHTS_SOURCE_ID, {
    type: 'raster',
    tiles: [
      `${LIGHTS_PROTOCOL}://{z}/{y}/{x}?b=${lastBucket ?? 0}&m=${ctx.state?.realtimeLightingEnabled ? 'rt' : 'full'}`
    ],
    tileSize: 256,
    minzoom: 1,
    maxzoom: 8,
    attribution: 'Night lights by NASA GIBS (VIIRS CityLights 2012)'
  });

  const beforeId = pickBeforeId(map);
  map.addLayer(
    {
      id: CITY_LIGHTS_LAYER_ID,
      type: 'raster',
      source: CITY_LIGHTS_SOURCE_ID,
      minzoom: 1,
      maxzoom: 8,
      paint: {
        'raster-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          1,
          0.92,
          3,
          0.78,
          5,
          0.42,
          6,
          0.22,
          8,
          0.08
        ],
        'raster-contrast': 0.35,
        'raster-brightness-min': 0.15,
        'raster-brightness-max': 1,
        'raster-saturation': 0.2
      }
    },
    beforeId
  );
}

function setSatelliteNightPaint(ctx, enabled) {
  // Intentionally a no-op: user wants no global darkening overlay.
  void enabled;
  const { map } = ctx;
  if (!map?.getLayer(SATELLITE_SOURCE_ID)) {
    return;
  }

  try {
    map.setPaintProperty(SATELLITE_SOURCE_ID, 'raster-saturation', 0.08);
    map.setPaintProperty(SATELLITE_SOURCE_ID, 'raster-contrast', 0.06);
    map.setPaintProperty(SATELLITE_SOURCE_ID, 'raster-brightness-min', null);
    map.setPaintProperty(SATELLITE_SOURCE_ID, 'raster-brightness-max', null);
    map.setPaintProperty(SATELLITE_SOURCE_ID, 'raster-opacity', 1);
  } catch {
    // Some styles may not support these paint props; ignore.
  }
}

function setLayerVisibility(map, layerId, visible) {
  if (!map.getLayer(layerId)) {
    return;
  }
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

function pickBeforeId(map) {
  // Try to place lights above satellite but below labels/roads.
  const layers = map.getStyle()?.layers ?? [];
  const firstSymbol = layers.find((layer) => layer.type === 'symbol')?.id;
  return firstSymbol;
}

function registerProtocols(ctx) {
  const { maplibregl } = ctx;
  if (!maplibregl || protocolRegistered) return;
  protocolRegistered = true;

  maplibregl.addProtocol(LIGHTS_PROTOCOL, async (params, abortController) => {
    const { z, x, y, bucketMs, mode } = parseZXY(params.url);
    // Static annual composite. Note the empty time segment in the RESTful WMTS path.
    const realUrl =
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default//GoogleMapsCompatible_Level8/' +
      `${z}/${y}/${x}.jpg`;

    const response = await fetch(realUrl, { signal: abortController.signal });
    if (!response.ok) {
      throw new Error(`GIBS lights tile error: ${response.status}`);
    }
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    const canvas = renderLightsTile(imageBitmap, z, y, x, bucketMs, mode);
    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const buffer = await pngBlob.arrayBuffer();
    return { data: buffer };
  });
}

function parseZXY(url) {
  const cleaned = url.replace(/^[a-z]+:\/\//i, '');
  const [path, query] = cleaned.split('?');
  const parts = path.split('/').filter(Boolean);
  const z = Number(parts[0]);
  const rawY = Number(parts[1]);
  const rawX = Number(parts[2]);
  const bucketMs = parseBucketMs(query);
  const mode = parseMode(query);

  // With renderWorldCopies=true, MapLibre can request tiles outside [0, 2^z-1].
  // Normalize so terminator math stays geographically correct.
  const n = 2 ** z;
  const x = ((rawX % n) + n) % n;
  // IMPORTANT: only X wraps. Y must be clamped in WebMercator.
  const y = Math.max(0, Math.min(n - 1, rawY));
  return { z, x, y, bucketMs, mode };
}

function parseBucketMs(query) {
  if (!query) return null;
  const params = new URLSearchParams(query);
  const b = params.get('b');
  if (!b) return null;
  const n = Number(b);
  return Number.isFinite(n) ? n : null;
}

function parseMode(query) {
  if (!query) return 'full';
  const params = new URLSearchParams(query);
  const m = params.get('m');
  return m === 'rt' ? 'rt' : 'full';
}

function renderLightsTile(img, z, y, x, bucketMs, mode) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx2d = canvas.getContext('2d');
  ctx2d.drawImage(img, 0, 0);
  const imageData = ctx2d.getImageData(0, 0, w, h);
  const d = imageData.data;

  if (mode === 'rt') {
    const sun = getSubsolarPoint(bucketMs ? new Date(bucketMs) : new Date());
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const idx = (py * w + px) * 4;
        const ll = tilePixelToLonLat(z, x, y, px / (w - 1), py / (h - 1));
        const alpha = nightAlpha(ll.lat, ll.lon, sun);
        d[idx + 3] = Math.round(alpha * 255);
      }
    }
  } else {
    // Manual "Night lights" mode: show lights everywhere (whole globe night).
    for (let i = 0; i < d.length; i += 4) {
      d[i + 3] = 255;
    }
  }

  ctx2d.putImageData(imageData, 0, 0);
  return canvas;
}

function nightAlpha(latDeg, lonDeg, sun) {
  // Show city lights only on the night side, ramping in through twilight.
  // 0 at sun altitude >= -3°, 1 at sun altitude <= -12°.
  const alt = solarAltitudeDeg(latDeg, lonDeg, sun);
  if (alt >= -3) return 0;
  if (alt <= -12) return 1;
  const t = (-3 - alt) / 9;
  return smoothstep(0, 1, t);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function solarAltitudeDeg(latDeg, lonDeg, sun) {
  const lat = deg2rad(latDeg);
  const lon = deg2rad(lonDeg);
  const subLat = deg2rad(sun.lat);
  const subLon = deg2rad(sun.lon);
  const cosZ =
    Math.sin(lat) * Math.sin(subLat) +
    Math.cos(lat) * Math.cos(subLat) * Math.cos(lon - subLon);
  const z = Math.acos(Math.max(-1, Math.min(1, cosZ)));
  const alt = Math.PI / 2 - z;
  return rad2deg(alt);
}

function tilePixelToLonLat(z, x, y, u, v) {
  const n = 2 ** z;
  const xt = x + u;
  const yt = y + v;
  const lon = (xt / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * yt) / n)));
  const lat = rad2deg(latRad);
  return { lon, lat };
}

function deg2rad(d) {
  return (d * Math.PI) / 180;
}
function rad2deg(r) {
  return (r * 180) / Math.PI;
}

function getSubsolarPoint(date) {
  // Approximate solar position (good enough for a visually accurate terminator).
  const jd = toJulianDay(date);
  const T = (jd - 2451545.0) / 36525.0;

  const L0 = fixAngleDeg(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = fixAngleDeg(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;

  const Mrad = deg2rad(M);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);
  const trueLong = L0 + C;

  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(deg2rad(omega));

  const eps0 =
    23 +
    (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(deg2rad(omega));

  const lambdaRad = deg2rad(lambda);
  const epsRad = deg2rad(eps);

  const sinDec = Math.sin(epsRad) * Math.sin(lambdaRad);
  const dec = Math.asin(sinDec);

  const y = Math.tan(epsRad / 2);
  const y2 = y * y;

  const eqTime =
    4 *
    rad2deg(
      y2 * Math.sin(2 * deg2rad(L0)) -
        2 * e * Math.sin(Mrad) +
        4 * e * y2 * Math.sin(Mrad) * Math.cos(2 * deg2rad(L0)) -
        0.5 * y2 * y2 * Math.sin(4 * deg2rad(L0)) -
        1.25 * e * e * Math.sin(2 * Mrad)
    ); // minutes

  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const solarTimeMinutes = (utcMinutes + eqTime) % 1440;
  let subLon = (720 - solarTimeMinutes) / 4;
  if (subLon > 180) subLon -= 360;
  if (subLon < -180) subLon += 360;

  return { lat: rad2deg(dec), lon: subLon };
}

function toJulianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function fixAngleDeg(a) {
  let x = a % 360;
  if (x < 0) x += 360;
  return x;
}
