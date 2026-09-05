import { RACES, type RaceDef } from "@/game/route";
import { getCar } from "@/game/cars";
import type { SaveData } from "@/game/save";
import { fmtTime } from "../Hud";
import { AnimatedBackdrop } from "./Home";

export function RaceSelect({
  save,
  onStart,
  onBack,
  onGarage,
}: {
  save: SaveData;
  onStart: (raceId: string) => void;
  onBack: () => void;
  onGarage: () => void;
}) {
  const car = getCar(save.selectedCar);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackdrop />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <Header
          title="ROUTE SELECT"
          onBack={onBack}
          right={
            <button
              onClick={onGarage}
              className="vc-display rounded-lg border border-[color:var(--vc-line)] bg-[color:var(--vc-panel)] px-4 py-2 text-[11px] tracking-[0.22em] text-[color:var(--vc-dim)] transition-colors hover:text-[color:var(--vc-neon)]"
            >
              GARAGE · {car.name}
            </button>
          }
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {RACES.map((race, i) => {
            const unlocked =
              save.unlockedRaces.includes(race.id) ||
              (i > 0 && save.bestTimes[RACES[i - 1]!.id] !== undefined);
            const best = save.bestTimes[race.id];
            return (
              <RaceCard
                key={race.id}
                race={race}
                unlocked={unlocked}
                best={best}
                onStart={() => onStart(race.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RaceCard({
  race,
  unlocked,
  best,
  onStart,
}: {
  race: RaceDef;
  unlocked: boolean;
  best: number | undefined;
  onStart: () => void;
}) {
  return (
    <div
      className={`vc-glass relative overflow-hidden p-5 transition-colors ${
        unlocked ? "hover:border-[color:var(--vc-neon)]" : "opacity-55"
      }`}
    >
      <div
        className="absolute inset-x-0 top-0 h-24 opacity-40"
        style={{
          background: `linear-gradient(180deg,${race.sky.top},transparent)`,
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="vc-display text-xl tracking-[0.12em] text-[color:var(--vc-neon)]">
              {race.name}
            </div>
            <div className="mt-1 text-[11px] tracking-[0.24em] text-[color:var(--vc-dim)]">
              {race.subtitle.toUpperCase()}
            </div>
          </div>
          <div className="flex gap-[3px] pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="h-4 w-[5px] rounded-sm"
                style={{
                  background:
                    i < race.difficulty ? "var(--vc-hot)" : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[color:var(--vc-dim)]">
          {race.description}
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <Cell label="KM" value={(race.distance / 1000).toFixed(1)} />
          <Cell label="RIVALS" value={String(race.rivals)} />
          <Cell label="PRIZE" value={`$${(race.reward / 1000).toFixed(0)}k`} tone="gold" />
          <Cell label="BEST" value={best !== undefined ? fmtTime(best) : "—"} />
        </div>

        <button
          disabled={!unlocked}
          onClick={onStart}
          className="vc-display mt-5 w-full rounded-lg px-4 py-3 text-[12px] font-bold tracking-[0.24em] transition-transform disabled:cursor-not-allowed disabled:bg-[rgba(255,255,255,0.08)] disabled:text-[color:var(--vc-dim)] enabled:bg-[color:var(--vc-neon)] enabled:text-[#04121a] enabled:hover:scale-[1.02]"
        >
          {unlocked ? "RACE" : "WIN PREVIOUS ROUTE TO UNLOCK"}
        </button>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "gold" }) {
  return (
    <div className="rounded-lg border border-[color:var(--vc-line)] bg-[rgba(255,255,255,0.03)] py-2">
      <div className="text-[8px] tracking-[0.24em] text-[color:var(--vc-dim)]">{label}</div>
      <div
        className="vc-display mt-0.5 text-sm"
        style={{ color: tone === "gold" ? "var(--vc-gold)" : "var(--vc-text)" }}
      >
        {value}
      </div>
    </div>
  );
}

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="vc-display rounded-lg border border-[color:var(--vc-line)] bg-[color:var(--vc-panel)] px-4 py-2 text-[11px] tracking-[0.22em] text-[color:var(--vc-dim)] transition-colors hover:text-[color:var(--vc-hot)]"
        >
          ← BACK
        </button>
        <h1 className="vc-display text-2xl tracking-[0.2em] text-[color:var(--vc-text)]">
          {title}
        </h1>
      </div>
      {right}
    </div>
  );
}
