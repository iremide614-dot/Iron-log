// Calorie/protein targets from body weight + goal mode.
// Simple, standard fitness heuristics (not medical advice):
//   maintenance ≈ 33 kcal per kg (≈15 per lb)
//   cut = maintenance − 500 (≈0.5 kg/week loss)
//   bulk = maintenance + 300 (lean gain)
//   protein = 2 g per kg (≈0.9 g per lb)

import type { GoalMode } from "./types";

export const GOAL_LABELS: Record<GoalMode, { label: string; hint: string; color: string }> = {
  cut: { label: "Cutting", hint: "−500 kcal · lose ~0.5 kg/wk", color: "var(--rd)" },
  maintain: { label: "Maintaining", hint: "eat at maintenance", color: "var(--bl)" },
  bulk: { label: "Bulking", hint: "+300 kcal · lean gain", color: "var(--gn)" },
};

export function computeTargets(
  weight: number,
  unit: "kg" | "lb",
  mode: GoalMode
): { calories: number; protein: number } {
  const kg = unit === "kg" ? weight : weight * 0.4536;
  const maintenance = kg * 33;
  const calories =
    mode === "cut" ? maintenance - 500 : mode === "bulk" ? maintenance + 300 : maintenance;
  return {
    calories: Math.max(1200, Math.round(calories / 10) * 10),
    protein: Math.round(kg * 2),
  };
}
