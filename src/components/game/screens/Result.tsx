import type { RaceResult } from "../RaceScene";
import { getRace } from "@/game/route";
import { fmtTime, ord } from "../Hud";
import { AnimatedBackdrop } from "./Home";

export function Result({
  result,
  raceId,
  best,
  isRecord,
  unlockedName,
  onRetry,
  onRoutes,
  onGarage,
}: {
  result: RaceResult;
  raceId: string;
  best: number | undefined;
  isRecord: boolean;
  unlockedName: string | null;
  onRetry: () => void;
  onRoutes: () => void;
  onGarage: () => void;
}) {
  const race = getRace(raceId);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackdrop />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <div className="text-[11px] tracking-[0.4em] text-[color:var(--vc-dim)]">
          {race.name.toUpperCase()} · RESULT
        </div>
        <h1
          className="vc-display mt-2 text-[clamp(2.4rem,8vw,5rem)] font-black leading-none"
          style={{ color: result.won ? "var(--vc-gold)" : "var(--vc-hot)" }}
        >
          {result.won ? "VICTORY" : `${ord(result.position)} PLACE`}
        </h1>
        <p className="mt-3 text-lg text-[color:var(--vc-dim)]">{result.reason}</p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Box label="TIME" value={fmtTime(result.time)} tone="neon" />
          <Box label="POSITION" value={`${result.position}/${result.racers}`} />
          <Box
            label="BEST"
            value={best !== undefined ? fmtTime(best) : "—"}
            tone={isRecord ? "gold" : undefined}
          />
          <Box label="PAYOUT" value={`$${result.reward.toLocaleString()}`} tone="gold" />
        </div>

        {isRecord && (
          <div className="vc-glass mt-4 border-[color:var(--vc-gold)] px-4 py-3 text-[12px] tracking-[0.22em] text-[color:var(--vc-gold)]">
            NEW ROUTE RECORD
          </div>
        )}
        {unlockedName && (
          <div className="vc-glass mt-3 border-[color:var(--vc-neon)] px-4 py-3 text-[12px] tracking-[0.22em] text-[color:var(--vc-neon)]">
            ROUTE UNLOCKED · {unlockedName.toUpperCase()}
          </div>
        )}

        <div className="mt-9 flex flex-wrap gap-3">
          <button
            onClick={onRetry}
            className="vc-display rounded-xl bg-[color:var(--vc-neon)] px-8 py-3.5 text-[12px] font-bold tracking-[0.22em] text-[#04121a] transition-transform hover:scale-[1.03]"
          >
            RACE AGAIN
          </button>
          <button
            onClick={onRoutes}
            className="vc-display rounded-xl border border-[color:var(--vc-line)] bg-[color:var(--vc-panel)] px-8 py-3.5 text-[12px] font-bold tracking-[0.22em] transition-colors hover:border-[color:var(--vc-hot)] hover:text-[color:var(--vc-hot)]"
          >
            ROUTES
          </button>
          <button
            onClick={onGarage}
            className="vc-display rounded-xl border border-[color:var(--vc-line)] bg-[color:var(--vc-panel)] px-8 py-3.5 text-[12px] font-bold tracking-[0.22em] transition-colors hover:border-[color:var(--vc-neon)] hover:text-[color:var(--vc-neon)]"
          >
            GARAGE
          </button>
        </div>
      </div>
    </div>
  );
}

function Box({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "neon" | "gold";
}) {
  const color =
    tone === "neon" ? "var(--vc-neon)" : tone === "gold" ? "var(--vc-gold)" : "var(--vc-text)";
  return (
    <div className="vc-glass px-4 py-3">
      <div className="text-[9px] tracking-[0.26em] text-[color:var(--vc-dim)]">{label}</div>
      <div className="vc-display mt-1 text-xl" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
