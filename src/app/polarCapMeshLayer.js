/**
 * Polar Cap Mesh Layer (Globe)
 * ---------------------------
 * Renders north/south polar "caps" as small triangle-fan meshes on the globe surface,
 * using sphere/ECEF coordinates (unit sphere). This avoids the WebMercator ±85° imagery
 * limitation by covering the missing pole region with a textured material.
 *
 * - Geometry is pinned to lat ±90 so it rotates with the globe.
 * - UVs are polar-stereographic (per hemisphere).
 * - Opacity smoothly cross-fades in when |cameraLat| goes from 80° to 85.051°.
 *
 * Texture URLs can be provided via options (or via Vite env in boot.js).
 */
export class PolarCapMeshLayer {
  constructor(options = {}) {
    this.id = options.id ?? 'polar-cap-mesh';
    this.type = 'custom';
    this.renderingMode = '3d';

    this.startLat = typeof options.startLat === 'number' ? options.startLat : 80;
    this.endLat = typeof options.endLat === 'number' ? options.endLat : 85.05112878;

    this.latEdge = typeof options.latEdge === 'number' ? options.latEdge : 85.05112878;
    this.segments = typeof options.segments === 'number' ? options.segments : 96;

    this.northUrl = options.northUrl ?? null;
    this.southUrl = options.southUrl ?? null;

    this._map = null;
    this._gl = null;

    this._program = null;
    this._bufNorth = null;
    this._bufSouth = null;
    this._countNorth = 0;
    this._countSouth = 0;

    this._texNorth = null;
    this._texSouth = null;
    this._texReadyN = false;
    this._texReadyS = false;
  }

  _clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  _smoothstep01(x) {
    const t = this._clamp01(x);
    return t * t * (3 - 2 * t);
  }

  _opacityForLat(latAbs) {
    const t = (latAbs - this.startLat) / Math.max(0.0001, (this.endLat - this.startLat));
    return this._smoothstep01(t);
  }

  _deg2rad(d) {
    return (d * Math.PI) / 180;
  }

  _sphereFromLonLatDeg(lonDeg, latDeg) {
    // Matches MapLibre's globe math: y is "up"/north.
    const lon = this._deg2rad(lonDeg);
    const lat = this._deg2rad(latDeg);
    const cosLat = Math.cos(lat);
    const x = cosLat * Math.sin(lon);
    const y = Math.sin(lat);
    const z = cosLat * Math.cos(lon);
    return [x, y, z];
  }

  _polarStereoUv(lonDeg, latDeg, hemisphere) {
    // Polar stereographic projection to a unit disk, scaled so latEdge maps to radius 1.
    // hemisphere: +1 for north, -1 for south
    const lon = this._deg2rad(lonDeg);
    const lat = this._deg2rad(latDeg);

    // Use standard spherical polar stereographic:
    // North: r = tan(pi/4 - lat/2)
    // South: r = tan(pi/4 + lat/2) (lat is negative)
    const r = hemisphere > 0 ? Math.tan(Math.PI / 4 - lat / 2) : Math.tan(Math.PI / 4 + lat / 2);

    // Normalize so latEdge becomes r=1
    const latEdgeRad = this._deg2rad(Math.abs(this.latEdge));
    const rEdge = Math.tan(Math.PI / 4 - latEdgeRad / 2); // same magnitude for both hemispheres
    const rn = r / Math.max(1e-6, rEdge);

    // Map to UV with center at (0.5,0.5)
    const u = 0.5 + 0.5 * rn * Math.sin(lon);
    const v = 0.5 - 0.5 * rn * Math.cos(lon);
    return [u, v];
  }

  _buildCapFan(hemisphere) {
    // hemisphere: +1 north, -1 south
    const centerLat = hemisphere > 0 ? 90 : -90;
    const edgeLat = hemisphere > 0 ? this.latEdge : -this.latEdge;

    // Center vertex
    const centerPos = this._sphereFromLonLatDeg(0, centerLat);
    const centerUv = [0.5, 0.5];

    const verts = [];
    const push = (pos, uv) => {
      verts.push(pos[0], pos[1], pos[2], uv[0], uv[1]);
    };

    // Triangle fan: (center, edge_i, edge_{i+1})
    for (let i = 0; i < this.segments; i++) {
      const lon0 = (i / this.segments) * 360;
      const lon1 = ((i + 1) / this.segments) * 360;
      const p0 = this._sphereFromLonLatDeg(lon0, edgeLat);
      const p1 = this._sphereFromLonLatDeg(lon1, edgeLat);
      const uv0 = this._polarStereoUv(lon0, edgeLat, hemisphere);
      const uv1 = this._polarStereoUv(lon1, edgeLat, hemisphere);

      push(centerPos, centerUv);
      push(p0, uv0);
      push(p1, uv1);
    }

    return new Float32Array(verts);
  }

