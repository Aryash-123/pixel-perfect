import * as THREE from "three";
import { LANE_WIDTH, ROAD_HALF_WIDTH } from "./route";

const cache = new Map<string, THREE.Texture>();

function canvasTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

/**
 * Road surface: u = across the road (0..1), v = along the road (repeats every 16 m).
 * Contains asphalt grain, dashed lane lines, solid edge lines and a centre divider.
 */
export function roadTexture() {
  return canvasTex("road", 512, 512, (ctx) => {
    ctx.fillStyle = "#22242b";
    ctx.fillRect(0, 0, 512, 512);
    // asphalt grain
    for (let i = 0; i < 6000; i++) {
      const g = 24 + Math.random() * 26;
      ctx.fillStyle = `rgba(${g},${g + 2},${g + 6},0.5)`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const total = ROAD_HALF_WIDTH * 2;
    const px = (metresFromLeft: number) => (metresFromLeft / total) * 512;

    // edge lines (solid white)
    ctx.fillStyle = "rgba(235,240,255,0.85)";
    ctx.fillRect(px(0.5), 0, 5, 512);
    ctx.fillRect(px(total - 0.7), 0, 5, 512);

    // centre divider (double yellow)
    ctx.fillStyle = "rgba(255,206,90,0.9)";
    ctx.fillRect(px(ROAD_HALF_WIDTH - 0.35), 0, 4, 512);
    ctx.fillRect(px(ROAD_HALF_WIDTH + 0.25), 0, 4, 512);

    // dashed lane lines
    ctx.fillStyle = "rgba(235,240,255,0.75)";
    for (let lane = 1; lane <= 5; lane++) {
      const m = 0.9 + lane * LANE_WIDTH;
      if (Math.abs(m - ROAD_HALF_WIDTH) < 1) continue;
      for (let y = 0; y < 512; y += 128) ctx.fillRect(px(m), y, 4, 74);
    }
    // reflectors
    ctx.fillStyle = "rgba(150,230,255,0.5)";
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(px(0.2), y, 4, 6);
      ctx.fillRect(px(total - 0.4), y, 4, 6);
    }
  });
}

export function buildingTexture(variant: number) {
  const warm = ["#ffd9a0", "#ffe9c4", "#a8d8ff", "#d8ecff", "#ffc9d6"][variant % 5]!;
  return canvasTex(`bld${variant}`, 256, 512, (ctx) => {
    ctx.fillStyle = ["#141a2c", "#101527", "#182036", "#0e1424", "#1a2138"][variant % 5]!;
    ctx.fillRect(0, 0, 256, 512);
    const cols = 6 + (variant % 3);
    const rows = 22;
    const cw = 256 / cols;
    const rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = Math.random() < 0.55;
        ctx.fillStyle = lit ? warm : "rgba(30,40,64,0.9)";
        ctx.globalAlpha = lit ? 0.5 + Math.random() * 0.5 : 1;
        ctx.fillRect(c * cw + cw * 0.18, r * rh + rh * 0.22, cw * 0.64, rh * 0.5);
      }
    }
    ctx.globalAlpha = 1;
  });
}

export function signTexture(text: string, color = "#0f2f18", accent = "#eafff0") {
  return canvasTex(`sign:${text}:${color}`, 512, 128, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 108);
    ctx.fillStyle = accent;
    ctx.font = "bold 56px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = Math.min(56, (460 / Math.max(6, text.length)) * 1.9);
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.fillText(text, 256, 68);
  });
}

export function checkerTexture() {
  return canvasTex("checker", 256, 256, (ctx) => {
    const n = 8;
    const s = 256 / n;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#f2f5ff" : "#15171c";
        ctx.fillRect(x * s, y * s, s, s);
      }
  });
}

export function neonTexture(variant: number) {
  const hues = [325, 190, 45, 275, 155];
  return canvasTex(`neon${variant}`, 256, 128, (ctx) => {
    ctx.fillStyle = "#05060c";
    ctx.fillRect(0, 0, 256, 128);
    const h = hues[variant % hues.length]!;
    ctx.strokeStyle = `hsl(${h} 100% 65%)`;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 24, 216, 80);
    ctx.fillStyle = `hsl(${h} 100% 72%)`;
    ctx.font = "bold 46px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(["SUSHI", "HOTEL", "CLUB", "RAMEN", "TOKYO"][variant % 5]!, 128, 68);
  });
}
