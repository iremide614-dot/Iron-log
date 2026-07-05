import { NextResponse } from "next/server";
import type { FoodAnalysis } from "@/lib/types";

// Runs server-side only — the Gemini key never reaches the browser.
export const runtime = "nodejs";

// Models to try in order — free-tier availability shifts as Google retires
// versions, so fall through on quota (429) / not-found (404) errors.
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
  "gemini-2.0-flash",
].filter((m): m is string => !!m);

const PROMPT = `You are a nutrition estimator. Look at this photo and identify EVERY distinct food you can see, estimating nutrition for the portion of each that is shown.
Respond with ONLY compact JSON, no markdown, in exactly this shape:
{"name": string, "items": [{"name": string, "calories": number, "protein": number, "carbs": number, "fat": number}]}
- name: a short overall dish/meal name (e.g. "Chicken & rice bowl")
- items: one entry per distinct food (e.g. separate entries for "Grilled chicken", "White rice", "Broccoli")
- calories: kcal for that item's visible portion; protein/carbs/fat: grams for that portion
List every identifiable component separately — sauces and sides too, when visible. If you cannot identify any food, return name "Unknown" with one best-guess item.`;

function clampNum(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (!isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

/** Deterministic-ish mock so the feature works with no API key. */
function mockAnalysis(): FoodAnalysis {
  const meals: FoodAnalysis[] = [
    {
      name: "Chicken & rice",
      items: [
        { name: "Grilled chicken", calories: 280, protein: 42, carbs: 0, fat: 10 },
        { name: "White rice", calories: 260, protein: 5, carbs: 56, fat: 1 },
        { name: "Steamed broccoli", calories: 55, protein: 4, carbs: 10, fat: 0 },
      ],
    },
    {
      name: "Salad bowl",
      items: [
        { name: "Mixed greens", calories: 30, protein: 2, carbs: 5, fat: 0 },
        { name: "Feta cheese", calories: 150, protein: 8, carbs: 2, fat: 12 },
        { name: "Olive oil dressing", calories: 200, protein: 0, carbs: 1, fat: 22 },
      ],
    },
  ];
  const m = meals[Math.floor(Math.random() * meals.length)];
  return { ...m, mock: true };
}

export async function POST(req: Request) {
  let body: { image?: string; mime?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { image, mime } = body;
  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const key = process.env.GEMINI_API_KEY;

  // No key configured -> mock mode so the UI is fully usable today.
  if (!key) {
    return NextResponse.json(mockAnalysis());
  }

  // strip a possible data: URL prefix
  const base64 = image.includes(",") ? image.split(",")[1] : image;

  try {
    const body = JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mime || "image/jpeg", data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    });

    // Try each candidate model until one answers.
    let res: Response | null = null;
    let lastStatus = 0;
    for (const model of MODEL_CANDIDATES) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      );
      if (res.ok) break;
      lastStatus = res.status;
      const detail = await res.text();
      console.error(`Gemini ${model} error`, res.status, detail.slice(0, 300));
      // quota/missing-model -> try the next candidate; other errors are fatal
      if (res.status !== 429 && res.status !== 404) {
        return NextResponse.json(
          { error: "Analysis failed", status: res.status },
          { status: 502 }
        );
      }
      res = null;
    }

    if (!res) {
      return NextResponse.json(
        { error: "Analysis failed", status: lastStatus },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const rawItems: unknown[] = Array.isArray(parsed.items) ? parsed.items : [];
    let items = rawItems.map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      return {
        name: typeof o.name === "string" && o.name ? o.name : "Item",
        calories: clampNum(o.calories),
        protein: clampNum(o.protein),
        carbs: clampNum(o.carbs),
        fat: clampNum(o.fat),
      };
    });
    // tolerate older/flat responses: fold top-level macros into a single item
    if (items.length === 0) {
      items = [
        {
          name: typeof parsed.name === "string" && parsed.name ? parsed.name : "Meal",
          calories: clampNum(parsed.calories),
          protein: clampNum(parsed.protein),
          carbs: clampNum(parsed.carbs),
          fat: clampNum(parsed.fat),
        },
      ];
    }

    const result: FoodAnalysis = {
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : "Meal",
      items,
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze-food failed", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
