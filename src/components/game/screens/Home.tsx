import { CARS, PAINTS } from "@/game/cars";
import { RACES } from "@/game/route";
import type { SaveData } from "@/game/save";

/** Animated neon-city title screen. */
export function Home({
  save,
  onRace,
  onGarage,
  onReset,
}: {
  save: SaveData;
  onRace: () => void;
  onGarage: () => void;
  onReset: () => void;
}) {
  const bestCount = Object.keys(save.bestTimes).length;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="text-[11px] tracking-[0.5em] text-[color:var(--vc-dim)]">
          OPEN-WORLD STREET RACING
        </div>

        <h1 className="vc-display vc-flicker mt-3 text-[clamp(2.6rem,9vw,7rem)] font-black leading-[0.9] tracking-[-0.02em]">
          <span className="block text-[color:var(--vc-neon)] [text-shadow:0_0_40px_rgba(0,229,255,0.6)]">
            VELOCITY
          </span>
          <span className="block text-[color:var(--vc-hot)] [text-shadow:0_0_40px_rgba(255,58,166,0.55)]">
            CITY
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--vc-dim)]">
          Five connected routes through neon downtown, coastal highway, mountain passes and the
          city skyway. Live traffic, rival racers, flyover shortcuts and a garage full of metal.
        </p>

        <div className="mt-9 flex flex-wrap gap-4">
          <button
            onClick={onRace}
            className="vc-display group relative overflow-hidden rounded-xl bg-[color:var(--vc-neon)] px-9 py-4 text-sm font-bold tracking-[0.22em] text-[#04121a] transition-transform hover:scale-[1.03]"
          >
            <span className="relative z-10">START RACING</span>
            <span className="vc-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-white/45 blur-md" />
          </button>
          <button
            onClick={onGarage}
            className="vc-display rounded-xl border border-[color:var(--vc-line)] bg-[color:var(--vc-panel)] px-9 py-4 text-sm font-bold tracking-[0.22em] text-[color:var(--vc-text)] transition-colors hover:border-[color:var(--vc-hot)] hover:text-[color:var(--vc-hot)]"
          >
            GARAGE
          </button>
        </div>

        <div className="mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          <Tile label="ROUTES" value={String(RACES.length)} />
          <Tile label="CARS" value={String(CARS.length)} />
          <Tile label="LIVERIES" value={String(PAINTS.length)} />
          <Tile label="RECORDS SET" value={String(bestCount)} />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 text-xs tracking-[0.2em] text-[color:var(--vc-dim)]">
          <span>
            BANK <span className="text-[color:var(--vc-gold)]">${save.cash.toLocaleString()}</span>
          </span>
          <span className="hidden h-3 w-px bg-[color:var(--vc-line)] sm:block" />
          <span>KEYBOARD: ARROWS + SPACE</span>
          <span className="hidden h-3 w-px bg-[color:var(--vc-line)] sm:block" />
          <button
            onClick={onReset}
            className="tracking-[0.2em] underline decoration-dotted underline-offset-4 transition-colors hover:text-[color:var(--vc-hot)]"
          >
            RESET PROGRESS
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="vc-glass px-4 py-3">
      <div className="text-[9px] tracking-[0.28em] text-[color:var(--vc-dim)]">{label}</div>
      <div className="vc-display mt-1 text-2xl text-[color:var(--vc-neon)]">{value}</div>
    </div>
  );
}

export function AnimatedBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#16255c_0%,transparent_55%),radial-gradient(circle_at_85%_75%,#4a0f3c_0%,transparent_50%),linear-gradient(180deg,#05070f_0%,#0a1024_60%,#05070f_100%)]" />

      {/* perspective road grid */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] [perspective:520px]">
        <div className="vc-grid absolute inset-0 origin-bottom [transform:rotateX(74deg)] opacity-70" />
      </div>

      {/* skyline silhouette */}
      <div className="absolute inset-x-0 bottom-[38%] flex h-40 items-end justify-center gap-[6px] opacity-80">
        {Array.from({ length: 46 }).map((_, i) => {
          const h = 26 + ((i * 37) % 100);
          const w = 14 + ((i * 13) % 22);
          return (
            <div
              key={i}
              className="relative shrink-0 bg-[#080d1e]"
              style={{ height: h, width: w }}
            >
              <span
                className="absolute inset-x-1 top-1 block"
                style={{
                  height: 2,
                  background: i % 3 === 0 ? "var(--vc-hot)" : "var(--vc-neon)",
                  opacity: 0.35 + ((i * 17) % 40) / 100,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* floating neon orbs */}
      <div className="vc-drift absolute left-[12%] top-[18%] h-40 w-40 rounded-full bg-[color:var(--vc-neon)] opacity-20 blur-3xl" />
      <div
        className="vc-drift absolute right-[14%] top-[30%] h-52 w-52 rounded-full bg-[color:var(--vc-hot)] opacity-20 blur-3xl"
        style={{ animationDelay: "1.6s" }}
      />

      <div className="vc-scan absolute inset-x-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(0,229,255,0.06),transparent)]" />
      <div className="absolute inset-0 vc-vignette" />
    </div>
  );
}
