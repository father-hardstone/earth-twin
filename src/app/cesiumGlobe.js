import * as Cesium from 'cesium';
import { 
  clamp, 
  deg, 
  rad, 
  createEmitter,
  cameraCenterLngLat
} from './cesiumUtils.js';
import { addSunCameraLensEffect } from './sunPostProcess.js';
import { loadTerrain, loadBuildings, updateTerrainExaggeration } from './cesiumAssets.js';
import { configureAtmosphere, updateSkyboxFade } from './cesiumAtmosphere.js';
import { configureInteraction, syncCameraToState } from './cesiumInteraction.js';
import { createSkyBox, buildSkyboxFadeSources } from './cesiumSkybox.js';
import { createScaledMoon } from './cesiumMoon.js';
import { createMapAdapter } from './cesiumAdapter.js';

// Import skybox images to let Vite handle the paths/loading
import skyPX from '../assets/images/skybox_1/px.jpg';
import skyNX from '../assets/images/skybox_1/nx.jpg';
import skyPY from '../assets/images/skybox_1/py.jpg';
import skyNY from '../assets/images/skybox_1/ny.jpg';
import skyPZ from '../assets/images/skybox_1/pz.jpg';
import skyNZ from '../assets/images/skybox_1/nz.jpg';

import starmap4 from '../assets/images/starmap_4.png';
import viewSettings from '../config/viewSettings.json';

const SKYBOX_DARKNESS_BRIGHTNESS = Number.isFinite(viewSettings?.skyDarknessBrightness)
  ? Math.max(0, Math.min(1, viewSettings.skyDarknessBrightness))
  : 0.1;
const MOON_SCALE = Number.isFinite(viewSettings?.moonScale)
  ? Math.max(0.1, viewSettings.moonScale)
  : 1.25;
const MOON_DISTANCE_SCALE = Number.isFinite(viewSettings?.moonDistanceScale)
  ? Math.max(0.1, viewSettings.moonDistanceScale)
  : 1.12;
const ATMOSPHERE_BRIGHTNESS_SHIFT = Number.isFinite(viewSettings?.atmosphereBrightnessShift)
  ? viewSettings.atmosphereBrightnessShift
  : -0.15;
const ATMOSPHERE_SATURATION_SHIFT = Number.isFinite(viewSettings?.atmosphereSaturationShift)
  ? viewSettings.atmosphereSaturationShift
  : -0.05;
const ATMOSPHERE_HUE_SHIFT = Number.isFinite(viewSettings?.atmosphereHueShift)
  ? viewSettings.atmosphereHueShift
  : 0.0;
const ATMOSPHERE_THICKNESS_SCALE = Number.isFinite(viewSettings?.atmosphereThicknessScale)
  ? Math.max(0.2, viewSettings.atmosphereThicknessScale)
  : 1.4;
const SKYBOX_FADE_LEVELS = 24;
const SKYBOX_FADE_OUT_SPEED = 2.4;
const SKYBOX_FADE_IN_SPEED = 1.35;
const SKYBOX_BRIGHT_HOLD_MS = 120;
const SKYBOX_SOURCES_NORMAL = {
  positiveX: skyNX, // x- is right
  negativeX: skyPX, // x+ is left
  positiveY: skyPY, // y+ is up
  negativeY: skyNY, // y- is bottom
  positiveZ: skyPZ, // z+ is front
  negativeZ: skyNZ  // z- is back
};


