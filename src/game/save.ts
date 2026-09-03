import { CARS, UPGRADE_COST } from "./cars";
import { RACES } from "./route";

export type Upgrades = { engine: number; handling: number; brakes: number };

export type SaveData = {
  cash: number;
  ownedCars: string[];
  selectedCar: string;
  paint: Record<string, string>;
  wheels: Record<string, string>;
  upgrades: Record<string, Upgrades>;
  unlockedRaces: string[];
  bestTimes: Record<string, number>;
};

const KEY = "velocity-city-save-v1";

export const defaultSave = (): SaveData => ({
  cash: 25000,
  ownedCars: [CARS[0]!.id],
  selectedCar: CARS[0]!.id,
  paint: { [CARS[0]!.id]: "blue" },
  wheels: { [CARS[0]!.id]: "standard" },
  upgrades: {},
  unlockedRaces: [RACES[0]!.id, RACES[1]!.id],
  bestTimes: {},
});

export function loadSave(): SaveData {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...(JSON.parse(raw) as SaveData) };
  } catch {
    return defaultSave();
  }
}

export function persistSave(data: SaveData) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — game still playable */
  }
}

export const upgradesFor = (save: SaveData, carId: string): Upgrades =>
  save.upgrades[carId] ?? { engine: 0, handling: 0, brakes: 0 };

export const upgradeCost = (level: number) => UPGRADE_COST[Math.min(level + 1, UPGRADE_COST.length - 1)] ?? 0;
