"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { workingSets, calcVolume, countSets } from "@/lib/workouts";
import { dateStr, fmtDate, fmtDuration, fmtVol, shortDate } from "@/lib/format";

export function History() {
  const { workouts, deleteWorkout } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m: Record<string, typeof workouts> = {};
    for (const w of workouts) (m[w.date] ||= []).push(w);
    return m;
  }, [workouts]);

  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const monthName = first.toLocaleString("en", { month: "long" });

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
    setSelected(null);
  }

  const selectedWorkouts = selected ? byDate[selected] ?? [] : [];

  return (
    <div className="scroll-area px-5 py-4 pb-24">
      {/* calendar */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => shift(-1)} style={{ color: "var(--c3)" }} className="px-2 text-lg">
            ‹
          </button>
          <span className="text-sm font-bold" style={{ color: "var(--c1)" }}>
            {monthName} {year}
          </span>
          <button onClick={() => shift(1)} style={{ color: "var(--c3)" }} className="px-2 text-lg">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[9px]" style={{ color: "var(--c5)" }}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const ds = fmtDate(new Date(year, month, day));
            const has = !!byDate[ds];
            const isSel = selected === ds;
            return (
              <button
                key={i}
                onClick={() => has && setSelected(isSel ? null : ds)}
                className="aspect-square rounded-lg flex items-center justify-center text-xs relative"
                style={{
                  background: isSel ? "var(--bl)" : has ? "rgba(74,143,255,.12)" : "transparent",
                  color: isSel ? "#000" : has ? "var(--bl)" : "var(--c4)",
                  fontWeight: has ? 700 : 400,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* selected day detail */}
      {selected && selectedWorkouts.map((w) => (
        <WorkoutDetail key={w.id} w={w} onDelete={() => { deleteWorkout(w.id); setSelected(null); }} />
      ))}

      {/* full list */}
      <div className="text-[10px] font-semibold tracking-[2px] mb-2 mt-2" style={{ color: "var(--c4)" }}>
        ALL WORKOUTS · {workouts.length}
      </div>
      {workouts.length === 0 && (
        <p className="text-sm" style={{ color: "var(--c4)" }}>
          No history yet.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {workouts.map((w) => (
          <button
            key={w.id}
            onClick={() => { setSelected(w.date); setMonth(new Date(w.date + "T12:00:00").getMonth()); setYear(new Date(w.date + "T12:00:00").getFullYear()); }}
            className="rounded-xl p-3 flex items-center justify-between text-left"
            style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
          >
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--c2)" }}>
                {w.split || "Workout"}
              </div>
              <div className="text-[10px]" style={{ color: "var(--c4)" }}>
                {shortDate(w.date)}
                {w.duration ? " · " + fmtDuration(w.duration) : ""} · {fmtVol(calcVolume(w))} vol
              </div>
            </div>
            <span className="text-xs" style={{ color: "var(--c5)" }}>
              {countSets(w)} sets
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkoutDetail({ w, onDelete }: { w: ReturnType<typeof useStore>["workouts"][number]; onDelete: () => void }) {
  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{ background: "var(--cd)", border: "1px solid var(--c6)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold" style={{ color: "var(--c1)" }}>
          {w.split || "Workout"}
        </span>
        <button onClick={onDelete} className="text-xs" style={{ color: "var(--rd)" }}>
          Delete
        </button>
      </div>
      <div className="text-[10px] mb-3" style={{ color: "var(--c4)" }}>
        {dateStr(w.date)} · {fmtDuration(w.duration || 0)} · {fmtVol(calcVolume(w))} vol
      </div>
      <div className="flex flex-col gap-2">
        {w.exercises.map((ex) => (
          <div key={ex.id}>
            <div className="text-xs font-semibold" style={{ color: "var(--c2)" }}>
              {ex.name}
            </div>
            <div className="text-[10px]" style={{ color: "var(--c5)", fontFamily: "var(--font-dm-mono)" }}>
              {workingSets(ex).map((s) => `${s.weight || "?"}×${s.reps || "?"}`).join("  ·  ") || "—"}
            </div>
          </div>
        ))}
      </div>
      {w.note && (
        <p className="text-xs mt-3 italic" style={{ color: "var(--c3)" }}>
          “{w.note}”
        </p>
      )}
    </div>
  );
}
