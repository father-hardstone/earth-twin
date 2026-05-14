import * as Cesium from 'cesium';

export function configureAtmosphere(viewer, settings) {
  const { 
    thicknessScale = 1.4, 
    rayleigh = new Cesium.Cartesian3(4.5e-6, 11.5e-6, 28.0e-6),
    mie = new Cesium.Cartesian3(25e-6, 25e-6, 25e-6),
    anisotropy = 0.92
  } = settings;

  const scene = viewer.scene;
  
  // Sky Atmosphere (Space view)
  scene.skyAtmosphere.show = true;
  scene.skyAtmosphere.atmosphereRayleighScaleHeight = 12000.0 * thicknessScale;
  scene.skyAtmosphere.atmosphereMieScaleHeight = 4500.0 * thicknessScale;
  scene.skyAtmosphere.atmosphereRayleighCoefficient = rayleigh;
  scene.skyAtmosphere.atmosphereMieCoefficient = mie;
  scene.skyAtmosphere.atmosphereMieAnisotropy = anisotropy;

  // Ground Atmosphere (Surface view)
  scene.globe.showGroundAtmosphere = true;
  scene.globe.atmosphereRayleighScaleHeight = 15000.0 * thicknessScale;
  scene.globe.atmosphereMieScaleHeight = 5000.0 * thicknessScale;
  scene.globe.atmosphereRayleighCoefficient = rayleigh;
  scene.globe.atmosphereMieCoefficient = mie;
  scene.globe.atmosphereMieAnisotropy = anisotropy;

  // Fog & Haze
  scene.fog.enabled = true;
  scene.fog.density = 2.0e-4;
  scene.fog.screenSpaceErrorFactor = 2.0;
}

export function updateSkyboxFade(viewer, state) {
  const { 
    skyboxFade, 
    skyboxFadeBoxes, 
    skyboxFadeIndex, 
    SKYBOX_FADE_LEVELS 
  } = state;

  if (!skyboxFadeBoxes) return skyboxFadeIndex;

  const index = Math.max(0, Math.min(SKYBOX_FADE_LEVELS, Math.round(skyboxFade * SKYBOX_FADE_LEVELS)));
  if (index === skyboxFadeIndex) return index;

  const targetSkyBox = skyboxFadeBoxes[index];
  if (targetSkyBox) {
    viewer.scene.skyBox = targetSkyBox;
  }
  return index;
}
