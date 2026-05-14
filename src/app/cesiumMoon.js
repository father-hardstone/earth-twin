import * as Cesium from 'cesium';

/**
 * Creates a moon with custom scaling and distance adjustment.
 * @param {number} scale - Radius scale factor
 * @param {number} distanceScale - Orbit distance scale factor
 * @param {string} textureUrl - Moon surface texture
 */
export function createScaledMoon(scale, distanceScale, textureUrl) {
  const moonRadii = Cesium.Ellipsoid.MOON.radii;
  const scaledEllipsoid = new Cesium.Ellipsoid(
    moonRadii.x * scale,
    moonRadii.y * scale,
    moonRadii.z * scale
  );
  
  const moon = new Cesium.Moon({
    show: true,
    onlySunLighting: true,
    textureUrl,
    ellipsoid: scaledEllipsoid
  });

  if (moon._ellipsoidPrimitive) {
    moon._ellipsoidPrimitive.depthTestEnabled = true;
  }

  // Inject distance scaling into the update loop if not 1.0
  if (Math.abs(distanceScale - 1.0) > 1e-6) {
    const baseUpdate = moon.update.bind(moon);
    moon.update = function updateMoonWithDistance(frameState) {
      const command = baseUpdate(frameState);
      const primitive = moon._ellipsoidPrimitive;
      if (primitive && primitive.modelMatrix) {
        const t = Cesium.Matrix4.getTranslation(primitive.modelMatrix, new Cesium.Cartesian3());
        Cesium.Cartesian3.multiplyByScalar(t, distanceScale, t);
        Cesium.Matrix4.setTranslation(primitive.modelMatrix, t, primitive.modelMatrix);
      }
      return command;
    };
  }

  return moon;
}
