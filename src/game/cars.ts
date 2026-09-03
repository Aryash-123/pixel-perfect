/** 11 cars — each with a genuinely different silhouette, built procedurally. */

export type CarClass = "SPORT" | "SUPER" | "MUSCLE" | "HYPER" | "GT";

export type CarShape = {
  len: number;
  width: number;
  noseH: number; // nose height (m)
  hoodH: number;
  hoodEnd: number; // 0..1 fraction of half-length where windshield starts
  roofH: number;
  roofFront: number; // fraction of half-length (positive = toward front)
  roofRear: number; // fraction of half-length (negative = toward rear)
  tailH: number;
  wheelR: number;
  wheelW: number;
  spoiler: number; // 0 = none, height in m
  spoilerWidthPct: number;
  intakes: boolean;
  diffuser: boolean;
  exhausts: 1 | 2 | 4;
  fenderFlare: number;
};

export type CarDef = {
  id: string;
  name: string;
  klass: CarClass;
  price: number;
  topSpeed: number; // km/h at 0 upgrades
  accel: number; // 1..10
  handling: number; // 1..10
  braking: number; // 1..10
  shape: CarShape;
  accent: string; // emissive trim colour
};

const base: CarShape = {
  len: 4.5,
  width: 1.95,
  noseH: 0.72,
  hoodH: 0.86,
  hoodEnd: 0.42,
  roofH: 1.36,
  roofFront: 0.16,
  roofRear: -0.42,
  tailH: 0.95,
  wheelR: 0.36,
  wheelW: 0.3,
  spoiler: 0.16,
  spoilerWidthPct: 0.9,
  intakes: false,
  diffuser: false,
  exhausts: 2,
  fenderFlare: 0.06,
};

export const CARS: CarDef[] = [
  {
    id: "gtx",
    name: "SHIRO GT-X",
    klass: "SPORT",
    price: 0,
    topSpeed: 246,
    accel: 6,
    handling: 6,
    braking: 6,
    accent: "#7ad7ff",
    shape: { ...base },
  },
  {
    id: "carrera",
    name: "PORTA 9-ELEVEN",
    klass: "SPORT",
    price: 32000,
    topSpeed: 258,
    accel: 6.5,
    handling: 7.5,
    braking: 7,
    accent: "#ffd36e",
    shape: {
      ...base,
      len: 4.35,
      width: 1.88,
      noseH: 0.62,
      hoodH: 0.78,
      hoodEnd: 0.34,
      roofH: 1.3,
      roofFront: 0.1,
      roofRear: -0.2,
      tailH: 1.06,
      spoiler: 0.1,
      exhausts: 2,
    },
  },
  {
    id: "m4",
    name: "BAVAR M-FOUR",
    klass: "GT",
    price: 46000,
    topSpeed: 264,
    accel: 7,
    handling: 7,
    braking: 7.5,
    accent: "#8fffc2",
    shape: {
      ...base,
      len: 4.75,
      width: 2.0,
      hoodEnd: 0.5,
      hoodH: 0.9,
      roofH: 1.38,
      roofFront: 0.06,
      roofRear: -0.46,
      tailH: 0.98,
      wheelR: 0.38,
      fenderFlare: 0.1,
      spoiler: 0.12,
      exhausts: 4,
    },
  },
  {
    id: "huracan",
    name: "TORO HURACAO",
    klass: "SUPER",
    price: 78000,
    topSpeed: 302,
    accel: 8.4,
    handling: 8,
    braking: 8,
    accent: "#ffe14d",
    shape: {
      ...base,
      len: 4.6,
      width: 2.1,
      noseH: 0.42,
      hoodH: 0.6,
      hoodEnd: 0.3,
      roofH: 1.14,
      roofFront: -0.02,
      roofRear: -0.38,
      tailH: 0.9,
      wheelR: 0.38,
      wheelW: 0.36,
      spoiler: 0.1,
      intakes: true,
      diffuser: true,
      exhausts: 2,
      fenderFlare: 0.13,
    },
  },
  {
    id: "s720",
    name: "MCLAIN 720-S",
    klass: "SUPER",
    price: 96000,
    topSpeed: 316,
    accel: 8.8,
    handling: 8.6,
    braking: 8.5,
    accent: "#ff9a3c",
    shape: {
      ...base,
      len: 4.7,
      width: 2.06,
      noseH: 0.4,
      hoodH: 0.66,
      hoodEnd: 0.26,
      roofH: 1.18,
      roofFront: 0.0,
      roofRear: -0.3,
      tailH: 0.82,
      wheelR: 0.39,
      wheelW: 0.35,
      spoiler: 0.2,
      spoilerWidthPct: 1.0,
      intakes: true,
      diffuser: true,
      exhausts: 2,
      fenderFlare: 0.14,
    },
  },
  {
    id: "supra",
    name: "TOYA SUPREME",
    klass: "SPORT",
    price: 54000,
    topSpeed: 272,
    accel: 7.4,
    handling: 7.2,
    braking: 7,
    accent: "#ff5e7a",
    shape: {
      ...base,
      len: 4.4,
      width: 1.94,
      noseH: 0.58,
      hoodH: 0.82,
      hoodEnd: 0.44,
      roofH: 1.28,
      roofFront: 0.08,
      roofRear: -0.28,
      tailH: 1.0,
      wheelR: 0.37,
      wheelW: 0.34,
      spoiler: 0.28,
      spoilerWidthPct: 0.95,
      exhausts: 2,
      fenderFlare: 0.12,
    },
  },
  {
    id: "r8",
    name: "AUDIX R-EIGHT",
    klass: "SUPER",
    price: 84000,
    topSpeed: 298,
    accel: 8.2,
    handling: 8.2,
    braking: 8,
    accent: "#c9d6ff",
    shape: {
      ...base,
      len: 4.62,
      width: 2.08,
      noseH: 0.48,
      hoodH: 0.72,
      hoodEnd: 0.34,
      roofH: 1.2,
      roofFront: 0.02,
      roofRear: -0.34,
      tailH: 0.94,
      wheelR: 0.39,
      wheelW: 0.35,
      spoiler: 0.08,
      intakes: true,
      exhausts: 2,
      fenderFlare: 0.12,
    },
  },
  {
    id: "stang",
    name: "STALLION GT",
    klass: "MUSCLE",
    price: 42000,
    topSpeed: 256,
    accel: 7.6,
    handling: 5.6,
    braking: 6,
    accent: "#ff7a2f",
    shape: {
      ...base,
      len: 4.85,
      width: 2.04,
      noseH: 0.76,
      hoodH: 0.94,
      hoodEnd: 0.54,
      roofH: 1.42,
      roofFront: 0.04,
      roofRear: -0.4,
      tailH: 1.06,
      wheelR: 0.4,
      wheelW: 0.38,
      spoiler: 0.1,
      exhausts: 4,
      fenderFlare: 0.14,
    },
  },
  {
    id: "vette",
    name: "CHEVRA CORVET",
    klass: "SUPER",
    price: 88000,
    topSpeed: 304,
    accel: 8.5,
    handling: 8.0,
    braking: 8.2,
    accent: "#ffe98a",
    shape: {
      ...base,
      len: 4.68,
      width: 2.12,
      noseH: 0.38,
      hoodH: 0.64,
      hoodEnd: 0.28,
      roofH: 1.16,
      roofFront: 0.0,
      roofRear: -0.36,
      tailH: 1.0,
      wheelR: 0.39,
      wheelW: 0.4,
      spoiler: 0.14,
      intakes: true,
      diffuser: true,
      exhausts: 4,
      fenderFlare: 0.16,
    },
  },
  {
    id: "vantage",
    name: "ASTON VANTA",
    klass: "GT",
    price: 105000,
    topSpeed: 308,
    accel: 8.6,
    handling: 8.4,
    braking: 8.4,
    accent: "#9effd6",
    shape: {
      ...base,
      len: 4.78,
      width: 2.02,
      noseH: 0.56,
      hoodH: 0.84,
      hoodEnd: 0.48,
      roofH: 1.26,
      roofFront: 0.0,
      roofRear: -0.3,
      tailH: 0.98,
      wheelR: 0.4,
      wheelW: 0.36,
      spoiler: 0.06,
      exhausts: 4,
      fenderFlare: 0.11,
    },
  },
  {
    id: "f488",
    name: "FERRANO 488-GTB",
    klass: "HYPER",
    price: 148000,
    topSpeed: 332,
    accel: 9.6,
    handling: 9.2,
    braking: 9.2,
    accent: "#ff3b3b",
    shape: {
      ...base,
      len: 4.72,
      width: 2.16,
      noseH: 0.34,
      hoodH: 0.6,
      hoodEnd: 0.24,
      roofH: 1.12,
      roofFront: -0.04,
      roofRear: -0.32,
      tailH: 0.9,
      wheelR: 0.41,
      wheelW: 0.42,
      spoiler: 0.24,
      spoilerWidthPct: 1.05,
      intakes: true,
      diffuser: true,
      exhausts: 4,
      fenderFlare: 0.18,
    },
  },
];

