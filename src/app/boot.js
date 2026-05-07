import { createFallbackStyleBundle, createStyleBundle } from '../services/styleBundle.js';
import { createAppContext } from './context';
import { FEATURED_LOCATIONS } from './constants.js';
import { updateHud } from './hud.js';
import { updateTerrainForZoom } from './terrain.js';
import { scheduleSpin } from './spin.js';
import { addLocationMarker, renderLocationButtons } from './locations.js';
import { applyCommonScene, enforceOrientationConstraints, setOverlayVisibility } from './scene.js';
import { bindUi } from './uiBindings.js';
import { registerMapEvents } from './mapEvents.js';
import { enableRtlText } from '../services/rtl.js';
import { initRouter } from './router.js';
import { initAuroraEffect } from './aurora.js';
import { TileManager } from '../tiles/tileManager';
import { registerTileMgrProtocol } from '../tiles/maplibreProtocol';
import { computePrefetchKeysForView } from '../tiles/prefetch';
import { applyInteractionWeight } from './interactionWeight.js';

const DEFAULT_LANDING_VIEW = {
  zoom: 2.0,
  lat: 48.8584,
  lng: 2.2945,
  bearing: -20,
  pitch: 68
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ensureValidMapHash() {
  const raw = window.location.hash || '';
  const hash = raw.startsWith('#') ? raw.slice(1) : raw;

  const applyDefault = () => {
    const d = DEFAULT_LANDING_VIEW;
    const safeHash = `#${d.zoom}/${d.lat}/${d.lng}/${d.bearing}/${d.pitch}`;
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}${safeHash}`);
  };

  if (!hash) {
    applyDefault();
    return;
  }

  const parts = hash.split('/').filter(Boolean);
  if (parts.length < 3) {
    applyDefault();
    return;
  }

  const zoom = Number(parts[0]);
  const lat = Number(parts[1]);
  const lng = Number(parts[2]);
  const bearing = parts.length >= 4 ? Number(parts[3]) : DEFAULT_LANDING_VIEW.bearing;
  const pitch = parts.length >= 5 ? Number(parts[4]) : DEFAULT_LANDING_VIEW.pitch;

  const valid =
    Number.isFinite(zoom) &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Number.isFinite(bearing) &&
    Number.isFinite(pitch) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!valid) {
    applyDefault();
    return;
  }

  const safeHash = `#${clamp(zoom, 0.8, 18.8)}/${clamp(lat, -90, 90)}/${clamp(lng, -180, 180)}/${clamp(
    bearing,
    -180,
    180
  )}/${clamp(pitch, 0, 89.99)}`;

  if (safeHash !== raw) {
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}${safeHash}`);
  }
}

