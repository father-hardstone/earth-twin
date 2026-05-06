import { SKY } from './constants.js';
import { VIEW } from '../services/styleBundle.js';
import { setCloudsEnabled, startCloudsAnimation, updateCloudsForZoom } from '../services/clouds.js';
import { applyLighting } from '../services/night.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function attachAtmosphereOverlayUpdater(ctx) {
  const { map } = ctx;
  const mapEl = document.getElementById('map');
  if (!map || !mapEl) return () => {};

  const update = () => {
    try {
      const zoom = map.getZoom?.() ?? 1;
      const pitch = map.getPitch?.() ?? 0;

      // MapLibre Globe Projection geometry alignment:
      // We need to match the 3D sphere's silhouette on the 2D screen.
      const transform = map.transform;
      if (!transform) return;

      const w = mapEl.clientWidth || transform.width || 1;
      const h = mapEl.clientHeight || transform.height || 1;

      // 1. Globe radius in world pixels at current zoom/latitude
      const worldSize = transform.worldSize;
      const centerLat = map.getCenter?.().lat ?? 0;
      const globeRadiusPixels = worldSize / (2.0 * Math.PI) / Math.cos(centerLat * Math.PI / 180);

      // 2. Camera properties
      // Distance from camera to globe surface point at screen center
      const d = transform.cameraToCenterDistance; 
      // Focal length (MapLibre default FOV is 36.87 deg, so f = 1.5 * height)
      const f = h * 1.5;

      // 3. Projected sphere metrics
      const pitchRad = pitch * Math.PI / 180;
      const R = globeRadiusPixels;
      // Distance from camera to globe center (Law of Cosines)
      const L = Math.sqrt(d * d + R * R + 2 * d * R * Math.cos(pitchRad));

      // 4. Apparent radius and vertical shift
      const radiusPx = (f * R) / L;
      const yShiftPx = (f * R * Math.sin(pitchRad)) / L;

      // 5. Visual refinement
      const zoomN = clamp((zoom - 1) / 15, 0, 1);
      const pitchN = clamp(pitch / 85, 0, 1);

      // Keep the haze sphere slightly larger than the globe.
      const padPx = clamp(12 - zoom * 0.8, 4, 14);
      const finalRadiusPx = radiusPx + padPx;

      const opacity = 0.55 + clamp((zoom - 1.5) / 10, 0, 1) * 0.25 + pitchN * 0.28;

      mapEl.style.setProperty('--atmos-y-shift', `${yShiftPx.toFixed(2)}px`);
      mapEl.style.setProperty('--atmos-scale', `1`);
      mapEl.style.setProperty('--atmos-opacity', `${clamp(opacity, 0, 1).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-radius-px', `${finalRadiusPx.toFixed(2)}px`);

      // Atmosphere visual properties
      mapEl.style.setProperty('--atmos-hue', `${(8 + pitchN * 6 + zoomN * 4).toFixed(2)}deg`);
      mapEl.style.setProperty('--atmos-sat', `${(1.08 + pitchN * 0.08 + zoomN * 0.06).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-contrast', `${(1.03 + pitchN * 0.03).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-brightness', `${(1.02 + pitchN * 0.02).toFixed(3)}`);

      // Gradient alpha knobs
      mapEl.style.setProperty('--atmos-core', `${(0.26 + pitchN * 0.08 + zoomN * 0.06).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-mid', `${(0.1 + pitchN * 0.06 + zoomN * 0.05).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-cap', `${(0.14 + pitchN * 0.06 + zoomN * 0.04).toFixed(3)}`);
    } catch (e) {
      console.warn('Atmosphere update failed:', e);
    }
  };

  map.on('render', update);
  update();

  return () => {
    try {
      map.off('render', update);
    } catch (e) {}
  };
}

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
      map.touchPitch?.disable?.();
      map.keyboard?.disableRotation?.();
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

    // Re-enable interactions when unlocked.
    try {
      map.dragRotate?.enable?.();
      map.touchZoomRotate?.enableRotation?.();
      map.touchPitch?.enable?.();
      map.keyboard?.enableRotation?.();
    } catch (e) {}
  }
}

export function applyCommonScene(ctx) {
  const { map, state } = ctx;
  if (!map || !map.isStyleLoaded()) return;

  // Ensure we don't leak the overlay listener across map lifecycle changes.
  // (e.g., style switches or hot reloads).
  if (ctx.atmosphereOverlayUnsub && typeof ctx.atmosphereOverlayUnsub !== 'function') {
    ctx.atmosphereOverlayUnsub = null;
  }

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

  const atmosphereActive = Boolean(state.atmosphereEnabled) && state.projection !== 'flat' && state.currentView !== VIEW.DARK;
  const mapEl = document.getElementById('map');
  if (mapEl) mapEl.classList.toggle('atmosphere-on', atmosphereActive);

  // Keep the (2D) globe-only fog/tint overlay feeling camera-reactive.
  if (!atmosphereActive) {
    if (ctx.atmosphereOverlayUnsub) ctx.atmosphereOverlayUnsub();
    ctx.atmosphereOverlayUnsub = null;
  } else if (!ctx.atmosphereOverlayUnsub) {
    ctx.atmosphereOverlayUnsub = attachAtmosphereOverlayUpdater(ctx);
  }

  if (typeof map.setSky === 'function') {
    if (atmosphereActive) {
      try {
        map.setSky(SKY);
      } catch (e) {}
    } else {
      try {
        // Explicitly disable the native atmosphere when the toggle is off.
        map.setSky({ 'atmosphere-blend': 0 });
      } catch (e) {
        try {
          map.setSky({});
        } catch (e2) {}
      }
    }

    try {
      const layers = map.getStyle().layers;
      const bg = layers.find((l) => l.type === 'background');
      if (bg) {
        // Keep background visible so native sky/stars are preserved.
        map.setPaintProperty(bg.id, 'background-opacity', 1);
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
