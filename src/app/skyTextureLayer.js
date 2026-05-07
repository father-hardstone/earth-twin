/**
 * Textured sky "dome" rendered as a full-screen quad.
 * Uses only camera bearing/pitch for rotation so it does not zoom with the globe.
 *
 * Expected texture: equirectangular 2:1 panorama (stars/space).
 */
export class SkyTextureLayer {
  constructor(options = {}) {
    this.id = options.id ?? 'sky-texture';
    this.type = 'custom';
    this.renderingMode = '3d';

    this.url = options.url;
    this.opacity = typeof options.opacity === 'number' ? options.opacity : 1;
    this.brightness = typeof options.brightness === 'number' ? options.brightness : 0.25;

    this._map = null;
    this._gl = null;
    this._program = null;
    this._buffer = null;
    this._texture = null;
    this._textureReady = false;
  }

  onAdd(map, gl) {
    this._map = map;
    this._gl = gl;

    const vertexSource = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        // a_pos is clip-space [-1..1]
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_uv = (a_pos * 0.5) + 0.5;
      }
    `;

    const fragmentSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform float u_yaw;
      uniform float u_pitch;
      uniform float u_aspect;
      uniform float u_opacity;
      uniform float u_brightness;

      // Convert screen uv to a view direction, then rotate by yaw/pitch.
      vec3 dirFromUv(vec2 uv) {
        // Map to NDC [-1..1], with y up.
        vec2 p = uv * 2.0 - 1.0;
        p.y = -p.y;
        p.x *= u_aspect; // Correct for aspect ratio
        
        // "Push" the sky sphere farther away by narrowing the sampling FOV slightly.
        // Larger z => less apparent parallax / less warping at edges.
        float z = 2.0;
        return normalize(vec3(p.x, p.y, z));
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

      vec2 equirectUv(vec3 d) {
        // d is direction vector.
        float lon = atan(d.x, d.z);
        float lat = asin(clamp(d.y, -1.0, 1.0));
        // Celestial star maps usually increase Right Ascension to the LEFT,
        // so we flip the U direction versus a typical environment map.
        float u = 0.5 - (lon / (2.0 * 3.14159265));
        float v = 0.5 - (lat / 3.14159265);
        return vec2(u, v);
      }

      void main() {
        vec3 d = dirFromUv(v_uv);
        // yaw rotates around Y, pitch around X (negative to match screen-space pitch direction)
        d = rotY(u_yaw) * (rotX(u_pitch) * d);
        vec2 suv = equirectUv(d);
        vec4 c = texture2D(u_tex, suv);
        // Subtle lift for stars.
        float lum = max(max(c.r, c.g), c.b);
        c.rgb = mix(c.rgb, vec3(lum), 0.1);
        c.rgb *= u_brightness;
        c.a = u_opacity;
        gl_FragColor = c;
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

    // Full-screen quad (two triangles)
    const data = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1
    ]);
    this._buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    // Temporary 1x1 pixel while image loads
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    if (this.url) {
      this._loadTexture(this.url);
    }
  }

  _loadTexture(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const gl = this._gl;
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this._textureReady = true;
        this._map?.triggerRepaint?.();
      } catch (e) {
        console.warn('Sky texture upload failed:', e);
      }
    };
    img.onerror = (e) => {
      console.warn('Sky texture failed to load:', url, e);
    };
    img.src = url;
  }

  render(gl, _matrix) {
    // MapLibre may call custom layers with either (gl, matrix) or a single params object.
    let _gl = gl;
    if (!_gl && gl && gl.gl) _gl = gl.gl;
    if (!_gl || !this._program || !this._buffer || !this._texture) return;
    if (!this._map) return;

    const bearing = this._map.getBearing?.() ?? 0;
    const pitchDeg = this._map.getPitch?.() ?? 0;
    const center = this._map.getCenter?.();
    // In globe projection, dragging typically changes center lng/lat more than bearing.
    const centerLng = center?.lng ?? 0;
    const centerLat = center?.lat ?? 0;

    const yaw = (bearing - centerLng) * (Math.PI / 180);
    const pitch = (pitchDeg - centerLat) * (Math.PI / 180);

    const canvas = this._map.getCanvas();
    const aspect = canvas.clientWidth / canvas.clientHeight;

    _gl.useProgram(this._program);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, this._buffer);

    const aPos = _gl.getAttribLocation(this._program, 'a_pos');
    _gl.enableVertexAttribArray(aPos);
    _gl.vertexAttribPointer(aPos, 2, _gl.FLOAT, false, 8, 0);

    const uTex = _gl.getUniformLocation(this._program, 'u_tex');
    const uYaw = _gl.getUniformLocation(this._program, 'u_yaw');
    const uPitch = _gl.getUniformLocation(this._program, 'u_pitch');
    const uAspect = _gl.getUniformLocation(this._program, 'u_aspect');
    const uOpacity = _gl.getUniformLocation(this._program, 'u_opacity');
    const uBrightness = _gl.getUniformLocation(this._program, 'u_brightness');

    _gl.activeTexture(_gl.TEXTURE0);
    _gl.bindTexture(_gl.TEXTURE_2D, this._texture);
    _gl.uniform1i(uTex, 0);
    _gl.uniform1f(uYaw, yaw);
    _gl.uniform1f(uPitch, pitch);
    _gl.uniform1f(uAspect, aspect);
    _gl.uniform1f(uOpacity, this.opacity);
    _gl.uniform1f(uBrightness, this.brightness);

    // Draw behind everything.
    _gl.disable(_gl.DEPTH_TEST);
    _gl.depthMask(false);
    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);

    _gl.drawArrays(_gl.TRIANGLES, 0, 6);

    _gl.enable(_gl.DEPTH_TEST);
    _gl.depthMask(true);
    _gl.disable(_gl.BLEND);

    _gl.disableVertexAttribArray(aPos);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    _gl.bindTexture(_gl.TEXTURE_2D, null);
    _gl.useProgram(null);
  }
}
