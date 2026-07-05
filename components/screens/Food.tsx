"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { analyzeFood, estimateFoodFromText, fileToDataURL, makeThumb, sumMacros } from "@/lib/food";
import { dateStr, fmtDate, today, uid } from "@/lib/format";
import type { FoodItem } from "@/lib/types";

type Draft = {
  name: string;
  items: FoodItem[];
  thumb?: string;
  mock?: boolean;
};
type Stage = "idle" | "analyzing" | "review";

function blankItem(): FoodItem {
  return { id: uid(), name: "", calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function Food() {
  const { food, addFood, deleteFood } = useStore();
  const [date, setDate] = useState(today());
  const [stage, setStage] = useState<Stage>("idle");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatingId, setEstimatingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const dayEntries = useMemo(
    () => food.filter((f) => f.date === date),
    [food, date]
  );
  const totals = sumMacros(dayEntries);
  const draftTotals = draft ? sumMacros(draft.items) : null;

  // most recent unique meals (by name) for one-tap repeating
  const recentMeals = useMemo(() => {
    const seen = new Set<string>();
    const out: typeof food = [];
    for (const f of food) {
      const key = f.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
      if (out.length >= 5) break;
    }
    return out;
  }, [food]);

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
      setDraft({ name: "", items: [], thumb });
      setStage("analyzing");
      const result = await analyzeFood(dataURL);
      setDraft({
        name: result.name,
        items: result.items.map((it) => ({ ...it, id: uid() })),
        thumb,
        mock: result.mock,
      });
      setStage("review");
    } catch {
      setError("Couldn't analyze that photo — enter the details manually.");
      setDraft((d) => ({ name: "", items: [blankItem()], thumb: d?.thumb }));
      setStage("review");
    }
  }

  function startManual() {
    setError(null);
    setDraft({ name: "", items: [blankItem()] });
    setStage("review");
  }

  /** Pre-fill the review form from a past meal so it can be tweaked and re-logged. */
  function repeatMeal(entry: (typeof food)[number]) {
    setError(null);
    const items: FoodItem[] = entry.items?.length
      ? entry.items.map((it) => ({ ...it, id: uid() }))
      : [
          {
            id: uid(),
            name: entry.name,
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
          },
        ];
    setDraft({ name: entry.name, items, thumb: entry.thumb });
    setStage("review");
  }

  function reset() {
    setStage("idle");
    setDraft(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function patchItem(id: string, patch: Partial<FoodItem>) {
    setDraft((d) =>
      d
        ? { ...d, items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }
        : d
    );
  }

  function removeItem(id: string) {
    setDraft((d) => (d ? { ...d, items: d.items.filter((it) => it.id !== id) } : d));
  }

  function addItem() {
    setDraft((d) => (d ? { ...d, items: [...d.items, blankItem()] } : d));
  }

  /** AI-estimate macros for an item from its typed name — no manual numbers needed. */
  async function estimateItem(it: FoodItem) {
    const query = it.name.trim();
    if (!query || estimatingId) return;
    setError(null);
    setEstimatingId(it.id);
    try {
      const r = await estimateFoodFromText(query);
      const replacements: FoodItem[] = (r.items.length
        ? r.items
        : [{ name: query, calories: 0, protein: 0, carbs: 0, fat: 0 }]
      ).map((x) => ({ ...x, id: uid() }));
      setDraft((d) =>
        d
          ? {
              ...d,
              mock: d.mock || r.mock,
              // the item may expand into several (e.g. "burger and fries")
              items: d.items.flatMap((x) => (x.id === it.id ? replacements : [x])),
            }
          : d
      );
    } catch {
      setError("Couldn't estimate that — check the name or fill it in manually.");
    } finally {
      setEstimatingId(null);
    }
  }

  function save() {
    if (!draft) return;
    const items = draft.items
      .map((it) => ({ ...it, name: it.name.trim() }))
      .filter((it) => it.name || it.calories > 0);
    const t = sumMacros(items);
    addFood({
      date,
      name: draft.name.trim() || items.map((i) => i.name).filter(Boolean).join(", ") || "Meal",
      items: items.length ? items : undefined,
      calories: t.calories,
      protein: t.protein,
      carbs: t.carbs,
      fat: t.fat,
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
        <>
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

          {recentMeals.length > 0 && (
            <div className="mb-4">
              <div
                className="text-[10px] font-semibold tracking-[2px] mb-2"
                style={{ color: "var(--c4)" }}
              >
                REPEAT A MEAL
              </div>
              <div className="flex flex-col gap-2">
                {recentMeals.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => repeatMeal(f)}
                    className="rounded-xl p-2.5 flex items-center gap-3 text-left"
                    style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
                  >
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
                      <div className="text-[10px]" style={{ color: "var(--c4)" }}>
                        {f.calories} kcal · P{f.protein} C{f.carbs} F{f.fat}
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0"
                      style={{ background: "rgba(138,111,255,.12)", color: "var(--pu)" }}
                    >
                      ↻ Log
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
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
            placeholder="Meal name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="mb-3"
          />

          {/* detected items — each editable */}
          <div className="text-[10px] font-semibold tracking-[2px] mb-2" style={{ color: "var(--c4)" }}>
            DETECTED ITEMS · {draft.items.length}
          </div>
          <div className="flex flex-col gap-2 mb-2">
            {draft.items.map((it) => (
              <div
                key={it.id}
                className="rounded-xl p-3"
                style={{ background: "var(--ip)", border: "1px solid var(--bd)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Food name"
                    value={it.name}
                    onChange={(e) => patchItem(it.id, { name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && estimateItem(it)}
                    style={{ background: "var(--cd)" }}
                  />
                  <button
                    onClick={() => estimateItem(it)}
                    disabled={!it.name.trim() || estimatingId !== null}
                    className={`px-2.5 py-2 shrink-0 text-xs font-bold rounded-lg${estimatingId === it.id ? " animate-pulse" : ""}`}
                    style={{
                      background: "rgba(138,111,255,.12)",
                      color: it.name.trim() ? "var(--pu)" : "var(--c5)",
                    }}
                    aria-label={`Estimate nutrition for ${it.name || "item"}`}
                    title="AI-estimate calories & macros from the name"
                  >
                    {estimatingId === it.id ? "…" : "✨ Auto"}
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="px-2 py-3 shrink-0 text-sm"
                    style={{ color: "var(--c4)" }}
                    aria-label={`Remove ${it.name || "item"}`}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <ItemField label="kcal" value={it.calories} onChange={(v) => patchItem(it.id, { calories: v })} />
                  <ItemField label="P (g)" value={it.protein} onChange={(v) => patchItem(it.id, { protein: v })} />
                  <ItemField label="C (g)" value={it.carbs} onChange={(v) => patchItem(it.id, { carbs: v })} />
                  <ItemField label="F (g)" value={it.fat} onChange={(v) => patchItem(it.id, { fat: v })} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addItem} className="text-xs font-semibold mb-3" style={{ color: "var(--bl)" }}>
            + Add item
          </button>

          {/* live totals for the meal */}
          {draftTotals && (
            <div
              className="rounded-xl px-3 py-2 mb-3 flex items-center justify-between"
              style={{ background: "var(--dp)", border: "1px solid var(--bd)" }}
            >
              <span className="text-xs font-semibold" style={{ color: "var(--c3)" }}>
                Meal total
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: "var(--c1)", fontFamily: "var(--font-dm-mono)" }}
              >
                {draftTotals.calories} kcal · P{draftTotals.protein} C{draftTotals.carbs} F{draftTotals.fat}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={draft.items.length === 0}
              className="flex-1 text-sm font-bold py-3 rounded-xl"
              style={{
                background: draft.items.length ? "var(--gn)" : "var(--ip)",
                color: draft.items.length ? "#000" : "var(--c4)",
              }}
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
                {f.items && f.items.length > 0 && (
                  <div className="text-[10px] truncate" style={{ color: "var(--c5)" }}>
                    {f.items.map((i) => i.name).join(" · ")}
                  </div>
                )}
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

function ItemField({
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
      <span className="text-[9px] block mb-0.5 text-center" style={{ color: "var(--c4)" }}>
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        style={{ background: "var(--cd)", padding: "8px 4px", minHeight: 40, fontSize: 14 }}
      />
    </label>
  );
}
