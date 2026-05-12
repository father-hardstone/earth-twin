import * as Cesium from 'cesium';
import { 
  clamp, 
  deg, 
  rad, 
  zoomToHeight, 
  heightToZoom, 
  cameraCenterLngLat, 
  createEmitter 
} from './cesiumUtils.js';
import { addSunCameraLensEffect } from './sunPostProcess.js';

/**
 * Creates a MapLibre-compatible adapter for the Cesium viewer.
 */
function createMapAdapter(viewer, containerEl, emitter, fireMoveEndSoon) {
  return {
    __renderer: 'cesium',
    getCenter() {
      return cameraCenterLngLat(viewer.scene) ?? { lng: 0, lat: 0 };
    },
    getZoom() {
      const h = viewer.scene.camera.positionCartographic?.height;
      return heightToZoom(h);
    },
    getBearing() {
      return deg(viewer.scene.camera.heading);
    },
    getPitch() {
      const p = deg(viewer.scene.camera.pitch);
      return clamp(p + 90, 0, 89.99);
    },
    getCanvas() {
      return viewer.scene.canvas;
    },
    getContainer() {
      return containerEl;
    },
    getCanvasContainer() {
      return containerEl;
    },
    triggerRepaint() {
      try {
        viewer.scene.requestRender();
      } catch (e) {}
    },
    on(event, handler) {
      return emitter.on(event, handler);
    },
    off(event, handler) {
      return emitter.off(event, handler);
    },
    once(event, handler) {
      return emitter.once(event, handler);
    },
    jumpTo(opts = {}) {
      const center = opts.center;
      const lng = Array.isArray(center) ? Number(center[0]) : undefined;
      const lat = Array.isArray(center) ? Number(center[1]) : undefined;
      const bearing = Number.isFinite(opts.bearing) ? Number(opts.bearing) : undefined;
      const pitch = Number.isFinite(opts.pitch) ? Number(opts.pitch) : undefined;
      const zoom = Number.isFinite(opts.zoom) ? Number(opts.zoom) : undefined;

      const currentCenter = cameraCenterLngLat(viewer.scene) ?? { lng: 0, lat: 0 };
      const targetLng = Number.isFinite(lng) ? lng : currentCenter.lng;
      const targetLat = Number.isFinite(lat) ? lat : currentCenter.lat;
      const targetHeight = Number.isFinite(zoom) ? zoomToHeight(zoom) : viewer.scene.camera.positionCartographic?.height;

      const targetPitchRad = pitch != null ? rad(clamp(pitch, 0, 89.99) - 90) : viewer.scene.camera.pitch;
      const targetHeadingRad = bearing != null ? rad(bearing) : viewer.scene.camera.heading;

      viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(targetLng, targetLat, targetHeight, Cesium.Ellipsoid.WGS84),
        orientation: {
          heading: targetHeadingRad,
          pitch: targetPitchRad,
          roll: 0
        }
      });
      emitter.emit('move');
      fireMoveEndSoon();
    },
    flyTo(opts = {}) {
      const center = opts.center;
      const lng = Array.isArray(center) ? Number(center[0]) : undefined;
      const lat = Array.isArray(center) ? Number(center[1]) : undefined;
      const bearing = Number.isFinite(opts.bearing) ? Number(opts.bearing) : undefined;
      const pitch = Number.isFinite(opts.pitch) ? Number(opts.pitch) : undefined;
      const zoom = Number.isFinite(opts.zoom) ? Number(opts.zoom) : undefined;

      const currentCenter = cameraCenterLngLat(viewer.scene) ?? { lng: 0, lat: 0 };
      const targetLng = Number.isFinite(lng) ? lng : currentCenter.lng;
      const targetLat = Number.isFinite(lat) ? lat : currentCenter.lat;
      const targetHeight = Number.isFinite(zoom) ? zoomToHeight(zoom) : viewer.scene.camera.positionCartographic?.height;

      viewer.scene.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(targetLng, targetLat, targetHeight, Cesium.Ellipsoid.WGS84),
        orientation: {
          heading: bearing != null ? rad(bearing) : viewer.scene.camera.heading,
          pitch: pitch != null ? rad(clamp(pitch, 0, 89.99) - 90) : viewer.scene.camera.pitch,
          roll: 0
        },
        duration: 1.2
      });
    },
    easeTo(opts = {}) {
      return this.flyTo(opts);
    }
  };
}

export function initCesiumGlobe(ctx, containerEl, initialView) {
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
    globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84),
    orderIndependentTranslucency: false,
    contextOptions: {
      webgl: {
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true
      }
    }
  });

  // Ultra HD Visuals
  viewer.resolutionScale = window.devicePixelRatio || 1.0;
  viewer.scene.msaaSamples = 4; // High-quality anti-aliasing
  viewer.scene.postProcessStages.fxaa.enabled = true;
  viewer.scene.globe.maximumScreenSpaceError = 1.2; // High terrain/imagery detail
  viewer.scene.highDynamicRange = false;

  // Lighting & Sun
  viewer.clock.currentTime = Cesium.JulianDate.now();
  viewer.clock.multiplier = 1;
  viewer.clock.shouldAnimate = true;
  viewer.scene.globe.enableLighting = true;
  
  viewer.scene.sun.show = true;
  viewer.scene.sunBloom = false;
  viewer.scene.sun.glowFactor = 0;

  viewer.scene.moon.show = true;
  viewer.scene.skyAtmosphere.show = true;
  viewer.scene.skyBox.show = true;

  // Add Sun Camera Lens Effect
  const lensTime0 = performance.now() / 1000;
  try {
    addSunCameraLensEffect(viewer, lensTime0);
  } catch (e) {
    console.warn('Could not add sun camera lens stage:', e);
  }

  // Camera constraints
  try {
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 120.0;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 40_000_000.0;
  } catch (e) {}

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

  const postRenderUnsub = viewer.scene.postRender.addEventListener(() => {
    if (destroyed) return;
    emitter.emit('render');

    const c = cameraCenterLngLat(viewer.scene);
    const height = viewer.scene.camera.positionCartographic?.height;
    const zoom = Number.isFinite(height) ? heightToZoom(height) : lastZoom ?? 2;
    const headingDeg = deg(viewer.scene.camera.heading);
    const pitchDeg = deg(viewer.scene.camera.pitch);
    const heading = Number.isFinite(headingDeg) ? headingDeg : lastHeading ?? 0;
    const pitch = Number.isFinite(pitchDeg) ? pitchDeg : lastPitch ?? 0;

    const changed =
      (!lastCenter && c) ||
      (lastCenter && c && (Math.abs(lastCenter.lng - c.lng) > 1e-6 || Math.abs(lastCenter.lat - c.lat) > 1e-6)) ||
      (lastZoom == null || Math.abs(lastZoom - zoom) > 1e-4) ||
      (lastHeading == null || Math.abs(lastHeading - heading) > 1e-4) ||
      (lastPitch == null || Math.abs(lastPitch - pitch) > 1e-4);

    if (changed) {
      lastCenter = c ?? lastCenter;
      lastZoom = zoom;
      lastHeading = heading;
      lastPitch = pitch;
      emitter.emit('move');
      emitter.emit('zoom');
      emitter.emit('rotate');
      emitter.emit('pitch');
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
      zoom: v.zoom ?? 2,
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