  _compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  }

  _createTex(gl) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return t;
  }

  _loadTex(url, tex, onReady) {
    if (!url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const gl = this._gl;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        onReady();
        this._map?.triggerRepaint?.();
      } catch (e) {
        console.warn('Polar cap texture upload failed:', e);
      }
    };
    img.onerror = (e) => {
      console.warn('Polar cap texture failed to load:', url, e);
    };
    img.src = url;
  }

  onAdd(map, gl) {
    this._map = map;
    this._gl = gl;

    const vs = `
      precision highp float;
      attribute vec3 a_pos;
      attribute vec2 a_uv;
      uniform mat4 u_matrix;
      varying vec2 v_uv;
      void main() {
        v_uv = a_uv;
        gl_Position = u_matrix * vec4(a_pos, 1.0);
      }
    `;

    const fs = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform float u_opacity;
      void main() {
        vec4 c = texture2D(u_tex, v_uv);
        // Premultiply not required; just modulate alpha.
        c.a *= u_opacity;
        if (c.a <= 0.001) discard;
        gl_FragColor = c;
      }
    `;

    const vsh = this._compile(gl, gl.VERTEX_SHADER, vs);
    const fsh = this._compile(gl, gl.FRAGMENT_SHADER, fs);
    const prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    this._program = prog;

    const north = this._buildCapFan(+1);
    const south = this._buildCapFan(-1);

    this._bufNorth = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._bufNorth);
    gl.bufferData(gl.ARRAY_BUFFER, north, gl.STATIC_DRAW);
    this._countNorth = north.length / 5;

    this._bufSouth = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._bufSouth);
    gl.bufferData(gl.ARRAY_BUFFER, south, gl.STATIC_DRAW);
    this._countSouth = south.length / 5;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this._texNorth = this._createTex(gl);
    this._texSouth = this._createTex(gl);

    this._loadTex(this.northUrl, this._texNorth, () => (this._texReadyN = true));
    this._loadTex(this.southUrl, this._texSouth, () => (this._texReadyS = true));
  }

  _selectMatrix(passedMatrix) {
    try {
      const proj = this._map?.getProjection?.();
      if (proj?.type === 'globe') {
        const m = this._map?.transform?._globeViewProjMatrix32f;
        if (m && m.length === 16) return m;
      }
    } catch {}
    return passedMatrix;
  }

  render(gl, matrix) {
    let _gl = gl;
    if (!_gl && gl && gl.gl) _gl = gl.gl;
    if (!_gl || !this._program || !this._map) return;

    const center = this._map.getCenter?.();
    const lat = center?.lat ?? 0;
    const latAbs = Math.abs(lat);
    const opacity = this._opacityForLat(latAbs);
    if (opacity <= 0.0001) return;

    const northOpacity = lat >= 0 ? opacity : 0;
    const southOpacity = lat <= 0 ? opacity : 0;
    if (northOpacity <= 0.0001 && southOpacity <= 0.0001) return;

    const m = this._selectMatrix(matrix);
    if (!m || m.length !== 16) return;

    _gl.useProgram(this._program);

    const aPos = _gl.getAttribLocation(this._program, 'a_pos');
    const aUv = _gl.getAttribLocation(this._program, 'a_uv');
    const uMatrix = _gl.getUniformLocation(this._program, 'u_matrix');
    const uTex = _gl.getUniformLocation(this._program, 'u_tex');
    const uOpacity = _gl.getUniformLocation(this._program, 'u_opacity');

    _gl.uniformMatrix4fv(uMatrix, false, m);
    _gl.uniform1i(uTex, 0);

    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);
    _gl.disable(_gl.CULL_FACE);
    _gl.disable(_gl.DEPTH_TEST);
    _gl.depthMask(false);

    const stride = 5 * 4;

    const drawCap = (buf, count, tex, capOpacity) => {
      if (capOpacity <= 0.0001) return;
      _gl.bindBuffer(_gl.ARRAY_BUFFER, buf);
      _gl.enableVertexAttribArray(aPos);
      _gl.vertexAttribPointer(aPos, 3, _gl.FLOAT, false, stride, 0);
      _gl.enableVertexAttribArray(aUv);
      _gl.vertexAttribPointer(aUv, 2, _gl.FLOAT, false, stride, 3 * 4);

      _gl.activeTexture(_gl.TEXTURE0);
      _gl.bindTexture(_gl.TEXTURE_2D, tex);
      _gl.uniform1f(uOpacity, capOpacity);

      _gl.drawArrays(_gl.TRIANGLES, 0, count);
    };

    drawCap(this._bufNorth, this._countNorth, this._texNorth, northOpacity);
    drawCap(this._bufSouth, this._countSouth, this._texSouth, southOpacity);

    _gl.depthMask(true);
    _gl.enable(_gl.DEPTH_TEST);
    _gl.disable(_gl.BLEND);
    _gl.bindTexture(_gl.TEXTURE_2D, null);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    _gl.useProgram(null);
  }
}

