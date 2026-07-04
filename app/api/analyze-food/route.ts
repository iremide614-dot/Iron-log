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

const PROMPT = `You are a nutrition estimator. Look at this photo of food and estimate the nutrition for the WHOLE portion shown.
Respond with ONLY compact JSON, no markdown, in exactly this shape:
{"name": string, "calories": number, "protein": number, "carbs": number, "fat": number}
- name: a short dish name (e.g. "Grilled chicken & rice")
- calories: total kcal for the portion shown
- protein/carbs/fat: grams for the portion shown
If you cannot identify food, return name "Unknown" with your best guess numbers.`;

function clampNum(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (!isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

/** Deterministic-ish mock so the feature works with no API key. */
function mockAnalysis(): FoodAnalysis {
  const meals = [
    { name: "Mixed meal", calories: 540, protein: 32, carbs: 48, fat: 22 },
    { name: "Chicken & rice", calories: 620, protein: 45, carbs: 60, fat: 16 },
    { name: "Salad bowl", calories: 380, protein: 18, carbs: 30, fat: 20 },
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

    const result: FoodAnalysis = {
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : "Meal",
      calories: clampNum(parsed.calories),
      protein: clampNum(parsed.protein),
      carbs: clampNum(parsed.carbs),
      fat: clampNum(parsed.fat),
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze-food failed", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
