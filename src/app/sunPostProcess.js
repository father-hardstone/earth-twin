import * as Cesium from 'cesium';
import { smoothstep } from './cesiumUtils.js';

export function addSunCameraLensEffect(viewer, lensTime0) {
  const sunScreenScratch = new Cesium.Cartesian2();
  const sunToCamScratch = new Cesium.Cartesian3();
  const uSunParamsScratch = new Cesium.Cartesian4(-1, -1, 0, 0);

  const sunCameraLensStage = new Cesium.PostProcessStage({
    name: 'sun-camera-lens',
    uniforms: {
      u_sunParams: function () {
        const scene = viewer.scene;
        const sunWC = scene.context.uniformState.sunPositionWC;
        const cam = scene.camera;
        
        Cesium.Cartesian3.subtract(sunWC, cam.positionWC, sunToCamScratch);
        const len = Cesium.Cartesian3.magnitude(sunToCamScratch);
        
        if (len < 1e-2) {
          uSunParamsScratch.x = -1;
          uSunParamsScratch.y = 0;
          uSunParamsScratch.z = 0;
          uSunParamsScratch.w = 0;
          return uSunParamsScratch;
        }
        
        Cesium.Cartesian3.normalize(sunToCamScratch, sunToCamScratch);
        const facing = Cesium.Cartesian3.dot(cam.directionWC, sunToCamScratch);
        
        // We no longer binary-occlude here to allow partial eclipsing in the shader
        const p = Cesium.SceneTransforms.worldToDrawingBufferCoordinates(scene, sunWC, sunScreenScratch);
        const w = scene.drawingBufferWidth;
        const h = scene.drawingBufferHeight;
        
        if (!Cesium.defined(p) || w <= 0 || h <= 0) {
          uSunParamsScratch.x = -1;
          uSunParamsScratch.y = 0;
          uSunParamsScratch.z = 0;
          uSunParamsScratch.w = 0;
          return uSunParamsScratch;
        }
        
        const nx = p.x / w;
        const ny = 1.0 - p.y / h;
        
        const vx = smoothstep(-0.07, 0.03, nx) * smoothstep(1.07, 0.97, nx);
        const vy = smoothstep(-0.07, 0.03, ny) * smoothstep(1.07, 0.97, ny);
        let visibility = vx * vy;
        
        // Sun-Earth Occlusion check for global visibility (flares/rays)
        const earthPos = Cesium.Cartesian3.ZERO;
        const e = Cesium.SceneTransforms.worldToDrawingBufferCoordinates(scene, earthPos, new Cesium.Cartesian2());
        if (Cesium.defined(e)) {
          const aspect = w / h;
          const distToE = Cesium.Cartesian3.distance(cam.positionWC, earthPos);
          const rE = Cesium.Ellipsoid.WGS84.maximumRadius;
          const fov = cam.frustum.fovy || Cesium.Math.RADIANS_PER_DEGREE * 60;
          const screenRE = (rE / distToE) / Math.tan(fov / 2) * 0.5;
          const ex = e.x / w;
          const ey = 1.0 - e.y / h;
          const sunToEarthDist = Math.hypot((nx - ex) * aspect, ny - ey);
          // Fade visibility as sun center goes behind Earth limb
          visibility *= smoothstep(screenRE - 0.005, screenRE + 0.005, sunToEarthDist);
        }

        uSunParamsScratch.x = nx;
        uSunParamsScratch.y = ny;
        uSunParamsScratch.z = Math.min(1.0, facing * 1.08);
        uSunParamsScratch.w = visibility;
        
        return uSunParamsScratch;
      },
      u_earthParams: function () {
        const scene = viewer.scene;
        const cam = scene.camera;
        const earthPos = Cesium.Cartesian3.ZERO;
        const dist = Cesium.Cartesian3.distance(cam.positionWC, earthPos);
        const r = Cesium.Ellipsoid.WGS84.maximumRadius;
        
        // Geometric limb of a sphere:
        // The limb is a circle of radius rL = r * cos(theta) where sin(theta) = r/dist
        // The center of this circle is shifted from the sphere center towards the camera.
        const sinTheta = Math.min(0.999, r / dist);
        const cosTheta = Math.sqrt(1.0 - sinTheta * sinTheta);
        const limbRadius = r * cosTheta;
        const distToLimbCenter = dist - (r * sinTheta); // Distance from camera to the plane of the limb

        // Project the limb center (which lies on the vector from camera to Earth center)
        const toEarth = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(earthPos, cam.positionWC, new Cesium.Cartesian3()), new Cesium.Cartesian3());
        const limbCenterWC = Cesium.Cartesian3.add(cam.positionWC, Cesium.Cartesian3.multiplyByScalar(toEarth, distToLimbCenter, new Cesium.Cartesian3()), new Cesium.Cartesian3());
        
        const pLimb = Cesium.SceneTransforms.worldToDrawingBufferCoordinates(scene, limbCenterWC, new Cesium.Cartesian2());
        if (!Cesium.defined(pLimb)) return new Cesium.Cartesian3(0, 0, 0);

        const fov = cam.frustum.fovy || Cesium.Math.RADIANS_PER_DEGREE * 60;
        // Projected radius in UV units
        const screenR_uv = (limbRadius / distToLimbCenter) / Math.tan(fov / 2) * 0.5;

        return new Cesium.Cartesian3(
          pLimb.x / scene.drawingBufferWidth,
          1.0 - pLimb.y / scene.drawingBufferHeight,
          screenR_uv * 1.015 // Include atmosphere
        );
      },
      u_aspect: function () {
        const scene = viewer.scene;
        const hh = scene.drawingBufferHeight || 1;
        return scene.drawingBufferWidth / hh;
      },
      u_time: function () {
        return performance.now() / 1000 - lensTime0;
      }
    },
    fragmentShader: `
      uniform sampler2D colorTexture;
      uniform vec4 u_sunParams;
      uniform vec3 u_earthParams;
      uniform float u_aspect;
      uniform float u_time;
      in vec2 v_textureCoordinates;

      void main() {
        vec2 uv = v_textureCoordinates;
        vec4 base = texture(colorTexture, uv);
        vec3 rgb = base.rgb;

        // Screen-space eclipsing against Earth's limb
        vec2 duvEarth = (uv - u_earthParams.xy) * vec2(u_aspect, 1.0);
        float distToEarth = length(duvEarth);
        float isSpace = smoothstep(u_earthParams.z - 0.001, u_earthParams.z + 0.001, distToEarth);

        float vf = u_sunParams.w * u_sunParams.z;
        if (u_sunParams.x < -0.01 || vf < 1e-4) {
          out_FragColor = vec4(rgb, base.a);
          return;
        }

        vec2 sunUv = u_sunParams.xy;
        vec2 duv = (uv - sunUv) * vec2(u_aspect, 1.0);
        float dist = length(duv);
        vec2 radDir = dist > 1e-5 ? duv / dist : vec2(1.0, 0.0);

        float spin = sunUv.x * 12.0 + sunUv.y * 8.0;
        float theta = atan(duv.y, duv.x) + spin;

        float distEff = dist * 16.0; // Slightly larger rays

        float rMain = pow(abs(cos(5.0 * theta)), 60.0);
        float rFine = pow(abs(cos(15.0 * theta)), 90.0) * 0.45;
        float rAlt = pow(abs(cos(3.0 * theta + 0.7)), 30.0) * 0.35;
        float rays = rMain + rFine + rAlt;
        float rayFall = exp(-distEff);

        vec3 add = vec3(0.0);
        add += vec3(1.0, 0.96, 0.85) * rays * rayFall * vf * 1.1;

        float core = exp(-dist / 0.016);
        float innerGlow = exp(-dist / 0.042);
        float halo = exp(-dist / 0.11);
        
        add += vec3(1.0, 1.0, 1.0) * core * vf * 3.0;
        add += vec3(1.0, 1.0, 0.95) * innerGlow * vf * 1.2;
        add += vec3(1.0, 0.9, 0.75) * halo * vf * 0.3;

        // Lens Flare Ghosts
        vec2 flareVec = (vec2(0.5) - sunUv);
        
        // Diverse Ghosts
        for (float i = 0.4; i < 3.0; i += 0.45) {
            vec2 p = sunUv + flareVec * i;
            float dg = length((uv - p) * vec2(u_aspect, 1.0));
            float sz = 0.01 + i * 0.02;
            float ghost = smoothstep(sz, sz * 0.8, dg);
            vec3 gcol = vec3(0.1 + i*0.1, 0.2, 0.5 - i*0.1) * 0.15;
            add += gcol * ghost * vf;
        }

        // Additional large soft ghosts
        vec2 pLarge = sunUv + flareVec * 1.3;
        float dLarge = length((uv - pLarge) * vec2(u_aspect, 1.0));
        add += vec3(0.1, 0.15, 0.2) * exp(-dLarge * 8.0) * vf * 0.12;

        vec2 pRing = sunUv + flareVec * 1.8;
        float dRing = length((uv - pRing) * vec2(u_aspect, 1.0));
        float ring = smoothstep(0.12, 0.115, dRing) * smoothstep(0.11, 0.115, dRing);
        add += vec3(0.25, 0.15, 0.3) * ring * vf * 0.25;

        vec2 ctr = vec2(0.5);
        float towardCenter = (1.0 - clamp(length(sunUv - ctr) * 1.8, 0.0, 1.0));
        towardCenter = pow(towardCenter, 2.5);
        float veil = towardCenter * vf * 0.08;
        vec3 scattered = vec3(1.0, 0.85, 0.7) * veil;

        float caMag = vf * smoothstep(0.01, 0.5, dist) * 0.006 / max(u_aspect, 0.5);
        vec2 caO = radDir * caMag * vec2(1.0 / max(u_aspect, 0.001), 1.0);
        float cr = texture(colorTexture, uv + caO).r;
        float cg = texture(colorTexture, uv).g;
        float cb = texture(colorTexture, uv - caO).b;
        vec3 caRgb = vec3(cr, cg, cb);
        rgb = mix(rgb, caRgb, vf * smoothstep(0.0, 0.35, dist) * 0.75);

        // Apply Sun Glow and Rays only to space pixels (eclipsing)
        rgb += (add + scattered) * isSpace;
        rgb = clamp(rgb, 0.0, 1.0);

        out_FragColor = vec4(rgb, base.a);
      }
    `
  });

  viewer.scene.postProcessStages.add(sunCameraLensStage);
  return sunCameraLensStage;
}
