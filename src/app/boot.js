import { createStyleBundle } from '../services/styleBundle.js';
import { createAppContext } from './context.js';
import { FEATURED_LOCATIONS } from './constants.js';
import { updateHud } from './hud.js';
import { updateTerrainForZoom } from './terrain.js';
import { scheduleSpin } from './spin.js';
import { addLocationMarker, renderLocationButtons } from './locations.js';
import { applyCommonScene, setOverlayVisibility } from './scene.js';
import { bindUi } from './uiBindings.js';
import { registerMapEvents } from './mapEvents.js';
import { enableRtlText } from '../services/rtl.js';
import { initRouter } from './router.js';
import { initAuroraEffect } from './aurora.js';

export async function boot() {
  const ctx = createAppContext();
  const { state, elements } = ctx;

  initAuroraEffect();
  renderLocationButtons(ctx);
  elements.status.textContent = 'Loading 3D renderer...';

  const maplibreModule = await import('maplibre-gl');
  ctx.maplibregl = maplibreModule.default;
  enableRtlText(ctx.maplibregl);

  elements.status.textContent = 'Loading Twin Earth...';
  const styleBundle = await createStyleBundle(state.currentView, state.labelsVisible);

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
    cancelPendingTileRequestsWhileZooming: true,
    // Add alpha channel support if possible (though mostly handled by container)
    transformRequest: (url) => ({ url })
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

  const router = initRouter(ctx);
  bindUi(ctx, router);
  registerMapEvents(ctx);

  map.on('load', () => {
    applyCommonScene(ctx);
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
  });

  // Fail-safe: Ensure loader disappears even if map load stalls
  window.setTimeout(() => {
    const loader = document.querySelector('#initial-loader');
    if (loader && !loader.classList.contains('is-hidden')) {
      console.warn('Map load timeout: hiding loader manually');
      loader.classList.add('is-hidden');
      elements.status.textContent = 'Twin Earth is ready (Offline mode)';
      window.setTimeout(() => elements.status.classList.add('is-hidden'), 2000);
    }
  }, 10000);
}
