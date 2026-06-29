"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { analyzeFood, fileToDataURL, makeThumb, sumMacros } from "@/lib/food";
import { dateStr, fmtDate, today } from "@/lib/format";
import type { FoodAnalysis } from "@/lib/types";

type Draft = FoodAnalysis & { thumb?: string };
type Stage = "idle" | "analyzing" | "review";

export function Food() {
  const { food, addFood, deleteFood } = useStore();
  const [date, setDate] = useState(today());
  const [stage, setStage] = useState<Stage>("idle");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const dayEntries = useMemo(
    () => food.filter((f) => f.date === date),
    [food, date]
  );
  const totals = sumMacros(dayEntries);

  function shiftDay(delta: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setDate(fmtDate(d));
  }

  async function onPick(file?: File) {
    if (!file) return;
    setError(null);
    try {
      const dataURL = await fileToDataURL(file);
      const thumb = await makeThumb(dataURL);
      setDraft({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, thumb });
      setStage("analyzing");
      const result = await analyzeFood(dataURL);
      setDraft({ ...result, thumb });
      setStage("review");
    } catch {
      setError("Couldn't analyze that photo — enter the details manually.");
      setStage("review");
    }
  }

  function startManual() {
    setError(null);
    setDraft({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0 });
    setStage("review");
  }

  function reset() {
    setStage("idle");
    setDraft(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function save() {
    if (!draft) return;
    addFood({
      date,
      name: draft.name.trim() || "Meal",
      calories: draft.calories,
      protein: draft.protein,
      carbs: draft.carbs,
      fat: draft.fat,
      thumb: draft.thumb,
    });
    reset();
  }

  const isToday = date === today();

  return (
    <div className="scroll-area px-5 py-4 pb-24">
      {/* date nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => shiftDay(-1)} className="px-2 text-lg" style={{ color: "var(--c3)" }}>
          ‹
        </button>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: "var(--c1)" }}>
            {isToday ? "Today" : dateStr(date)}
          </div>
        </div>
        <button
          onClick={() => shiftDay(1)}
          disabled={isToday}
          className="px-2 text-lg"
          style={{ color: isToday ? "var(--c6)" : "var(--c3)" }}
        >
          ›
        </button>
      </div>

      {/* totals */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
      >
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-3xl font-extrabold" style={{ color: "var(--c1)" }}>
            {totals.calories}
          </span>
          <span className="text-sm" style={{ color: "var(--c3)" }}>
            kcal
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Macro label="Protein" value={totals.protein} color="var(--gn)" />
          <Macro label="Carbs" value={totals.carbs} color="var(--bl)" />
          <Macro label="Fat" value={totals.fat} color="var(--fi)" />
        </div>
      </div>

      {/* capture / review */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      {stage === "idle" && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-xl py-3 text-sm font-bold"
            style={{ background: "linear-gradient(135deg,var(--pu),#6a4fd0)", color: "#fff" }}
          >
            📷 Snap a meal
          </button>
          <button
            onClick={startManual}
            className="px-4 rounded-xl text-sm font-semibold"
            style={{ background: "var(--ip)", color: "var(--c2)" }}
          >
            Manual
          </button>
        </div>
      )}

      {stage === "analyzing" && (
        <div
          className="rounded-2xl p-5 mb-4 flex flex-col items-center gap-3"
          style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
        >
          {draft?.thumb && (
            <img src={draft.thumb} alt="meal" className="w-24 h-24 rounded-xl object-cover" />
          )}
          <span className="text-sm animate-pulse" style={{ color: "var(--pu)" }}>
            Analyzing your meal…
          </span>
        </div>
      )}

      {stage === "review" && draft && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: "var(--cd)", border: "1px solid var(--c6)" }}
        >
          {draft.thumb && (
            <img src={draft.thumb} alt="meal" className="w-full h-40 rounded-xl object-cover mb-3" />
          )}
          {draft.mock && (
            <div
              className="text-[10px] mb-2 px-2 py-1 rounded-md inline-block"
              style={{ background: "rgba(138,111,255,.12)", color: "var(--pu)" }}
            >
              Demo estimate — add a Gemini key for real AI analysis
            </div>
          )}
          {error && (
            <div className="text-[11px] mb-2" style={{ color: "var(--rd)" }}>
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Food name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="mb-3"
          />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Field label="Calories" value={draft.calories} onChange={(v) => setDraft({ ...draft, calories: v })} />
            <Field label="Protein (g)" value={draft.protein} onChange={(v) => setDraft({ ...draft, protein: v })} />
            <Field label="Carbs (g)" value={draft.carbs} onChange={(v) => setDraft({ ...draft, carbs: v })} />
            <Field label="Fat (g)" value={draft.fat} onChange={(v) => setDraft({ ...draft, fat: v })} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex-1 text-sm font-bold py-3 rounded-xl"
              style={{ background: "var(--gn)", color: "#000" }}
            >
              Add to diary
            </button>
            <button
              onClick={reset}
              className="px-4 text-sm py-3 rounded-xl"
              style={{ background: "var(--ip)", color: "var(--c3)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* diary list */}
      <div className="text-[10px] font-semibold tracking-[2px] mb-2" style={{ color: "var(--c4)" }}>
        MEALS · {dayEntries.length}
      </div>
      {dayEntries.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--c4)" }}>
          Nothing logged for this day.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {dayEntries.map((f) => (
            <div
              key={f.id}
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
            >
              {f.thumb ? (
                <img src={f.thumb} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
                  style={{ background: "var(--ip)" }}
                >
                  🍽
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--c1)" }}>
                  {f.name}
                </div>
                <div className="text-[10px]" style={{ color: "var(--c4)" }}>
                  {f.calories} kcal · P{f.protein} C{f.carbs} F{f.fat}
                </div>
              </div>
              <button
                onClick={() => deleteFood(f.id)}
                className="text-xs px-1 shrink-0"
                style={{ color: "var(--c5)" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl py-2 text-center" style={{ background: "var(--ip)" }}>
      <div className="text-base font-bold" style={{ color }}>
        {value}g
      </div>
      <div className="text-[9px]" style={{ color: "var(--c4)" }}>
        {label}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] block mb-1" style={{ color: "var(--c4)" }}>
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
    </label>
  );
}
