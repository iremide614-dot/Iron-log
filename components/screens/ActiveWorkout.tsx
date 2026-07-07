"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useRestTimer, RestTimerBar } from "../RestTimer";
import {
  lastSessionFor,
  lastSummary,
  overloadTrend,
  countSets,
  calcVolume,
  type Trend,
} from "@/lib/workouts";
import { clock, fmtVol } from "@/lib/format";
import { ABS_LIST, CARDIO_LIST } from "@/lib/data/splits";
import type { Tab } from "../AppShell";

const TREND_UI: Record<Trend, { icon: string; color: string }> = {
  up: { icon: "▲", color: "var(--gn)" },
  down: { icon: "▼", color: "var(--rd)" },
  same: { icon: "=", color: "var(--c4)" },
  new: { icon: "•", color: "var(--c5)" },
};

export function ActiveWorkout({ go }: { go: (t: Tab) => void }) {
  const {
    active,
    workouts,
    profile,
    addSet,
    updateSet,
    removeSet,
    addExercise,
    removeExercise,
    finishWorkout,
    cancelWorkout,
  } = useStore();

  const timer = useRestTimer(profile.restSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [note, setNote] = useState("");
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(
      () => setElapsed(Math.round((Date.now() - active.startedAt) / 1000)),
      1000
    );
    setElapsed(Math.round((Date.now() - active.startedAt) / 1000));
    return () => clearInterval(t);
  }, [active]);

  // last-session map for overload comparison
  const lastMap = useMemo(() => {
    const m: Record<string, ReturnType<typeof lastSessionFor>> = {};
    if (active) {
      for (const ex of active.exercises) {
        m[ex.id] = lastSessionFor(workouts, ex.name, active.id);
      }
    }
    return m;
  }, [active, workouts]);

  if (!active) {
    return (
      <div className="scroll-area flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--c4)" }}>
            No active workout.
          </p>
          <button
            onClick={() => go("home")}
            className="text-sm font-bold px-5 py-3 rounded-xl"
            style={{ background: "var(--bl)", color: "#000" }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  function toggleSet(exId: string, setId: string, checked: boolean) {
    updateSet(exId, setId, { checked: !checked });
    // auto-start rest on completing a set
    if (!checked) timer.start();
  }

  function finish() {
    finishWorkout(note);
    setFinishing(false);
    go("home");
  }

  const quick = Array.from(new Set([...ABS_LIST, ...CARDIO_LIST]));

  return (
    <>
      {/* header */}
      <header
        className="px-5 pt-3 pb-3"
        style={{ background: "var(--hd)", borderBottom: "1px solid var(--bd)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-wider" style={{ color: "var(--bl)" }}>
              {(active.split || "WORKOUT").toUpperCase()}
            </div>
            <div className="text-[10px]" style={{ color: "var(--c4)", fontFamily: "var(--font-dm-mono)" }}>
              {clock(elapsed)}
            </div>
          </div>
          <div className="flex gap-2">
            <Stat label="sets" value={String(countSets(active))} />
            <Stat label="vol" value={fmtVol(calcVolume(active))} />
          </div>
        </div>
      </header>

      <div className="scroll-area px-5 py-4 pb-40">
        {active.exercises.map((ex) => {
          const last = lastMap[ex.id];
          const trend = overloadTrend(ex, last);
          const tui = TREND_UI[trend];
          return (
            <div
              key={ex.id}
              className="rounded-2xl p-3 mb-3"
              style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: "var(--c1)" }}>
                      {ex.name}
                    </span>
                    <span className="text-xs font-bold" style={{ color: tui.color }}>
                      {tui.icon}
                    </span>
                  </div>
                  {last && (
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--c5)", fontFamily: "var(--font-dm-mono)" }}
                    >
                      Last: {lastSummary(last)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeExercise(ex.id)}
                  className="text-xs px-2"
                  style={{ color: "var(--c5)" }}
                >
                  ✕
                </button>
              </div>

              {/* set rows */}
              <div className="flex flex-col gap-2">
                {ex.sets.map((set, i) => (
                  <div key={set.id} className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateSet(ex.id, set.id, {
                          type: set.type === "warmup" ? "normal" : "warmup",
                        })
                      }
                      className="w-6 text-center text-[10px] font-bold"
                      style={{ color: set.type === "warmup" ? "var(--fi)" : "var(--c4)" }}
                      title="Toggle warmup"
                    >
                      {set.type === "warmup" ? "W" : i + 1}
                    </button>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder={profile.unit}
                      value={set.weight}
                      onChange={(e) => updateSet(ex.id, set.id, { weight: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <span style={{ color: "var(--c5)" }}>×</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={ex.timed ? "sec" : "reps"}
                      value={set.reps}
                      onChange={(e) => updateSet(ex.id, set.id, { reps: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={() => toggleSet(ex.id, set.id, set.checked)}
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: set.checked ? "var(--gn)" : "var(--ip)",
                        color: set.checked ? "#000" : "var(--c5)",
                        border: "1px solid " + (set.checked ? "var(--gn)" : "var(--bd)"),
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => removeSet(ex.id, set.id)}
                      className="text-xs px-2 py-3 shrink-0"
                      style={{ color: "var(--c5)" }}
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(ex.id)}
                className="mt-2 text-xs font-semibold"
                style={{ color: "var(--bl)" }}
              >
                + Add set
              </button>
            </div>
          );
        })}

        {/* add exercise */}
        {adding ? (
          <div
            className="rounded-2xl p-3 mb-3"
            style={{ background: "var(--cd)", border: "1px dashed var(--bd)" }}
          >
            <input
              type="text"
              placeholder="Exercise name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quick.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    addExercise(q, ABS_LIST.includes(q));
                    setAdding(false);
                  }}
                  className="text-[10px] px-2 py-1 rounded-full"
                  style={{ background: "var(--ip)", color: "var(--c3)" }}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  if (newName.trim()) addExercise(newName.trim());
                  setNewName("");
                  setAdding(false);
                }}
                className="flex-1 text-xs font-bold py-2 rounded-lg"
                style={{ background: "var(--bl)", color: "#000" }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewName("");
                }}
                className="px-4 text-xs py-2 rounded-lg"
                style={{ background: "var(--ip)", color: "var(--c3)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-xl py-3 text-xs font-bold mb-3"
            style={{ background: "var(--ip)", color: "var(--c2)", border: "1px dashed var(--bd)" }}
          >
            + Add exercise
          </button>
        )}

        {/* finish / cancel */}
        {finishing ? (
          <div
            className="rounded-2xl p-3"
            style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
          >
            <textarea
              placeholder="How did it feel? (optional note)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={finish}
                className="flex-1 text-sm font-bold py-3 rounded-xl"
                style={{ background: "linear-gradient(135deg,var(--gn),#18a050)", color: "#fff" }}
              >
                Finish & Save
              </button>
              <button
                onClick={() => setFinishing(false)}
                className="px-4 text-sm py-3 rounded-xl"
                style={{ background: "var(--ip)", color: "var(--c3)" }}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setFinishing(true)}
              className="flex-1 text-sm font-semibold py-3 rounded-xl"
              style={{
                background: "rgba(34,204,102,.06)",
                border: "1px solid rgba(34,204,102,.2)",
                color: "var(--gn)",
              }}
            >
              Finish
            </button>
            <button
              onClick={() => {
                if (confirm("Discard this workout?")) {
                  cancelWorkout();
                  go("home");
                }
              }}
              className="px-4 text-sm py-3 rounded-xl"
              style={{ background: "var(--ip)", color: "var(--rd)" }}
            >
              Discard
            </button>
          </div>
        )}
      </div>

      {timer.running && (
        <RestTimerBar
          remaining={timer.remaining}
          duration={timer.duration}
          onAdd={(s) => timer.start(timer.remaining + s)}
          onStop={timer.stop}
        />
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-2.5 py-1 text-center"
      style={{ background: "rgba(74,143,255,.08)" }}
    >
      <span className="text-xs font-bold" style={{ color: "var(--bl)" }}>
        {value}
      </span>{" "}
      <span className="text-[8px]" style={{ color: "var(--c5)" }}>
        {label}
      </span>
    </div>
  );
}
