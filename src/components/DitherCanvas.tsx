import { useRef, useEffect, useCallback } from "react";

interface DitherCanvasProps {
  theme: "dark" | "light";
}

// Attempt organic noise via layered sine functions with a random seed
function noise(x: number, y: number, seed: number): number {
  const s = seed;
  let v = 0;
  v += Math.sin(x * 0.015 + s) * Math.cos(y * 0.017 + s * 1.3) * 0.35;
  v += Math.sin(x * 0.03 + y * 0.02 + s * 0.7) * 0.25;
  v += Math.cos(x * 0.05 - y * 0.04 + s * 2.1) * Math.sin(y * 0.06 + s) * 0.2;
  v += Math.sin((x + y) * 0.025 + s * 1.5) * 0.15;
  v += Math.sin(x * 0.08 + s * 3.0) * Math.cos(y * 0.07 + s * 2.5) * 0.12;
  v += Math.cos(x * 0.12 + y * 0.1 + s * 0.3) * 0.08;
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
    // Fill background
    ctx.fillStyle = isDark ? "#0a0a0a" : "#f5f5f5";
    ctx.fillRect(0, 0, width, height);

    const seed = seedRef.current;
    const step = 4;
    const dotSize = 2;

    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const n = noise(x, y, seed);

        // Edge bias: increase density near edges
        const edgeX = Math.min(x, width - x) / width;
        const edgeY = Math.min(y, height - y) / height;
        const edgeFactor = 1 - Math.min(edgeX, edgeY) * 2.5;

        const combined = n + edgeFactor * 0.15;

        if (combined > 0.08) {
          // Intensity drives opacity and lightness
          const intensity = Math.min((combined - 0.08) / 0.7, 1);

          if (isDark) {
            const lightness = 40 + intensity * 45; // 40-85 range
            const alpha = 0.25 + intensity * 0.55;
            ctx.fillStyle = `hsla(0, 0%, ${lightness}%, ${alpha})`;
          } else {
            const lightness = 60 - intensity * 45; // 60-15 range
            const alpha = 0.2 + intensity * 0.5;
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
