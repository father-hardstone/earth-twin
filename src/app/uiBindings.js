import { VIEW } from '../services/styleBundle.js';
import { findLocationById, flyToLocation } from './locations.js';
import { schedulePitchUpdate } from './pitch.js';
import { scheduleSpin } from './spin.js';
import { scheduleTerrainUpdate } from './terrain.js';
import { applyCommonScene, setOverlayVisibility, syncProjectionState, syncToggleState, syncViewState } from './scene.js';
import { switchView } from './viewSwitch.js';
import { setCloudsEnabled } from '../services/clouds.js';
import { applyLighting } from '../services/night.js';

function clampLatForGlobe(ctx) {
  const { map, state } = ctx;
  // Cesium globe supports full latitude range; only clamp for MapLibre's WebMercator math.
  if (!map || state.projection !== 'globe' || ctx.renderer !== 'maplibre') return;
  try {
    const c = map.getCenter();
    if (!c) return;
    // WebMercator cannot represent beyond ~±85.0511. Keep geolocation within
    // that range so map math stays stable, while pole-rollover (mapEvents)
    // handles seamless traversal near the poles.
    const WEB_MERCATOR_MAX_LAT = 85.05112878;
    const safe = WEB_MERCATOR_MAX_LAT - 0.001;
    const clampedLat = Math.max(-safe, Math.min(safe, c.lat));
    if (Math.abs(clampedLat - c.lat) > 0.0001) {
      map.jumpTo({ center: [c.lng, clampedLat] });
    }
  } catch (e) {}
}

