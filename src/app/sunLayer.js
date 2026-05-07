import { getSubsolarPoint } from '../services/night.js';

/**
 * Procedural Sun layer rendered as a glowing sprite in "celestial infinity".
 * Uses 3D Ray-Casting to ensure the sun is suspended in space, not stuck on a 2D plane.
 */
export class SunLayer {
  constructor(options = {}) {
    this.id = options.id ?? 'sun-layer';
    this.type = 'custom';
    this.renderingMode = '3d';

    this.intensity = options.intensity ?? 1.1;
    this.size = options.size ?? 0.008;

    this._map = null;
    this._gl = null;
    this._program = null;
    this._buffer = null;
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
      
      uniform vec3 u_sun_dir;
      uniform float u_yaw;
      uniform float u_pitch;
      uniform float u_aspect;
      uniform float u_intensity;
      uniform float u_size;
      uniform float u_visible;

      vec3 dirFromUv(vec2 uv) {
        vec2 p = uv * 2.0 - 1.0;
        p.y = -p.y;
        p.x *= u_aspect;
        return normalize(vec3(p.x, p.y, 2.0));
      }

      mat3 rotY(float a) {
        float c = cos(a), s = sin(a);
        return mat3(
          c, 0.0, -s,
          0.0, 1.0, 0.0,
          s, 0.0, c
        );
      }

      mat3 rotX(float a) {
        float c = cos(a), s = sin(a);
        return mat3(
          1.0, 0.0, 0.0,
          0.0, c, s,
          0.0, -s, c
        );
      }

      void main() {
        vec3 viewDir = dirFromUv(v_uv);
        vec3 celestialDir = rotY(u_yaw) * (rotX(u_pitch) * viewDir);
        
        float d = dot(celestialDir, u_sun_dir);
        
        float glow = pow(max(0.0, d), 1.0 / u_size);
        float core = pow(max(0.0, d), 1.0 / (u_size * 0.18));
        
        vec3 color = vec3(1.0, 0.98, 0.92) * core * 1.6 + 
                     vec3(1.0, 0.85, 0.4) * glow * 0.7;
                     
        float alpha = clamp(core * 2.0 + glow, 0.0, 1.0) * u_intensity * u_visible;
        gl_FragColor = vec4(color * alpha, alpha);
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

  render(gl, _matrix) {
    let _gl = gl;
    if (!_gl && gl && gl.gl) _gl = gl.gl;
    if (!_gl || !this._program || !this._buffer || !this._map) return;

    const canvas = this._map.getCanvas();
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const bearing = this._map.getBearing?.() ?? 0;
    const pitchDeg = this._map.getPitch?.() ?? 0;
    const center = this._map.getCenter?.();
    const centerLng = center?.lng ?? 0;
    const centerLat = center?.lat ?? 0;

    // Corrected Yaw/Pitch to follow the globe's rotation
    const yaw = (bearing - centerLng) * (Math.PI / 180);
    const pitch = (pitchDeg - centerLat) * (Math.PI / 180);

    const sunPos = getSubsolarPoint(new Date());
    // Star panorama is RA-flipped (U is mirrored), so mirror longitude here too
    const theta = (sunPos.lon * Math.PI) / 180;
    const latRad = ((sunPos.lat- 30) * Math.PI) / 180;

    // Full 3D direction vector
    const sx = Math.cos(latRad) * Math.sin(theta);
    const sy = Math.sin(latRad);
    const sz = Math.cos(latRad) * Math.cos(theta);
    const sunDir = [sx, sy, sz];

    const mapEl = document.getElementById('map');
    const visible = (mapEl && mapEl.classList.contains('atmosphere-on')) ? 1.0 : 0.0;

    _gl.useProgram(this._program);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, this._buffer);

    const aPos = _gl.getAttribLocation(this._program, 'a_pos');
    _gl.enableVertexAttribArray(aPos);
    _gl.vertexAttribPointer(aPos, 2, _gl.FLOAT, false, 8, 0);

    _gl.uniform3fv(_gl.getUniformLocation(this._program, 'u_sun_dir'), sunDir);
    _gl.uniform1f(_gl.getUniformLocation(this._program, 'u_yaw'), yaw);
    _gl.uniform1f(_gl.getUniformLocation(this._program, 'u_pitch'), pitch);
    _gl.uniform1f(_gl.getUniformLocation(this._program, 'u_aspect'), aspect);
    _gl.uniform1f(_gl.getUniformLocation(this._program, 'u_intensity'), this.intensity);
    _gl.uniform1f(_gl.getUniformLocation(this._program, 'u_size'), this.size);
    _gl.uniform1f(_gl.getUniformLocation(this._program, 'u_visible'), visible);

    _gl.disable(_gl.DEPTH_TEST);
    _gl.depthMask(false);
    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);

    _gl.drawArrays(_gl.TRIANGLES, 0, 6);

    _gl.enable(_gl.DEPTH_TEST);
    _gl.depthMask(true);
    _gl.disable(_gl.BLEND);
    _gl.disableVertexAttribArray(aPos);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    _gl.useProgram(null);
  }
}
