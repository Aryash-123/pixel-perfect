import { useSyncExternalStore } from "react";
import { hudStore } from "@/game/hudStore";
import { Minimap } from "./Minimap";
import type { Route } from "@/game/route";

const ord = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
};

export const fmtTime = (t: number) => {
  const m = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * 100);
  return `${m}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

export function Hud({ route, onQuit }: { route: Route; onQuit: () => void }) {
  const h = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const gear = Math.min(6, Math.max(1, Math.floor(h.speed / 48) + 1));
  const needle = Math.min(1, h.speed / 340);

  return (
    <div className="pointer-events-none absolute inset-0 select-none font-[var(--vc-font-ui)]">
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className="vc-glass flex items-center gap-4 px-4 py-2.5">
          <Stat label="POS" value={`${h.position}/${h.racers}`} tone="hot" />
          <Divider />
          <Stat label="TIME" value={fmtTime(h.time)} />
          <Divider />
          <Stat label="CP" value={`${h.checkpoint}/${h.checkpointTotal}`} tone="gold" />
          <Divider />
          <Stat label="HITS" value={String(h.collisions)} />
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="vc-glass px-4 py-2 text-right">
            <div className="text-[10px] tracking-[0.28em] text-[color:var(--vc-dim)]">ROUTE</div>
            <div className="font-[var(--vc-font-display)] text-sm tracking-[0.16em] text-[color:var(--vc-neon)]">
              {route.race.name}
            </div>
          </div>
          <button
            onClick={onQuit}
            className="pointer-events-auto rounded-lg border border-[color:var(--vc-line)] bg-[color:var(--vc-panel)] px-3 py-1.5 text-[11px] tracking-[0.2em] text-[color:var(--vc-dim)] transition-colors hover:text-[color:var(--vc-hot)]"
          >
            QUIT (ESC)
          </button>
        </div>
      </div>

      {/* progress rail */}
      <div className="absolute inset-x-0 top-[86px] px-6">
        <div className="mx-auto h-[6px] max-w-3xl overflow-hidden rounded-full border border-[color:var(--vc-line)] bg-[color:var(--vc-panel)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--vc-neon),var(--vc-hot))] transition-[width] duration-150"
            style={{ width: `${Math.min(100, h.progress * 100)}%` }}
          />
        </div>
      </div>

      {/* branch / event prompt */}
      {h.prompt && (
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 animate-fade-in">
          <div className="vc-glass border-[color:var(--vc-hot)] px-6 py-3 text-center shadow-[0_0_40px_rgba(255,58,166,0.35)]">
            <div className="font-[var(--vc-font-display)] text-lg tracking-[0.18em] text-[color:var(--vc-hot)]">
              {h.prompt}
            </div>
            {h.branchChoice && (
              <div className="mt-1 text-[11px] tracking-[0.22em] text-[color:var(--vc-dim)]">
                TAKING: {h.branchChoice.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* minimap */}
      <div className="absolute bottom-4 right-4">
        <Minimap route={route} />
        <div className="mt-1.5 flex justify-end gap-3 text-[9px] tracking-[0.18em] text-[color:var(--vc-dim)]">
          <span className="text-[color:var(--vc-neon)]">YOU</span>
          <span className="text-[color:var(--vc-hot)]">RIVALS</span>
          <span className="text-[color:var(--vc-gold)]">CHECKPOINT</span>
        </div>
      </div>

      {/* speedo */}
      <div className="absolute bottom-4 left-4">
        <div className="vc-glass relative flex h-[132px] w-[188px] flex-col justify-end px-4 pb-3">
          <div className="absolute left-4 top-3 text-[10px] tracking-[0.28em] text-[color:var(--vc-dim)]">
            KM / H
          </div>
          <div className="absolute right-4 top-2 font-[var(--vc-font-display)] text-2xl text-[color:var(--vc-hot)]">
            {gear}
          </div>
          <div className="font-[var(--vc-font-display)] text-[46px] leading-none tracking-tight text-[color:var(--vc-neon)] [text-shadow:0_0_22px_rgba(0,229,255,0.55)]">
            {Math.round(h.speed)}
          </div>
          <div className="mt-2 flex gap-[3px]">
            {Array.from({ length: 26 }).map((_, i) => {
              const on = i / 26 < needle;
              return (
                <span
                  key={i}
                  className="h-3 flex-1 rounded-[1px]"
                  style={{
                    background: on
                      ? i > 20
                        ? "var(--vc-hot)"
                        : i > 14
                          ? "var(--vc-gold)"
                          : "var(--vc-neon)"
                      : "rgba(255,255,255,0.09)",
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 text-[9px] tracking-[0.18em] text-[color:var(--vc-dim)]">
          ↑ THROTTLE · ↓ BRAKE · ← → STEER · SPACE HANDBRAKE · 1/2 PICK ROUTE
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 vc-vignette" />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "hot" | "gold" }) {
  const color =
    tone === "hot" ? "var(--vc-hot)" : tone === "gold" ? "var(--vc-gold)" : "var(--vc-neon)";
  return (
    <div>
      <div className="text-[9px] tracking-[0.28em] text-[color:var(--vc-dim)]">{label}</div>
      <div
        className="font-[var(--vc-font-display)] text-base leading-tight tracking-[0.08em]"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

const Divider = () => <span className="h-7 w-px bg-[color:var(--vc-line)]" />;

export { ord };
