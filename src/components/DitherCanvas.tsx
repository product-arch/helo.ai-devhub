import { useRef, useEffect, useCallback } from "react";

interface DitherCanvasProps {
  theme: "dark" | "light";
}

// Layered sine-based noise for organic blob shapes
function noise(x: number, y: number, seed: number): number {
  const s = seed;
  let v = 0;
  // Large blobs
  v += Math.sin(x * 0.012 + s) * Math.cos(y * 0.013 + s * 1.3) * 0.4;
  v += Math.sin(x * 0.022 + y * 0.018 + s * 0.7) * 0.3;
  v += Math.cos(x * 0.04 - y * 0.035 + s * 2.1) * Math.sin(y * 0.045 + s) * 0.25;
  // Medium detail
  v += Math.sin((x + y) * 0.02 + s * 1.5) * 0.18;
  v += Math.sin(x * 0.065 + s * 3.0) * Math.cos(y * 0.06 + s * 2.5) * 0.15;
  // Fine grain
  v += Math.cos(x * 0.1 + y * 0.09 + s * 0.3) * 0.1;
  v += Math.sin(x * 0.15 + y * 0.13 + s * 4.2) * 0.06;
  return v;
}

export default function DitherCanvas({ theme }: DitherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seedRef = useRef(Math.random() * 1000);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const isDark = theme === "dark";
    ctx.fillStyle = isDark ? "#0a0a0a" : "#f0f0f0";
    ctx.fillRect(0, 0, width, height);

    const seed = seedRef.current;
    const step = 3;
    const dotSize = 2;

    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const n = noise(x, y, seed);

        // Edge bias for denser edges
        const edgeX = Math.min(x, width - x) / width;
        const edgeY = Math.min(y, height - y) / height;
        const edgeFactor = 1 - Math.min(edgeX, edgeY) * 3;

        const combined = n + edgeFactor * 0.2;

        if (combined > -0.05) {
          const intensity = Math.min((combined + 0.05) / 0.9, 1);

          if (isDark) {
            const lightness = 35 + intensity * 50;
            const alpha = 0.15 + intensity * 0.65;
            ctx.fillStyle = `hsla(0, 0%, ${lightness}%, ${alpha})`;
          } else {
            const lightness = 65 - intensity * 50;
            const alpha = 0.12 + intensity * 0.55;
            ctx.fillStyle = `hsla(0, 0%, ${lightness}%, ${alpha})`;
          }

          ctx.fillRect(x, y, dotSize, dotSize);
        }
      }
    }
  }, [theme]);

  useEffect(() => {
    draw();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(() => draw());
    ro.observe(parent);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
