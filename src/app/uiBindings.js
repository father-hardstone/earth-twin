import { VIEW } from '../services/styleBundle.js';
import { findLocationById, flyToLocation } from './locations.js';
import { schedulePitchUpdate } from './pitch.js';
import { scheduleSpin } from './spin.js';
import { scheduleTerrainUpdate } from './terrain.js';
import { applyCommonScene, setOverlayVisibility, syncProjectionState, syncToggleState, syncViewState } from './scene.js';
import { switchView } from './viewSwitch.js';
import { setCloudsEnabled } from '../services/clouds.js';
import { applyLighting } from '../services/night.js';

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

  // Handle Landing Page Scroll (Toggle Header)
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

  // --- Range Controls ---
  elements.terrainRange.addEventListener('sl-input', (event) => {
    state.terrainExaggeration = Number(event.target.value);
    elements.terrainValue.textContent = `${state.terrainExaggeration.toFixed(2)}x`;
    scheduleTerrainUpdate(ctx);
  });

  elements.pitchRange.addEventListener('sl-input', (event) => {
    const pitch = Number(event.target.value);
    elements.pitchValue.textContent = `${pitch.toFixed(0)} deg`;
    schedulePitchUpdate(ctx, pitch);
  });

  // --- Shoelace Switches ---
  
  // Real-time Terminator & Night Lights Logic
  const updateLightingUI = () => {
    const isRealtime = elements.lightRealtime.checked;
    state.realtimeLightingEnabled = isRealtime;
    
    if (isRealtime) {
      elements.dayNightContainer.classList.add('disabled');
      elements.lightToggle.disabled = true;
    } else {
      elements.dayNightContainer.classList.remove('disabled');
      elements.lightToggle.disabled = false;
      state.lighting = elements.lightToggle.checked ? 'night' : 'day';
    }
    applyLighting(ctx);
  };

  elements.lightRealtime.addEventListener('sl-change', updateLightingUI);
  
  elements.lightToggle.addEventListener('sl-change', (event) => {
    state.lighting = event.target.checked ? 'night' : 'day';
    applyLighting(ctx);
  });

  // Views (Dark Matter View toggle switches between Dark and Satellite basemaps)
  elements.viewDark.addEventListener('sl-change', (event) => {
    const view = event.target.checked ? VIEW.DARK : VIEW.SATELLITE;
    switchView(ctx, view);
  });

  // Projection
  elements.projToggle.addEventListener('sl-change', (event) => {
    state.projection = event.target.checked ? 'globe' : 'flat';
    applyCommonScene(ctx);
    syncProjectionState(ctx);
  });

  // Layers
  elements.labelsToggle.addEventListener('sl-change', (event) => {
    state.labelsVisible = event.target.checked;
    setOverlayVisibility(ctx, state.labelsVisible);
    syncToggleState(ctx);
  });

  elements.cloudsToggle.addEventListener('sl-change', (event) => {
    setCloudsEnabled(ctx, event.target.checked);
  });

  elements.atmosToggle.addEventListener('sl-change', (event) => {
    state.atmosphereEnabled = event.target.checked;
    applyCommonScene(ctx);
  });

  elements.spinToggle.addEventListener('sl-change', (event) => {
    state.autoSpin = event.target.checked;
    if (state.autoSpin) {
      scheduleSpin(ctx);
    } else if (state.spinTimeout) {
      window.clearTimeout(state.spinTimeout);
    }
  });

  // --- Geolocation ---
  elements.btnGeolocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    elements.btnGeolocation.loading = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        ctx.map.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          pitch: 0,
          speed: 0.8,
          essential: true
        });
        elements.btnGeolocation.loading = false;
        elements.status.textContent = 'Landed at your location.';
        window.setTimeout(() => elements.status.classList.add('is-hidden'), 2000);
      },
      (error) => {
        elements.btnGeolocation.loading = false;
        alert(`Geolocation error: ${error.message}`);
      }
    );
  });

  // Locations Click
  elements.locations.addEventListener('click', (event) => {
    const button = event.target.closest('[data-location-id]');
    if (!button) return;
    const location = findLocationById(button.dataset.locationId);
    if (location) flyToLocation(ctx, location);
  });

  // Initial Sync
  updateLightingUI();
  syncProjectionState(ctx);
  syncViewState(ctx);
  syncToggleState(ctx);
  setPanelOpen(false);
}
