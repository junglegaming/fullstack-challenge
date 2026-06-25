import { useEffect, useRef } from "react";
import type { Phase } from "../game/gameState";

interface Props {
  phase: Phase;
  multiplier: number;
  crashPoint: number | null;
}

const COLORS = {
  green: "#2fd47a",
  red: "#ff4d5e",
  grid: "rgba(255,255,255,0.05)",
  axis: "rgba(255,255,255,0.25)",
};

export function CrashChart({ phase, multiplier, crashPoint }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const targetRef = useRef(multiplier);
  const dispRef = useRef(multiplier);
  const phaseRef = useRef(phase);
  const crashRef = useRef(crashPoint);

  targetRef.current = multiplier;
  phaseRef.current = phase;
  crashRef.current = crashPoint;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const ph = phaseRef.current;

      if (ph === "crashed") {
        dispRef.current = crashRef.current ?? targetRef.current;
      } else if (ph === "betting") {
        dispRef.current = 1;
      } else {
        dispRef.current += (targetRef.current - dispRef.current) * 0.18;
      }
      const m = dispRef.current;

      ctx.clearRect(0, 0, w, h);

      const padL = 8;
      const padR = 56;
      const padB = 26;
      const padT = 14;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      const maxM = Math.max(2, m * 1.15);
      const color = ph === "crashed" ? COLORS.red : COLORS.green;

      const yFor = (mult: number) => {
        const t = (mult - 1) / (maxM - 1);
        return padT + plotH - t * plotH;
      };

      ctx.font = "11px ui-monospace, monospace";
      ctx.textBaseline = "middle";
      const ticks = niceTicks(maxM);
      for (const tick of ticks) {
        const y = yFor(tick);
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
        ctx.fillStyle = COLORS.axis;
        ctx.textAlign = "left";
        ctx.fillText(`${tick.toFixed(tick < 10 ? 1 : 0)}x`, padL + plotW + 8, y);
      }

      if (ph !== "betting") {
        const N = 64;
        const pts: Array<[number, number]> = [];
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const mult = Math.pow(m, t);
          pts.push([padL + t * plotW, yFor(mult)]);
        }

        const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
        grad.addColorStop(0, hexA(color, 0.28));
        grad.addColorStop(1, hexA(color, 0));
        ctx.beginPath();
        ctx.moveTo(pts[0]![0], padT + plotH);
        for (const [x, y] of pts) {
          ctx.lineTo(x, y);
        }
        ctx.lineTo(pts[pts.length - 1]![0], padT + plotH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pts[0]![0], pts[0]![1]);
        for (const [x, y] of pts) {
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.shadowColor = hexA(color, 0.5);
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const tip = pts[pts.length - 1]!;
        ctx.beginPath();
        ctx.arc(tip[0], tip[1], ph === "crashed" ? 6 : 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        if (ph === "running") {
          ctx.font = "16px serif";
          ctx.textAlign = "center";
          ctx.fillText("🚀", tip[0], tip[1] - 14);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function niceTicks(maxM: number): number[] {
  const span = maxM - 1;
  const rawStep = span / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  const step = niceNorm * mag;
  const ticks: number[] = [];
  for (let t = 1 + step; t < maxM; t += step) {
    ticks.push(Number(t.toFixed(2)));
  }
  return ticks;
}

function hexA(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
