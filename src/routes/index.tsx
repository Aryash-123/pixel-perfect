import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Home } from "@/components/game/screens/Home";
import { RaceSelect } from "@/components/game/screens/RaceSelect";
import { Garage } from "@/components/game/screens/Garage";
import { Result } from "@/components/game/screens/Result";
import { Hud } from "@/components/game/Hud";
import { RaceScene, type RaceResult } from "@/components/game/RaceScene";
import { buildRoute, RACES } from "@/game/route";
import { carPerformance, getCar } from "@/game/cars";
import {
  defaultSave,
  loadSave,
  persistSave,
  upgradeCost,
  upgradesFor,
  type SaveData,
} from "@/game/save";
import { hudStore } from "@/game/hudStore";

const TITLE = "Velocity City — Open-World 3D Street Racing";
const DESC =
  "Race five connected neon routes with live traffic, flyover shortcuts, rival drivers, 11 cars, upgrades and lap records — playable in your browser.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

type Screen = "home" | "select" | "garage" | "race" | "result";

function Game() {
  const [save, setSave] = useState<SaveData>(() => defaultSave());
  const [screen, setScreen] = useState<Screen>("home");
  const [raceId, setRaceId] = useState(RACES[0]!.id);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [meta, setMeta] = useState<{ isRecord: boolean; unlockedName: string | null }>({
    isRecord: false,
    unlockedName: null,
  });
  const [webglOk, setWebglOk] = useState(true);

  // hydrate from storage on the client only
  useEffect(() => setSave(loadSave()), []);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebglOk(Boolean(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebglOk(false);
    }
  }, []);

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave((prev) => {
      const next = fn(prev);
      persistSave(next);
      return next;
    });
  }, []);

  const car = getCar(save.selectedCar);
  const paintId = save.paint[car.id] ?? "blue";
  const wheelId = save.wheels[car.id] ?? "standard";
  const perf = useMemo(
    () => carPerformance(car, upgradesFor(save, car.id), wheelId),
    [car, save, wheelId],
  );

  const route = useMemo(() => buildRoute(raceId), [raceId]);

  const startRace = useCallback((id: string) => {
    hudStore.reset();
    setRaceId(id);
    setResult(null);
    setScreen("race");
  }, []);

  const quitRace = useCallback(() => {
    hudStore.reset();
    setScreen("select");
  }, []);

  useEffect(() => {
    if (screen !== "race") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") quitRace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, quitRace]);

  const onFinish = useCallback(
    (r: RaceResult) => {
      const prevBest = save.bestTimes[raceId];
      const isRecord = prevBest === undefined || r.time < prevBest;
      const idx = RACES.findIndex((x) => x.id === raceId);
      const next = RACES[idx + 1];
      const unlockedName =
        r.won && next && !save.unlockedRaces.includes(next.id) ? next.name : null;

      update((s) => ({
        ...s,
        cash: s.cash + r.reward,
        bestTimes: isRecord ? { ...s.bestTimes, [raceId]: r.time } : s.bestTimes,
        unlockedRaces:
          r.won && next && !s.unlockedRaces.includes(next.id)
            ? [...s.unlockedRaces, next.id]
            : s.unlockedRaces,
      }));
      setMeta({ isRecord, unlockedName });
      setResult(r);
      setScreen("result");
    },
    [raceId, save.bestTimes, save.unlockedRaces, update],
  );

  return (
    <main className="vc-root min-h-screen">
      {!webglOk && (
        <div className="fixed inset-x-0 top-0 z-50 bg-[color:var(--vc-hot)] px-4 py-2 text-center text-xs tracking-[0.2em] text-black">
          3D GRAPHICS UNAVAILABLE IN THIS BROWSER — MENUS STILL WORK
        </div>
      )}

      {screen === "home" && (
        <Home
          save={save}
          onRace={() => setScreen("select")}
          onGarage={() => setScreen("garage")}
          onReset={() => update(() => defaultSave())}
        />
      )}

      {screen === "select" && (
        <RaceSelect
          save={save}
          onStart={startRace}
          onBack={() => setScreen("home")}
          onGarage={() => setScreen("garage")}
        />
      )}

      {screen === "garage" && (
        <Garage
          save={save}
          onBack={() => setScreen("home")}
          onSelect={(id) => update((s) => ({ ...s, selectedCar: id }))}
          onBuy={(id) =>
            update((s) => {
              const c = getCar(id);
              if (s.ownedCars.includes(id) || s.cash < c.price) return s;
              return {
                ...s,
                cash: s.cash - c.price,
                ownedCars: [...s.ownedCars, id],
                selectedCar: id,
                paint: { ...s.paint, [id]: s.paint[id] ?? "black" },
                wheels: { ...s.wheels, [id]: s.wheels[id] ?? "standard" },
              };
            })
          }
          onPaint={(pid) =>
            update((s) => ({ ...s, paint: { ...s.paint, [s.selectedCar]: pid } }))
          }
          onWheels={(wid) =>
            update((s) => ({ ...s, wheels: { ...s.wheels, [s.selectedCar]: wid } }))
          }
          onUpgrade={(kind) =>
            update((s) => {
              const cur = upgradesFor(s, s.selectedCar);
              if (cur[kind] >= 4) return s;
              const cost = upgradeCost(cur[kind]);
              if (s.cash < cost) return s;
              return {
                ...s,
                cash: s.cash - cost,
                upgrades: {
                  ...s.upgrades,
                  [s.selectedCar]: { ...cur, [kind]: cur[kind] + 1 },
                },
              };
            })
          }
        />
      )}

      {screen === "race" && (
        <div className="fixed inset-0 bg-black">
          {webglOk ? (
            <>
              <RaceScene
                raceId={raceId}
                carId={car.id}
                paintId={paintId}
                wheelId={wheelId}
                perf={perf}
                onFinish={onFinish}
              />
              <Hud route={route} onQuit={quitRace} />
              <TouchControls />
            </>

          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm tracking-[0.2em] text-[color:var(--vc-dim)]">
                THIS BROWSER CANNOT RENDER 3D GRAPHICS
              </p>
              <button
                onClick={quitRace}
                className="vc-display rounded-lg border border-[color:var(--vc-line)] px-6 py-3 text-[11px] tracking-[0.2em]"
              >
                BACK TO ROUTES
              </button>
            </div>
          )}
        </div>
      )}

      {screen === "result" && result && (
        <Result
          result={result}
          raceId={raceId}
          best={save.bestTimes[raceId]}
          isRecord={meta.isRecord}
          unlockedName={meta.unlockedName}
          onRetry={() => startRace(raceId)}
          onRoutes={() => setScreen("select")}
          onGarage={() => setScreen("garage")}
        />
      )}
    </main>
  );
}
