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

  // --- Pitch (RMB drag with velocity + friction) ---
  let pitchPos = map.getPitch();
  let pitchVel = 0;
  let pitchActive = false;
  let pitchRaf = 0;
  let pitchLastTs = 0;

  const PITCH_FRICTION = 0.88;

  const pitchTick = (ts) => {
    const dt = Math.min(32, ts - (pitchLastTs || ts));
    pitchLastTs = ts;
    const k = dt / 16;

    if (isOrientationLocked()) {
      pitchPos = 0;
      pitchVel = 0;
      map.jumpTo({ pitch: 0, bearing: 0 });
      return;
    }

    pitchVel *= Math.pow(PITCH_FRICTION, k);
    pitchPos += pitchVel * k;
    pitchPos = clamp(pitchPos, 0, 85);

    map.jumpTo({ pitch: pitchPos });

    if (pitchActive || Math.abs(pitchVel) > 0.01) {
      pitchRaf = requestAnimationFrame(pitchTick);
    }
  };

  const startPitchLoop = () => {
    pitchLastTs = 0;
    cancelAnimationFrame(pitchRaf);
    pitchRaf = requestAnimationFrame(pitchTick);
  };

  ctx.cameraController = {
    setPitch: (pitch) => {
      if (isOrientationLocked()) {
        pitchPos = 0;
        pitchVel = 0;
        try { map.jumpTo({ pitch: 0, bearing: 0 }); } catch (e) {}
        return;
      }
      pitchPos = clamp(Number(pitch), 0, 85);
      pitchVel = 0;
      try { map.jumpTo({ pitch: pitchPos }); } catch (e) {}
    }
  };

  // Initialize pitch from UI slider.
  try {
    const p = Number(ctx.elements?.pitchRange?.value);
    if (Number.isFinite(p)) ctx.cameraController.setPitch(p);
  } catch (e) {}

  // RMB pointer handlers for pitch.
  let rmbDown = false;
  let rmbPid = null;
  let rmbLastY = 0;

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 2) return;
    e.preventDefault();
    rmbDown = true;
    rmbPid = e.pointerId;
    rmbLastY = e.clientY;
    pitchActive = true;
    try { canvas.setPointerCapture(rmbPid); } catch (err) {}
    startPitchLoop();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!rmbDown || e.pointerId !== rmbPid) return;
    e.preventDefault();
    const dy = e.clientY - rmbLastY;
    rmbLastY = e.clientY;
    if (!isOrientationLocked()) {
      pitchVel -= dy * 0.04;
    }
  });

  const endRmb = () => {
    rmbDown = false;
    rmbPid = null;
    pitchActive = false;
  };
  canvas.addEventListener("pointerup", endRmb);
  canvas.addEventListener("pointercancel", endRmb);
}
