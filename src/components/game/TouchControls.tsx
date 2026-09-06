import { useEffect, useRef, useState } from "react";

/** Fires the same key events the race loop already listens for. */
function press(code: string, down: boolean) {
  window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code, bubbles: true }));
}

function Pad({
  code,
  label,
  className,
}: {
  code: string;
  label: string;
  className?: string;
}) {
  const held = useRef(false);
  const [active, setActive] = useState(false);

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    if (held.current) return;
    held.current = true;
    setActive(true);
    press(code, true);
  };
  const end = () => {
    if (!held.current) return;
    held.current = false;
    setActive(false);
    press(code, false);
  };

  useEffect(() => () => end(), []);

  return (
    <button
      onPointerDown={start}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
      onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto flex select-none items-center justify-center rounded-2xl border font-[var(--vc-font-display)] tracking-[0.14em] backdrop-blur-md transition-transform ${
        active
          ? "scale-95 border-[color:var(--vc-neon)] bg-[color:var(--vc-neon)]/25 text-[color:var(--vc-neon)]"
          : "border-[color:var(--vc-line)] bg-[color:var(--vc-panel)] text-[color:var(--vc-dim)]"
      } ${className ?? ""}`}
      style={{ touchAction: "none" }}
    >
      {label}
    </button>
  );
}

export function TouchControls() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const touch =
      window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    setShow(touch);
  }, []);
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 pb-6">
      <div className="flex gap-3">
        <Pad code="ArrowLeft" label="◀" className="h-16 w-16 text-xl" />
        <Pad code="ArrowRight" label="▶" className="h-16 w-16 text-xl" />
      </div>
      <div className="flex items-end gap-3">
        <Pad code="Space" label="DRIFT" className="h-14 w-20 text-[11px]" />
        <Pad code="ArrowDown" label="BRAKE" className="h-16 w-20 text-xs" />
        <Pad code="ArrowUp" label="GAS" className="h-20 w-20 text-sm" />
      </div>
    </div>
  );
}
