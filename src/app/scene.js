import { SKY } from './constants.js';
import { VIEW } from '../services/styleBundle.js';
import { setCloudsEnabled, startCloudsAnimation, updateCloudsForZoom } from '../services/clouds.js';
import { applyLighting } from '../services/night.js';

export function applyCommonScene(ctx) {
  const { map, state } = ctx;
  if (!map.isStyleLoaded()) return;
  map.setProjection({ type: state.projection === 'flat' ? 'mercator' : 'globe' });

  if (typeof map.setSky === 'function') {
    map.setSky(SKY);
  }

  if (typeof map.setFog === 'function') {
    if (state.atmosphereEnabled) {
      map.setFog({
        color: 'rgb(20, 35, 50)', // Soft horizon glow
        'high-color': 'rgba(0, 0, 0, 0)',
        'horizon-blend': 0.3, // Very smooth edge transition
        'space-color': 'rgba(0, 0, 0, 0)',
        'star-intensity': 0
      });
    } else {
      map.setFog(null);
    }
    
    // Manage background transparency
    try {
      const layers = map.getStyle().layers;
      const bg = layers.find(l => l.type === 'background');
      if (bg) map.setPaintProperty(bg.id, 'background-opacity', 0);
    } catch (e) {}
  }

  if (state.cloudsEnabled) {
    setCloudsEnabled(ctx, true);
    startCloudsAnimation(ctx);
    updateCloudsForZoom(ctx);
  }

  applyLighting(ctx);
}

export function setOverlayVisibility(ctx, visible) {
  const { map, state } = ctx;
  const enabled = visible && state.supportsCartographyToggle;

  state.overlayLayerIds.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', enabled ? 'visible' : 'none');
    }
  });
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
