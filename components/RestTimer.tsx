"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clock } from "@/lib/format";

export function useRestTimer(defaultSeconds: number) {
  const [duration, setDuration] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setRunning(false);
    setRemaining(0);
  }, []);

  const start = useCallback(
    (secs?: number) => {
      const total = secs ?? duration;
      if (tick.current) clearInterval(tick.current);
      setRemaining(total);
      setRunning(true);
      tick.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            if (tick.current) clearInterval(tick.current);
            tick.current = null;
            setRunning(false);
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    },
    [duration]
  );

  useEffect(() => () => stop(), [stop]);

  return { duration, setDuration, remaining, running, start, stop };
}

export function RestTimerBar({
  remaining,
  duration,
  onAdd,
  onStop,
}: {
  remaining: number;
  duration: number;
  onAdd: (secs: number) => void;
  onStop: () => void;
}) {
  const pct = duration ? (remaining / duration) * 100 : 0;
  return (
    <div
      className="absolute left-0 right-0 bottom-0 px-4 py-3"
      style={{ background: "var(--hd)", borderTop: "1px solid var(--bd)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-widest" style={{ color: "var(--bl)" }}>
          REST
        </span>
        <span
          className="text-lg font-bold"
          style={{ color: "var(--c1)", fontFamily: "var(--font-dm-mono)" }}
        >
          {clock(remaining)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onAdd(15)}
            className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{ background: "var(--ip)", color: "var(--c2)" }}
          >
            +15s
          </button>
          <button
            onClick={onStop}
            className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{ background: "var(--bl)", color: "#000" }}
          >
            Skip
          </button>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ip)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: "var(--bl)" }}
        />
      </div>
    </div>
  );
}
