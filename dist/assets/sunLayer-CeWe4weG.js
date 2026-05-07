import{n as e}from"./night-B8oLbSUL.js";var t=class{constructor(e={}){this.id=e.id??`sun-layer`,this.type=`custom`,this.renderingMode=`3d`,this.intensity=e.intensity??1.1,this.size=e.size??.008,this._map=null,this._gl=null,this._program=null,this._buffer=null}onAdd(e,t){this._map=e,this._gl=t;let n=t.createShader(t.VERTEX_SHADER);t.shaderSource(n,`
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_uv = (a_pos * 0.5) + 0.5;
      }
    `),t.compileShader(n);let r=t.createShader(t.FRAGMENT_SHADER);t.shaderSource(r,`
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
    `),t.compileShader(r);let i=t.createProgram();t.attachShader(i,n),t.attachShader(i,r),t.linkProgram(i),this._program=i;let a=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this._buffer=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this._buffer),t.bufferData(t.ARRAY_BUFFER,a,t.STATIC_DRAW),t.bindBuffer(t.ARRAY_BUFFER,null)}render(t,n){let r=t;if(!r&&t&&t.gl&&(r=t.gl),!r||!this._program||!this._buffer||!this._map)return;let i=this._map.getCanvas(),a=i.clientWidth/i.clientHeight,o=this._map.getBearing?.()??0,s=this._map.getPitch?.()??0,c=this._map.getCenter?.(),l=c?.lng??0,u=c?.lat??0,d=(o-l)*(Math.PI/180),f=(s-u)*(Math.PI/180),p=e(new Date),m=p.lon*Math.PI/180,h=(p.lat-30)*Math.PI/180,g=[Math.cos(h)*Math.sin(m),Math.sin(h),Math.cos(h)*Math.cos(m)],_=document.getElementById(`map`),v=_&&_.classList.contains(`atmosphere-on`)?1:0;r.useProgram(this._program),r.bindBuffer(r.ARRAY_BUFFER,this._buffer);let y=r.getAttribLocation(this._program,`a_pos`);r.enableVertexAttribArray(y),r.vertexAttribPointer(y,2,r.FLOAT,!1,8,0),r.uniform3fv(r.getUniformLocation(this._program,`u_sun_dir`),g),r.uniform1f(r.getUniformLocation(this._program,`u_yaw`),d),r.uniform1f(r.getUniformLocation(this._program,`u_pitch`),f),r.uniform1f(r.getUniformLocation(this._program,`u_aspect`),a),r.uniform1f(r.getUniformLocation(this._program,`u_intensity`),this.intensity),r.uniform1f(r.getUniformLocation(this._program,`u_size`),this.size),r.uniform1f(r.getUniformLocation(this._program,`u_visible`),v),r.disable(r.DEPTH_TEST),r.depthMask(!1),r.enable(r.BLEND),r.blendFunc(r.ONE,r.ONE_MINUS_SRC_ALPHA),r.drawArrays(r.TRIANGLES,0,6),r.enable(r.DEPTH_TEST),r.depthMask(!0),r.disable(r.BLEND),r.disableVertexAttribArray(y),r.bindBuffer(r.ARRAY_BUFFER,null),r.useProgram(null)}};export{t as SunLayer};