import { useEffect, useRef } from "react";
import { hudStore } from "@/game/hudStore";
import { sampleAt, worldPos, type Route } from "@/game/route";

/**
 * Aerial minimap. Draws the sampled route centreline once into an offscreen
 * canvas (in map space), then each frame blits it and overlays live markers.
 * Reads telemetry straight from the hud store so the 3D scene never re-renders.
 */
export function Minimap({ route, size = 178 }: { route: Route; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const pad = 14;
    const { minX, maxX, minZ, maxZ } = route.bounds;
    const spanX = Math.max(1, maxX - minX);
    const spanZ = Math.max(1, maxZ - minZ);
    const scale = (size - pad * 2) / Math.max(spanX, spanZ);
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const toMap = (x: number, z: number): [number, number] => [
      size / 2 + (x - cx) * scale,
      size / 2 - (z - cz) * scale,
    ];

    // ---- static layer: road ribbon + checkpoints + start/finish
    const base = document.createElement("canvas");
    base.width = size;
    base.height = size;
    const b = base.getContext("2d")!;

    b.strokeStyle = "rgba(120,190,255,0.16)";
    b.lineWidth = 1;
    for (let g = pad; g <= size - pad; g += (size - pad * 2) / 4) {
      b.beginPath();
      b.moveTo(pad, g);
      b.lineTo(size - pad, g);
      b.moveTo(g, pad);
      b.lineTo(g, size - pad);
      b.stroke();
    }

    const path = new Path2D();
    route.samples.forEach((p, i) => {
      const [mx, my] = toMap(p.x, p.z);
      if (i === 0) path.moveTo(mx, my);
      else path.lineTo(mx, my);
    });
    b.lineCap = "round";
    b.lineJoin = "round";
    b.strokeStyle = "rgba(0,229,255,0.22)";
    b.lineWidth = 8;
    b.stroke(path);
    b.strokeStyle = "rgba(190,240,255,0.9)";
    b.lineWidth = 3;
    b.stroke(path);

    // branch (flyover) alternates
    route.race.branches.forEach((br) => {
      b.beginPath();
      for (let s = br.start; s <= br.end; s += 6) {
        const p = worldPos(route, s, br.groundOffset * 0.5, {});
        const [mx, my] = toMap(p.x, p.z);
        if (s === br.start) b.moveTo(mx, my);
        else b.lineTo(mx, my);
      }
      b.strokeStyle = "rgba(255,58,166,0.75)";
      b.lineWidth = 2;
      b.setLineDash([3, 3]);
      b.stroke();
      b.setLineDash([]);
    });

    route.checkpoints.forEach((s) => {
      const p = sampleAt(route, s);
      const [mx, my] = toMap(p.x, p.z);
      b.beginPath();
      b.arc(mx, my, 2.6, 0, Math.PI * 2);
      b.fillStyle = "rgba(255,214,84,0.95)";
      b.fill();
    });

    const fin = route.samples[route.samples.length - 1]!;
    const [fx, fy] = toMap(fin.x, fin.z);
    b.fillStyle = "#ffffff";
    b.fillRect(fx - 3.5, fy - 3.5, 7, 7);
    b.fillStyle = "#0b1024";
    b.fillRect(fx - 3.5, fy - 3.5, 3.5, 3.5);
    b.fillRect(fx, fy, 3.5, 3.5);

    let raf = 0;
    const draw = () => {
      const h = hudStore.get();
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(base, 0, 0);

      // traffic
      ctx.fillStyle = "rgba(150,170,210,0.85)";
      for (const [s, lat] of h.trafficS) {
        const p = worldPos(route, s, lat, {});
        const [mx, my] = toMap(p.x, p.z);
        ctx.fillRect(mx - 1, my - 1, 2, 2);
      }

      // rivals
      ctx.fillStyle = "#ff3aa6";
      for (const rs of h.rivalS) {
        const p = sampleAt(route, rs);
        const [mx, my] = toMap(p.x, p.z);
        ctx.beginPath();
        ctx.arc(mx, my, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // player
      const pp = sampleAt(route, h.s);
      const [px, py] = toMap(pp.x, pp.z);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pp.heading);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4.5, 5);
      ctx.lineTo(0, 2.5);
      ctx.lineTo(-4.5, 5);
      ctx.closePath();
      ctx.fillStyle = "#00e5ff";
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [route, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-xl border border-[color:var(--vc-line)] bg-[color:var(--vc-panel)] shadow-[0_0_30px_rgba(0,229,255,0.12)]"
      aria-label="Aerial minimap of the race route"
    />
  );
}
