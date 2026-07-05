"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { workingSets, calcVolume, countSets } from "@/lib/workouts";
import { sumMacros } from "@/lib/food";
import { dateStr, fmtDate, fmtDuration, fmtVol, shortDate, today } from "@/lib/format";
import type { Workout, FoodEntry } from "@/lib/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function History() {
  const { workouts, deleteWorkout, food, bodyweight, profile } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState<string | null>(today());

  const workoutsByDate = useMemo(() => {
    const m: Record<string, Workout[]> = {};
    for (const w of workouts) (m[w.date] ||= []).push(w);
    return m;
  }, [workouts]);

  const mealsByDate = useMemo(() => {
    const m: Record<string, FoodEntry[]> = {};
    for (const f of food) (m[f.date] ||= []).push(f);
    return m;
  }, [food]);

  const weightByDate = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of bodyweight) m[b.date] = b.weight;
    return m;
  }, [bodyweight]);

  // workouts grouped by month for the cleaned-up list
  const workoutsByMonth = useMemo(() => {
    const groups: { label: string; items: Workout[] }[] = [];
    for (const w of workouts) {
      const d = new Date(w.date + "T12:00:00");
      const label = `${MONTHS[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(w);
      else groups.push({ label, items: [w] });
    }
    return groups;
  }, [workouts]);

  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
    setSelected(null);
  }

  function jumpTo(ds: string) {
    const d = new Date(ds + "T12:00:00");
    setMonth(d.getMonth());
    setYear(d.getFullYear());
    setSelected(ds);
  }

  const selWorkouts = selected ? workoutsByDate[selected] ?? [] : [];
  const selMeals = selected ? mealsByDate[selected] ?? [] : [];
  const selWeight = selected ? weightByDate[selected] : undefined;
  const selMealTotals = selMeals.length ? sumMacros(selMeals) : null;

  return (
    <div className="scroll-area px-5 py-4 pb-24">
      {/* calendar */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => shift(-1)} style={{ color: "var(--c3)" }} className="px-3 py-1 text-lg">
            ‹
          </button>
          <span className="text-sm font-bold" style={{ color: "var(--c1)" }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={() => shift(1)} style={{ color: "var(--c3)" }} className="px-3 py-1 text-lg">
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
            const hasWorkout = !!workoutsByDate[ds];
            const hasMeals = !!mealsByDate[ds];
            const hasWeight = weightByDate[ds] !== undefined;
            const hasAny = hasWorkout || hasMeals || hasWeight;
            const isSel = selected === ds;
            return (
              <button
                key={i}
                onClick={() => hasAny && setSelected(isSel ? null : ds)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
                style={{
                  background: isSel ? "var(--bl)" : hasWorkout ? "rgba(74,143,255,.12)" : "transparent",
                  color: isSel ? "#000" : hasWorkout ? "var(--bl)" : hasAny ? "var(--c3)" : "var(--c5)",
                  fontWeight: hasAny ? 700 : 400,
                  fontSize: 12,
                }}
              >
                {day}
                {!isSel && (hasMeals || hasWeight) && (
                  <span className="flex gap-0.5 absolute" style={{ bottom: 3 }}>
                    {hasMeals && (
                      <span className="rounded-full" style={{ width: 4, height: 4, background: "var(--fi)" }} />
                    )}
                    {hasWeight && (
                      <span className="rounded-full" style={{ width: 4, height: 4, background: "var(--gn)" }} />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* legend */}
        <div className="flex items-center gap-4 mt-3">
          <Legend swatch="rgba(74,143,255,.5)" label="Workout" square />
          <Legend swatch="var(--fi)" label="Meals" />
          <Legend swatch="var(--gn)" label="Weight" />
        </div>
      </div>

      {/* ===== selected day ===== */}
      {selected && (
        <div className="mb-4">
          <div className="text-[10px] font-semibold tracking-[2px] mb-2" style={{ color: "var(--c4)" }}>
            {dateStr(selected).toUpperCase()}
          </div>

          {selWorkouts.map((w) => (
            <WorkoutDetail key={w.id} w={w} onDelete={() => { deleteWorkout(w.id); }} />
          ))}

          {selWeight !== undefined && (
            <div
              className="rounded-2xl px-4 py-3 mb-3 flex items-center justify-between"
              style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
            >
              <span className="text-xs font-semibold tracking-wider" style={{ color: "var(--gn)" }}>
                BODY WEIGHT
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--c1)", fontFamily: "var(--font-dm-mono)" }}
              >
                {selWeight} {profile.unit}
              </span>
            </div>
          )}

          {selMeals.length > 0 && (
            <div
              className="rounded-2xl p-4 mb-3"
              style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold tracking-wider" style={{ color: "var(--fi)" }}>
                  MEALS · {selMeals.length}
                </span>
                {selMealTotals && (
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: "var(--c2)", fontFamily: "var(--font-dm-mono)" }}
                  >
                    {selMealTotals.calories} kcal · P{selMealTotals.protein} C{selMealTotals.carbs} F{selMealTotals.fat}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2.5">
                {selMeals.map((f) => (
                  <div key={f.id} className="flex items-center gap-3">
                    {f.thumb ? (
                      <img src={f.thumb} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-sm"
                        style={{ background: "var(--ip)" }}
                      >
                        🍽
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--c2)" }}>
                        {f.name}
                      </div>
                      <div className="text-[10px] truncate" style={{ color: "var(--c4)" }}>
                        {f.calories} kcal
                        {f.items && f.items.length > 0 && <> · {f.items.map((i) => i.name).join(" · ")}</>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selWorkouts.length === 0 && selMeals.length === 0 && selWeight === undefined && (
            <p className="text-sm" style={{ color: "var(--c4)" }}>
              Nothing logged this day.
            </p>
          )}
        </div>
      )}

      {/* ===== all workouts, grouped by month ===== */}
      <div className="text-[10px] font-semibold tracking-[2px] mb-2" style={{ color: "var(--c4)" }}>
        ALL WORKOUTS · {workouts.length}
      </div>
      {workouts.length === 0 && (
        <p className="text-sm" style={{ color: "var(--c4)" }}>
          No history yet.
        </p>
      )}
      {workoutsByMonth.map((group) => (
        <div key={group.label} className="mb-3">
          <div className="text-[9px] font-semibold tracking-[2px] mb-1.5 pl-1" style={{ color: "var(--c5)" }}>
            {group.label}
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
          >
            {group.items.map((w, i) => (
              <button
                key={w.id}
                onClick={() => jumpTo(w.date)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--bd)" }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--c1)" }}>
                    {w.split || "Workout"}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--c4)" }}>
                    {shortDate(w.date)}
                    {w.duration ? ` · ${fmtDuration(w.duration)}` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-3" style={{ fontFamily: "var(--font-dm-mono)" }}>
                  <div className="text-xs font-bold" style={{ color: "var(--bl)" }}>
                    {countSets(w)} <span style={{ color: "var(--c5)", fontWeight: 400 }}>sets</span>
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--c4)" }}>
                    {fmtVol(calcVolume(w))} vol
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Legend({ swatch, label, square }: { swatch: string; label: string; square?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        style={{
          width: square ? 8 : 5,
          height: square ? 8 : 5,
          borderRadius: square ? 2 : 99,
          background: swatch,
          display: "inline-block",
        }}
      />
      <span className="text-[9px]" style={{ color: "var(--c4)" }}>
        {label}
      </span>
    </span>
  );
}

function WorkoutDetail({ w, onDelete }: { w: Workout; onDelete: () => void }) {
  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{ background: "var(--cd)", border: "1px solid var(--c6)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold tracking-wider" style={{ color: "var(--bl)" }}>
          {(w.split || "WORKOUT").toUpperCase()}
        </span>
        <button
          onClick={() => {
            if (confirm("Delete this workout?")) onDelete();
          }}
          className="text-xs px-2 py-1"
          style={{ color: "var(--rd)" }}
        >
          Delete
        </button>
      </div>
      <div className="text-[10px] mb-3" style={{ color: "var(--c4)" }}>
        {fmtDuration(w.duration || 0)} · {fmtVol(calcVolume(w))} vol · {countSets(w)} sets
      </div>
      <div className="flex flex-col gap-2">
        {w.exercises.map((ex) => (
          <div key={ex.id} className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold shrink-0" style={{ color: "var(--c2)" }}>
              {ex.name}
            </span>
            <span
              className="text-[10px] text-right"
              style={{ color: "var(--c4)", fontFamily: "var(--font-dm-mono)" }}
            >
              {workingSets(ex).map((s) => `${s.weight || "?"}×${s.reps || "?"}`).join("  ") || "—"}
            </span>
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
