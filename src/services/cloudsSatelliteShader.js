/**
 * Custom WebGL layer: MODIS GIBS tiles (two dates, max() to shrink swaths) +
 * procedural clouds blended into dark no-data pixels (fragment shader gap fill).
 */

const GIBS_LAYER = 'MODIS_Terra_CorrectedReflectance_TrueColor';
const GIBS_MATRIX = 'GoogleMapsCompatible_Level9';
const DAYS_PRIMARY = 1;
const DAYS_FILL = 7;

function tile2lat(y, z) {
  const n = 2 ** z;
  const pi = Math.PI;
  const y2 = pi * (1 - 2 * (y / n));
  return (180 / pi) * Math.atan(Math.sinh(y2));
}

function buildGibsTileUrl(z, x, y, daysBack) {
  const n = 2 ** z;
  const col = ((x % n) + n) % n;
  const row = ((y % n) + n) % n;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  const time = d.toISOString().slice(0, 10);
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${GIBS_LAYER}&STYLE=default&TILEMATRIXSET=${GIBS_MATRIX}&TILEMATRIX=${z}&TILEROW=${row}&TILECOL=${col}&FORMAT=image/jpeg&TIME=${time}`;
}

function buildTileInterleavedBuffer(maplibregl, z, tx, ty, altitudeMeters) {
  const MercatorCoordinate = maplibregl?.MercatorCoordinate;
  if (!MercatorCoordinate?.fromLngLat) {
    return null;
  }
  const n = 2 ** z;
  const west = (tx / n) * 360 - 180;
  const east = ((tx + 1) / n) * 360 - 180;
  const north = tile2lat(ty, z);
  const south = tile2lat(ty + 1, z);

  const sw = MercatorCoordinate.fromLngLat({ lng: west, lat: south }, altitudeMeters);
  const se = MercatorCoordinate.fromLngLat({ lng: east, lat: south }, altitudeMeters);
  const ne = MercatorCoordinate.fromLngLat({ lng: east, lat: north }, altitudeMeters);
  const nw = MercatorCoordinate.fromLngLat({ lng: west, lat: north }, altitudeMeters);

  return new Float32Array([
    sw.x, sw.y, sw.z, 0, 1,
    se.x, se.y, se.z, 1, 1,
    ne.x, ne.y, ne.z, 1, 0,
    sw.x, sw.y, sw.z, 0, 1,
    ne.x, ne.y, ne.z, 1, 0,
    nw.x, nw.y, nw.z, 0, 0
  ]);
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info}`);
  }
  return program;
}

function loadTexture(gl, image) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

function createBlackTexture(gl) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const pixel = new Uint8Array([0, 0, 0, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

function fetchTileImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Tile load failed: ${url}`));
    img.src = url;
  });
}

const VERT = `
precision highp float;
attribute vec3 a_pos;
attribute vec2 a_uv;
uniform mat4 u_matrix;
varying vec2 v_uv;
varying vec2 v_world;
void main() {
  v_world = a_pos.xy;
  v_uv = a_uv;
  gl_Position = u_matrix * vec4(a_pos, 1.0);
}
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 v_uv;
varying vec2 v_world;
uniform float u_time;
uniform float u_zoom;
uniform float u_opacity;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform float u_has1;
uniform float u_has2;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p = p * 2.02 + vec2(19.1, 7.7);
    amp *= 0.5;
  }
  return value;
}

vec3 proceduralCloud(vec2 world) {
  float baseScale = mix(6.0, 20.0, clamp((u_zoom - 1.0) / 6.0, 0.0, 1.0));
  vec2 p = world * baseScale;
  float t = u_time * 0.032;
  vec2 flow1 = vec2(t * 1.2, t * 0.7);
  vec2 flow2 = vec2(-t * 0.6, t * 1.1);
  vec2 warp = vec2(fbm(p * 0.55 + flow2) - 0.5, fbm(p * 0.55 - flow1) - 0.5);
  p += warp * 1.45;
  float base = fbm(p + flow1);
  float detail = fbm(p * 1.8 + flow2);
  float density = base * 0.72 + detail * 0.42;
  float cover = 0.44;
  float softness = 0.2;
  float alpha = smoothstep(cover - softness, cover + softness, density);
  alpha = pow(alpha, 0.55);
  float wisp = fbm(p * 2.6 + vec2(t * 1.8, -t * 1.3));
  alpha = clamp(alpha + smoothstep(0.55, 0.92, wisp) * 0.18, 0.0, 1.0);
  float shade = clamp((density - cover) * 1.6, 0.0, 1.0);
  return mix(vec3(0.92, 0.94, 0.98), vec3(1.0), shade) * alpha;
}