export async function boot() {
  const ctx = createAppContext();
  const { state, elements } = ctx;

  initAuroraEffect();
  renderLocationButtons(ctx);
  elements.status.textContent = 'Loading 3D renderer...';

  const loaderEl = document.querySelector('#initial-loader');
  const hideLoader = (message) => {
    if (loaderEl && !loaderEl.classList.contains('is-hidden')) {
      loaderEl.classList.add('is-hidden');
      if (message) elements.status.textContent = message;
      window.setTimeout(() => elements.status.classList.add('is-hidden'), 1800);
    }
  };

  const router = initRouter(ctx);
  bindUi(ctx, router);

  ensureValidMapHash();

  const maplibreModule = await import('maplibre-gl');
  ctx.maplibregl = maplibreModule.default;
  enableRtlText(ctx.maplibregl);

  const tileManager = new TileManager({ memoryMaxBytes: 128 * 1024 * 1024, maxFetchConcurrency: 12 });
  registerTileMgrProtocol(ctx.maplibregl, tileManager);
  tileManager.preseedBaseZooms(3);

  elements.status.textContent = 'Loading Twin Earth...';
  let styleBundle;
  try {
    styleBundle = await Promise.race([
      createStyleBundle(state.currentView, state.labelsVisible),
      new Promise((resolve) => {
        window.setTimeout(() => resolve(createFallbackStyleBundle()), 6500);
      })
    ]);
  } catch (error) {
    console.warn('Style bundle failed to load, using fallback style:', error);
    styleBundle = createFallbackStyleBundle();
  }

  state.overlayLayerIds = styleBundle.overlayLayerIds;
  state.inspectableLayerIds = styleBundle.inspectableLayerIds;
  state.supportsCartographyToggle = styleBundle.supportsCartographyToggle;
  if (styleBundle.statusMessage) {
    elements.status.textContent = styleBundle.statusMessage;
  }

  await new Promise(requestAnimationFrame);
  const mapEl = document.getElementById('map');
  if (!mapEl) throw new Error('Missing #map element');
  
  if (mapEl.clientWidth === 0 || mapEl.clientHeight === 0) {
    mapEl.style.width = '100vw';
    mapEl.style.height = '100vh';
  }

  try {
    state.projection = 'globe';
    if (elements.projToggle) elements.projToggle.checked = true;
    if (elements.atmosToggle) {
      state.atmosphereEnabled = (elements.atmosToggle.checked || elements.atmosToggle.hasAttribute('checked'));
    }
  } catch (e) {}

  try {
    if (elements.pitchRange) elements.pitchRange.value = 0;
    if (elements.pitchValue) elements.pitchValue.textContent = '0 deg';
  } catch (e) {}

  ctx.map = new ctx.maplibregl.Map({
    container: 'map',
    style: styleBundle.style,
    // Some MapLibre builds ignore the object form during init; the string form
    // is accepted broadly and prevents "starts in mercator even when toggle is globe".
    projection: state.projection === 'flat' ? 'mercator' : 'globe',
    center: [DEFAULT_LANDING_VIEW.lng, DEFAULT_LANDING_VIEW.lat],
    zoom: DEFAULT_LANDING_VIEW.zoom,
    pitch: 0,
    bearing: 0,
    minZoom: 0.8,
    maxZoom: 18.8,
    hash: true,
    antialias: true,
    pixelRatio: Math.min(2.5, Math.max(2, window.devicePixelRatio || 1)),
    renderWorldCopies: true,
    maxPitch: 89.99,
    alpha: true,
    preserveDrawingBuffer: true,
    cancelPendingTileRequestsWhileZooming: true,
    refreshExpiredTiles: true,
    bearingSnap: 0
  });

  const { map, maplibregl } = ctx;

  // Ensure the style doesn't override projection back to mercator during initial load.
  // (Some styles specify `projection`, and MapLibre applies it on style.load.)
  map.once('style.load', () => {
    try {
      map.setProjection({ type: state.projection === 'flat' ? 'mercator' : 'globe' });
    } catch (e) {
      try {
        map.setProjection(state.projection === 'flat' ? 'mercator' : 'globe');
      } catch {}
    }

    // Apply scene-dependent effects (atmosphere, sky, overlay) as soon as the style is ready.
    try { applyCommonScene(ctx); } catch (e) {}
  });

  if (ctx.syncUiToState) ctx.syncUiToState();

  applyInteractionWeight(ctx);

  map.once('render', () => hideLoader());
  map.once('load', () => hideLoader());
  map.once('idle', () => hideLoader());
  window.setTimeout(() => hideLoader('Twin Earth is ready.'), 30000);

  tileManager.setOnTileUpdated(() => {
    try { map.triggerRepaint(); } catch (e) {}
  });

  map.on('error', (event) => {
    try {
      console.warn('MapLibre error:', { sourceId: event?.sourceId, tile: event?.tile, err: event?.error ?? event });
      elements.status.textContent = 'Map error: check network / style endpoints.';
      hideLoader();
    } catch (e) {}
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.FullscreenControl(), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right');

  registerMapEvents(ctx);

  const schedulePrefetch = (() => {
    let t = 0;
    return () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        try {
          const keys = computePrefetchKeysForView(map, { padTiles: 1 });
          tileManager.prefetch(keys);
        } catch (e) {}
      }, 120);
    };
  })();
  map.on('moveend', schedulePrefetch);
  map.on('zoomend', schedulePrefetch);

  map.on('load', () => {
    import('./skyTextureLayer.js').then(({ SkyTextureLayer }) => {
      const layers = map.getStyle().layers;
      const firstId = layers.length > 0 ? layers[0].id : undefined;
      const url = import.meta.env.VITE_SKY_TEXTURE_URL || new URL('../assets/images/starmap_3.png', import.meta.url).href;
      map.addLayer(new SkyTextureLayer({ url, opacity: 0.65, brightness: 0.22 }), firstId);
    });

    import('./sunLayer.js').then(({ SunLayer }) => {
      const layers = map.getStyle().layers;
      const firstId = layers.length > 0 ? layers[0].id : undefined;
      map.addLayer(new SunLayer({ intensity: 1.2, size: 0.001 }), firstId);
    });

    // 3D polar cap mesh (world-space on the globe) that fades in near WebMercator clamp.
    // Uses polar-stereographic textures so it rotates perfectly with the globe.
    import('./polarCapMeshLayer.js').then(({ PolarCapMeshLayer }) => {
      try {
        const layers = map.getStyle().layers;
        const firstId = layers.length > 0 ? layers[0].id : undefined;
        map.addLayer(
          new PolarCapMeshLayer({
            startLat: 80,
            endLat: 85.05112878,
            latEdge: 85.05112878,
            segments: 96,
            northUrl: import.meta.env.VITE_POLAR_CAP_NORTH_URL || null,
            southUrl: import.meta.env.VITE_POLAR_CAP_SOUTH_URL || null
          }),
          firstId
        );
      } catch (e) {
        console.warn('Failed to add polar cap mesh:', e);
      }
    });

    const addPolarCaps = () => {
      try {
        const poleSourceId = 'polar-caps';
        if (map.getSource(poleSourceId)) return;
        const createPolePolygon = (latCenter) => {
          const coords = [];
          const lat = latCenter > 0 ? 78 : -78;
          for (let i = 0; i <= 360; i += 15) coords.push([i > 180 ? i - 360 : i, lat]);
          return [coords];
        };
        map.addSource(poleSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              { type: 'Feature', properties: { id: 'north-pole' }, geometry: { type: 'Polygon', coordinates: createPolePolygon(90) } },
              { type: 'Feature', properties: { id: 'south-pole' }, geometry: { type: 'Polygon', coordinates: createPolePolygon(-90) } }
            ]
          }
        });

        // Keep the legacy geojson cap layers present but fully transparent.
        // The real pole-coverage is handled by the 3D PolarCapMeshLayer.
        map.addLayer({ id: 'polar-cap-fill', type: 'fill', source: poleSourceId, paint: { 'fill-color': '#ffffff', 'fill-opacity': 0 } });
        map.addLayer({ id: 'polar-cap-outline', type: 'line', source: poleSourceId, paint: { 'line-color': '#ffffff', 'line-width': 2, 'line-blur': 10, 'line-opacity': 0 } });
      } catch (e) { console.warn('Failed to add polar caps:', e); }
    };

    addPolarCaps();
    
    applyCommonScene(ctx);
    enforceOrientationConstraints(ctx);

    // The native MapLibre atmosphere (setSky) silently fails when called during
    // 'load' because the globe projection rendering pipeline hasn't fully settled.
    // Re-apply once the map reaches 'idle' (all tiles rendered, globe ready).
    map.once('idle', () => {
      try { applyCommonScene(ctx); } catch (e) {}
    });

    FEATURED_LOCATIONS.forEach((location) => addLocationMarker(ctx, location));
    setOverlayVisibility(ctx, state.labelsVisible);

    updateHud(ctx);
    updateTerrainForZoom(ctx);
    scheduleSpin(ctx);
    schedulePrefetch();
  });
}
