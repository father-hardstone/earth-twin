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

  // Hard rule: reset pitch to 0 on every mode/view change.
  try {
    map.jumpTo({ pitch: 0 });
    if (elements.pitchRange) elements.pitchRange.value = 0;
    if (elements.pitchValue) elements.pitchValue.textContent = '0 deg';
  } catch (e) {}

  // Dark Matter view is meant to be clean: no clouds/atmos/night effects.
  if (view === VIEW.DARK) {
    state.cloudsEnabled = false;
    state.atmosphereEnabled = false;
    state.realtimeLightingEnabled = false;
    state.lighting = 'day';
    state.autoSpin = false;
    if (elements.cloudsToggle) elements.cloudsToggle.checked = false;
    if (elements.atmosToggle) elements.atmosToggle.checked = false;
    if (elements.spinToggle) elements.spinToggle.checked = false;
    if (elements.lightRealtime) elements.lightRealtime.checked = false;
    if (elements.lightToggle) elements.lightToggle.checked = false;

    // Force-disable these controls in Dark view.
    if (elements.cloudsToggle) elements.cloudsToggle.disabled = true;
    if (elements.atmosToggle) elements.atmosToggle.disabled = true;
    if (elements.spinToggle) elements.spinToggle.disabled = true;

    // Ensure the camera is upright before style load as well.
    try {
      map.jumpTo({ bearing: 0, pitch: 0 });
    } catch (e) {}
  } else {
    // Re-enable toggles when leaving Dark view.
    if (elements.cloudsToggle) elements.cloudsToggle.disabled = false;
    if (elements.atmosToggle) elements.atmosToggle.disabled = false;
    if (elements.spinToggle) elements.spinToggle.disabled = false;
  }

  const bundle = await createStyleBundle(view, state.labelsVisible);
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
