import { createStyleBundle, VIEW } from '../services/styleBundle.js';
import { removePopup } from './popups.js';
import {
  applyCommonScene,
  setOverlayVisibility,
  syncToggleState,
  syncViewState
} from './scene.js';
import { updateTerrainForZoom } from './terrain.js';
import { removeClouds, setCloudsEnabled, startCloudsAnimation } from '../services/clouds.js';
import { applyLighting, removeCityLights } from '../services/night.js';

export async function switchView(ctx, view) {
  const { map, state, elements } = ctx;
  if (view === state.currentView) {
    return;
  }

  state.currentView = view;
  syncViewState(ctx);
  elements.status.classList.remove('is-hidden');
  elements.status.textContent = 'Switching view...';

  removePopup(ctx);

  // Dark Matter view is meant to be clean: no clouds/atmos/night effects.
  if (view === VIEW.DARK) {
    state.cloudsEnabled = false;
    state.atmosphereEnabled = false;
    state.realtimeLightingEnabled = false;
    state.lighting = 'day';
    if (elements.cloudsToggle) elements.cloudsToggle.checked = false;
    if (elements.atmosToggle) elements.atmosToggle.checked = false;
    if (elements.lightRealtime) elements.lightRealtime.checked = false;
    if (elements.lightToggle) elements.lightToggle.checked = false;
  }

  const bundle = await createStyleBundle(view);
  state.overlayLayerIds = bundle.overlayLayerIds;
  state.inspectableLayerIds = bundle.inspectableLayerIds;
  state.supportsCartographyToggle = bundle.supportsCartographyToggle;

  map.once('style.load', () => {
    removeClouds(ctx);
    removeCityLights(ctx);
    applyCommonScene(ctx);
    updateTerrainForZoom(ctx);
    setOverlayVisibility(ctx, state.labelsVisible);
    syncToggleState(ctx);
    if (state.cloudsEnabled) {
      setCloudsEnabled(ctx, true);
      startCloudsAnimation(ctx);
    }
    applyLighting(ctx);
    elements.status.textContent = bundle.statusMessage ?? 'View updated.';
    window.setTimeout(() => elements.status.classList.add('is-hidden'), 900);
  });

  map.setStyle(bundle.style, { diff: false });
}
