"use client";

import { useEffect, useMemo, useRef } from "react";
import { Rng } from "@/lib/simulation/prng";
import { usePrefersReducedMotion } from "./hooks";

/*
  A synthetic persona network whose cascade is a pure function of `progress`
  (0 → 1). Scroll drives progress, so scrolling back un-spreads the idea.
*/

interface Node {
  x: number;
  y: number;
  r: number;
  cluster: number;
  target: boolean;
  phase: number;
  /** activation time in [0,1]; Infinity = never reached */
  t: number;
  parent: number;
  shared: boolean;
}

interface Net {
  nodes: Node[];
  edges: [number, number][];
}

function buildNetwork(count: number, seed: number): Net {
  const rng = new Rng(seed);
  const gauss = () => {
    const u = Math.max(1e-9, rng.next());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng.next());
  };

  const centers = [
    { x: 0.3, y: 0.42, s: 0.09, target: true },
    { x: 0.52, y: 0.3, s: 0.08, target: true },
    { x: 0.7, y: 0.52, s: 0.1, target: false },
    { x: 0.42, y: 0.68, s: 0.085, target: true },
    { x: 0.16, y: 0.7, s: 0.07, target: false },
    { x: 0.84, y: 0.26, s: 0.07, target: false },
    { x: 0.86, y: 0.78, s: 0.06, target: false },
  ];

  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    const c = Math.floor(rng.next() * centers.length);
    const C = centers[c]!;
    nodes.push({
      x: Math.min(0.98, Math.max(0.02, C.x + gauss() * C.s)),
      y: Math.min(0.96, Math.max(0.04, C.y + gauss() * C.s)),
      r: 0.9 + Math.pow(rng.next(), 3) * 2.6,
      cluster: c,
      target: rng.next() < (C.target ? 0.82 : 0.18),
      phase: rng.next() * Math.PI * 2,
      t: Infinity,
      parent: -1,
      shared: false,
    });
  }

  // k-nearest ties + a few long-range bridges
  const edges: [number, number][] = [];
  const adj: number[][] = nodes.map(() => []);
  const seen = new Set<string>();
  const link = (a: number, b: number) => {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a === b || seen.has(k)) return;
    seen.add(k);
    edges.push([a, b]);
    adj[a]!.push(b);
    adj[b]!.push(a);
  };
  for (let i = 0; i < count; i++) {
    const d = nodes
      .map((n, j) => [j, (n.x - nodes[i]!.x) ** 2 + (n.y - nodes[i]!.y) ** 2] as const)
      .sort((a, b) => a[1] - b[1]);
    for (let k = 1; k <= 4; k++) link(i, d[k]![0]);
    // occasional bridge to a mid-distance node — how ideas jump clusters
    if (rng.next() < 0.05) link(i, d[8 + Math.floor(rng.next() * 40)]![0]);
  }

  // Cascade: BFS from seeds, with probabilistic transmission (higher in-target).
  const seeds = nodes
    .map((n, i) => [i, (n.x - 0.3) ** 2 + (n.y - 0.42) ** 2] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(([i]) => i);
  const hop = new Array(count).fill(Infinity);
  const queue: number[] = [];
  for (const s of seeds) {
    hop[s] = 0;
    nodes[s]!.shared = true;
    queue.push(s);
  }
  while (queue.length) {
    const cur = queue.shift()!;
    if (!nodes[cur]!.shared) continue; // only sharers pass it on
    for (const nb of adj[cur]!) {
      if (hop[nb] !== Infinity) continue;
      const p = nodes[nb]!.target ? 0.92 : 0.55;
      if (rng.next() > p) continue;
      hop[nb] = hop[cur] + 1;
      nodes[nb]!.parent = cur;
      nodes[nb]!.shared = rng.next() < (nodes[nb]!.target ? 0.74 : 0.36);
      queue.push(nb);
    }
  }
  const maxHop = Math.max(1, ...hop.filter((h) => h !== Infinity));
  nodes.forEach((n, i) => {
    if (hop[i] !== Infinity) {
      n.t = (hop[i] / maxHop) * 0.88 + rng.next() * 0.06;
    }
  });
  return { nodes, edges };
}

function cssHsl(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? v.split(/\s+/).join(", ") : fallback;
}

export interface CascadeStats {
  reached: number;
  shared: number;
  total: number;
}

