import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { CarMesh } from "../CarMesh";
import {
  CARS,
  PAINTS,
  WHEELS,
  carPerformance,
  getCar,
  type CarDef,
} from "@/game/cars";
import { upgradeCost, upgradesFor, type SaveData } from "@/game/save";
import { Header } from "./RaceSelect";
import { AnimatedBackdrop } from "./Home";

export function Garage({
  save,
  onBack,
  onSelect,
  onBuy,
  onPaint,
  onWheels,
  onUpgrade,
}: {
  save: SaveData;
  onBack: () => void;
  onSelect: (carId: string) => void;
  onBuy: (carId: string) => void;
  onPaint: (paintId: string) => void;
  onWheels: (wheelId: string) => void;
  onUpgrade: (kind: "engine" | "handling" | "brakes") => void;
}) {
  const [previewId, setPreviewId] = useState(save.selectedCar);
  const car = getCar(previewId);
  const owned = save.ownedCars.includes(car.id);
  const isActive = car.id === save.selectedCar;
  const paintId = save.paint[car.id] ?? "blue";
  const wheelId = save.wheels[car.id] ?? "standard";
  const up = upgradesFor(save, car.id);
  const perf = carPerformance(car, up, wheelId);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackdrop />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <Header
          title="GARAGE"
          onBack={onBack}
          right={
            <div className="vc-glass px-4 py-2 text-right">
              <div className="text-[9px] tracking-[0.26em] text-[color:var(--vc-dim)]">BANK</div>
              <div className="vc-display text-lg text-[color:var(--vc-gold)]">
                ${save.cash.toLocaleString()}
              </div>
            </div>
          }
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* preview + stats */}
          <div className="vc-glass overflow-hidden">
            <div className="h-[320px] bg-[radial-gradient(circle_at_50%_120%,#132248,#05070f_70%)]">
              <Suspense fallback={null}>
                <Canvas
                  dpr={[1, 1.6]}
                  camera={{ fov: 34, position: [5.4, 2.1, 5.4] }}
                  gl={{ antialias: true }}
                >
                  <hemisphereLight args={["#9fd8ff", "#0a1020", 1.1]} />
                  <directionalLight position={[6, 9, 5]} intensity={1.3} color="#dceaff" />
                  <pointLight position={[-5, 2, -4]} intensity={40} color="#ff3aa6" />
                  <pointLight position={[5, 2, -4]} intensity={40} color="#00e5ff" />
                  <Turntable car={car} paintId={paintId} wheelId={wheelId} />
                  <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
                    <circleGeometry args={[5.6, 48]} />
                    <meshStandardMaterial color="#0b1124" metalness={0.5} roughness={0.35} />
                  </mesh>
                </Canvas>
              </Suspense>
            </div>

            <div className="p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="vc-display text-2xl tracking-[0.1em] text-[color:var(--vc-neon)]">
                    {car.name}
                  </div>
                  <div className="mt-1 text-[11px] tracking-[0.26em] text-[color:var(--vc-dim)]">
                    {car.klass} · {owned ? "OWNED" : `$${car.price.toLocaleString()}`}
                  </div>
                </div>
                {!owned ? (
                  <button
                    disabled={save.cash < car.price}
                    onClick={() => onBuy(car.id)}
                    className="vc-display rounded-lg px-6 py-3 text-[11px] font-bold tracking-[0.22em] disabled:bg-[rgba(255,255,255,0.08)] disabled:text-[color:var(--vc-dim)] enabled:bg-[color:var(--vc-gold)] enabled:text-[#191203]"
                  >
                    {save.cash < car.price ? "NOT ENOUGH CASH" : "BUY"}
                  </button>
                ) : isActive ? (
                  <div className="vc-display text-[11px] tracking-[0.22em] text-[color:var(--vc-neon)]">
                    ACTIVE CAR
                  </div>
                ) : (
                  <button
                    onClick={() => onSelect(car.id)}
                    className="vc-display rounded-lg bg-[color:var(--vc-neon)] px-6 py-3 text-[11px] font-bold tracking-[0.22em] text-[#04141a]"
                  >
                    DRIVE THIS
                  </button>
                )}
              </div>

              <div className="mt-5 space-y-2.5">
                <Bar label="TOP SPEED" value={perf.topSpeed / 360} text={`${Math.round(perf.topSpeed)} km/h`} />
                <Bar label="ACCEL" value={perf.accel / 12} text={perf.accel.toFixed(1)} />
                <Bar label="HANDLING" value={perf.handling / 12} text={perf.handling.toFixed(1)} />
                <Bar label="BRAKES" value={perf.braking / 12} text={perf.braking.toFixed(1)} />
              </div>

              {owned && (
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {(["engine", "handling", "brakes"] as const).map((k) => {
                    const lvl = up[k];
                    const cost = upgradeCost(lvl);
                    const maxed = lvl >= 4;
                    return (
                      <button
                        key={k}
                        disabled={maxed || save.cash < cost}
                        onClick={() => onUpgrade(k)}
                        className="rounded-lg border border-[color:var(--vc-line)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5 text-left transition-colors enabled:hover:border-[color:var(--vc-neon)] disabled:opacity-45"
                      >
                        <div className="text-[9px] tracking-[0.24em] text-[color:var(--vc-dim)]">
                          {k.toUpperCase()}
                        </div>
                        <div className="mt-1 flex items-center gap-[3px]">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <span
                              key={i}
                              className="h-2 flex-1 rounded-sm"
                              style={{
                                background: i < lvl ? "var(--vc-neon)" : "rgba(255,255,255,0.12)",
                              }}
                            />
                          ))}
                        </div>
                        <div className="vc-display mt-1.5 text-[11px] text-[color:var(--vc-gold)]">
                          {maxed ? "MAX" : `$${cost.toLocaleString()}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* lists */}
          <div className="space-y-5">
            <Panel title="SHOWROOM">
              <div className="max-h-[268px] space-y-1.5 overflow-y-auto pr-1">
                {CARS.map((c) => {
                  const isOwned = save.ownedCars.includes(c.id);
                  const active = c.id === car.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-[color:var(--vc-neon)] bg-[rgba(0,229,255,0.08)]"
                          : "border-[color:var(--vc-line)] bg-[rgba(255,255,255,0.02)] hover:border-[color:var(--vc-hot)]"
                      }`}
                    >
                      <span>
                        <span className="vc-display block text-[12px] tracking-[0.1em]">
                          {c.name}
                        </span>
                        <span className="text-[9px] tracking-[0.22em] text-[color:var(--vc-dim)]">
                          {c.klass} · {c.topSpeed} KM/H
                        </span>
                      </span>
                      <span
                        className="vc-display text-[11px]"
                        style={{ color: isOwned ? "var(--vc-neon)" : "var(--vc-gold)" }}
                      >
                        {isOwned ? "OWNED" : `$${(c.price / 1000).toFixed(0)}k`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel title="PAINT">
              <div className="flex flex-wrap gap-2">
                {PAINTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPaint(p.id)}
                    title={p.name}
                    className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                      paintId === p.id ? "border-[color:var(--vc-neon)]" : "border-white/15"
                    }`}
                    style={{ background: p.hex }}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="WHEELS">
              <div className="grid grid-cols-2 gap-2">
                {WHEELS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => onWheels(w.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-[10px] tracking-[0.2em] transition-colors ${
                      wheelId === w.id
                        ? "border-[color:var(--vc-neon)] text-[color:var(--vc-neon)]"
                        : "border-[color:var(--vc-line)] text-[color:var(--vc-dim)] hover:text-[color:var(--vc-text)]"
                    }`}
                  >
                    {w.name}
                    <span className="mt-0.5 block text-[9px] text-[color:var(--vc-dim)]">
                      +{w.handling.toFixed(1)} GRIP
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Turntable({
  car,
  paintId,
  wheelId,
}: {
  car: CarDef;
  paintId: string;
  wheelId: string;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.45;
  });
  return (
    <group ref={g}>
      <CarMesh car={car} paintId={paintId} wheelId={wheelId} headlights={false} />
    </group>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="vc-glass p-4">
      <div className="mb-3 text-[9px] tracking-[0.28em] text-[color:var(--vc-dim)]">{title}</div>
      {children}
    </div>
  );
}

function Bar({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] tracking-[0.24em] text-[color:var(--vc-dim)]">
        <span>{label}</span>
        <span className="text-[color:var(--vc-text)]">{text}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--vc-neon),var(--vc-hot))]"
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
    </div>
  );
}
