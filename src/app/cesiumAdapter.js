import * as Cesium from 'cesium';
import { 
  clamp, 
  rad, 
  deg, 
  zoomToHeight, 
  heightToZoom, 
  cameraCenterLngLat 
} from './cesiumUtils.js';

const PITCH_SLIDER_WEIGHT = 0.7;

/**
 * Creates a MapLibre-compatible adapter for the Cesium viewer.
 * This allows the UI to interact with Cesium using familiar MapLibre methods.
 */
export function createMapAdapter(viewer, containerEl, emitter, fireMoveEndSoon) {
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
      return clamp(p + 90, 0, 89.0);
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
    emit(event, ...args) {
      return emitter.emit(event, ...args);
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

      const weightedPitch = pitch != null ? clamp(pitch * PITCH_SLIDER_WEIGHT, 0, 89.0) : null;
      const targetPitchRad = weightedPitch != null ? rad(weightedPitch - 90) : viewer.scene.camera.pitch;
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
          pitch: pitch != null ? rad(clamp(clamp(pitch, 0, 89.0) * PITCH_SLIDER_WEIGHT, 0, 89.0) - 90) : viewer.scene.camera.pitch,
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
