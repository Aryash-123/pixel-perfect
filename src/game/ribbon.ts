import * as THREE from "three";
import { ROAD_HALF_WIDTH, sampleAt, type Route } from "./route";

export type CentreFn = (s: number) => { offset: number; height: number };

/** Builds a road ribbon that follows the route centreline exactly. */
export function buildRibbon(
  route: Route,
  opts: {
    from?: number;
    to?: number;
    halfWidth?: number;
    centre?: CentreFn;
    step?: number;
    yLift?: number;
    vScale?: number; // metres per texture repeat
  } = {},
) {
  const from = opts.from ?? 0;
  const to = opts.to ?? route.length;
  const hw = opts.halfWidth ?? ROAD_HALF_WIDTH;
  const step = opts.step ?? 4;
  const centre = opts.centre ?? (() => ({ offset: 0, height: 0 }));
  const lift = opts.yLift ?? 0.02;
  const vScale = opts.vScale ?? 16;

  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const n = Math.max(2, Math.round((to - from) / step));

  for (let i = 0; i <= n; i++) {
    const s = from + ((to - from) * i) / n;
    const p = sampleAt(route, s);
    const c = centre(s);
    const nx = Math.cos(p.heading);
    const nz = -Math.sin(p.heading);
    const cx = p.x + nx * c.offset;
    const cz = p.z + nz * c.offset;
    const y = p.y + c.height + lift;
    pos.push(cx - nx * hw, y, cz - nz * hw);
    pos.push(cx + nx * hw, y, cz + nz * hw);
    const v = s / vScale;
    uv.push(0, v, 1, v);
    if (i < n) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Vertical side wall (used for flyover decks, curbs, barriers). */
export function buildWall(
  route: Route,
  opts: {
    from: number;
    to: number;
    side: number; // -1 left, 1 right
    offset: number; // lateral distance from centre
    height: number;
    centre?: CentreFn;
    step?: number;
    yBase?: number;
  },
) {
  const centre = opts.centre ?? (() => ({ offset: 0, height: 0 }));
  const step = opts.step ?? 6;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const n = Math.max(2, Math.round((opts.to - opts.from) / step));
  for (let i = 0; i <= n; i++) {
    const s = opts.from + ((opts.to - opts.from) * i) / n;
    const p = sampleAt(route, s);
    const c = centre(s);
    const nx = Math.cos(p.heading);
    const nz = -Math.sin(p.heading);
    const d = c.offset + opts.side * opts.offset;
    const x = p.x + nx * d;
    const z = p.z + nz * d;
    const y0 = p.y + c.height + (opts.yBase ?? 0);
    pos.push(x, y0, z, x, y0 + opts.height, z);
    uv.push(s / 8, 0, s / 8, 1);
    if (i < n) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
