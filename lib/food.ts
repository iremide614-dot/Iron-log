"use client";

import type { FoodAnalysis, FoodEntry, Macros } from "./types";

/** Read a File into a data URL. */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Downscale a data URL to a JPEG thumbnail no larger than `max` px on its long edge. */
export function makeThumb(dataURL: string, max = 320, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataURL);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataURL);
    img.src = dataURL;
  });
}

/** Send an image to the analysis endpoint. */
export async function analyzeFood(dataURL: string): Promise<FoodAnalysis> {
  const mime = dataURL.substring(5, dataURL.indexOf(";")) || "image/jpeg";
  const res = await fetch("/api/analyze-food", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataURL, mime }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "Analysis failed");
  }
  return res.json();
}

export function sumMacros(entries: FoodEntry[]): Macros {
  return entries.reduce<Macros>(
    (a, e) => ({
      calories: a.calories + e.calories,
      protein: a.protein + e.protein,
      carbs: a.carbs + e.carbs,
      fat: a.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