function resetPitchToZero(ctx) {
  const { map, elements } = ctx;
  try {
    if (elements.pitchRange) elements.pitchRange.value = 0;
    if (elements.pitchValue) elements.pitchValue.textContent = '0 deg';
  } catch (e) {}
  try {
    // Use the same path as the range slider to avoid "no-op" jumpTo states.
    schedulePitchUpdate(ctx, 0);
  } catch (e) {}
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
    if (!ctx.map) return;
    state.terrainExaggeration = Number(event.target.value);
    elements.terrainValue.textContent = `${state.terrainExaggeration.toFixed(2)}x`;
    scheduleTerrainUpdate(ctx);
  });

  elements.pitchRange.addEventListener('sl-input', (event) => {
    if (!ctx.map) return;
    const pitch = Number(event.target.value);
    elements.pitchValue.textContent = `${pitch.toFixed(0)} deg`;
    schedulePitchUpdate(ctx, pitch);
  });

  // --- Shoelace Switches ---
  
  // Real-time Terminator & Night Lights Logic
  const updateLightingUI = () => {
    if (!ctx.map) return;
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
    if (!ctx.map) return;
    state.lighting = event.target.checked ? 'night' : 'day';
    applyLighting(ctx);
  });

  // Views (Dark Matter View toggle switches between Dark and Satellite basemaps)
  elements.viewDark.addEventListener('sl-change', (event) => {
    if (!ctx.map) return;
    const view = event.target.checked ? VIEW.DARK : VIEW.SATELLITE;
    switchView(ctx, view);
  });

  // Projection
  elements.projToggle.addEventListener('sl-change', (event) => {
    if (!ctx.map) return;
    state.projection = event.target.checked ? 'globe' : 'flat';
    resetPitchToZero(ctx);

    // Flat projection: force-disable atmosphere (and lock the toggle).
    if (state.projection === 'flat') {
      state.atmosphereEnabled = false;
      if (elements.atmosToggle) {
        elements.atmosToggle.checked = false;
        elements.atmosToggle.disabled = true;
      }
    } else {
      // Re-enable atmosphere toggle when returning to globe unless Dark view locks it.
      if (elements.atmosToggle && state.currentView !== VIEW.DARK) {
        elements.atmosToggle.disabled = false;
      }
    }

    applyCommonScene(ctx);
    syncProjectionState(ctx);
  });

  // Layers
  elements.labelsToggle.addEventListener('sl-change', (event) => {
    if (!ctx.map) return;
    state.labelsVisible = event.target.checked;
    setOverlayVisibility(ctx, state.labelsVisible);
    syncToggleState(ctx);
  });

  elements.cloudsToggle.addEventListener('sl-change', (event) => {
    if (!ctx.map) return;
    setCloudsEnabled(ctx, event.target.checked);
  });

  elements.atmosToggle.addEventListener('sl-change', (event) => {
    if (!ctx.map) return;
    state.atmosphereEnabled = event.target.checked;
    applyCommonScene(ctx);
  });

  elements.spinToggle.addEventListener('sl-change', (event) => {
    if (!ctx.map) return;
    state.autoSpin = event.target.checked;
    resetPitchToZero(ctx);
    if (state.autoSpin) {
      scheduleSpin(ctx);
    } else if (state.spinTimeout) {
      window.clearTimeout(state.spinTimeout);
    }
  });

  // --- Tool Buttons (Top Right) ---
  elements.btnCapture.addEventListener('click', () => {
    if (!ctx.map) return;
    try {
      // Force a repaint to ensure the drawing buffer is populated
      const originalScale = ctx.viewer.resolutionScale;
      ctx.viewer.resolutionScale = 2.5; // Boost resolution for capture
      
      ctx.map.triggerRepaint();
      
      // Capture after the next render cycle to ensure we don't get a blank/cleared buffer
      ctx.map.once('render', () => {
        const canvas = ctx.map.getCanvas();

        const out = document.createElement('canvas');
        out.width = canvas.width;
        out.height = canvas.height;
        const g = out.getContext('2d', { alpha: false });
        if (g) {
          g.fillStyle = '#000';
          g.fillRect(0, 0, out.width, out.height);
          g.drawImage(canvas, 0, 0);
        }
        const dataUrl = (g ? out : canvas).toDataURL('image/png', 1.0);

        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = `twin-earth-uhd-${timestamp}.png`;
        link.href = dataUrl;
        link.click();
        
        ctx.viewer.resolutionScale = originalScale;
        ctx.map.triggerRepaint();
        
        elements.status.textContent = 'Ultra HD Snapshot saved.';
        elements.status.classList.remove('is-hidden');
        window.setTimeout(() => elements.status.classList.add('is-hidden'), 2500);
      });
    } catch (e) {
      console.error('Capture failed:', e);
      alert('Failed to capture screen.');
    }
  });

  // --- Navigation Controls (Right Side) ---
  const nudgeZoom = (delta) => {
    if (!ctx.map) return;
    const current = Number(ctx.map.getZoom?.() ?? 2);
    const next = current + delta;
    try {
      ctx.map.flyTo?.({ zoom: next, duration: 0.4 });
    } catch (e) {
      try {
        ctx.map.jumpTo?.({ zoom: next });
      } catch {}
    }
  };

  elements.btnZoomIn.addEventListener('click', () => nudgeZoom(+0.6));
  elements.btnZoomOut.addEventListener('click', () => nudgeZoom(-0.6));

  elements.btnResetNorth.addEventListener('click', () => {
    if (!ctx.map) return;
    // Reset both bearing (north up) and pitch (top-down view).
    try {
      ctx.map.easeTo?.({ bearing: 0, pitch: 0, duration: 0.5 });
    } catch (e) {
      try {
        ctx.map.jumpTo?.({ bearing: 0, pitch: 0 });
      } catch {}
    }
    // Sync the pitch slider UI.
    try {
      if (elements.pitchRange) elements.pitchRange.value = 0;
      if (elements.pitchValue) elements.pitchValue.textContent = '0 deg';
      if (ctx.cameraController?.setPitch) ctx.cameraController.setPitch(0);
    } catch (e) {}
  });

  elements.btnFullscreen.addEventListener('click', async () => {
    const target = ctx.map?.getContainer?.() ?? document.documentElement;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (target?.requestFullscreen) {
        await target.requestFullscreen();
      }
    } catch (e) {}
  });

  elements.btnLockAxis.addEventListener('click', () => {
    if (!ctx.map) return;
    state.fixedAxis = !state.fixedAxis;
    const isLocked = state.fixedAxis;

    elements.btnLockAxis.classList.toggle('is-active', isLocked);

    const ssc = ctx.viewer?.scene?.screenSpaceCameraController;
    const CesiumRef = ctx.Cesium;

    if (isLocked) {
      // Fix the rotation axis to Earth's north-south pole (UNIT_Z).
      // This is the same constraint Cesium applies by default, which keeps
      // north always "up" and makes the camera self-correct its orientation.
      if (ssc && CesiumRef) {
        try { ssc.constrainedAxis = CesiumRef.Cartesian3.UNIT_Z; } catch (e) {}
      }

      // Snap bearing to north and pitch to zero so the axis is cleanly aligned on lock.
      try { ctx.map.jumpTo({ bearing: 0, pitch: 0 }); } catch (e) {}
      try {
        if (elements.pitchRange) elements.pitchRange.value = 0;
        if (elements.pitchValue) elements.pitchValue.textContent = '0 deg';
        if (ctx.cameraController?.setPitch) ctx.cameraController.setPitch(0);
      } catch (e) {}

      // Enforce: keep bearing at 0 while axis is locked so dragging can't
      // rotate the camera off-axis.
      if (ctx._fixedAxisEnforcer) {
        try { ctx.map.off('move', ctx._fixedAxisEnforcer); } catch (e) {}
        try { ctx.map.off('rotate', ctx._fixedAxisEnforcer); } catch (e) {}
      }
      ctx._fixedAxisEnforcer = () => {
        if (!state.fixedAxis) return;
        try {
          const b = ctx.map.getBearing?.() ?? 0;
          if (Math.abs(b) > 0.1) ctx.map.jumpTo?.({ bearing: 0 });
        } catch (e) {}
      };
      try { ctx.map.on('move', ctx._fixedAxisEnforcer); } catch (e) {}
      try { ctx.map.on('rotate', ctx._fixedAxisEnforcer); } catch (e) {}

      elements.status.textContent = 'Axis Locked (North Up)';
    } else {
      // Remove the bearing enforcer.
      if (ctx._fixedAxisEnforcer) {
        try { ctx.map.off('move', ctx._fixedAxisEnforcer); } catch (e) {}
        try { ctx.map.off('rotate', ctx._fixedAxisEnforcer); } catch (e) {}
        ctx._fixedAxisEnforcer = null;
      }

      // Release the axis constraint so the camera can freely orbit in any direction.
      if (ssc) {
        try { ssc.constrainedAxis = undefined; } catch (e) {}
      }

      elements.status.textContent = 'Axis Free';
    }

    elements.status.classList.remove('is-hidden');
    window.setTimeout(() => elements.status.classList.add('is-hidden'), 1500);
  });

  // --- Compass bearing indicator ---
  // Rotate the ▲ button to visually reflect the current camera heading.
  const updateCompassRotation = () => {
    if (!ctx.map) return;
    try {
      const bearing = ctx.map.getBearing?.() ?? 0;
      elements.btnResetNorth.style.transform = `rotate(${-bearing}deg)`;
    } catch (e) {}
  };
  // Run on every camera move event.
  try { ctx.map?.on?.('move', updateCompassRotation); } catch (e) {}
  // Initial sync.
  updateCompassRotation();

  // --- Geolocation ---
  elements.btnGeolocation.addEventListener('click', () => {
    if (!ctx.map) return;
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
        clampLatForGlobe(ctx);
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

  // Initial Sync Logic
  ctx.syncUiToState = () => {
    updateLightingUI();
    syncProjectionState(ctx);
    syncViewState(ctx);
    syncToggleState(ctx);
    
    // Explicitly sync extra toggles not handled by specific sync helpers
    if (elements.atmosToggle) {
      elements.atmosToggle.checked = state.atmosphereEnabled;
    }
    if (elements.cloudsToggle) {
      elements.cloudsToggle.checked = state.cloudsEnabled;
    }
    if (elements.spinToggle) {
      elements.spinToggle.checked = state.autoSpin;
    }
  };


  if (ctx.map) {
    ctx.syncUiToState();
  }
  setPanelOpen(false);
}
