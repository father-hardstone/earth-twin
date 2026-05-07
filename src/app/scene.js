import { SKY } from './constants.js';
import { VIEW } from '../services/styleBundle.js';
import { setCloudsEnabled, startCloudsAnimation, updateCloudsForZoom } from '../services/clouds.js';
import { applyLighting, getSubsolarPoint } from '../services/night.js';

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

      // Use projection-based measurement for the globe silhouette.
      // This stays stable when rotating longitude (previous math drifted).
      const center = map.getCenter?.();
      const centerLng = center?.lng ?? 0;
      const centerLat = center?.lat ?? 0;

      const metrics = estimateGlobeScreenMetrics(map, centerLat, centerLng);
      // IMPORTANT: radiusPx must be derived from the projection only.
      // Any extra "shrink" heuristics will desync the haze from the globe when zooming.
      const radiusPx = (metrics.radiusPx ?? Math.min(w, h) * 0.32);
      const yShiftPx = metrics.yShiftPx ?? 0;

      // Sun tracking: Calculate Sun's screen center for the glow gradient
      const sunPos = getSubsolarPoint(new Date());
      const sunScreenPos = map.project([sunPos.lon, sunPos.lat]);
      
      const sunOffsetX = sunScreenPos.x - w / 2;
      const sunOffsetY = sunScreenPos.y - h / 2;
      
      const glowLimit = radiusPx * 0.8;
      const gx = clamp(sunOffsetX, -glowLimit, glowLimit);
      const gy = clamp(sunOffsetY, -glowLimit, glowLimit);

      // 5. Visual refinement
      const zoomN = clamp((zoom - 1) / 15, 0, 1);
      const pitchN = clamp(pitch / 89.99, 0, 1);

      // Keep the haze slightly larger than the globe, but scale by ratio (not fixed pixels)
      // so it zooms in/out with the exact same factor as the globe silhouette.
      const padRatio = clamp(0.022 - zoom * 0.001, 0.006, 0.024);
      const finalRadiusPx = radiusPx * (1 + padRatio);

      const opacity = 0.55 + clamp((zoom - 1.5) / 10, 0, 1) * 0.25 + pitchN * 0.25;

      mapEl.style.setProperty('--atmos-y-shift', `${yShiftPx.toFixed(2)}px`);
      mapEl.style.setProperty('--atmos-glow-x', `${gx.toFixed(2)}px`);
      mapEl.style.setProperty('--atmos-glow-y', `${gy.toFixed(2)}px`);
      mapEl.style.setProperty('--atmos-scale', `1`);
      mapEl.style.setProperty('--atmos-opacity', `${clamp(opacity, 0, 1).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-radius-px', `${finalRadiusPx.toFixed(2)}px`);

      // Atmosphere visual properties
      mapEl.style.setProperty('--atmos-hue', `${(8 + pitchN * 6 + zoomN * 4).toFixed(2)}deg`);
      mapEl.style.setProperty('--atmos-sat', `${(1.12 + pitchN * 0.08 + zoomN * 0.06).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-contrast', `${(1.05 + pitchN * 0.03).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-brightness', `${(1.04 + pitchN * 0.02).toFixed(3)}`);

      // Gradient alpha knobs (Limb brightening: lighter center, denser edge)
      mapEl.style.setProperty('--atmos-core', `${(0.06 + pitchN * 0.04).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-mid', `${(0.18 + pitchN * 0.06 + zoomN * 0.04).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-edge', `${(0.42 + pitchN * 0.14 + zoomN * 0.1).toFixed(3)}`);
      mapEl.style.setProperty('--atmos-cap', `${(0.12 + pitchN * 0.08 + zoomN * 0.06).toFixed(3)}`);
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
  const hardLock = state.projection === 'flat' || state.currentView === VIEW.DARK;
  const axisLock = Boolean(state.fixedAxis) && !hardLock;

  if (!map) return;

  // Ensure drag interaction is enabled (unless explicitly disabled elsewhere).
  try {
    map.dragPan?.enable?.();
  } catch (e) {}

  if (hardLock || axisLock) {
    try {
      // Hard lock: keep the camera level and north-up.
      // Axis lock: keep only the tilt (pitch) fixed; allow side-to-side rotation.
      map.jumpTo(hardLock ? { bearing: 0, pitch: 0 } : { pitch: 0 });
    } catch (e) {}

    try {
      if (hardLock) {
        map.dragRotate?.disable?.();
        map.touchZoomRotate?.disableRotation?.();
        map.keyboard?.disableRotation?.();
      } else {
        // Allow rotation while the tilt is locked.
        map.dragRotate?.enable?.();
        map.touchZoomRotate?.enableRotation?.();
        map.keyboard?.enableRotation?.();
      }

      // Always disable pitch interactions when tilt is locked.
      map.touchPitch?.disable?.();
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

function deg2rad(d) {
  return (d * Math.PI) / 180;
}

function rad2deg(r) {
  return (r * 180) / Math.PI;
}

function wrapLng(lng) {
  let x = ((lng + 180) % 360 + 360) % 360 - 180;
  // Avoid -180 when possible (MapLibre sometimes normalizes)
  if (x === -180) x = 180;
  return x;
}

function destination90deg(lat0Deg, lon0Deg, bearingDeg) {
  // Destination point from (lat0,lon0) moving 90 degrees along a great circle at given bearing.
  // Uses the general great-circle destination formula with angular distance d = π/2.
  const lat0 = deg2rad(lat0Deg);
  const lon0 = deg2rad(lon0Deg);
  const brng = deg2rad(bearingDeg);

  const sinLat2 = Math.cos(lat0) * Math.cos(brng); // since cos(d)=0 and sin(d)=1
  const lat2 = Math.asin(Math.max(-1, Math.min(1, sinLat2)));

  const y = Math.sin(brng) * Math.cos(lat0);
  const x = -Math.sin(lat0) * Math.sin(lat2); // because cos(d)=0
  const lon2 = lon0 + Math.atan2(y, x);

  return { lat: rad2deg(lat2), lng: wrapLng(rad2deg(lon2)) };
}

export function estimateGlobeScreenMetrics(map, centerLat, centerLng) {
  try {
    const canvas = map.getCanvas?.();
    const w = canvas?.clientWidth ?? 0;
    const h = canvas?.clientHeight ?? 0;
    if (!w || !h) return { radiusPx: null, yShiftPx: null };

    const centerPx = map.project?.({ lat: centerLat, lng: centerLng });
    if (!centerPx || !Number.isFinite(centerPx.x) || !Number.isFinite(centerPx.y)) {
      return { radiusPx: null, yShiftPx: null };
    }

    // Measure horizon points 90° away in four bearings.
    const bearings = [0, 90, 180, 270];
    const distances = [];
    for (const b of bearings) {
      const p = destination90deg(centerLat, centerLng, b);
      const px = map.project?.(p);
      if (!px || !Number.isFinite(px.x) || !Number.isFinite(px.y)) continue;
      distances.push(Math.hypot(px.x - centerPx.x, px.y - centerPx.y));
    }
    if (distances.length < 2) return { radiusPx: null, yShiftPx: null };

    // Use median for robustness (projection near horizon can be noisy at high pitch).
    distances.sort((a, b) => a - b);
    const mid = distances[Math.floor(distances.length / 2)];

    // yShift: our CSS expects how much the globe center shifts from the canvas center due to pitch.
    const canvasCenterY = h / 2;
    const yShiftPx = centerPx.y - canvasCenterY;

    return { radiusPx: mid, yShiftPx };
  } catch (e) {
    return { radiusPx: null, yShiftPx: null };
  }
}

export function applyCommonScene(ctx) {
  const { map, state } = ctx;
  if (!map) return;
  const styleLoaded = Boolean(map.isStyleLoaded?.());

  // Ensure we don't leak the overlay listener across map lifecycle changes.
  // (e.g., style switches or hot reloads).
  if (ctx.atmosphereOverlayUnsub && typeof ctx.atmosphereOverlayUnsub !== 'function') {
    ctx.atmosphereOverlayUnsub = null;
  }

  // Apply projection. Some versions of MapLibre ignore the initial constructor option
  // or require it to be reapplied after the style has loaded.
  const targetProj = state.projection === 'flat' ? 'mercator' : 'globe';
  if (styleLoaded) {
    try {
      map.setProjection({ type: targetProj });
    } catch (e) {
      try {
        map.setProjection(targetProj);
      } catch (e2) {
        console.warn('Failed to set projection:', e2);
      }
    }
  }

  const atmosphereActive = Boolean(state.atmosphereEnabled) && state.projection !== 'flat' && state.currentView !== VIEW.DARK;
  const mapEl = document.getElementById('map');
  if (mapEl) mapEl.classList.toggle('atmosphere-on', atmosphereActive);

  // Ensure the (2D) globe-only fog/tint overlay is correctly registered and reactive.
  if (ctx.atmosphereOverlayUnsub) {
    try { ctx.atmosphereOverlayUnsub(); } catch (e) {}
    ctx.atmosphereOverlayUnsub = null;
  }
  
  if (atmosphereActive) {
    ctx.atmosphereOverlayUnsub = attachAtmosphereOverlayUpdater(ctx);
    
    // Apply a blue tint directly to the satellite tiles to fake atmospheric scattering
    try {
      if (map.getLayer('satellite-imagery')) {
        map.setPaintProperty('satellite-imagery', 'raster-hue-rotate', 8); // Shift towards blue
        map.setPaintProperty('satellite-imagery', 'raster-saturation', 0.2); // Increase saturation
        map.setPaintProperty('satellite-imagery', 'raster-contrast', 0.1); // Slightly reduce contrast
        map.setPaintProperty('satellite-imagery', 'raster-brightness-min', 0.1); // Increase brightness of darks
        map.setPaintProperty('satellite-imagery', 'raster-brightness-max', 1.0); // Must be <= 1.0
      }
    } catch (e) {
      console.warn('Failed to tint satellite tiles:', e);
    }
  } else {
    // Reset satellite tiles to their original color profile
    try {
      if (map.getLayer('satellite-imagery')) {
        map.setPaintProperty('satellite-imagery', 'raster-hue-rotate', 0);
        map.setPaintProperty('satellite-imagery', 'raster-saturation', 0.08); // Original saturation
        map.setPaintProperty('satellite-imagery', 'raster-contrast', 0.06); // Original contrast
        map.setPaintProperty('satellite-imagery', 'raster-brightness-min', 0.0); // Reset darks
        map.setPaintProperty('satellite-imagery', 'raster-brightness-max', 1.0); // Original brightness
      }
    } catch (e) {
      console.warn('Failed to reset satellite tiles:', e);
    }
  }

  if (styleLoaded && typeof map.setSky === 'function') {
    const applySky = () => {
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
    };

    applySky();
    // Re-apply after a short delay to ensure globe projection and style state are fully synced.
    // This fixes the issue where atmosphere stays off on the first page load.
    window.requestAnimationFrame(applySky);
  }

  // Hide the native background layer so the starfield can show through.
  try {
    const layers = map.getStyle().layers;
    const bg = layers.find((l) => l.type === 'background');
    if (bg) {
      map.setPaintProperty(bg.id, 'background-opacity', 0);
    }
  } catch (e) {}
  
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
