/**
 * ROUTE SYSTEM — the foundation of the world.
 *
 * Every race is defined by a deterministic list of segments. The route is
 * sampled once into a centreline (position, heading, elevation, environment)
 * and EVERYTHING else in the world (road ribbon, buildings, traffic, signs,
 * checkpoints, minimap, finish line) is placed relative to those samples.
 */

export type Env = "city" | "highway" | "mountain" | "coast" | "suburb" | "tunnel";

export type Segment = {
  len: number; // metres
  turn?: number; // total heading change in degrees (+ = right)
  rise?: number; // total elevation change in metres
  env: Env;
  label?: string; // sign text shown at the start of the segment
};

export type BranchDef = {
  /** distance along route where the split begins */
  start: number;
  /** distance where the two routes reconnect */
  end: number;
  /** lateral offset the GROUND route drifts to (metres, + = right) */
  groundOffset: number;
  /** peak height of the FLYOVER route */
  height: number;
  signs: [string, string]; // [flyover, ground]
};

export type RaceDef = {
  id: string;
  name: string;
  subtitle: string;
  distance: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  reward: number;
  description: string;
  rivals: number;
  trafficDensity: number;
  segments: Segment[];
  branches: BranchDef[];
  sky: { top: string; bottom: string; fog: string; fogNear: number; fogFar: number };
  moon?: boolean;
};

export type Sample = {
  s: number;
  x: number;
  z: number;
  y: number;
  heading: number; // radians, 0 = +Z
  env: Env;
};

export const ROAD_HALF_WIDTH = 11; // 3 lanes each way
export const LANE_WIDTH = 3.6;
const STEP = 4;

/* ------------------------------------------------------------------ races */

const NIGHT_CITY = {
  top: "#0a1030",
  bottom: "#1b2455",
  fog: "#111a3a",
  fogNear: 60,
  fogFar: 460,
};

