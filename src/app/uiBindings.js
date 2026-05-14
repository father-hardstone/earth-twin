import { VIEW } from '../services/styleBundle.js';
import { findLocationById, flyToLocation } from './locations.js';
import { FEATURED_LOCATIONS } from './constants.js';
import { schedulePitchUpdate } from './pitch.js';
import { scheduleSpin } from './spin.js';
import { scheduleTerrainUpdate } from './terrain.js';
import { applyCommonScene, setOverlayVisibility, syncProjectionState, syncToggleState, syncViewState } from './scene.js';
import { switchView } from './viewSwitch.js';
import { setCloudsEnabled } from '../services/clouds.js';
import { applyLighting } from '../services/night.js';

function toDMS(decimal, isLat) {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  let direction = '';
  if (isLat) {
    direction = decimal >= 0 ? 'N' : 'S';
  } else {
    direction = decimal >= 0 ? 'E' : 'W';
  }

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

export function bindUi(ctx, router) {
  const { elements, state } = ctx;

  // --- Landing Page & Navigation ---
  if (elements.goToMapHeroBtn) {
    elements.goToMapHeroBtn.addEventListener('click', () => {
      router.navigate('/map');
    });
  }

  if (elements.goToMapNavBtn) {
    elements.goToMapNavBtn.addEventListener('click', () => {
      router.navigate('/map');
    });
  }

  elements.backToLandingBtn.addEventListener('click', () => {
    router.navigate('/landing');
  });

  // Handle Landing Page Scroll
  elements.landingPage.addEventListener('scroll', () => {
    const isScrolled = elements.landingPage.scrollTop > 100;
    elements.landingHeader.classList.toggle('scrolled', isScrolled);
  });

  // --- Controls Toggle ---
  const setPanelOpen = (open) => {
    elements.sidePanel.classList.toggle('is-hidden', !open);
    elements.toggleControls.style.display = open ? 'none' : '';
  };

  elements.toggleControls.addEventListener('click', () => setPanelOpen(true));
  if (elements.closeControls) {
    elements.closeControls.addEventListener('click', () => setPanelOpen(false));
  }

  // --- Navigation Hub & Search ---
  const updateLocationReadout = () => {
    if (!ctx.map) return;
    const center = ctx.map.getCenter();
    if (!center) return;
    
    const lat = center.lat;
    const lng = center.lng;
    
    elements.coordsDms.textContent = `${toDMS(lat, true)}, ${toDMS(lng, false)}`;
    
    // Auto-fill coordinates if user isn't typing
    if (document.activeElement !== elements.inputLat && document.activeElement !== elements.inputLng) {
      elements.inputLat.value = lat.toFixed(4);
      elements.inputLng.value = lng.toFixed(4);
    }
  };

  elements.btnPinLocation.addEventListener('click', () => {
    const lat = parseFloat(elements.inputLat.value);
    const lng = parseFloat(elements.inputLng.value);
    const place = elements.inputPlace.value.trim();

    if (place) {
      // Basic place search among featured locations
      const found = FEATURED_LOCATIONS.find(l => l.title.toLowerCase().includes(place.toLowerCase()));
      if (found) {
        flyToLocation(ctx, found);
        return;
      }
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      ctx.map.flyTo({
        center: [lng, lat],
        zoom: 12,
        duration: 1.5
      });
    }
  });

  // --- Range Controls & Resets ---
  elements.btnResetZoom.addEventListener('click', () => {
    ctx.map?.flyTo({ zoom: 2, duration: 1.0 });
  });

  elements.btnResetPitch.addEventListener('click', () => {
    schedulePitchUpdate(ctx, 0);
  });

  elements.btnResetFov.addEventListener('click', () => {
    state.fov = 70;
    if (ctx.viewer) {
      ctx.viewer.camera.frustum.fov = (70 * Math.PI) / 180;
    }
    elements.fovRange.value = 70;
    elements.fovValue.textContent = '70°';
  });

  elements.zoomRange.addEventListener('sl-input', (event) => {
    if (!ctx.map) return;
    const zoom = Number(event.target.value);
    ctx.map.jumpTo({ zoom });
  });

  elements.pitchRange.addEventListener('sl-input', (event) => {
    if (!ctx.map) return;
    const pitch = Number(event.target.value);
    schedulePitchUpdate(ctx, pitch);
  });

  elements.fovRange.addEventListener('sl-input', (event) => {
    if (!ctx.map) return;
    const val = Number(event.target.value);
    if (isNaN(val) || val <= 0) return; // Prevent 0 or NaN FOV
    state.fov = val;
    elements.fovValue.textContent = `${state.fov}°`;
    if (ctx.viewer) {
      ctx.viewer.camera.frustum.fov = (state.fov * Math.PI) / 180;
    }
  });

  // --- Core Toggles ---
  elements.viewDark.addEventListener('sl-change', (event) => {
    if (!ctx.map) return;
    const view = event.target.checked ? VIEW.DARK : VIEW.SATELLITE;
    switchView(ctx, view);
  });

  elements.projToggle.addEventListener('sl-change', (event) => {
    if (!ctx.map) return;
    state.projection = event.target.checked ? 'globe' : 'flat';
    schedulePitchUpdate(ctx, 0);
    applyCommonScene(ctx);
    syncProjectionState(ctx);
    syncLightingAvailability();
  });

  elements.lightRealtime.addEventListener('sl-change', () => {
    state.realtimeLightingEnabled = elements.lightRealtime.checked;
    applyLighting(ctx);
    syncLightingAvailability();
  });

  elements.lightToggle.addEventListener('sl-change', (event) => {
    state.lighting = event.target.checked ? 'night' : 'day';
    applyLighting(ctx);
  });

  // Environment
  elements.atmosToggle.addEventListener('sl-change', (event) => {
    state.atmosphereEnabled = event.target.checked;
    applyCommonScene(ctx);
  });

  elements.cloudsToggle.addEventListener('sl-change', (event) => {
    setCloudsEnabled(ctx, event.target.checked);
  });

  elements.spinToggle.addEventListener('sl-change', (event) => {
    state.autoSpin = event.target.checked;
    if (state.autoSpin) scheduleSpin(ctx);
    else if (state.spinTimeout) window.clearTimeout(state.spinTimeout);
  });

  // Terrain
  elements.terrainToggle.addEventListener('sl-change', (event) => {
    state.terrainEnabled = event.target.checked;
    ctx.map.emit('cesium-refresh-terrain');
  });

  elements.buildingsToggle.addEventListener('sl-change', (event) => {
    state.buildingsEnabled = event.target.checked;
    ctx.map.emit('cesium-refresh-terrain');
  });

  elements.waterToggle.addEventListener('sl-change', (event) => {
    state.waterMaskEnabled = event.target.checked;
    ctx.map.emit('cesium-refresh-terrain');
  });

  const syncLightingAvailability = () => {
    const isGlobe = state.projection === 'globe';
    elements.dayNightContainer.classList.toggle('disabled', isGlobe);
    elements.lightRealtime.disabled = isGlobe;
    elements.lightToggle.disabled = isGlobe;
  };

  // --- Locations Grid ---
  const renderLocations = () => {
    elements.locations.innerHTML = FEATURED_LOCATIONS.map(loc => `
      <button class="loc-btn" data-location-id="${loc.id}">
        ${loc.title}
      </button>
    `).join('');
  };

  elements.locations.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-location-id]');
    if (!btn) return;
    const loc = findLocationById(btn.dataset.locationId);
    if (loc) flyToLocation(ctx, loc);
  });

  // --- Map Event Sync ---
  if (ctx.map) {
    ctx.map.on('move', () => {
      updateLocationReadout();
      
      const zoom = ctx.map.getZoom();
      elements.zoomRange.value = zoom;
      elements.zoomValue.textContent = zoom.toFixed(1);
      
      const pitch = ctx.map.getPitch();
      elements.pitchRange.value = pitch;
      elements.pitchValue.textContent = `${Math.round(pitch)}°`;
    });
  }

  // --- Initial Sync ---
  ctx.syncUiToState = () => {
    elements.viewDark.checked = state.currentView === VIEW.DARK;
    elements.projToggle.checked = state.projection === 'globe';
    elements.lightRealtime.checked = state.realtimeLightingEnabled;
    elements.lightToggle.checked = state.lighting === 'night';
    
    elements.atmosToggle.checked = state.atmosphereEnabled;
    elements.cloudsToggle.checked = state.cloudsEnabled;
    elements.spinToggle.checked = state.autoSpin;
    
    elements.terrainToggle.checked = state.terrainEnabled;
    elements.buildingsToggle.checked = state.buildingsEnabled;
    elements.waterToggle.checked = state.waterMaskEnabled;
    
    elements.fovRange.value = state.fov;
    elements.fovValue.textContent = `${state.fov}°`;
    
    syncLightingAvailability();
    renderLocations();
    updateLocationReadout();
  };

  // --- Other Tools ---
  elements.btnCapture.addEventListener('click', () => {
    if (!ctx.map) return;
    
    elements.status.textContent = 'Capturing high-res view...';
    
    const originalScale = ctx.viewer?.resolutionScale || 1.0;
    // Boost to 1.5x for high clarity without crashing the GPU
    if (ctx.viewer) ctx.viewer.resolutionScale = 1.5; 
    
    ctx.map.triggerRepaint();
    ctx.map.once('render', () => {
      const canvas = ctx.map.getCanvas();
      const out = document.createElement('canvas');
      out.width = canvas.width; 
      out.height = canvas.height;
      const g = out.getContext('2d');
      if (g) g.drawImage(canvas, 0, 0);
      
      const dataUrl = out.toDataURL('image/png');
      
      // Restore
      if (ctx.viewer) ctx.viewer.resolutionScale = originalScale;
      
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `earth-twin-${timestamp}.png`;
      link.href = dataUrl;
      link.click();
      
      elements.status.textContent = 'Snapshot saved.';
      setTimeout(() => { elements.status.textContent = 'Ready'; }, 2000);
    });
  });

  elements.btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  elements.btnResetNorth.addEventListener('click', () => {
    ctx.map?.flyTo({ bearing: 0, pitch: 0, duration: 1.0 });
  });

  elements.btnLockAxis.addEventListener('click', () => {
    state.fixedAxis = !state.fixedAxis;
    elements.btnLockAxis.classList.toggle('is-active', state.fixedAxis);
    if (ctx.viewer) {
      ctx.viewer.scene.screenSpaceCameraController.constrainedAxis = state.fixedAxis ? ctx.Cesium.Cartesian3.UNIT_Z : undefined;
    }
  });

  elements.btnZoomIn.addEventListener('click', () => ctx.map?.flyTo({ zoom: ctx.map.getZoom() + 1 }));
  elements.btnZoomOut.addEventListener('click', () => ctx.map?.flyTo({ zoom: ctx.map.getZoom() - 1 }));

  renderLocations();
  setPanelOpen(false);
}
