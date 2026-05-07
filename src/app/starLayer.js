/**
 * A custom WebGL layer for MapLibre that renders a persistent star sphere.
 * This creates a true 3D field of stars that surrounds the globe and 
 * reacts to the camera's orientation.
 */
export class StarLayer {
  constructor() {
    this.id = 'star-sphere';
    this.type = 'custom';
    this.renderingMode = '3d';
    this.program = null;
    this.buffer = null;
    this.starCount = 6000;
  }

  onAdd(map, gl) {
    const vertexSource = `
      uniform mat4 u_matrix;
      attribute vec4 a_pos;
      attribute float a_brightness;
      varying float v_brightness;
      void main() {
        gl_Position = u_matrix * a_pos;
        gl_PointSize = (1.0 + a_brightness * 2.0);
        v_brightness = a_brightness;
      }
    `;

    const fragmentSource = `
      precision mediump float;
      varying float v_brightness;
      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (dist > 0.5) discard;
        float alpha = (1.0 - dist * 2.0) * (0.15 + v_brightness * 0.35);
        gl_FragColor = vec4(0.5, 0.65, 0.85, alpha);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    // Generate random stars on a sphere centered at the globe (0.5, 0.5 in Mercator)
    const data = new Float32Array(this.starCount * 4);
    const radius = 0.8; // Reduced radius to stay within camera far plane
    
    for (let i = 0; i < this.starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      // Center the sphere at [0.5, 0.5] (Mercator center)
      const x = 0.5 + radius * Math.sin(phi) * Math.cos(theta);
      const y = 0.5 + radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      data[i * 4 + 0] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = z;
      data[i * 4 + 3] = Math.random(); // Brightness
    }

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  render(gl, matrix) {
    // Handle variations in MapLibre's custom layer signature across versions.
    let _gl = gl;
    let _matrix = matrix;
    
    // If first arg is an object with .gl and .matrix, use them (MapLibre v3+ event style)
    if (!_matrix && gl && typeof gl === 'object' && gl.matrix) {
      _gl = gl.gl;
      _matrix = gl.matrix;
    }

    if (!_gl || !_matrix) return;

    // Ensure _matrix is a valid Float32Array for uniformMatrix4fv
    let finalMatrix;
    if (_matrix instanceof Float32Array) {
      finalMatrix = _matrix;
    } else if (Array.isArray(_matrix)) {
      finalMatrix = new Float32Array(_matrix);
    } else {
      // Fallback if matrix is not a simple array (e.g. if it's nested in another object)
      try {
        finalMatrix = new Float32Array(Object.values(_matrix));
      } catch (e) {
        return; // Avoid crashing the render loop
      }
    }

    if (finalMatrix.length !== 16) return;

    _gl.useProgram(this.program);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, this.buffer);

    const posLoc = _gl.getAttribLocation(this.program, 'a_pos');
    _gl.enableVertexAttribArray(posLoc);
    _gl.vertexAttribPointer(posLoc, 3, _gl.FLOAT, false, 16, 0);

    const brightLoc = _gl.getAttribLocation(this.program, 'a_brightness');
    _gl.enableVertexAttribArray(brightLoc);
    _gl.vertexAttribPointer(brightLoc, 1, _gl.FLOAT, false, 16, 12);

    const matrixLoc = _gl.getUniformLocation(this.program, 'u_matrix');
    _gl.uniformMatrix4fv(matrixLoc, false, finalMatrix);

    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE);
    
    // Disable depth testing so stars stay in the background and 
    // don't interfere with globe/terrain depth.
    _gl.disable(_gl.DEPTH_TEST);
    
    _gl.drawArrays(_gl.POINTS, 0, this.starCount);

    _gl.enable(_gl.DEPTH_TEST);

    _gl.disableVertexAttribArray(posLoc);
    _gl.disableVertexAttribArray(brightLoc);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    _gl.useProgram(null);
  }
}
