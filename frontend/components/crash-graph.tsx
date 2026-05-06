"use client";

import { useRef, useEffect } from "react";
import { useGameStore } from "@/stores/game-store";

const GROWTH_RATE = 0.06; // Matches backend multiplier growth

export function CrashGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastMultiplierRef = useRef(1.0);
  const animatedMultiplierRef = useRef(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const resizeObserver = new ResizeObserver(() => {
      dpr = window.devicePixelRatio || 1;
      resize();
    });
    resizeObserver.observe(canvas);

    const drawCurve = (ctx: CanvasRenderingContext2D, w: number, h: number, multiplier: number, status: string, crashPoint: number) => {
      if (multiplier <= 1.0) return;

      const maxMult = Math.max(crashPoint * 1.2, multiplier * 1.5, 2.0);
      const points: { x: number; y: number }[] = [];

      // Generate exponential curve points
      for (let i = 0; i <= 100; i++) {
        const t = i / 100; // 0 to 1 along the curve
        // Exponential: multiplier at position t
        const multAtT = 1 + (multiplier - 1) * t;
        // Map to canvas: x from 10% to 90%, y from bottom to top
        const x = w * 0.1 + t * w * 0.8;
        // Exponential curve formula matching backend
        const exponent = GROWTH_RATE * t * 60;
        const yNormalized = (Math.exp(exponent) - 1) / (Math.exp(GROWTH_RATE * 60) - 1);
        const y = h - yNormalized * h * 0.8;
        points.push({ x, y });
      }

      const isCrashed = status === "CRASHED";
      const lineColor = isCrashed ? "#ef4444" : "#22c55e";
      const glowColor = isCrashed ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)";

      // Draw glow
      ctx.beginPath();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 12;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Draw main line
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 10;
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawCrashEffect = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Red flash overlay
      ctx.fillStyle = "rgba(239,68,68,0.2)";
      ctx.fillRect(0, 0, w, h);

      // Explosion particles
      const time = Date.now() / 1000;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 30 + Math.sin(time * 5 + i) * 10;
        const x = w / 2 + Math.cos(angle) * radius;
        const y = h / 2 + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
      }
    };

    const render = () => {
      const state = useGameStore.getState();
      const targetMultiplier = state.multiplier;
      const phase = state.phase;
      const crashPoint = state.currentRound?.crashPoint || 10;

      // Smooth interpolation for 60fps
      if (Math.abs(animatedMultiplierRef.current - targetMultiplier) > 0.01) {
        animatedMultiplierRef.current +=
          (targetMultiplier - animatedMultiplierRef.current) * 0.15;
      } else {
        animatedMultiplierRef.current = targetMultiplier;
      }

      const currentMult = animatedMultiplierRef.current;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "#0f0f23";
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Curve
      drawCurve(ctx, width, height, currentMult, phase, crashPoint);

      // Multiplier text
      ctx.fillStyle =
        phase === "CRASHED"
          ? "#ef4444"
          : phase === "RUNNING"
          ? "#22c55e"
          : "#ffffff";
      ctx.font = "bold 72px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${currentMult.toFixed(2)}x`, width / 2, height / 2);

      // Crash effect
      if (phase === "CRASHED") {
        drawCrashEffect(ctx, width, height);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 28px system-ui";
        ctx.fillText("CRASHED", width / 2, height / 2 + 50);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
