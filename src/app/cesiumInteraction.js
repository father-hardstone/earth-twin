import * as Cesium from 'cesium';

export function configureInteraction(viewer) {
  const controller = viewer.scene.screenSpaceCameraController;

  // 1. Unify and simplify controls to prevent overlap
  // Left Click: Pure Globe Rotation (Pan)
  controller.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG];

  // Middle Click OR Ctrl+Left: Tilt/Pitch
  controller.tiltEventTypes = [
    Cesium.CameraEventType.MIDDLE_DRAG,
    {
      eventType: Cesium.CameraEventType.LEFT_DRAG,
      modifier: Cesium.KeyboardEventModifier.CTRL
    }
  ];

  // Right Click: High-precision Zoom
  controller.zoomEventTypes = [
    Cesium.CameraEventType.RIGHT_DRAG,
    Cesium.CameraEventType.WHEEL,
    Cesium.CameraEventType.PINCH
  ];

  // 2. Heavy momentum for premium feel
  controller.inertiaSpin = 0.98;
  controller.inertiaTilt = 0.97;
  controller.inertiaZoom = 0.85;
  controller.maximumMovementRatio = 0.08;

  // 3. Collision and axis stability
  controller.enableCollisionDetection = true;

  // 4. Context-Aware Rotation
  // Only allow rotation (Left Click Drag) and tilt (Ctrl + Left Click Drag) 
  // if the cursor is actively on the globe or a primitive.
  const handler = viewer.screenSpaceEventHandler;
  if (handler) {
    let isLeftDown = false;

    const checkGlobeInteraction = (position) => {
      if (!position) return;
      const scene = viewer.scene;
      const ray = scene.camera.getPickRay(position);
      const globeHit = scene.globe.pick(ray, scene);
      const pickHit = scene.pick(position);
      const onGlobe = Cesium.defined(globeHit) || Cesium.defined(pickHit);

      controller.enableRotate = onGlobe;
      controller.enableTilt = onGlobe;
      controller.enableTranslate = onGlobe;
    };

    handler.setInputAction((movement) => {
      isLeftDown = true;
      checkGlobeInteraction(movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((movement) => {
      if (isLeftDown && movement && movement.endPosition) {
        checkGlobeInteraction(movement.endPosition);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(() => {
      isLeftDown = false;
      // Restore interaction capability for next potential interaction
      controller.enableRotate = true;
      controller.enableTilt = true;
      controller.enableTranslate = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
  }
}

export function syncCameraToState(viewer, state, emitter) {
  const camera = viewer.scene.camera;
  
  // Calculate current pitch in degrees (0 to 90 format for UI)
  const pitchRad = camera.pitch;
  const pitchDeg = Cesium.Math.toDegrees(pitchRad) + 90;
  
  // Update state
  const lastPitch = state.pitch;
  state.pitch = pitchDeg;
  
  // Only emit if changed significantly to prevent UI thrashing
  if (Math.abs(lastPitch - pitchDeg) > 0.01) {
    emitter.emit('pitch', pitchDeg);
  }

  // Update zoom/height
  const height = camera.positionCartographic?.height;
  if (height) {
    state.height = height;
    emitter.emit('zoom');
  }
}
