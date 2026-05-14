import * as Cesium from 'cesium';
import { smoothstep } from './cesiumUtils.js';

export function addSunCameraLensEffect(viewer, lensTime0, onRaysVisibilityChange) {
  const sunScreenScratch = new Cesium.Cartesian2();
  const sunToCamScratch = new Cesium.Cartesian3();
  const uSunParamsScratch = new Cesium.Cartesian4(-1, -1, 0, 0);
  const emitRaysVisibility = (visible) => {
    if (typeof onRaysVisibilityChange === 'function') {
      try {
        onRaysVisibilityChange(visible);
      } catch (e) {}
    }
  };

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
          emitRaysVisibility(false);
          uSunParamsScratch.x = -1;
          uSunParamsScratch.y = 0;
          uSunParamsScratch.z = 0;
          uSunParamsScratch.w = 0;
          return uSunParamsScratch;
        }
        
        Cesium.Cartesian3.normalize(sunToCamScratch, sunToCamScratch);
        const facing = Cesium.Cartesian3.dot(cam.directionWC, sunToCamScratch);
        const occluder = new Cesium.EllipsoidalOccluder(scene.globe.ellipsoid, cam.positionWC);
        
        if (facing <= 0.008 || !occluder.isPointVisible(sunWC)) {
          emitRaysVisibility(false);
          uSunParamsScratch.x = -1;
          uSunParamsScratch.y = 0;
          uSunParamsScratch.z = 0;
          uSunParamsScratch.w = 0;
          return uSunParamsScratch;
        }
        
        const p = Cesium.SceneTransforms.worldToDrawingBufferCoordinates(scene, sunWC, sunScreenScratch);
        const w = scene.drawingBufferWidth;
        const h = scene.drawingBufferHeight;
        
        if (!Cesium.defined(p) || w <= 0 || h <= 0) {
          emitRaysVisibility(false);
          uSunParamsScratch.x = -1;
          uSunParamsScratch.y = 0;
          uSunParamsScratch.z = 0;
          uSunParamsScratch.w = 0;
          return uSunParamsScratch;
        }
        
        const nx = p.x / w;
        const ny = 1.0 - p.y / h;
        
        // Flare visibility (tighter for the optical effect)
        const vx = smoothstep(-0.07, 0.03, nx) * smoothstep(1.07, 0.97, nx);
        const vy = smoothstep(-0.07, 0.03, ny) * smoothstep(1.07, 0.97, ny);
        const flareVis = vx * vy;

        // Darkening visibility (wider to keep sky dark as long as sun is "around")
        const dx = smoothstep(-0.4, -0.1, nx) * smoothstep(1.4, 1.1, nx);
        const dy = smoothstep(-0.4, -0.1, ny) * smoothstep(1.4, 1.1, ny);
        const darkenVis = dx * dy;
        const raySignal = flareVis * Math.min(1.0, facing * 1.15) * darkenVis;
        emitRaysVisibility(raySignal > 0.0001);
        
        uSunParamsScratch.x = nx;
        uSunParamsScratch.y = ny;
        uSunParamsScratch.z = Math.min(1.0, facing * 1.15);
        uSunParamsScratch.w = flareVis;
        // Store the wider darken factor in a separate place if needed, 
        // but for now let's just use a high value in the shader or pass it in .z
        uSunParamsScratch.z *= darkenVis; 
        
        return uSunParamsScratch;
      },
      u_aspect: function () {
        const scene = viewer.scene;
        const hh = scene.drawingBufferHeight || 1;
        return scene.drawingBufferWidth / hh;
      },
      u_time: function () {
        return performance.now() / 1000 - lensTime0;
      },
      u_heading: function () {
        return viewer.scene.camera.heading || 0.0;
      }
    },
    fragmentShader: `
      uniform sampler2D colorTexture;
      uniform vec4 u_sunParams;
      uniform float u_aspect;
      uniform float u_time;
      uniform float u_heading;
      in vec2 v_textureCoordinates;

      void main() {
        vec2 uv = v_textureCoordinates;
        vec4 base = texture(colorTexture, uv);
        vec3 rgb = base.rgb;

        float vf = u_sunParams.w * u_sunParams.z;
        
        if (u_sunParams.x < -0.01 || vf < 1e-4) {
          out_FragColor = vec4(rgb, base.a);
          return;
        }

        vec2 sunUv = u_sunParams.xy;
        vec2 duv = (uv - sunUv) * vec2(u_aspect, 1.0);
        float dist = length(duv);
        vec2 radDir = dist > 1e-5 ? duv / dist : vec2(1.0, 0.0);

        float headingSpin = u_heading * 0.9;
        float microSpin = (sunUv.x * 12.0 + sunUv.y * 8.0) * 0.08;
        float theta = atan(duv.y, duv.x) + headingSpin + microSpin;

        float distEff = dist * 22.0;

        // Sharper, more complex rays
        float rMain = pow(abs(cos(6.0 * theta)), 80.0);
        float rFine = pow(abs(cos(24.0 * theta)), 120.0) * 0.35;
        float rAlt = pow(abs(cos(3.0 * theta + 0.7)), 40.0) * 0.25;
        float rays = rMain + rFine + rAlt;
        float rayFall = exp(-distEff);

        vec3 add = vec3(0.0);
        
        // Spectral diffraction in rays
        vec3 rayColor = mix(vec3(1.0, 0.95, 0.8), vec3(0.8, 0.9, 1.0), sin(theta * 3.0) * 0.5 + 0.5);
        add += rayColor * rays * rayFall * vf * 0.9;

        float core = exp(-dist / 0.012);
        float innerGlow = exp(-dist / 0.035);
        float halo = exp(-dist / 0.09);
        
        add += vec3(1.0, 1.0, 1.0) * core * vf * 3.0;
        add += vec3(1.0, 1.0, 0.98) * innerGlow * vf * 1.2;
        add += vec3(1.0, 0.92, 0.8) * halo * vf * 0.3;

        vec2 flareVec = (vec2(0.5) - sunUv);
        
        // Ghosting & Lens Flare Elements
        for (int i = 1; i <= 6; i++) {
          float fi = float(i);
          float offset = fi * 0.35 - 0.2;
          vec2 p = sunUv + flareVec * offset;
          float d = length((uv - p) * vec2(u_aspect, 1.0));
          
          float size = 0.01 + fi * 0.015;
          float ghost = smoothstep(size, size * 0.85, d);
          
          // Spectral/Diffraction colors for ghosts
          vec3 gCol = vec3(0.1, 0.15, 0.2);
          if (i == 2) gCol = vec3(0.2, 0.1, 0.05);
          if (i == 4) gCol = vec3(0.1, 0.2, 0.15);
          if (i == 5) gCol = vec3(0.15, 0.1, 0.2);
          
          add += gCol * ghost * vf * (0.3 / fi);
        }

        // Additional Rainbow diffraction ring
        float dRing = length((uv - (sunUv + flareVec * 0.85)) * vec2(u_aspect, 1.0));
        float ring = smoothstep(0.15, 0.148, dRing) * smoothstep(0.14, 0.142, dRing);
        vec3 ringCol = vec3(0.1, 0.2, 0.1) * (sin(dRing * 100.0) * 0.5 + 0.5);
        add += ringCol * ring * vf * 0.4;

        vec2 ctr = vec2(0.5);
        float towardCenter = (1.0 - clamp(length(sunUv - ctr) * 2.0, 0.0, 1.0));
        towardCenter = pow(towardCenter, 3.0);
        float veil = towardCenter * vf * 0.08;
        vec3 scattered = vec3(1.0, 0.85, 0.7) * veil;

        float caMag = vf * smoothstep(0.01, 0.6, dist) * 0.006 / max(u_aspect, 0.5);
        vec2 caO = radDir * caMag * vec2(1.0 / max(u_aspect, 0.001), 1.0);
        float cr = texture(colorTexture, uv + caO).r;
        float cg = texture(colorTexture, uv).g;
        float cb = texture(colorTexture, uv - caO).b;
        vec3 caRgb = vec3(cr, cg, cb);
        rgb = mix(rgb, caRgb, vf * smoothstep(0.0, 0.4, dist) * 0.75);

        rgb += add + scattered;
        rgb = clamp(rgb, 0.0, 1.0);

        out_FragColor = vec4(rgb, base.a);
      }
    `
  });

  viewer.scene.postProcessStages.add(sunCameraLensStage);
  return sunCameraLensStage;
}
