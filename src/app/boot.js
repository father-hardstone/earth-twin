import { createAppContext } from './context';
import { FEATURED_LOCATIONS } from './constants.js';
import { updateHud } from './hud.js';
import { scheduleSpin } from './spin.js';
import { addLocationMarker, renderLocationButtons } from './locations.js';
import { applyCommonScene, enforceOrientationConstraints, setOverlayVisibility } from './scene.js';
import { bindUi } from './uiBindings.js';
import { registerMapEvents } from './mapEvents.js';
import { initRouter } from './router.js';
import { initAuroraEffect } from './aurora.js';
import { applyInteractionWeight } from './interactionWeight.js';
import { initCesiumGlobe } from './cesiumGlobe.js';
import { renderApiInfo } from './apiInfo.js';

const DEFAULT_LANDING_VIEW = {
  zoom: 2.0,
  lat: 48.8584,
  lng: 2.2945,
  bearing: -20,
  pitch: 0
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

function readViewFromHash() {
  const raw = window.location.hash || '';
  const hash = raw.startsWith('#') ? raw.slice(1) : raw;
  const parts = hash.split('/').filter(Boolean);
  if (parts.length < 3) return { ...DEFAULT_LANDING_VIEW };

  const zoom = Number(parts[0]);
  const lat = Number(parts[1]);
  const lng = Number(parts[2]);
  const bearing = parts.length >= 4 ? Number(parts[3]) : DEFAULT_LANDING_VIEW.bearing;
  const pitch = parts.length >= 5 ? Number(parts[4]) : DEFAULT_LANDING_VIEW.pitch;

  return {
    zoom: Number.isFinite(zoom) ? clamp(zoom, 0.8, 18.8) : DEFAULT_LANDING_VIEW.zoom,
    lat: Number.isFinite(lat) ? clamp(lat, -90, 90) : DEFAULT_LANDING_VIEW.lat,
    lng: Number.isFinite(lng) ? clamp(lng, -180, 180) : DEFAULT_LANDING_VIEW.lng,
    bearing: Number.isFinite(bearing) ? clamp(bearing, -180, 180) : DEFAULT_LANDING_VIEW.bearing,
    pitch: Number.isFinite(pitch) ? clamp(pitch, 0, 89.99) : DEFAULT_LANDING_VIEW.pitch
  };
}

export async function boot() {
  const ctx = createAppContext();
  const { state, elements } = ctx;

  initAuroraEffect();
  renderLocationButtons(ctx);
  renderApiInfo(ctx);
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

  // Cesium does not use MapLibre style bundles; keep overlay lists empty.
  state.overlayLayerIds = [];
  state.inspectableLayerIds = [];
  state.supportsCartographyToggle = false;

  elements.status.textContent = 'Loading Twin Earth...';

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
      state.atmosphereEnabled = elements.atmosToggle.checked || elements.atmosToggle.hasAttribute('checked');
    }
  } catch (e) {}

  try {
    if (elements.pitchRange) elements.pitchRange.value = 0;
    if (elements.pitchValue) elements.pitchValue.textContent = '0 deg';
  } catch (e) {}

  const initialView = readViewFromHash();
  initCesiumGlobe(ctx, mapEl, initialView);
  const { map } = ctx;

  // Cesium replaces MapLibre projection switching; keep UI in a consistent state.
  try {
    if (elements.projToggle) {
      elements.projToggle.checked = true;
      elements.projToggle.disabled = true;
    }
  } catch {}

  if (ctx.syncUiToState) ctx.syncUiToState();

  applyInteractionWeight(ctx);

  // Cesium continuously renders; treat first render as "ready".
  map.once('render', () => hideLoader());
  window.setTimeout(() => hideLoader(), 4000);
  window.setTimeout(() => hideLoader('Twin Earth is ready.'), 30000);

  registerMapEvents(ctx);

  try {
    applyCommonScene(ctx);
    enforceOrientationConstraints(ctx);
  } catch (e) {}

  // Location markers are MapLibre-only; keep buttons and flyTo.
  try {
    FEATURED_LOCATIONS.forEach((location) => addLocationMarker(ctx, location));
  } catch (e) {}

  try {
    setOverlayVisibility(ctx, state.labelsVisible);
  } catch (e) {}

  updateHud(ctx);
  scheduleSpin(ctx);
}
