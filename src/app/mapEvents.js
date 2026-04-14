import { updateHud } from './hud.js';
import { removePopup, showPopup } from './popups.js';
import { scheduleSpin } from './spin.js';
import { updateTerrainForZoom } from './terrain.js';
import { updateCloudsForZoom } from '../services/clouds.js';
import { applyLighting } from '../services/night.js';

export function registerMapEvents(ctx) {
  const { map, state, elements } = ctx;

  map.on('movestart', () => {
    state.interacting = true;
    if (state.spinTimeout) {
      window.clearTimeout(state.spinTimeout);
    }
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

    const priorityFeature =
      features.find((feature) => feature.properties?.name) ?? features[0];

    showPopup(ctx, event.lngLat, priorityFeature);
  });
}