export async function initCesiumGlobe(ctx, containerEl, initialView) {
  if (!containerEl) throw new Error('Missing Cesium container element');

  containerEl.innerHTML = '';

  const viewer = new Cesium.Viewer(containerEl, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    vrButton: false,
    globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84)
  });

  // Performance & Quality Optimization Pipeline
  viewer.resolutionScale = window.devicePixelRatio || 1.0; 
  viewer.scene.globe.maximumScreenSpaceError = 2.5; // Balanced for 3060 clarity vs performance
  viewer.scene.globe.preloadAncestors = true; // Surface textures load first
  viewer.scene.globe.tileCacheSize = 1024; // High cache for smooth fly-bys
  viewer.scene.globe.depthTestAgainstTerrain = true;

  // Interaction & Controls Setup
  configureInteraction(viewer);

  let buildings = null;
  const refreshTerrain = async () => {
    // 1. Terrain & Water Mask
    if (ctx.state.terrainEnabled) {
      await loadTerrain(viewer, ctx.state.waterMaskEnabled);
    } else {
      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    }

    // 2. 3D Buildings
    if (!buildings) {
      buildings = await loadBuildings(viewer);
    }
    if (buildings) {
      buildings.show = ctx.state.buildingsEnabled;
    }
    
    updateTerrainExaggeration(viewer, ctx.state.terrainExaggeration || 1.15);
  };

  // Initial load
  refreshTerrain();

  // UHD Visuals (Tuned for Skybox clarity and maximum sharpness)
  viewer.resolutionScale = 1.0; 
  viewer.scene.msaaSamples = 1; // Disabled per user request
  viewer.scene.postProcessStages.fxaa.enabled = false; // Disabled per user request
  viewer.scene.globe.maximumScreenSpaceError = 1.0;
  viewer.scene.globe.tileCacheSize = 256;

  // Lighting & Sun
  viewer.clock.currentTime = Cesium.JulianDate.now();
  viewer.clock.multiplier = 1;
  viewer.clock.shouldAnimate = true;
  viewer.scene.globe.enableLighting = true;
  
  viewer.scene.sun.show = true;
  viewer.scene.sunBloom = false;
  viewer.scene.sun.glowFactor = 0;

  const moonTextureUrl = viewer.scene.moon?.textureUrl;
  viewer.scene.moon = createScaledMoon(MOON_SCALE, MOON_DISTANCE_SCALE, moonTextureUrl);
  viewer.scene.moon.show = true;
  // Natural Palette: Improved horizon fade to remove "plastic" feel
  configureAtmosphere(viewer, {
    thicknessScale: ATMOSPHERE_THICKNESS_SCALE,
    rayleigh: new Cesium.Cartesian3(4.5e-6, 11.5e-6, 28.0e-6),
    mie: new Cesium.Cartesian3(25e-6, 25e-6, 25e-6),
    anisotropy: 0.85 // Reduced anisotropy for a more natural horizon glow
  });
  
  viewer.scene.skyAtmosphere.brightnessShift = ATMOSPHERE_BRIGHTNESS_SHIFT;
  viewer.scene.skyAtmosphere.saturationShift = ATMOSPHERE_SATURATION_SHIFT;
  viewer.scene.skyAtmosphere.hueShift = ATMOSPHERE_HUE_SHIFT;
  viewer.scene.globe.terrainExaggeration = ctx.state.terrainExaggeration || 1.15;
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0d1626'); // Deep oceanic base


  // --- High-Resolution Cube Map Starfield (skybox_1) ---
  viewer.scene.skyBox = createSkyBox(SKYBOX_SOURCES_NORMAL);
  viewer.scene.skyBox.show = true;

  let skyboxFadeSources = null;
  let skyboxFadeBoxes = null;
  let skyboxFade = 1.0;
  let skyboxFadeTarget = 1.0;
  let skyboxFadeIndex = SKYBOX_FADE_LEVELS;
  let raysVisible = false;
  let lastRaysVisibleAt = 0;
  const applySkyboxState = () => {
    skyboxFadeIndex = updateSkyboxFade(viewer, {
      skyboxFade,
      skyboxFadeBoxes,
      skyboxFadeIndex,
      SKYBOX_FADE_LEVELS
    });
  };

  buildSkyboxFadeSources(SKYBOX_SOURCES_NORMAL, SKYBOX_FADE_LEVELS, SKYBOX_DARKNESS_BRIGHTNESS)
    .then((sources) => {
      skyboxFadeSources = sources;
      skyboxFadeBoxes = sources.map((item) => createSkyBox(item));
      applySkyboxState();
    })
    .catch(() => {
      skyboxFadeSources = [SKYBOX_SOURCES_NORMAL];
      skyboxFadeBoxes = [createSkyBox(SKYBOX_SOURCES_NORMAL)];
      skyboxFade = 1.0;
      skyboxFadeIndex = -1; // Force first apply
      applySkyboxState();
    });

  // --- Alternative: High-Resolution Equirectangular Starfield (starmap_4) ---
  /*
  viewer.scene.skyBox.show = false;
  const starfieldPrimitive = new Cesium.Primitive({
    // ... (rest of the code)
  });
  */

  // Add Sun Camera Lens Effect
  const lensTime0 = performance.now() / 1000;
  try {
    addSunCameraLensEffect(viewer, lensTime0, (visible) => {
      raysVisible = !!visible;
      if (raysVisible) {
        lastRaysVisibleAt = performance.now();
        viewer.scene.moon.show = true;
      }
    });
  } catch (e) {
    console.warn('Could not add sun camera lens stage:', e);
  }

  // Camera constraints
  try {
    const cameraController = viewer.scene.screenSpaceCameraController;
    cameraController.enableCollisionDetection = true;
    cameraController.minimumZoomDistance = 120.0;
    cameraController.maximumZoomDistance = 100_000_000.0;

    // Enable RMB camera actions for smooth native tilting.
    cameraController.tiltEventTypes = [
      Cesium.CameraEventType.RIGHT_DRAG,
      Cesium.CameraEventType.MIDDLE_DRAG,
      { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL }
    ];
    cameraController.lookEventTypes = [];
    cameraController.zoomEventTypes = [
      Cesium.CameraEventType.WHEEL,
      Cesium.CameraEventType.PINCH
    ];

    // Ensure the camera remains upright to prevent "violent spinning" at poles.
    cameraController.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
  } catch (e) {}

  // Apply initial FOV from state
  if (ctx.state && ctx.state.fov) {
    viewer.camera.frustum.fov = (ctx.state.fov * Math.PI) / 180;
  }

  const emitter = createEmitter();
  let destroyed = false;
  let lastCenter = null;
  let lastZoom = null;
  let lastHeading = null;
  let lastPitch = null;
  let moveEndTimer = 0;

  const fireMoveEndSoon = () => {
    window.clearTimeout(moveEndTimer);
    moveEndTimer = window.setTimeout(() => {
      emitter.emit('moveend');
    }, 110);
  };

  const mapAdapter = createMapAdapter(viewer, containerEl, emitter, fireMoveEndSoon);

  // Interaction Sync
  mapAdapter.on('cesium-refresh-terrain', () => {
    refreshTerrain();
  });

  // FPS Monitor and Render Loop
  let lastFpsUpdate = 0;
  let frameCount = 0;
  const postRenderUnsub = viewer.scene.postRender.addEventListener(() => {
    if (destroyed) return;

    // FPS Counter
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate > 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
      if (ctx.elements.fpsMonitor) {
        ctx.elements.fpsMonitor.textContent = `${fps} FPS`;
        // Color coding for visual feedback
        if (fps >= 55) ctx.elements.fpsMonitor.style.color = 'rgba(100, 255, 100, 0.5)';
        else if (fps >= 30) ctx.elements.fpsMonitor.style.color = 'rgba(255, 255, 100, 0.5)';
        else ctx.elements.fpsMonitor.style.color = 'rgba(255, 100, 100, 0.5)';
      }
      frameCount = 0;
      lastFpsUpdate = now;
    }

    emitter.emit('render');

    const keepDark = raysVisible || (now - lastRaysVisibleAt) < SKYBOX_BRIGHT_HOLD_MS;
    skyboxFadeTarget = keepDark ? 0.0 : 1.0;
    const fadeSpeed = skyboxFadeTarget < skyboxFade ? SKYBOX_FADE_OUT_SPEED : SKYBOX_FADE_IN_SPEED;
    const step = Math.max(0.01, fadeSpeed / 60);
    if (skyboxFade < skyboxFadeTarget) {
      skyboxFade = Math.min(skyboxFadeTarget, skyboxFade + step);
      applySkyboxState();
    } else if (skyboxFade > skyboxFadeTarget) {
      skyboxFade = Math.max(skyboxFadeTarget, skyboxFade - step);
      applySkyboxState();
    }

    // Synchronize camera state with UI (Pitch, Zoom, etc.)
    syncCameraToState(viewer, ctx.state, emitter);

    // Fire moveend events for secondary logic
    const c = cameraCenterLngLat(viewer.scene);
    if (c && (!lastCenter || Math.abs(lastCenter.lng - c.lng) > 1e-6 || Math.abs(lastCenter.lat - c.lat) > 1e-6)) {
      lastCenter = c;
      fireMoveEndSoon();
    }
  });

  const clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  clickHandler.setInputAction((movement) => {
    const cartesian = viewer.scene.camera.pickEllipsoid(movement.position, Cesium.Ellipsoid.WGS84);
    if (!cartesian) return;
    const carto = Cesium.Cartographic.fromCartesian(cartesian, Cesium.Ellipsoid.WGS84);
    const lngLat = { lng: deg(carto.longitude), lat: deg(carto.latitude) };
    emitter.emit('click', { lngLat, position: movement.position, point: movement.position });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // Initial view
  try {
    const v = initialView || {};
    mapAdapter.jumpTo({
      center: [v.lng ?? 0, v.lat ?? 0],
      zoom: v.zoom ?? 0,
      bearing: v.bearing ?? 0,
      pitch: v.pitch ?? 0
    });
  } catch (e) {}

  ctx.viewer = viewer;
  ctx.Cesium = Cesium;
  ctx.map = mapAdapter;
  ctx.maplibregl = null;
  ctx.renderer = 'cesium';

  const destroy = () => {
    destroyed = true;
    try {
      window.clearTimeout(moveEndTimer);
    } catch (e) {}
    try {
      clickHandler.destroy();
    } catch (e) {}
    try {
      postRenderUnsub?.();
    } catch (e) {}
    try {
      viewer.destroy();
    } catch (e) {}
    try {
      containerEl.innerHTML = '';
    } catch (e) {}
  };

  return { viewer, map: mapAdapter, destroy };
}
