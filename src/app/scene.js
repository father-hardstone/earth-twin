import { SKY } from './constants.js';
import { VIEW } from '../services/styleBundle.js';
import { setCloudsEnabled, startCloudsAnimation, updateCloudsForZoom } from '../services/clouds.js';
import { applyLighting } from '../services/night.js';

export function enforceOrientationConstraints(ctx) {
  const { map, state, elements } = ctx;
  const lock = state.projection === 'flat' || state.currentView === VIEW.DARK;

  if (!map) return;

  // Ensure drag interaction is enabled (unless explicitly disabled elsewhere).
  try {
    map.dragPan?.enable?.();
  } catch (e) {}

  if (lock) {
    try {
      map.jumpTo({ bearing: 0, pitch: 0 });
    } catch (e) {}

    try {
      map.dragRotate?.disable?.();
      map.touchZoomRotate?.disableRotation?.();
    } catch (e) {}

    if (elements?.pitchRange) {
      elements.pitchRange.disabled = true;
      elements.pitchRange.value = 0;
    }
    if (elements?.pitchValue) {
      elements.pitchValue.textContent = '0 deg';
    }
  } else {
    if (elements?.pitchRange) {
      elements.pitchRange.disabled = false;
    }
  }
}

export function applyCommonScene(ctx) {
  const { map, state } = ctx;
  if (!map || !map.isStyleLoaded()) return;

  // Apply projection. Some versions of MapLibre ignore the initial constructor option
  // or require it to be reapplied after the style has loaded.
  const targetProj = state.projection === 'flat' ? 'mercator' : 'globe';
  const currentProj = map.getProjection()?.type || 'mercator';

  if (currentProj !== targetProj) {
    try {
      map.setProjection({ type: targetProj });
    } catch (e) {
      console.warn('Failed to set projection:', e);
    }
  }

  if (typeof map.setSky === 'function') {
    if (state.atmosphereEnabled) {
      map.setSky(SKY);
    } else {
      // In MapLibre, an empty object or zeroed values clears the sky/atmosphere
      map.setSky({});
    }
    
    // Manage background transparency to ensure the space/stars are visible
    try {
      const layers = map.getStyle().layers;
      const bg = layers.find(l => l.type === 'background');
      if (bg) {
        map.setPaintProperty(bg.id, 'background-opacity', state.atmosphereEnabled ? 0 : 1);
      }
    } catch (e) {}
  }

  if (state.cloudsEnabled) {
    setCloudsEnabled(ctx, true);
    startCloudsAnimation(ctx);
    updateCloudsForZoom(ctx);
  }

  applyLighting(ctx);
  enforceOrientationConstraints(ctx);
}


export function setOverlayVisibility(ctx, visible) {
  const { map, state } = ctx;
  const enabled = visible && state.supportsCartographyToggle;

  state.overlayLayerIds.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', enabled ? 'visible' : 'none');
    }
  });

  // Location markers are DOM-based (MapLibre Markers), so they aren't affected by style layers.
  // Keep them in sync with the cartography toggle.
  if (Array.isArray(ctx.locationMarkers)) {
    ctx.locationMarkers.forEach((marker) => {
      try {
        const el = marker?.getElement?.();
        if (!el) return;
        el.setAttribute('aria-hidden', enabled ? 'false' : 'true');
        el.style.setProperty('display', enabled ? 'block' : 'none', 'important');
        el.style.setProperty('visibility', enabled ? 'visible' : 'hidden', 'important');
      } catch (e) {}
    });
  }

  document.body.classList.toggle('labels-hidden', !enabled);
}

export function syncToggleState(ctx) {
  const { state, elements } = ctx;
  const cartographyEnabled = state.labelsVisible && state.supportsCartographyToggle;

  if (elements.labelsToggle) {
    elements.labelsToggle.disabled = !state.supportsCartographyToggle;
    elements.labelsToggle.checked = cartographyEnabled;
  }
}

export function syncViewState(ctx) {
  const { state, elements } = ctx;
  if (elements.viewSatellite) {
    elements.viewSatellite.checked = state.currentView === VIEW.SATELLITE;
  }
  if (elements.viewDark) {
    elements.viewDark.checked = state.currentView === VIEW.DARK;
  }
}

export function syncProjectionState(ctx) {
  const { state, elements } = ctx;
  if (elements.projToggle) {
    elements.projToggle.checked = state.projection === 'globe';
  }
}
