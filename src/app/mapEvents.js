import { updateHud } from './hud.js';
import { removePopup, showPopup } from './popups.js';
import { scheduleSpin } from './spin.js';
import { updateTerrainForZoom } from './terrain.js';
import { updateCloudsForZoom } from '../services/clouds.js';
import { applyLighting } from '../services/night.js';

const WEB_MERCATOR_MAX_LAT = 85.05112878;
const POLE_CLAMP_LAT = WEB_MERCATOR_MAX_LAT - 0.001;

export function registerMapEvents(ctx) {
  const { map, state, elements } = ctx;

  // --- Pole Clamp: stop at WebMercator limit ---
  // Reverts the previous "jump/rollover to the other side" behavior.
  let poleClampGuard = false;
  const clampAtPoles = () => {
    if (poleClampGuard) return;
    if (state.projection === 'flat') return;

    const center = map.getCenter?.();
    if (!center) return;

    const clampedLat = Math.max(-POLE_CLAMP_LAT, Math.min(POLE_CLAMP_LAT, center.lat));
    if (Math.abs(clampedLat - center.lat) <= 1e-6) return;

    poleClampGuard = true;
    try {
      map.jumpTo({ center: [center.lng, clampedLat] });
    } finally {
      requestAnimationFrame(() => {
        poleClampGuard = false;
      });
    }
  };

  map.on('move', clampAtPoles);

  map.on('movestart', () => {
    state.interacting = true;
    if (state.spinTimeout) {
      window.clearTimeout(state.spinTimeout);
    }
  });

  map.on('move', () => {
    updateHud(ctx);
  });

  map.on('moveend', () => {
    state.interacting = false;
    updateHud(ctx);
    updateTerrainForZoom(ctx);
    updateCloudsForZoom(ctx);
    applyLighting(ctx);
    scheduleSpin(ctx);
  });

  map.on('pitchend', () => {
    elements.pitchRange.value = map.getPitch().toFixed(0);
    elements.pitchValue.textContent = `${map.getPitch().toFixed(0)} deg`;
  });

  map.on('zoom', () => {
    updateHud(ctx);
    updateCloudsForZoom(ctx);
    applyLighting(ctx);
  });

  map.on('click', (event) => {
    const layers = state.inspectableLayerIds.filter((layerId) => map.getLayer(layerId));
    if (!layers.length) {
      return;
    }

    const features = map.queryRenderedFeatures(event.point, { layers });
    if (!features.length) {
      removePopup(ctx);
      return;
    }

    const priorityFeature = features.find((feature) => feature.properties?.name) ?? features[0];

    showPopup(ctx, event.lngLat, priorityFeature);
  });
}

