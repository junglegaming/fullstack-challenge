"use client";

import { useRef, useEffect, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { motion, AnimatePresence } from "framer-motion";

const GROWTH_RATE = 0.06;

export function CrashGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const animatedMultiplierRef = useRef(1.0);
  const [showExplosion, setShowExplosion] = useState(false);

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

    const drawCurve = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      multiplier: number,
      status: string,
      crashPoint: number,
    ) => {
      if (multiplier <= 1.0) return;

      const maxMult = Math.max(crashPoint * 1.2, multiplier * 1.5, 2.0);
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const multAtT = 1 + (multiplier - 1) * t;
        const x = w * 0.1 + t * w * 0.8;
        const exponent = GROWTH_RATE * t * 60;
        const yNormalized = (Math.exp(exponent) - 1) / (Math.exp(GROWTH_RATE * 60) - 1);
        const y = h - yNormalized * h * 0.8;
        points.push({ x, y });
      }

      const isCrashed = status === "CRASHED";
      const lineColor = isCrashed ? "#ff0055" : "#00ff88";
      const glowColor = isCrashed ? "rgba(255,0,85,0.5)" : "rgba(0,255,136,0.5)";

      // Draw outer glow
      ctx.beginPath();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 20;
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
      ctx.lineWidth = 4;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 15;
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const render = () => {
      const state = useGameStore.getState();
      const targetMultiplier = state.multiplier;
      const phase = state.phase;
      const crashPoint = state.currentRound?.crashPoint || 10;

      // Smooth interpolation
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
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0a0a1a");
      bgGrad.addColorStop(1, "#0f0f23");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid with neon effect
      ctx.strokeStyle = "rgba(0,255,136,0.08)";
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

      // Multiplier text with glow
      const textColor =
        phase === "CRASHED"
          ? "#ff0055"
          : phase === "RUNNING"
            ? "#00ff88"
            : "#ffffff";

      ctx.fillStyle = textColor;
      ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Text glow
      ctx.shadowColor = textColor;
      ctx.shadowBlur = 30;
      ctx.fillText(`${currentMult.toFixed(2)}x`, width / 2, height / 2);
      ctx.shadowBlur = 0;

      // Crash text
      if (phase === "CRASHED") {
        ctx.fillStyle = "#ff0055";
        ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
        ctx.shadowColor = "#ff0055";
        ctx.shadowBlur = 40;
        ctx.fillText("CRASHED!", width / 2, height / 2 + 50);
        ctx.shadowBlur = 0;

        // Trigger explosion animation
        if (!showExplosion) {
          setShowExplosion(true);
        }
      } else {
        if (showExplosion) {
          setShowExplosion(false);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [showExplosion]);

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-[#00ff88]/20 bg-[#0a0a1a] shadow-[0_0_30px_rgba(0,255,136,0.1)]">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Explosion overlay */}
      <AnimatePresence>
        {showExplosion && (
          <>
            {/* Red flash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 0.8, times: [0, 0.1, 1] }}
              className="absolute inset-0 bg-red-600 pointer-events-none"
            />

            {/* Explosion particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${50 + (Math.cos((i / 20) * Math.PI * 2) * 40)}%`,
                  y: `${50 + (Math.sin((i / 20) * Math.PI * 2) * 40)}%`,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute w-3 h-3 rounded-full pointer-events-none"
                style={{
                  backgroundColor: i % 3 === 0 ? "#ff0055" : i % 3 === 1 ? "#ffaa00" : "#ffffff",
                  boxShadow: `0 0 10px ${i % 3 === 0 ? "#ff0055" : "#ffaa00"}`,
                }}
              />
            ))}

            {/* Center explosion ring */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-red-500 pointer-events-none"
              style={{ boxShadow: "0 0 40px #ff0055, 0 0 80px #ff0055" }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
