import * as Cesium from 'cesium';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function deg(rad) {
  return (rad * 180) / Math.PI;
}

export function rad(degValue) {
  return (degValue * Math.PI) / 180;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function zoomToHeight(zoom) {
  const z = clamp(Number(zoom ?? 2), 0.2, 20);
  return clamp(20_000_000 / 2 ** z, 120, 40_000_000);
}

export function heightToZoom(height) {
  const h = clamp(Number(height ?? 20_000_000), 120, 40_000_000);
  return clamp(Math.log2(20_000_000 / h), 0.2, 20);
}

export function cameraCenterLngLat(scene) {
  try {
    const cam = scene.camera;
    const pos = cam?.position;
    if (
      !pos ||
      !Number.isFinite(pos.x) ||
      !Number.isFinite(pos.y) ||
      !Number.isFinite(pos.z)
    ) {
      return null;
    }

    const canvas = scene.canvas;
    const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const cartesian = cam.pickEllipsoid(center, Cesium.Ellipsoid.WGS84);
    if (!cartesian) return null;
    const carto = Cesium.Cartographic.fromCartesian(cartesian, Cesium.Ellipsoid.WGS84);
    const lng = deg(carto.longitude);
    const lat = deg(carto.latitude);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return { lng, lat };
  } catch (e) {
    return null;
  }
}

export function createEmitter() {
  const listeners = new Map();
  const on = (event, handler) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => off(event, handler);
  };
  const off = (event, handler) => {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(handler);
  };
  const once = (event, handler) => {
    const unsub = on(event, (...args) => {
      unsub();
      handler(...args);
    });
    return unsub;
  };
  const emit = (event, ...args) => {
    const set = listeners.get(event);
    if (!set) return;
    for (const fn of Array.from(set)) {
      try {
        fn(...args);
      } catch (e) {}
    }
  };
  return { on, off, once, emit };
}
