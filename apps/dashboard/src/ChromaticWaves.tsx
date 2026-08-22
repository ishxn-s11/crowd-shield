import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 aPos;
varying vec2 vUV;
void main(){
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUV;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uIntensity;

float wave(vec2 p, float freq, float speed, vec2 dir) {
  return sin(dot(p, dir) * freq + uTime * speed);
}

void main() {
  vec2 uv = vUV;
  float aspect = uRes.x / uRes.y;
  vec2 p = uv;
  p.x *= aspect;

  // Multiple overlapping waves
  float w1 = wave(p, 3.0, 0.8, vec2(1.0, 0.5));
  float w2 = wave(p, 5.0, 0.6, vec2(-0.7, 1.0));
  float w3 = wave(p, 7.0, 1.2, vec2(0.3, -0.8));
  float w4 = wave(p, 2.0, 0.4, vec2(0.8, 0.3));
  float w5 = wave(p, 4.0, 1.0, vec2(-0.5, 0.7));

  float composite = (w1 + w2 * 0.7 + w3 * 0.5 + w4 * 0.3 + w5 * 0.4) / 2.9;
  composite = composite * 0.5 + 0.5;

  // Chromatic blend based on wave height
  vec3 color = mix(uColor1, uColor2, composite);
  color = mix(color, uColor3, pow(composite, 2.0));

  // Add subtle edge glow
  float edge = 1.0 - length(uv - 0.5) * 1.4;
  edge = clamp(edge, 0.0, 1.0);

  // Scan line texture
  float scan = 0.95 + 0.05 * sin(uv.y * uRes.y * 0.5 + uTime * 2.0);

  float alpha = edge * uIntensity * scan;
  gl_FragColor = vec4(color * alpha, alpha);
}`;

interface Props {
  colors?: [string, string, string];
  intensity?: number;
  speed?: number;
  style?: React.CSSProperties;
}

function hexToRGB(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function ChromaticWaves({
  colors = ["#0a1628", "#1a0a3e", "#0d2847"],
  intensity = 0.4,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      depth: false,
      antialias: false,
    });
    if (!gl) return;

    // Compile shaders
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    const idx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "uTime");
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uColor1 = gl.getUniformLocation(prog, "uColor1");
    const uColor2 = gl.getUniformLocation(prog, "uColor2");
    const uColor3 = gl.getUniformLocation(prog, "uColor3");
    const uIntensity = gl.getUniformLocation(prog, "uIntensity");

    const [r1, g1, b1] = hexToRGB(colors[0]);
    const [r2, g2, b2] = hexToRGB(colors[1]);
    const [r3, g3, b3] = hexToRGB(colors[2]);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let raf = 0;
    let t = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform3f(uColor1, r1, g1, b1);
      gl.uniform3f(uColor2, r2, g2, b2);
      gl.uniform3f(uColor3, r3, g3, b3);
      gl.uniform1f(uIntensity, intensity);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [colors, intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
