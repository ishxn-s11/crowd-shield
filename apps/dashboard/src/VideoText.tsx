import { useEffect, useRef, useState } from "react";

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
uniform sampler2D uTexture;
uniform sampler2D uMask;
uniform float uTime;
uniform vec2 uRes;
uniform float uGlitch;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUV;
  
  // Get mask alpha
  float mask = texture2D(uMask, uv).a;
  if (mask < 0.01) discard;
  
  // Scanline effect
  float scanline = 0.92 + 0.08 * sin(uv.y * uRes.y * 1.5 + uTime * 3.0);
  
  // Chromatic aberration
  float aberr = 0.002 * (1.0 + 0.5 * sin(uTime * 0.7));
  float r = texture2D(uTexture, uv + vec2(aberr, 0.0)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - vec2(aberr, 0.0)).b;
  vec3 color = vec3(r, g, b);
  
  // Horizontal glitch lines
  float glitch = step(0.98, rand(vec2(floor(uv.y * 60.0), floor(uTime * 8.0))));
  color += glitch * vec3(0.1, 0.05, 0.15) * uGlitch;
  
  // VHS tracking noise
  float noise = rand(vec2(uv.x * 100.0, uTime * 50.0)) * 0.03;
  color += noise;
  
  // Bright pulsing
  float pulse = 0.95 + 0.05 * sin(uTime * 2.0);
  
  color *= scanline * pulse;
  
  gl_FragColor = vec4(color, mask * max(max(color.r, color.g), color.b));
}`;

interface Props {
  text?: string;
  fontSize?: string | number;
  fontWeight?: number;
  color?: string;
  glowColor?: string;
  glitchIntensity?: number;
  style?: React.CSSProperties;
}

export default function VideoText({
  text = "CROWD SHIELD",
  fontSize = "clamp(48px, 10vw, 140px)",
  fontWeight = 900,
  color = "#ffffff",
  glowColor = "#3b82f6",
  glitchIntensity = 1.0,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glEpoch, setGlEpoch] = useState(0);

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

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("VideoText shader:", gl.getShaderInfoLog(sh));
      }
      return sh;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Quad
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
    const uGlitch = gl.getUniformLocation(prog, "uGlitch");
    const uTexture = gl.getUniformLocation(prog, "uTexture");
    const uMask = gl.getUniformLocation(prog, "uMask");

    // Create text canvas texture
    const textCanvas = document.createElement("canvas");
    const maskCanvas = document.createElement("canvas");

    const textTex = gl.createTexture();
    const maskTex = gl.createTexture();

    const setupTex = (tex: WebGLTexture) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    setupTex(textTex);
    setupTex(maskTex);

    const paintText = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      const tw = w * dpr;
      const th = h * dpr;

      // Parse fontSize to pixels
      let sizePx = 120;
      if (typeof fontSize === "string" && fontSize.includes("px")) {
        sizePx = parseFloat(fontSize);
      } else if (typeof fontSize === "number") {
        sizePx = fontSize;
      }
      const scaledSize = sizePx * dpr;

      // Text canvas — RGB with glow
      textCanvas.width = tw;
      textCanvas.height = th;
      const ctx = textCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, tw, th);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${fontWeight} ${scaledSize}px Inter, sans-serif`;

      // Glow layers
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = scaledSize * 0.15;
      ctx.fillStyle = color;
      ctx.fillText(text, tw / 2, th / 2);
      ctx.fillText(text, tw / 2, th / 2); // double for stronger glow

      // Crisp layer
      ctx.shadowBlur = 0;
      ctx.fillText(text, tw / 2, th / 2);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        textCanvas
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      // Mask canvas — alpha channel for shape
      maskCanvas.width = tw;
      maskCanvas.height = th;
      const mctx = maskCanvas.getContext("2d")!;
      mctx.clearRect(0, 0, tw, th);
      mctx.textAlign = "center";
      mctx.textBaseline = "middle";
      mctx.font = `${fontWeight} ${scaledSize}px Inter, sans-serif`;
      mctx.fillStyle = "#ffffff";
      mctx.fillText(text, tw / 2, th / 2);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        maskCanvas
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    };

    // Load font then paint
    document.fonts?.ready?.then(() => {
      setTimeout(paintText, 100);
    });
    paintText();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let raf = 0;
    let t = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      paintText();
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
      gl.useProgram(prog);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uGlitch, glitchIntensity);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.uniform1i(uTexture, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.uniform1i(uMask, 1);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [text, fontSize, fontWeight, color, glowColor, glitchIntensity, glEpoch]);

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
