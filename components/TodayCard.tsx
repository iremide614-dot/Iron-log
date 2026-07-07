"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { todayStatus } from "@/lib/today";
import { computeTargets, GOAL_LABELS } from "@/lib/goals";
import type { GoalMode } from "@/lib/types";

const MODES: GoalMode[] = ["cut", "maintain", "bulk"];

export function TodayCard() {
  const { food, workouts, bodyweight, profile, updateProfile } = useStore();
  const [editing, setEditing] = useState(false);

  const needsSetup = !profile.goalMode;
  const status = todayStatus(food, workouts, profile);

  // ---- setup state ----
  const latestBw = bodyweight.length ? bodyweight[bodyweight.length - 1].weight : undefined;
  const [mode, setMode] = useState<GoalMode>(profile.goalMode ?? "maintain");
  const [unit, setUnit] = useState<"kg" | "lb">(profile.unit);
  const [weight, setWeight] = useState<string>(latestBw ? String(latestBw) : "");
  const [calOverride, setCalOverride] = useState<string>("");

  useEffect(() => {
    if (latestBw && !weight) setWeight(String(latestBw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestBw]);

  const w = parseFloat(weight);
  const computed = !isNaN(w) && w > 0 ? computeTargets(w, unit, mode) : null;
  const finalCalories = calOverride ? parseInt(calOverride) || 0 : computed?.calories ?? 0;

  function save() {
    if (!finalCalories) return;
    updateProfile({
      goalMode: mode,
      calorieGoal: finalCalories,
      proteinGoal: computed?.protein,
      unit,
    });
    setCalOverride("");
    setEditing(false);
  }

  // ================= setup view =================
  if (needsSetup || editing) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold tracking-[2px]" style={{ color: "var(--c4)" }}>
            🎯 {needsSetup ? "SET YOUR GOAL" : "EDIT GOAL"}
          </span>
          {!needsSetup && (
            <button onClick={() => setEditing(false)} className="text-[10px]" style={{ color: "var(--c4)" }}>
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs mb-3" style={{ color: "var(--c3)" }}>
          What are you working toward? Your daily calorie target comes from this.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {MODES.map((m) => {
            const g = GOAL_LABELS[m];
            const sel = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="rounded-xl py-2.5 px-1 text-center"
                style={{
                  background: sel ? "rgba(74,143,255,.12)" : "var(--ip)",
                  border: `1px solid ${sel ? "var(--bl)" : "var(--bd)"}`,
                }}
              >
                <div className="text-xs font-bold" style={{ color: sel ? g.color : "var(--c3)" }}>
                  {g.label}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] mb-3 text-center" style={{ color: "var(--c4)" }}>
          {GOAL_LABELS[mode].hint}
        </p>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: "var(--c4)" }}>
              Your body weight
            </span>
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--bd)" }}>
              {(["lb", "kg"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className="px-3 py-1 text-[10px] font-bold"
                  style={{
                    background: unit === u ? "var(--bl)" : "var(--ip)",
                    color: unit === u ? "#000" : "var(--c4)",
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            inputMode="decimal"
            placeholder={`e.g. ${unit === "kg" ? "82.5" : "180"}`}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        {computed && (
          <div
            className="rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between"
            style={{ background: "var(--dp)", border: "1px solid var(--bd)" }}
          >
            <div>
              <div className="text-[10px]" style={{ color: "var(--c4)" }}>
                Daily target (tap to adjust)
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={calOverride || computed.calories}
                onChange={(e) => setCalOverride(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  minHeight: 0,
                  textAlign: "left",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--c1)",
                  width: 110,
                }}
              />
              <span className="text-xs" style={{ color: "var(--c3)" }}>
                kcal
              </span>
            </div>
            <div className="text-right">
              <div className="text-[10px]" style={{ color: "var(--c4)" }}>
                Protein
              </div>
              <div className="text-sm font-bold" style={{ color: "var(--gn)" }}>
                {computed.protein}g
              </div>
            </div>
          </div>
        )}

        <button
          onClick={save}
          disabled={!finalCalories}
          className="w-full text-sm font-bold py-3 rounded-xl"
          style={{
            background: finalCalories ? "var(--bl)" : "var(--ip)",
            color: finalCalories ? "#000" : "var(--c4)",
          }}
        >
          Save goal
        </button>
      </Card>
    );
  }

  // ================= dashboard view =================
  const pct = Math.min(100, (status.eaten / status.goal) * 100);
  const over = status.eaten > status.goal;
  const g = GOAL_LABELS[profile.goalMode!];

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold tracking-[2px]" style={{ color: "var(--c4)" }}>
          TODAY
        </span>
        <button
          onClick={() => { setMode(profile.goalMode!); setEditing(true); }}
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "var(--ip)", color: g.color }}
        >
          {g.label} ✎
        </button>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-3xl font-extrabold" style={{ color: "var(--c1)" }}>
          {status.eaten}
        </span>
        <span className="text-sm" style={{ color: "var(--c3)" }}>
          / {status.goal} kcal
        </span>
        <span className="ml-auto text-sm font-bold" style={{ color: over ? "var(--rd)" : "var(--gn)" }}>
          {over ? `+${status.eaten - status.goal} over` : `${status.remaining} left`}
        </span>
      </div>

      <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--ip)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: over ? "var(--rd)" : "var(--gn)" }}
        />
      </div>

      {profile.proteinGoal ? (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] shrink-0" style={{ color: "var(--c4)" }}>
            Protein
          </span>
          <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: "var(--ip)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (status.protein / profile.proteinGoal) * 100)}%`,
                background: "var(--gn)",
              }}
            />
          </div>
          <span className="text-[10px] font-bold shrink-0" style={{ color: "var(--c2)", fontFamily: "var(--font-dm-mono)" }}>
            {status.protein}/{profile.proteinGoal}g
          </span>
        </div>
      ) : null}

      <div className="flex gap-2">
        {(["breakfast", "lunch", "dinner"] as const).map((slot) => (
          <div
            key={slot}
            className="flex-1 rounded-lg py-1.5 text-center text-[10px] font-semibold"
            style={{
              background: status.slots[slot] ? "rgba(34,204,102,.10)" : "var(--ip)",
              color: status.slots[slot] ? "var(--gn)" : "var(--c4)",
            }}
          >
            {status.slots[slot] ? "✓ " : ""}
            {slot[0].toUpperCase() + slot.slice(1)}
          </div>
        ))}
        <div
          className="flex-1 rounded-lg py-1.5 text-center text-[10px] font-semibold"
          style={{
            background: status.workedOut ? "rgba(74,143,255,.10)" : "var(--ip)",
            color: status.workedOut ? "var(--bl)" : "var(--c4)",
          }}
        >
          {status.workedOut ? "✓ " : ""}Workout
        </div>
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
    >
      {children}
    </div>
  );
}
