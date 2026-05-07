var e=class{constructor(e={}){this.id=e.id??`sky-texture`,this.type=`custom`,this.renderingMode=`3d`,this.url=e.url,this.opacity=typeof e.opacity==`number`?e.opacity:1,this.brightness=typeof e.brightness==`number`?e.brightness:.25,this._map=null,this._gl=null,this._program=null,this._buffer=null,this._texture=null,this._textureReady=!1}onAdd(e,t){this._map=e,this._gl=t;let n=t.createShader(t.VERTEX_SHADER);t.shaderSource(n,`
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        // a_pos is clip-space [-1..1]
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_uv = (a_pos * 0.5) + 0.5;
      }
    `),t.compileShader(n);let r=t.createShader(t.FRAGMENT_SHADER);t.shaderSource(r,`
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
    `),t.compileShader(r);let i=t.createProgram();t.attachShader(i,n),t.attachShader(i,r),t.linkProgram(i),this._program=i;let a=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this._buffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this._buffer),t.bufferData(t.ARRAY_BUFFER,a,t.STATIC_DRAW),t.bindBuffer(t.ARRAY_BUFFER,null),this._texture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this._texture),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,new Uint8Array([0,0,0,255])),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.bindTexture(t.TEXTURE_2D,null),this.url&&this._loadTexture(this.url)}_loadTexture(e){let t=new Image;t.crossOrigin=`anonymous`,t.decoding=`async`,t.onload=()=>{try{let e=this._gl;e.bindTexture(e.TEXTURE_2D,this._texture),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,t),e.generateMipmap(e.TEXTURE_2D),e.bindTexture(e.TEXTURE_2D,null),this._textureReady=!0,this._map?.triggerRepaint?.()}catch(e){console.warn(`Sky texture upload failed:`,e)}},t.onerror=t=>{console.warn(`Sky texture failed to load:`,e,t)},t.src=e}render(e,t){let n=e;if(!n&&e&&e.gl&&(n=e.gl),!n||!this._program||!this._buffer||!this._texture||!this._map)return;let r=this._map.getBearing?.()??0,i=this._map.getPitch?.()??0,a=this._map.getCenter?.(),o=a?.lng??0,s=a?.lat??0,c=(r-o)*(Math.PI/180),l=(i-s)*(Math.PI/180),u=this._map.getCanvas(),d=u.clientWidth/u.clientHeight;n.useProgram(this._program),n.bindBuffer(n.ARRAY_BUFFER,this._buffer);let f=n.getAttribLocation(this._program,`a_pos`);n.enableVertexAttribArray(f),n.vertexAttribPointer(f,2,n.FLOAT,!1,8,0);let p=n.getUniformLocation(this._program,`u_tex`),m=n.getUniformLocation(this._program,`u_yaw`),h=n.getUniformLocation(this._program,`u_pitch`),g=n.getUniformLocation(this._program,`u_aspect`),_=n.getUniformLocation(this._program,`u_opacity`),v=n.getUniformLocation(this._program,`u_brightness`);n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,this._texture),n.uniform1i(p,0),n.uniform1f(m,c),n.uniform1f(h,l),n.uniform1f(g,d),n.uniform1f(_,this.opacity),n.uniform1f(v,this.brightness),n.disable(n.DEPTH_TEST),n.depthMask(!1),n.enable(n.BLEND),n.blendFunc(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA),n.drawArrays(n.TRIANGLES,0,6),n.enable(n.DEPTH_TEST),n.depthMask(!0),n.disable(n.BLEND),n.disableVertexAttribArray(f),n.bindBuffer(n.ARRAY_BUFFER,null),n.bindTexture(n.TEXTURE_2D,null),n.useProgram(null)}};export{e as SkyTextureLayer};