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
  zoom: 15.8,
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
  )}/${clamp(pitch, 0, 85)}`;

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

  // Bind navigation/UI immediately so landing buttons work while MapLibre loads.
  const router = initRouter(ctx);
  bindUi(ctx, router);

  // MapLibre's built-in hash parser throws if it encounters invalid values.
  // Normalize the hash (or inject a default landing view) before map init.
  ensureValidMapHash();

  const maplibreModule = await import('maplibre-gl');
  ctx.maplibregl = maplibreModule.default;
  enableRtlText(ctx.maplibregl);

  // Tile manager: non-blocking protocol + caches + prefetch.
  const tileManager = new TileManager({ memoryMaxBytes: 128 * 1024 * 1024, maxFetchConcurrency: 12 });
  registerTileMgrProtocol(ctx.maplibregl, tileManager);

  // Pre-seed z0–z3 (85 tiles) so the globe always has base imagery.
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

  // Ensure the map container has a measurable size before initializing MapLibre.
  // Some browsers/GPUs crash inside MapLibre when initialized at 0x0.
  await new Promise(requestAnimationFrame);
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    throw new Error('Missing #map element');
  }
  if (mapEl.clientWidth === 0 || mapEl.clientHeight === 0) {
    mapEl.style.width = '100vw';
    mapEl.style.height = '100vh';
  }

  // Sync initial scene state from UI defaults before creating the map.
  // (Prevents mismatches like "toggle says globe" while map starts in mercator.)
  // We check both .checked property and the 'checked' attribute for Web Components.
  try {
    if (elements.projToggle) {
      state.projection = (elements.projToggle.checked || elements.projToggle.hasAttribute('checked')) ? 'globe' : 'flat';
    }
    if (elements.atmosToggle) {
      state.atmosphereEnabled = (elements.atmosToggle.checked || elements.atmosToggle.hasAttribute('checked'));
    }
  } catch (e) {}

  const initialPitch = Number(elements.pitchRange?.value ?? 0);

  ctx.map = new ctx.maplibregl.Map({
    container: 'map',
    style: styleBundle.style,
    projection: { type: state.projection === 'flat' ? 'mercator' : 'globe' },
    center: [DEFAULT_LANDING_VIEW.lng, DEFAULT_LANDING_VIEW.lat],
    zoom: DEFAULT_LANDING_VIEW.zoom,
    pitch: Number.isFinite(initialPitch) ? initialPitch : 0,
    bearing: 0,
    minZoom: 0.8,
    maxZoom: 18.8,
    hash: true,
    antialias: true,
    // Higher pixel ratio makes the globe edge much smoother (less jagged),
    // at the cost of more GPU work. We clamp to avoid blowing up low-end GPUs.
    pixelRatio: Math.min(2.5, Math.max(2, window.devicePixelRatio || 1)),
    // Enables continuous left/right panning in flat (mercator) projection.
    // Globe projection ignores this setting.
    renderWorldCopies: true,
    maxPitch: 85,
    cancelPendingTileRequestsWhileZooming: true,
    // Add alpha channel support if possible (though mostly handled by container)
    transformRequest: (url) => ({ url })
  });

  const { map, maplibregl } = ctx;

  // Sync state to UI now that map is created.
  if (ctx.syncUiToState) {
    ctx.syncUiToState();
  }


  applyInteractionWeight(ctx);

  // Hide loader as soon as we render the first frame (best UX signal).
  map.once('render', () => hideLoader());
  // Also hide on full load/idle.
  map.once('load', () => hideLoader());
  map.once('idle', () => hideLoader());

  // Fail-safe: only hide after a long stall; no noisy warning.
  window.setTimeout(() => hideLoader('Twin Earth is ready.'), 30000);

  tileManager.setOnTileUpdated(() => {
    // Ask MapLibre to repaint; combined with raster fade this blends updates.
    try {
      map.triggerRepaint();
    } catch (e) {}
  });

  map.on('error', (event) => {
    try {
      const details = {
        sourceId: event?.sourceId,
        tile: event?.tile,
        err: event?.error ?? event
      };
      console.warn('MapLibre error:', details);
      elements.status.textContent = 'Map error: check network / style endpoints.';
      const loader = document.querySelector('#initial-loader');
      if (loader) loader.classList.add('is-hidden');
    } catch (e) {}
  });

  map.addControl(
    new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true
    }),
    'top-right'
  );
  map.addControl(new maplibregl.FullscreenControl(), 'top-right');
  map.addControl(
    new maplibregl.ScaleControl({
      maxWidth: 120,
      unit: 'metric'
    }),
    'bottom-right'
  );

  registerMapEvents(ctx);

  // Prefetch on motion; does not block rendering.
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
    applyCommonScene(ctx);
    enforceOrientationConstraints(ctx);

    FEATURED_LOCATIONS.forEach((location) => addLocationMarker(ctx, location));
    setOverlayVisibility(ctx, state.labelsVisible); // Ensure initial visibility matches state

    elements.status.textContent =
      styleBundle.statusMessage ?? 'Twin Earth is ready.';

    // Hide initial loader if it exists
    const loader = document.querySelector('#initial-loader');
    if (loader) loader.classList.add('is-hidden');

    window.setTimeout(() => {
      elements.status.classList.add('is-hidden');
    }, 1800);

    updateHud(ctx);
    updateTerrainForZoom(ctx);
    scheduleSpin(ctx);

    schedulePrefetch();
  });
}
