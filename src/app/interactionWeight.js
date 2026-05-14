import * as Cesium from 'cesium';

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function applyInteractionWeight(ctx) {
  const { map } = ctx;
  if (!map) return;

  const canvas = map.getCanvas?.();
  const container = map.getCanvasContainer?.() ?? map.getContainer?.();
  if (!canvas || !container) return;

  // Disable handlers we replace; keep MapLibre scrollZoom for consistent zoom.
  try {
    map.dragRotate?.disable?.();
    map.doubleClickZoom?.disable?.();
    map.touchZoomRotate?.disableRotation?.();
    map.dragPan?.enable?.();
  } catch (e) {}

  const isOrientationLocked = () =>
    ctx.state?.projection === 'flat' || ctx.state?.currentView === 'dark';

  // --- Cesium: let the native controller handle LMB globe spinning ---
  // Cesium's built-in rotate handler properly orbits the camera in 3D without
  // clipping at the poles, so we enable it and only disable look/tilt/translate.
  if (ctx.renderer === 'cesium' && ctx.viewer?.scene?.camera) {
    try {
      const ssc = ctx.viewer.scene.screenSpaceCameraController;
      // Let Cesium handle left-drag globe rotation natively — it orbits the
      // camera properly in 3D without the pole-clipping our old jumpTo handler had.
      ssc.enableRotate = true;
      ssc.enableLook = false;
      // Allow native tilt (RMB) but tune it for the "heavy" feel.
      ssc.enableTilt = true;
      ssc.enableTranslate = false;
      
      // Ensure the camera remains upright to prevent "violent spinning" at poles.
      ssc.constrainedAxis = Cesium.Cartesian3.UNIT_Z;

      // Premium "Heavy" Feel: High inertia for an animated, weighted experience.
      ssc.maximumMovementRatio = 0.08;
      ssc.inertiaSpin = 0.98;
      ssc.inertiaTilt = 0.97;
      ssc.inertiaZoom = 0.85;
    } catch (e) {}
  }

  // --- Zoom (MapLibre scrollZoom tuned for consistency) ---
  // Custom wheel handlers are inconsistent across devices because deltaY varies
  // (trackpad vs mouse wheel vs pinch/ctrl zoom). Let MapLibre normalize input.
  try {
    map.scrollZoom?.enable?.({ around: 'center' });
    // Slower/heavier feel than default, but consistent.
    // Defaults: wheel ~ 1/450, trackpad ~ 1/100
    map.scrollZoom?.setWheelZoomRate?.(1 / 700);
    map.scrollZoom?.setZoomRate?.(1 / 160);
  } catch (e) {}

  // --- Pitch (Natively handled by Cesium via RIGHT_DRAG) ---
  ctx.cameraController = {
    setPitch: (pitch) => {
      if (isOrientationLocked()) return;
      const targetPitchRad = Cesium.Math.toRadians(clamp(Number(pitch), 0, 89.99) - 90);
      ctx.viewer.camera.setView({
        orientation: {
          heading: ctx.viewer.camera.heading,
          pitch: targetPitchRad,
          roll: 0
        }
      });
    }
  };

  // Initialize pitch from UI slider.
  try {
    const p = Number(ctx.elements?.pitchRange?.value);
    if (Number.isFinite(p)) ctx.cameraController.setPitch(p);
  } catch (e) {}

  // RMB pointer handlers for pitch.
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}