export const RACES: RaceDef[] = [
  {
    id: "downtown",
    name: "DOWNTOWN GLOW",
    subtitle: "NEON CITY BOULEVARD",
    distance: 900,
    difficulty: 1,
    reward: 4500,
    rivals: 5,
    trafficDensity: 1,
    description:
      "Three-lane boulevard through the neon heart of the city. Intersections, shopping district, skyscrapers.",
    sky: NIGHT_CITY,
    segments: [
      { len: 140, env: "city", label: "CITY CENTRE" },
      { len: 120, turn: 10, env: "city" },
      { len: 130, env: "city", label: "SHOPPING DISTRICT" },
      { len: 120, turn: -14, env: "city" },
      { len: 90, env: "tunnel", label: "UNDERPASS" },
      { len: 120, turn: 12, env: "city", label: "DOWNTOWN" },
      { len: 180, env: "highway", label: "FINISH AHEAD" },
    ],
    branches: [{ start: 620, end: 810, groundOffset: 20, height: 9, signs: ["FLYOVER", "GROUND ROUTE"] }],
  },
  {
    id: "skyway",
    name: "SKYWAY FLYOVER",
    subtitle: "ELEVATED EXPRESSWAY",
    distance: 1100,
    difficulty: 2,
    reward: 6000,
    rivals: 6,
    trafficDensity: 1.15,
    description:
      "A wide expressway stacked with interchanges. Two real flyover choices: fly high and fast, or stay low through traffic.",
    sky: { ...NIGHT_CITY, fog: "#0d1436" },
    segments: [
      { len: 150, env: "highway", label: "NORTH HIGHWAY" },
      { len: 140, turn: 8, env: "highway", label: "EXIT 12" },
      { len: 180, env: "highway" },
      { len: 160, turn: -12, env: "city", label: "CITY CENTRE" },
      { len: 170, env: "highway", label: "EXPRESSWAY" },
      { len: 150, turn: 14, env: "city" },
      { len: 150, env: "highway", label: "FINISH 200 m" },
    ],
    branches: [
      { start: 200, end: 430, groundOffset: 22, height: 10, signs: ["ELEVATED EXPRESSWAY", "GROUND ROAD"] },
      { start: 640, end: 900, groundOffset: -22, height: 12, signs: ["SKYWAY", "CITY ROUTE"] },
    ],
  },
  {
    id: "mountain",
    name: "MOUNTAIN EDGE",
    subtitle: "CLIFFSIDE PASS",
    distance: 1200,
    difficulty: 3,
    reward: 7500,
    rivals: 6,
    trafficDensity: 0.7,
    description:
      "Suburban highway climbing into a guard-railed mountain pass. Tunnels, rock walls, real elevation change.",
    sky: { top: "#060a1e", bottom: "#122040", fog: "#0b1128", fogNear: 50, fogFar: 380 },
    segments: [
      { len: 130, env: "suburb", label: "MOUNTAIN PASS" },
      { len: 150, turn: 16, rise: 18, env: "mountain" },
      { len: 130, rise: 14, env: "mountain", label: "ROCK WALLS" },
      { len: 110, turn: -22, rise: 8, env: "tunnel", label: "TUNNEL" },
      { len: 150, turn: 20, env: "mountain", label: "VIEWPOINT" },
      { len: 170, rise: -22, turn: -16, env: "mountain" },
      { len: 180, rise: -14, env: "suburb", label: "FOREST ROAD" },
      { len: 180, env: "highway", label: "FINISH 200 m" },
    ],
    branches: [],
  },
  {
    id: "coast",
    name: "MOONLIT COAST",
    subtitle: "OCEAN EXPRESSWAY",
    distance: 1800,
    difficulty: 4,
    reward: 9000,
    rivals: 7,
    trafficDensity: 0.9,
    moon: true,
    description:
      "Long coastal highway under a huge moon. Palm trees, ocean reflections, a bridge and a sleepy coastal town.",
    sky: { top: "#04081c", bottom: "#0e2a4a", fog: "#08162e", fogNear: 90, fogFar: 620 },
    segments: [
      { len: 160, env: "suburb", label: "BEACH ROAD" },
      { len: 200, turn: 12, env: "coast", label: "COASTAL ROAD" },
      { len: 260, env: "coast" },
      { len: 200, turn: -14, env: "coast", label: "COASTAL TOWN" },
      { len: 240, env: "coast", label: "BRIDGE" },
      { len: 220, turn: 16, env: "coast" },
      { len: 260, env: "coast", label: "MOONLIT EXPRESSWAY" },
      { len: 260, env: "highway", label: "FINISH 260 m" },
    ],
    branches: [{ start: 980, end: 1240, groundOffset: 24, height: 11, signs: ["BRIDGE", "SHORE ROAD"] }],
  },
  {
    id: "grandprix",
    name: "CITY-OCEAN GRAND PRIX",
    subtitle: "THE FULL CIRCUIT",
    distance: 2400,
    difficulty: 5,
    reward: 14000,
    rivals: 7,
    trafficDensity: 1.2,
    moon: true,
    description:
      "One continuous route: downtown, urban highway, interchange, expressway, suburbs, the coast, and back into the city.",
    sky: { top: "#070c26", bottom: "#16294f", fog: "#0d1734", fogNear: 80, fogFar: 560 },
    segments: [
      { len: 200, env: "city", label: "DOWNTOWN" },
      { len: 180, turn: 12, env: "city" },
      { len: 220, env: "highway", label: "URBAN HIGHWAY" },
      { len: 200, turn: -14, rise: 6, env: "highway", label: "INTERCHANGE" },
      { len: 240, env: "highway", label: "EXPRESSWAY" },
      { len: 220, turn: 16, rise: -6, env: "suburb", label: "AIRPORT" },
      { len: 260, env: "coast", label: "COASTAL ROAD" },
      { len: 240, turn: -12, env: "coast" },
      { len: 220, env: "coast", label: "COASTAL CITY" },
      { len: 220, turn: 14, env: "city", label: "CITY APPROACH" },
      { len: 200, env: "city", label: "FINISH 200 m" },
    ],
    branches: [
      { start: 600, end: 860, groundOffset: 22, height: 11, signs: ["FLYOVER", "GROUND ROUTE"] },
      { start: 1700, end: 1960, groundOffset: -24, height: 10, signs: ["OCEAN BRIDGE", "SHORE ROAD"] },
    ],
  },
  {
    id: "harbor",
    name: "HARBOR FREIGHT RUN",
    subtitle: "DOCKLANDS HAUL",
    distance: 1400,
    difficulty: 2,
    reward: 5500,
    rivals: 6,
    trafficDensity: 1.1,
    description:
      "Industrial docks at full chat. Container yards, warehouse tunnels, cranes on the skyline and a flyover over the freight yard.",
    sky: { top: "#081026", bottom: "#152244", fog: "#0e1730", fogNear: 55, fogFar: 420 },
    segments: [
      { len: 160, env: "suburb", label: "DOCKS ENTRANCE" },
      { len: 180, turn: 10, env: "highway" },
      { len: 160, env: "tunnel", label: "WAREHOUSE TUNNEL" },
      { len: 140, turn: -12, env: "tunnel" },
      { len: 200, env: "city", label: "FREIGHT YARD" },
      { len: 180, turn: 8, env: "city" },
      { len: 180, env: "coast", label: "HARBOR WALL" },
      { len: 180, env: "highway", label: "FINISH 180 m" },
    ],
    branches: [{ start: 700, end: 960, groundOffset: 20, height: 9, signs: ["YARD FLYOVER", "YARD ROAD"] }],
  },
  {
    id: "ringroad",
    name: "RING ROAD RUSH",
    subtitle: "ORBITAL EXPRESSWAY",
    distance: 1600,
    difficulty: 3,
    reward: 6800,
    rivals: 6,
    trafficDensity: 1.25,
    description:
      "The city's orbital ring at rush hour. Wall-to-wall traffic, sweeping bends and two interchanges — pick your flyovers wisely.",
    sky: { top: "#0a0e2c", bottom: "#1d2050", fog: "#12163a", fogNear: 70, fogFar: 500 },
    segments: [
      { len: 200, env: "highway", label: "RING ROAD" },
      { len: 180, turn: 12, env: "highway" },
      { len: 200, env: "highway", label: "INTERCHANGE 7" },
      { len: 160, turn: -10, env: "city" },
      { len: 220, env: "highway", label: "OUTER LANE" },
      { len: 180, turn: 10, env: "highway" },
      { len: 180, env: "city", label: "CITY SPOUT" },
      { len: 280, env: "highway", label: "FINISH 280 m" },
    ],
    branches: [
      { start: 480, end: 720, groundOffset: -22, height: 11, signs: ["RAMP EAST", "SERVICE ROAD"] },
      { start: 1080, end: 1320, groundOffset: 22, height: 10, signs: ["RAMP WEST", "GROUND LANE"] },
    ],
  },
  {
    id: "tunnelspider",
    name: "TUNNEL SPIDER",
    subtitle: "THE UNDERGROUND WEB",
    distance: 1500,
    difficulty: 3,
    reward: 7000,
    rivals: 6,
    trafficDensity: 0.85,
    description:
      "A sprint stitched through the city's service tunnels. Flickering lights, echoing walls and almost no room for error.",
    sky: { top: "#05060f", bottom: "#101426", fog: "#080b16", fogNear: 40, fogFar: 300 },
    segments: [
      { len: 170, env: "city", label: "TUNNEL ENTRANCE" },
      { len: 200, env: "tunnel", label: "SERVICE TUNNEL" },
      { len: 160, turn: -10, env: "tunnel" },
      { len: 200, env: "highway", label: "VENT SHAFT ROAD" },
      { len: 180, turn: 14, env: "city" },
      { len: 200, env: "tunnel", label: "DEEP TUNNEL" },
      { len: 190, turn: -12, env: "city", label: "OLD TOWN" },
      { len: 200, env: "highway", label: "FINISH 200 m" },
    ],
    branches: [],
  },
  {
    id: "skylinecrest",
    name: "SKYLINE CREST",
    subtitle: "PEAK TO PIER",
    distance: 2000,
    difficulty: 4,
    reward: 9800,
    rivals: 7,
    trafficDensity: 0.75,
    description:
      "Climb the ridge road through rock walls and tunnels, then drop the whole elevation into the coastal district. Brakes matter.",
    sky: { top: "#060a1e", bottom: "#122040", fog: "#0b1128", fogNear: 60, fogFar: 440 },
    segments: [
      { len: 160, env: "suburb", label: "RIDGE ROAD" },
      { len: 200, rise: 20, env: "mountain" },
      { len: 180, turn: 18, rise: 12, env: "mountain", label: "HAIRPIN" },
      { len: 200, rise: 6, env: "tunnel", label: "SUMMIT TUNNEL" },
      { len: 220, env: "mountain", label: "CREST VIEW" },
      { len: 180, turn: -16, rise: -18, env: "mountain" },
      { len: 220, rise: -10, env: "coast", label: "DESCENT" },
      { len: 220, env: "coast" },
      { len: 180, turn: 10, env: "coast", label: "PIER ROAD" },
      { len: 240, env: "city", label: "COASTAL CITY" },
      { len: 220, env: "highway", label: "FINISH 220 m" },
    ],
    branches: [{ start: 1150, end: 1420, groundOffset: 24, height: 12, signs: ["CLIFF VIADUCT", "SHORE ROAD"] }],
  },
  {
    id: "midnight3000",
    name: "MIDNIGHT 3000",
    subtitle: "THE FULL MOON MARATHON",
    distance: 3000,
    difficulty: 5,
    reward: 18000,
    rivals: 8,
    trafficDensity: 1.15,
    moon: true,
    description:
      "Everything the city has, in one run: downtown, tunnels, mountain passes, the coast and back under a full moon. For legends only.",
    sky: { top: "#04081c", bottom: "#0e2a4a", fog: "#08162e", fogNear: 90, fogFar: 640 },
    segments: [
      { len: 220, env: "city", label: "DOWNTOWN START" },
      { len: 200, turn: 12, env: "city" },
      { len: 240, env: "highway", label: "URBAN HIGHWAY" },
      { len: 220, turn: -12, rise: 8, env: "highway", label: "INTERCHANGE" },
      { len: 240, env: "tunnel", label: "NORTH TUNNEL" },
      { len: 220, turn: 16, env: "suburb", label: "HILL SUBURB" },
      { len: 240, rise: 14, env: "mountain", label: "MOUNTAIN PASS" },
      { len: 220, turn: -14, env: "mountain" },
      { len: 260, env: "coast", label: "MOONLIT COAST" },
      { len: 240, turn: 10, env: "coast" },
      { len: 280, env: "highway", label: "COASTAL EXPRESSWAY" },
      { len: 240, env: "tunnel", label: "RETURN TUNNEL" },
      { len: 240, env: "city", label: "CITY APPROACH" },
      { len: 160, env: "highway", label: "FINISH 160 m" },
    ],
    branches: [
      { start: 760, end: 1040, groundOffset: 22, height: 11, signs: ["HILL FLYOVER", "VALLEY ROAD"] },
      { start: 2180, end: 2460, groundOffset: -24, height: 10, signs: ["OCEAN BRIDGE", "SHORE ROAD"] },
    ],
  },
];