export function cascadeStats(net: Net, progress: number): CascadeStats {
  let reached = 0;
  let shared = 0;
  for (const n of net.nodes) {
    if (n.t <= progress) {
      reached++;
      if (n.shared) shared++;
    }
  }
  return { reached, shared, total: net.nodes.length };
}

export function useCascadeNetwork(count = 460, seed = 7) {
  return useMemo(() => buildNetwork(count, seed), [count, seed]);
}

export function CascadeCanvas({
  net,
  progress,
  autoplay = false,
  dim = false,
  align = "center",
  className,
}: {
  net: Net;
  progress?: number;
  /** play the cascade on its own instead of following `progress` */
  autoplay?: boolean;
  dim?: boolean;
  /** "right" keeps the graph clear of a left-hand text column on wide screens */
  align?: "center" | "right";
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress ?? 0);
  const reduced = usePrefersReducedMotion();
  progressRef.current = progress ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const col = {
      neutral: cssHsl("--node-neutral", "38, 5%, 36%"),
      target: cssHsl("--info", "213, 26%, 66%"),
      out: cssHsl("--clay", "24, 42%, 62%"),
      shared: cssHsl("--positive", "142, 16%, 62%"),
      seed: cssHsl("--foreground", "38, 22%, 90%"),
      line: cssHsl("--border-strong", "40, 4%, 20%"),
    };

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting));
    io.observe(canvas);

    const start = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || w === 0) return;
      const time = (now - start) / 1000;
      const p = autoplay
        ? reduced
          ? 1
          : Math.min(1, Math.max(0, (time - 0.6) / 7))
        : progressRef.current;
      const drift = reduced ? 0 : 1;
      // keep the network square-ish and centred regardless of aspect ratio
      const right = align === "right" && w >= 1024;
      // narrow screens: text sits at the bottom, so lift the graph to the top
      const top = align === "right" && w < 1024;
      const s = right ? Math.min(w * 0.6, h * 1.3) : top ? Math.min(w * 1.15, h * 0.62) : Math.min(w, h * 1.5);
      const ox = right ? w - s - w * 0.03 : (w - s) / 2;
      const oy = top ? h * 0.1 : (h - s / 1.5) / 2;
      const P = net.nodes.map((n) => ({
        x: ox + n.x * s + Math.sin(time * 0.35 + n.phase) * 2.2 * drift,
        y: oy + n.y * (s / 1.5) + Math.cos(time * 0.3 + n.phase) * 2.2 * drift,
      }));

      ctx.clearRect(0, 0, w, h);
      const baseA = dim ? 0.5 : 1;

      // latent ties
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `hsla(${col.line}, ${0.55 * baseA})`;
      ctx.beginPath();
      for (const [a, b] of net.edges) {
        ctx.moveTo(P[a]!.x, P[a]!.y);
        ctx.lineTo(P[b]!.x, P[b]!.y);
      }
      ctx.stroke();

      // transmission paths, drawn growing from parent to child
      ctx.lineWidth = 1;
      net.nodes.forEach((n, i) => {
        if (n.parent < 0 || n.t === Infinity) return;
        const tp = net.nodes[n.parent]!.t;
        if (p <= tp) return;
        const f = Math.min(1, (p - tp) / Math.max(0.02, n.t - tp));
        const a = P[n.parent]!;
        const b = P[i]!;
        ctx.strokeStyle = `hsla(${n.target ? col.target : col.out}, ${0.45 * baseA})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
        ctx.stroke();
      });

      // nodes
      net.nodes.forEach((n, i) => {
        const { x, y } = P[i]!;
        const on = n.t <= p;
        const age = on ? Math.min(1, (p - n.t) / 0.05) : 0;
        let c = col.neutral;
        let a = 0.55;
        if (on) {
          c = n.t === 0 || (n.parent < 0 && n.shared) ? col.seed : n.shared ? col.shared : n.target ? col.target : col.out;
          a = 0.95;
        }
        const r = n.r * (on ? 1 + 0.35 * age : 1);
        if (on && n.shared && age < 1 && !reduced) {
          ctx.fillStyle = `hsla(${c}, ${0.18 * (1 - age) * baseA})`;
          ctx.beginPath();
          ctx.arc(x, y, r + 10 * age, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `hsla(${c}, ${a * baseA})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [net, autoplay, dim, align, reduced]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
