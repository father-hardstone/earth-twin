import { createStyleBundle } from '../services/styleBundle.js';
import { createAppContext } from './context.js';
import { FEATURED_LOCATIONS } from './constants.js';
import { updateHud } from './hud.js';
import { updateTerrainForZoom } from './terrain.js';
import { scheduleSpin } from './spin.js';
import {
  addLocationMarker,
  renderLocationButtons
} from './locations.js';
import { applyCommonScene } from './scene.js';
import { bindUi } from './uiBindings.js';
import { registerMapEvents } from './mapEvents.js';
import { enableRtlText } from '../services/rtl.js';

export async function boot() {
  const ctx = createAppContext();
  const { state, elements } = ctx;

  renderLocationButtons(ctx);
  elements.status.textContent = 'Loading 3D renderer...';

  const maplibreModule = await import('maplibre-gl');
  ctx.maplibregl = maplibreModule.default;
  enableRtlText(ctx.maplibregl);

  elements.status.textContent = 'Loading Earth...';
  const styleBundle = await createStyleBundle(state.currentView);

  state.overlayLayerIds = styleBundle.overlayLayerIds;
  state.inspectableLayerIds = styleBundle.inspectableLayerIds;
  state.supportsCartographyToggle = styleBundle.supportsCartographyToggle;
  if (styleBundle.statusMessage) {
    elements.status.textContent = styleBundle.statusMessage;
  }

  ctx.map = new ctx.maplibregl.Map({
    container: 'map',
    style: styleBundle.style,
    center: [12, 20],
    zoom: 1.58,
    pitch: Number(elements.pitchRange.value),
    bearing: 0,
    minZoom: 0.8,
    maxZoom: 18.8,
    hash: true,
    antialias: true,
    // Enables continuous left/right panning in flat (mercator) projection.
    // Globe projection ignores this setting.
    renderWorldCopies: true,
    maxPitch: 85,
    cancelPendingTileRequestsWhileZooming: true
  });

  const { map, maplibregl } = ctx;

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

  bindUi(ctx);
  registerMapEvents(ctx);

  map.on('load', () => {
    applyCommonScene(ctx);
    elements.status.textContent =
      styleBundle.statusMessage ?? 'Earth is ready - pick a landing or zoom anywhere.';
    window.setTimeout(() => {
      elements.status.classList.add('is-hidden');
    }, 1800);

    FEATURED_LOCATIONS.forEach((location) => addLocationMarker(ctx, location));
    updateHud(ctx);
    updateTerrainForZoom(ctx);
    scheduleSpin(ctx);
  });
}