export const getRace = (id: string): RaceDef => RACES.find((r) => r.id === id) ?? RACES[0]!;

/* --------------------------------------------------------------- sampling */

export type Route = {
  race: RaceDef;
  samples: Sample[];
  length: number;
  checkpoints: number[]; // distances along route
  signs: { s: number; text: string }[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

export function buildRoute(raceId: string): Route {
  const race = getRace(raceId);
  const samples: Sample[] = [];
  const signs: { s: number; text: string }[] = [];

  let x = 0;
  let z = 0;
  let y = 0;
  let heading = 0;
  let s = 0;

  for (const seg of race.segments) {
    if (seg.label) signs.push({ s: s + 30, text: seg.label });
    const steps = Math.max(2, Math.round(seg.len / STEP));
    const dTurn = ((seg.turn ?? 0) * Math.PI) / 180 / steps;
    const dRise = (seg.rise ?? 0) / steps;
    for (let i = 0; i < steps; i++) {
      // smooth (ease in/out) curvature so the road never rotates abruptly
      const t = (i + 0.5) / steps;
      const ease = 6 * t * (1 - t); // integrates to 1 over [0,1]
      heading += dTurn * ease;
      const step = seg.len / steps;
      x += Math.sin(heading) * step;
      z += Math.cos(heading) * step;
      y += dRise * ease;
      s += step;
      samples.push({ s, x, z, y, heading, env: seg.env });
    }
  }

  const length = s;
  const checkpoints: number[] = [];
  const cpCount = Math.max(4, Math.round(length / 220));
  for (let i = 1; i <= cpCount; i++) checkpoints.push((length * i) / (cpCount + 1));

  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (const p of samples) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }

  return { race, samples, length, checkpoints, signs, bounds: { minX, maxX, minZ, maxZ } };
}

/* ---------------------------------------------------------------- queries */

/**
 * Continuous sample lookup: finds the two samples bracketing `s` and blends
 * them. Snapping to the nearest sample makes motion quantise to the sample
 * spacing, which reads as a stutter at speed.
 */
export function sampleAt(route: Route, s: number): Sample {
  const arr = route.samples;
  const last = arr.length - 1;
  const clamped = Math.max(0, Math.min(route.length - 0.001, s));

  // start from the uniform guess, then walk to the true bracket (segments can
  // have slightly different step sizes)
  let i = Math.min(last, Math.max(0, Math.floor((clamped / route.length) * arr.length)));
  while (i > 0 && arr[i]!.s > clamped) i--;
  while (i < last && arr[i + 1]!.s <= clamped) i++;

  const a = arr[i]!;
  const b = arr[Math.min(last, i + 1)]!;
  const span = b.s - a.s;
  if (span <= 1e-6) return a;
  const t = Math.max(0, Math.min(1, (clamped - a.s) / span));

  // heading is monotonic-ish here, but normalise the delta to be safe
  let dh = b.heading - a.heading;
  while (dh > Math.PI) dh -= Math.PI * 2;
  while (dh < -Math.PI) dh += Math.PI * 2;

  return {
    s: clamped,
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    y: a.y + (b.y - a.y) * t,
    heading: a.heading + dh * t,
    env: t < 0.5 ? a.env : b.env,
  };
}


/** Smoothstep helper for branch blending */
const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

export type BranchState = "flyover" | "ground";

/**
 * Lateral offset + extra height of a branch's centreline at distance s.
 * Both routes start and end at offset 0 / height 0 so they truly reconnect.
 */
export function branchCentre(b: BranchDef, s: number, which: BranchState) {
  if (s <= b.start || s >= b.end) return { offset: 0, height: 0 };
  const t = (s - b.start) / (b.end - b.start);
  const bump = Math.sin(Math.PI * smooth(t) * 1) ; // 0 -> 1 -> 0
  const flat = Math.sin(Math.PI * t);
  if (which === "flyover") {
    return { offset: 0, height: b.height * Math.min(1, flat * 1.6) };
  }
  return { offset: b.groundOffset * Math.min(1, bump * 1.6), height: 0 };
}

export function activeBranch(route: Route, s: number): BranchDef | null {
  for (const b of route.race.branches) if (s > b.start && s < b.end) return b;
  return null;
}

export function nextBranch(route: Route, s: number): BranchDef | null {
  for (const b of route.race.branches) if (b.end > s) return b;
  return null;
}

/** World position of a point given route distance, lateral offset and branch. */
export function worldPos(
  route: Route,
  s: number,
  lateral: number,
  branchSel: Record<number, BranchState> = {},
) {
  const p = sampleAt(route, s);
  let off = 0;
  let h = 0;
  for (let i = 0; i < route.race.branches.length; i++) {
    const b = route.race.branches[i]!;
    if (s > b.start && s < b.end) {
      const which = branchSel[i] ?? "ground";
      const c = branchCentre(b, s, which);
      off += c.offset;
      h += c.height;
    }
  }
  const nx = Math.cos(p.heading);
  const nz = -Math.sin(p.heading);
  return {
    x: p.x + nx * (lateral + off),
    z: p.z + nz * (lateral + off),
    y: p.y + h,
    heading: p.heading,
    env: p.env,
  };
}
