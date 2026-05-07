/**
 * Polar Cap Overlay
 * -----------------
 * MapLibre clamps latitudes to WebMercator's MAX_VALID_LATITUDE (~±85.0511),
 * so raster imagery cannot cover the poles to ±90.
 *
 * This custom layer draws a subtle "cap" in screen space near the top/bottom
 * of the globe silhouette and cross-fades it in when the camera latitude
 * approaches the clamp limit. It is intentionally projection-agnostic and
 * does not use geographic coordinates (so it can visually cover beyond the clamp).
 */
export class PolarCapOverlayLayer {
  constructor(options = {}) {
    this.id = options.id ?? 'polar-cap-overlay';
    this.type = 'custom';
    this.renderingMode = '3d';

    this.startLat = typeof options.startLat === 'number' ? options.startLat : 80;
    this.endLat = typeof options.endLat === 'number' ? options.endLat : 85.0;
    this.intensity = typeof options.intensity === 'number' ? options.intensity : 1;

    this._map = null;
    this._gl = null;
    this._program = null;
    this._buffer = null;

    // Function: () => { cx, cy, radiusPx, lat }
    this._getMetrics = typeof options.getMetrics === 'function' ? options.getMetrics : null;
  }

  onAdd(map, gl) {
    this._map = map;
    this._gl = gl;

    const vertexSource = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_uv = (a_pos * 0.5) + 0.5;
      }
    `;

    const fragmentSource = `
      precision mediump float;
      varying vec2 v_uv;

      uniform vec2 u_center_px;
      uniform float u_radius_px;
      uniform vec2 u_viewport_px;
      uniform float u_opacity_n;
      uniform float u_opacity_s;
      uniform float u_intensity;

      float clamp01(float x) { return clamp(x, 0.0, 1.0); }
      float smooth01(float x) { return x * x * (3.0 - 2.0 * x); }

      void main() {
        vec2 fragPx = v_uv * u_viewport_px;
        vec2 d = fragPx - u_center_px;
        float r = length(d);

        // Mask outside the globe silhouette.
        float globeMask = 1.0 - smoothstep(u_radius_px - 1.0, u_radius_px + 1.0, r);
        if (globeMask <= 0.0) {
          discard;
        }

        // Polar caps: screen-space bands near the top/bottom of the globe circle.
        // This is a visual patch to cover the missing tile region beyond WebMercator clamp.
        float ny = (d.y / max(1.0, u_radius_px)); // -1..1 inside globe

        // Cap extent (fraction of radius). Tuned to cover the typical missing polar ring.
        float capStart = 0.72;
        float capEnd = 1.02;

        float northBand = smoothstep(capStart, capEnd, ny);
        float southBand = smoothstep(capStart, capEnd, -ny);

        // Feather inward so it blends with imagery.
        float feather = smoothstep(0.0, 0.12, 1.0 - (r / max(1.0, u_radius_px)));

        // Subtle texture/noise so it doesn't look like a flat blob.
        float n = fract(sin(dot(fragPx, vec2(12.9898, 78.233))) * 43758.5453);
        float grain = (n - 0.5) * 0.06;

        vec3 capColor = vec3(0.92, 0.95, 1.0) + grain;

        float aN = u_opacity_n * northBand * feather;
        float aS = u_opacity_s * southBand * feather;
        float a = clamp01((aN + aS) * globeMask) * u_intensity;

        if (a <= 0.001) discard;
        gl_FragColor = vec4(capColor, a);
      }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentSource);
    gl.compileShader(fs);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    this._program = program;

    const data = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this._buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  _opacityForLat(latAbs) {
    const t = (latAbs - this.startLat) / Math.max(0.0001, (this.endLat - this.startLat));
    const x = Math.max(0, Math.min(1, t));
    // smoothstep
    return x * x * (3 - 2 * x);
  }

  render(gl, _matrix) {
    let _gl = gl;
    if (!_gl && gl && gl.gl) _gl = gl.gl;
    if (!_gl || !this._program || !this._buffer || !this._map) return;
    if (!this._getMetrics) return;

    const canvas = this._map.getCanvas?.();
    const w = canvas?.clientWidth ?? 0;
    const h = canvas?.clientHeight ?? 0;
    if (!w || !h) return;

    const m = this._getMetrics();
    if (!m || !Number.isFinite(m.radiusPx) || m.radiusPx <= 0) return;

    const latAbs = Math.abs(m.lat ?? 0);
    const baseOpacity = this._opacityForLat(latAbs);
    const northOpacity = (m.lat ?? 0) >= 0 ? baseOpacity : 0;
    const southOpacity = (m.lat ?? 0) <= 0 ? baseOpacity : 0;

    if (northOpacity <= 0.0001 && southOpacity <= 0.0001) return;

    _gl.useProgram(this._program);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, this._buffer);

    const aPos = _gl.getAttribLocation(this._program, 'a_pos');
    _gl.enableVertexAttribArray(aPos);
    _gl.vertexAttribPointer(aPos, 2, _gl.FLOAT, false, 8, 0);

    const uCenter = _gl.getUniformLocation(this._program, 'u_center_px');
    const uRadius = _gl.getUniformLocation(this._program, 'u_radius_px');
    const uViewport = _gl.getUniformLocation(this._program, 'u_viewport_px');
    const uON = _gl.getUniformLocation(this._program, 'u_opacity_n');
    const uOS = _gl.getUniformLocation(this._program, 'u_opacity_s');
    const uI = _gl.getUniformLocation(this._program, 'u_intensity');

    _gl.uniform2f(uCenter, m.cx, m.cy);
    _gl.uniform1f(uRadius, m.radiusPx);
    _gl.uniform2f(uViewport, w, h);
    _gl.uniform1f(uON, northOpacity);
    _gl.uniform1f(uOS, southOpacity);
    _gl.uniform1f(uI, this.intensity);

    _gl.disable(_gl.DEPTH_TEST);
    _gl.depthMask(false);
    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);

    _gl.drawArrays(_gl.TRIANGLES, 0, 6);

    _gl.disable(_gl.BLEND);
    _gl.depthMask(true);
    _gl.enable(_gl.DEPTH_TEST);

    _gl.disableVertexAttribArray(aPos);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    _gl.useProgram(null);
  }
}

