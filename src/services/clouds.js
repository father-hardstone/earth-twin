const CLOUDS_LAYER_ID = 'sim-clouds';
const CLOUDS_SOURCE_ID = 'sim-clouds-src';
const PROTOCOL = 'gibscloud';

const BRIGHTNESS_THRESHOLD = 34;
const CLOUD_ALPHA_SCALE = 0.85;
const CLOUD_ALPHA_GAMMA = 1.4;
const DILATE_RADIUS = 12;
const FEATHER_RADIUS = 8;
const BLANK_TILE_CUTOFF = 0.03;

let protocolRegistered = false;

function buildRealUrl(z, y, x) {
  // GIBS GoogleMapsCompatible_Level9 only supports z<=9.
  // When MapLibre requests overscaled tiles, map them to a supported parent.
  const maxZ = 9;
  const zClamped = Math.max(0, Math.min(maxZ, z));
  const dz = z - zClamped;
  const scale = dz > 0 ? 2 ** dz : 1;
  const xScaled = Math.floor(x / scale);
  const yScaled = Math.floor(y / scale);

  const n = 2 ** zClamped;
  const col = ((xScaled % n) + n) % n;
  // IMPORTANT: only X wraps. Y must be clamped in WebMercator.
  const row = Math.max(0, Math.min(n - 1, yScaled));
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  const time = d.toISOString().slice(0, 10);
  return (
    'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?' +
    'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
    '&LAYER=MODIS_Terra_CorrectedReflectance_TrueColor' +
    '&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible_Level9' +
    `&TILEMATRIX=${zClamped}&TILEROW=${row}&TILECOL=${col}` +
    '&FORMAT=image/jpeg' +
    `&TIME=${time}`
  );
}

function processImage(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx2d = canvas.getContext('2d');
  ctx2d.drawImage(img, 0, 0);
  const imageData = ctx2d.getImageData(0, 0, w, h);
  const src = imageData.data;

  const cloudAlphaFromBrightness = (brightness) => {
    const t = (brightness - BRIGHTNESS_THRESHOLD) / (255 - BRIGHTNESS_THRESHOLD);
    const a = Math.max(0, Math.min(1, t));
    return Math.max(0, Math.min(1, CLOUD_ALPHA_SCALE * (a ** CLOUD_ALPHA_GAMMA)));
  };

  const mask = new Uint8Array(w * h);
  let realCount = 0;
  for (let j = 0; j < w * h; j++) {
    const i = j * 4;
    const brightness = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114;
    if (brightness >= BRIGHTNESS_THRESHOLD) {
      mask[j] = 1;
      realCount++;
    }
  }

  if (realCount < w * h * BLANK_TILE_CUTOFF) {
    ctx2d.clearRect(0, 0, w, h);
    return canvas;
  }
  if (realCount === w * h) return canvas;

  const totalR = DILATE_RADIUS + FEATHER_RADIUS;
  const dist = new Float32Array(w * h);
  dist.fill(totalR + 1);
  for (let j = 0; j < w * h; j++) {
    if (mask[j]) dist[j] = 0;
  }
  for (let y = 0; y < h; y++) {
    const off = y * w;
    let d = totalR + 1;
    for (let x = 0; x < w; x++) {
      d = dist[off + x] === 0 ? 0 : d + 1;
      dist[off + x] = Math.min(dist[off + x], d);
    }
    d = totalR + 1;
    for (let x = w - 1; x >= 0; x--) {
      d = dist[off + x] === 0 ? 0 : d + 1;
      dist[off + x] = Math.min(dist[off + x], d);
    }
  }
  for (let x = 0; x < w; x++) {
    let d = totalR + 1;
    for (let y = 0; y < h; y++) {
      d = dist[y * w + x] === 0 ? 0 : d + 1;
      dist[y * w + x] = Math.min(dist[y * w + x], d);
    }
    d = totalR + 1;
    for (let y = h - 1; y >= 0; y--) {
      d = dist[y * w + x] === 0 ? 0 : d + 1;
      dist[y * w + x] = Math.min(dist[y * w + x], d);
    }
  }

  const out = ctx2d.createImageData(w, h);
  const od = out.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = y * w + x;
      const i = j * 4;

      if (mask[j]) {
        const brightness = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114;
        const a = cloudAlphaFromBrightness(brightness);
        od[i] = 255;
        od[i + 1] = 255;
        od[i + 2] = 255;
        od[i + 3] = Math.round(a * 255);
        continue;
      }

      const d = dist[j];
      if (d > totalR) {
        od[i] = od[i + 1] = od[i + 2] = od[i + 3] = 0;
        continue;
      }

      const searchR = Math.ceil(d) + 1;
      let sr = 0, sg = 0, sb = 0, count = 0;
      const x0 = Math.max(0, x - searchR);
      const x1 = Math.min(w - 1, x + searchR);
      const y0 = Math.max(0, y - searchR);
      const y1 = Math.min(h - 1, y + searchR);
      for (let sy = y0; sy <= y1; sy += 2) {
        for (let sx = x0; sx <= x1; sx += 2) {
          if (mask[sy * w + sx]) {
            const si = (sy * w + sx) * 4;
            sr += src[si];
            sg += src[si + 1];
            sb += src[si + 2];
            count++;
          }
        }
      }

      if (count === 0) {
        od[i] = od[i + 1] = od[i + 2] = od[i + 3] = 0;
        continue;
      }

      sr = Math.round(sr / count);
      sg = Math.round(sg / count);
      sb = Math.round(sb / count);

      let alpha = 1;
      if (d > DILATE_RADIUS) {
        alpha = 1 - (d - DILATE_RADIUS) / FEATHER_RADIUS;
      }

      const brightness = sr * 0.299 + sg * 0.587 + sb * 0.114;
      const a = cloudAlphaFromBrightness(brightness) * Math.max(0, Math.min(1, alpha));
      od[i] = 255;
      od[i + 1] = 255;
      od[i + 2] = 255;
      od[i + 3] = Math.round(a * 255);
    }
  }

  ctx2d.putImageData(out, 0, 0);
  return canvas;
}

