"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { streak } from "@/lib/workouts";
import { shortDate, fmtDuration } from "@/lib/format";
import { Reminders } from "../Reminders";
import type { Tab } from "../AppShell";

export function Home({ go }: { go: (t: Tab) => void }) {
  const { splits, workouts, active, startWorkout } = useStore();
  const [picking, setPicking] = useState(false);
  const s = streak(workouts);

  function begin(name: string, exercises: string[]) {
    startWorkout(name, exercises);
    setPicking(false);
    go("workout");
  }

  return (
    <div className="scroll-area px-5 py-4 pb-24">
      {/* streak */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold" style={{ color: "var(--fi)" }}>
            {s.current}
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--fi)" }}>
            day streak
          </span>
          <span className="ml-auto text-xs" style={{ color: "var(--c4)" }}>
            best {s.best}
          </span>
        </div>
        <div className="flex gap-1 mt-3">
          {"MTWTFSS".split("").map((d, i) => {
            const lit = i < (s.current % 7 || (s.current ? 7 : 0));
            return (
              <div
                key={i}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-semibold"
                style={{
                  background: lit ? "rgba(255,140,40,.14)" : "rgba(255,140,40,.04)",
                  color: lit ? "var(--fi)" : "var(--c5)",
                }}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>

      {/* continue active workout */}
      {active && (
        <button
          onClick={() => go("workout")}
          className="w-full rounded-2xl p-4 mb-4 flex items-center justify-between"
          style={{ background: "rgba(74,143,255,.10)", border: "1px solid var(--c6)" }}
        >
          <div className="text-left">
            <div className="text-sm font-bold" style={{ color: "var(--bl)" }}>
              Workout in progress
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--c4)" }}>
              {active.split} · {active.exercises.length} exercises
            </div>
          </div>
          <span
            className="text-xs font-bold px-4 py-2 rounded-lg"
            style={{ background: "var(--bl)", color: "#000" }}
          >
            Continue
          </span>
        </button>
      )}

      {/* start workout */}
      {!picking ? (
        <button
          onClick={() => setPicking(true)}
          className="w-full rounded-2xl py-4 mb-5 text-sm font-bold tracking-[3px]"
          style={{
            background: "linear-gradient(135deg,#1a3a7a,#0d2459)",
            color: "#fff",
          }}
        >
          START WORKOUT
        </button>
      ) : (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--c3)" }}>
              Pick a split
            </span>
            <button className="text-xs" style={{ color: "var(--c4)" }} onClick={() => setPicking(false)}>
              Cancel
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => begin("Blank", [])}
              className="rounded-xl p-3 text-left text-sm font-semibold"
              style={{ background: "var(--ip)", color: "var(--c2)", border: "1px dashed var(--bd)" }}
            >
              + Empty workout
            </button>
            {splits.map((sp) => (
              <button
                key={sp.name}
                onClick={() => begin(sp.name, sp.exercises)}
                className="rounded-xl p-3 text-left"
                style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm" style={{ color: "var(--c1)" }}>
                    {sp.name}
                  </span>
                  {sp.custom && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--c6)", color: "var(--bl)" }}
                    >
                      CUSTOM
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--c3)" }}>
                  {sp.exercises.length} exercises
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* reminders */}
      <Reminders />

      {/* recent */}
      <div className="text-[10px] font-semibold tracking-[2px] mb-2" style={{ color: "var(--c4)" }}>
        RECENT
      </div>
      {workouts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--c4)" }}>
          No workouts yet — start your first one above.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {workouts.slice(0, 6).map((w) => (
            <button
              key={w.id}
              onClick={() => go("history")}
              className="rounded-xl p-3 flex items-center justify-between text-left"
              style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--c2)" }}>
                  {w.split || "Workout"}
                </div>
                <div className="text-[10px]" style={{ color: "var(--c4)" }}>
                  {shortDate(w.date)}
                  {w.duration ? " · " + fmtDuration(w.duration) : ""}
                </div>
              </div>
              <span className="text-xs" style={{ color: "var(--c5)" }}>
                {w.exercises.length} ex
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