void main() {
  vec3 c1 = u_has1 > 0.5 ? texture2D(u_tex1, v_uv).rgb : vec3(0.0);
  vec3 c2 = u_has2 > 0.5 ? texture2D(u_tex2, v_uv).rgb : vec3(0.0);
  vec3 sat = max(c1, c2);
  float luma = dot(sat, vec3(0.299, 0.587, 0.114));
  float gap = 1.0 - smoothstep(0.028, 0.13, luma);
  vec3 proc = proceduralCloud(v_world);
  float procStr = gap * 0.92;
  vec3 rgb = mix(sat, proc, procStr);
  float outA = mix(0.42, 0.9, 1.0 - gap * 0.85);
  gl_FragColor = vec4(rgb, outA * u_opacity);
}
`;

function toMat4f32(matrix) {
  if (!matrix) return null;
  if (Array.isArray(matrix)) {
    return matrix.length === 16 ? new Float32Array(matrix) : null;
  }
  if (ArrayBuffer.isView(matrix)) {
    return matrix.length === 16 ? (matrix instanceof Float32Array ? matrix : new Float32Array(matrix)) : null;
  }
  if (typeof matrix.toFloat32Array === 'function') {
    const out = matrix.toFloat32Array();
    return out?.length === 16 ? out : null;
  }
  if (typeof matrix.toArray === 'function') {
    const arr = matrix.toArray();
    return Array.isArray(arr) && arr.length === 16 ? new Float32Array(arr) : null;
  }
  return null;
}

const MAX_CACHE = 96;

function pruneCache(gl, cache, keepKeys) {
  if (cache.size <= MAX_CACHE) {
    return;
  }
  for (const key of [...cache.keys()]) {
    if (cache.size <= MAX_CACHE) {
      break;
    }
    if (keepKeys.has(key)) {
      continue;
    }
    const entry = cache.get(key);
    if (entry?.tex1) gl.deleteTexture(entry.tex1);
    if (entry?.tex2) gl.deleteTexture(entry.tex2);
    cache.delete(key);
  }
}

/**
 * @param {object} internal - shared internal from clouds.js (map, maplibregl, ctx)
 * @param {string} layerId - e.g. sim-clouds
 */
export function createSatelliteCloudCompositeLayer(internal, layerId) {
  const tileCache = new Map();

  return {
    id: layerId,
    type: 'custom',
    renderingMode: '3d',
    onAdd(map, gl) {
      internal.satGl = gl;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try {
        internal.satProgram = createProgram(gl, VERT, FRAG);
      } catch (e) {
        console.error('Satellite cloud shader failed:', e);
        internal.satProgram = null;
        return;
      }
      internal.satAttrs = {
        a_pos: gl.getAttribLocation(internal.satProgram, 'a_pos'),
        a_uv: gl.getAttribLocation(internal.satProgram, 'a_uv'),
        u_matrix: gl.getUniformLocation(internal.satProgram, 'u_matrix'),
        u_time: gl.getUniformLocation(internal.satProgram, 'u_time'),
        u_zoom: gl.getUniformLocation(internal.satProgram, 'u_zoom'),
        u_opacity: gl.getUniformLocation(internal.satProgram, 'u_opacity'),
        u_tex1: gl.getUniformLocation(internal.satProgram, 'u_tex1'),
        u_tex2: gl.getUniformLocation(internal.satProgram, 'u_tex2'),
        u_has1: gl.getUniformLocation(internal.satProgram, 'u_has1'),
        u_has2: gl.getUniformLocation(internal.satProgram, 'u_has2')
      };
      internal.satBuffer = gl.createBuffer();
      internal.tileCache = tileCache;
      internal.satDummyTex = createBlackTexture(gl);
    },
    render(gl, matrix) {
      if (!internal.satProgram || !internal.satBuffer) {
        return;
      }

      const map = internal.map;
      const zoom = map.getZoom();
      const computeOpacity = internal.computeOpacity;
      if (typeof computeOpacity !== 'function') {
        return;
      }
      const opacity = computeOpacity(zoom) * Number(internal.ctx?.state?.cloudsOpacity ?? 1);
      if (opacity <= 0.001) {
        return;
      }

      const m = toMat4f32(matrix);
      if (!m) {
        return;
      }

      const tileIDs = map.coveringTiles({
        tileSize: 512,
        minzoom: 0,
        maxzoom: 9,
        roundZoom: true
      });

      const keepKeys = new Set();
      const time = (performance.now() - internal.startTime) / 1000;
      const maplibregl = internal.maplibregl;

      for (const tid of tileIDs) {
        const z = tid.canonical.z;
        const x = tid.canonical.x;
        const y = tid.canonical.y;
        const key = `${z}/${x}/${y}`;
        keepKeys.add(key);

        let entry = tileCache.get(key);
        if (!entry) {
          entry = {
            tex1: null,
            tex2: null,
            fetchStarted: false
          };
          tileCache.set(key, entry);
        }

        if (!entry.fetchStarted) {
          entry.fetchStarted = true;
          const u1 = buildGibsTileUrl(z, x, y, DAYS_PRIMARY);
          const u2 = buildGibsTileUrl(z, x, y, DAYS_FILL);
          Promise.all([
            fetchTileImage(u1).catch(() => null),
            fetchTileImage(u2).catch(() => null)
          ]).then(([img1, img2]) => {
            if (img1) {
              entry.tex1 = loadTexture(gl, img1);
            }
            if (img2) {
              entry.tex2 = loadTexture(gl, img2);
            }
            map.triggerRepaint();
          });
        }
      }

      pruneCache(gl, tileCache, keepKeys);

      gl.useProgram(internal.satProgram);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.uniformMatrix4fv(internal.satAttrs.u_matrix, false, m);
      gl.uniform1f(internal.satAttrs.u_time, time);
      gl.uniform1f(internal.satAttrs.u_zoom, zoom);
      gl.uniform1f(internal.satAttrs.u_opacity, opacity);

      gl.bindBuffer(gl.ARRAY_BUFFER, internal.satBuffer);

      for (const tid of tileIDs) {
        const z = tid.canonical.z;
        const x = tid.canonical.x;
        const y = tid.canonical.y;
        const key = `${z}/${x}/${y}`;
        const entry = tileCache.get(key);
        const has1 = entry?.tex1 ? 1 : 0;
        const has2 = entry?.tex2 ? 1 : 0;
        if (!has1 && !has2) {
          continue;
        }

        const buf = buildTileInterleavedBuffer(maplibregl, z, x, y, 11000);
        if (!buf) {
          continue;
        }
        gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STREAM_DRAW);

        const stride = 5 * 4;
        gl.enableVertexAttribArray(internal.satAttrs.a_pos);
        gl.vertexAttribPointer(internal.satAttrs.a_pos, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(internal.satAttrs.a_uv);
        gl.vertexAttribPointer(internal.satAttrs.a_uv, 2, gl.FLOAT, false, stride, 3 * 4);

        gl.uniform1f(internal.satAttrs.u_has1, has1);
        gl.uniform1f(internal.satAttrs.u_has2, has2);

        const dummy = internal.satDummyTex;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, entry.tex1 || dummy);
        gl.uniform1i(internal.satAttrs.u_tex1, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, entry.tex2 || dummy);
        gl.uniform1i(internal.satAttrs.u_tex2, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  };
}

export function disposeSatelliteTileCache(internal) {
  const cache = internal?.tileCache;
  const gl = internal?.satGl;
  if (!cache || !gl) {
    return;
  }
  for (const entry of cache.values()) {
    if (entry.tex1) gl.deleteTexture(entry.tex1);
    if (entry.tex2) gl.deleteTexture(entry.tex2);
  }
  cache.clear();
  if (internal.satDummyTex) {
    gl.deleteTexture(internal.satDummyTex);
    internal.satDummyTex = null;
  }
}