function registerProtocol(maplibregl) {
  if (protocolRegistered) {
    return;
  }
  protocolRegistered = true;

  maplibregl.addProtocol(PROTOCOL, async (params, abortController) => {
    const parts = params.url.replace(`${PROTOCOL}://`, '').split('/');
    const z = Number(parts[0]);
    const y = Number(parts[1]);
    const x = Number(parts[2]);
    const realUrl = buildRealUrl(z, y, x);

    const response = await fetch(realUrl, { signal: abortController.signal });
    if (!response.ok) {
      throw new Error(`GIBS tile error: ${response.status}`);
    }

    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    const canvas = processImage(imageBitmap);
    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const buffer = await pngBlob.arrayBuffer();
    return { data: buffer };
  });
}

export function setCloudsEnabled(ctx, enabled) {
  const { state, map } = ctx;
  state.cloudsEnabled = enabled;

  if (!map) {
    return;
  }

  if (enabled) {
    registerProtocol(ctx.maplibregl);
    if (map.getZoom() < 0.95) {
      map.easeTo({ zoom: 1.05, duration: 350, essential: true });
    }
    addOrRefreshClouds(ctx);
    updateCloudsForZoom(ctx);
  } else {
    removeClouds(ctx);
  }
}

export function startCloudsAnimation(ctx) {
  void ctx;
}

export function stopCloudsAnimation(ctx) {
  void ctx;
}

export function addOrRefreshClouds(ctx) {
  const { map, state } = ctx;
  if (!map || !state.cloudsEnabled) {
    return;
  }

  if (!map.getSource(CLOUDS_SOURCE_ID)) {
    map.addSource(CLOUDS_SOURCE_ID, {
      type: 'raster',
      tiles: [`${PROTOCOL}://{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 9
    });
  }

  if (!map.getLayer(CLOUDS_LAYER_ID)) {
    map.addLayer(
      {
        id: CLOUDS_LAYER_ID,
        type: 'raster',
        source: CLOUDS_SOURCE_ID,
        paint: {
          'raster-opacity': 0.88,
          'raster-resampling': 'linear',
          'raster-saturation': -0.12,
          'raster-contrast': 0.1
        }
      },
      pickBeforeId(map)
    );
  }

  updateCloudsForZoom(ctx);
}

export function removeClouds(ctx) {
  const { map } = ctx;
  if (!map) {
    return;
  }
  if (map.getLayer(CLOUDS_LAYER_ID)) {
    map.removeLayer(CLOUDS_LAYER_ID);
  }
  if (map.getSource(CLOUDS_SOURCE_ID)) {
    map.removeSource(CLOUDS_SOURCE_ID);
  }
}

export function updateCloudsForZoom(ctx) {
  const { map, state } = ctx;
  if (!map || !state.cloudsEnabled) {
    return;
  }

  const zoom = map.getZoom();
  const visible = zoom >= 0.8 && zoom <= 2.9;
  const opacity = visible
    ? computeOpacity(zoom) * Number(state.cloudsOpacity ?? 1)
    : 0;

  if (map.getLayer(CLOUDS_LAYER_ID)) {
    map.setLayoutProperty(CLOUDS_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
    map.setPaintProperty(CLOUDS_LAYER_ID, 'raster-opacity', Math.min(1, opacity));
  }
}

function computeOpacity(zoom) {
  if (zoom < 0.8) return 0;
  if (zoom <= 1) return 0.92 * ((zoom - 0.8) / 0.2);
  if (zoom <= 2.4) return 0.92;
  if (zoom <= 2.9) return 0.92 * (1 - (zoom - 2.4) / 0.5);
  return 0;
}

function pickBeforeId(map) {
  const layers = map.getStyle()?.layers ?? [];
  return layers.find((l) => l.type === 'symbol')?.id;
}