export const PAINTS = [
  { id: "red", name: "INFERNO RED", hex: "#d81f2a" },
  { id: "blue", name: "AZURE BLUE", hex: "#1f5ad8" },
  { id: "black", name: "MIDNIGHT", hex: "#141519" },
  { id: "white", name: "PEARL WHITE", hex: "#e9ecf2" },
  { id: "silver", name: "LIQUID SILVER", hex: "#9aa4b2" },
  { id: "green", name: "TOXIC GREEN", hex: "#1fb355" },
  { id: "purple", name: "ULTRAVIOLET", hex: "#7b32d6" },
  { id: "orange", name: "SOLAR ORANGE", hex: "#f0721a" },
];

export const WHEELS = [
  { id: "standard", name: "STANDARD", spokes: 5, rim: "#3c4048", lip: 0.05, handling: 0 },
  { id: "sport", name: "SPORT", spokes: 7, rim: "#7f8792", lip: 0.07, handling: 0.2 },
  { id: "racing", name: "RACING", spokes: 10, rim: "#c9ced6", lip: 0.09, handling: 0.4 },
  { id: "premium", name: "PREMIUM", spokes: 12, rim: "#d8b25a", lip: 0.11, handling: 0.6 },
];

export const getCar = (id: string): CarDef => CARS.find((c) => c.id === id) ?? CARS[0]!;
export const getPaint = (id: string) => PAINTS.find((p) => p.id === id) ?? PAINTS[0]!;
export const getWheel = (id: string) => WHEELS.find((w) => w.id === id) ?? WHEELS[0]!;

export const UPGRADE_COST = [0, 6000, 12000, 20000, 32000];

/** Final performance numbers used by the physics, after upgrades. */
export function carPerformance(car: CarDef, up: { engine: number; handling: number; brakes: number }, wheelId: string) {
  const wheel = getWheel(wheelId);
  return {
    topSpeed: car.topSpeed * (1 + up.engine * 0.045),
    accel: car.accel * (1 + up.engine * 0.05),
    handling: car.handling * (1 + up.handling * 0.05) + wheel.handling,
    braking: car.braking * (1 + up.brakes * 0.06),
  };
}
